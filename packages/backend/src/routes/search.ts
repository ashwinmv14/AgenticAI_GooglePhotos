import express from 'express';
import { authenticateToken } from '../middleware/auth';
import { GeocodingService } from '../services/geocodingService';
import { prisma } from '../index';
import { AuthenticatedRequest, PhotoCluster } from '../types';

const router = express.Router();

// Smart search with natural language processing
router.get('/', authenticateToken, async (req: AuthenticatedRequest, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    const query = req.query.q as string;
    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'Search query is required'
      });
    }

    // Parse natural language query
    const searchFilters = await parseNaturalQuery(query);
    
    const filters: any = {
      userId: req.user.id
    };

    // Apply parsed filters
    if (searchFilters.dateFrom || searchFilters.dateTo) {
      filters.dateTaken = {};
      if (searchFilters.dateFrom) {
        filters.dateTaken.gte = searchFilters.dateFrom;
      }
      if (searchFilters.dateTo) {
        filters.dateTaken.lte = searchFilters.dateTo;
      }
    }

    if (searchFilters.location) {
      filters.OR = [
        { location: { contains: searchFilters.location, mode: 'insensitive' } },
        { country: { contains: searchFilters.location, mode: 'insensitive' } },
        { city: { contains: searchFilters.location, mode: 'insensitive' } }
      ];
    }

    if (searchFilters.tags && searchFilters.tags.length > 0) {
      filters.tags = {
        hasSome: searchFilters.tags
      };
    }

    // Text search in AI descriptions
    if (searchFilters.description) {
      filters.aiDescription = {
        contains: searchFilters.description,
        mode: 'insensitive'
      };
    }

    // Face group filter
    if (searchFilters.people && searchFilters.people.length > 0) {
      filters.faces = {
        some: {
          faceGroupId: {
            in: searchFilters.people
          }
        }
      };
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const [photos, total] = await Promise.all([
      prisma.photo.findMany({
        where: filters,
        include: {
          faces: {
            include: {
              faceGroup: {
                select: {
                  id: true,
                  name: true
                }
              }
            }
          },
          albumPhotos: {
            include: {
              album: {
                select: {
                  id: true,
                  title: true
                }
              }
            }
          }
        },
        orderBy: {
          dateTaken: 'desc'
        },
        skip,
        take: limit
      }),
      prisma.photo.count({ where: filters })
    ]);

    res.json({
      success: true,
      data: photos,
      searchQuery: query,
      parsedFilters: searchFilters,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get clustered photos by location
router.get('/clusters', authenticateToken, async (req: AuthenticatedRequest, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    const radiusKm = parseFloat(req.query.radius as string) || 1;
    
    // Get all photos with location data
    const photos = await prisma.photo.findMany({
      where: {
        userId: req.user.id,
        latitude: { not: null },
        longitude: { not: null }
      },
      select: {
        id: true,
        thumbnailUrl: true,
        latitude: true,
        longitude: true,
        location: true,
        dateTaken: true,
        tags: true
      }
    });

    if (photos.length === 0) {
      return res.json({
        success: true,
        data: [],
        message: 'No photos with location data found'
      });
    }

    // Cluster photos by location
    const clusters = GeocodingService.clusterPhotosByLocation(
      photos as any,
      radiusKm
    );

    // Format clusters
    const formattedClusters: PhotoCluster[] = clusters.map((cluster, index) => {
      const centerPhoto = cluster[0];
      const dates = cluster
        .map(p => p.dateTaken)
        .filter(d => d)
        .sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

      return {
        id: `cluster-${index}`,
        location: centerPhoto.location || `${centerPhoto.latitude}, ${centerPhoto.longitude}`,
        latitude: centerPhoto.latitude,
        longitude: centerPhoto.longitude,
        photos: cluster,
        dateRange: {
          start: dates[0] ? new Date(dates[0]) : new Date(),
          end: dates[dates.length - 1] ? new Date(dates[dates.length - 1]) : new Date()
        }
      };
    });

    res.json({
      success: true,
      data: formattedClusters,
      totalClusters: formattedClusters.length,
      totalPhotos: photos.length
    });
  } catch (error) {
    next(error);
  }
});

// Get travel timeline
router.get('/timeline', authenticateToken, async (req: AuthenticatedRequest, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    const year = req.query.year ? parseInt(req.query.year as string) : new Date().getFullYear();
    
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year + 1, 0, 1);

    const photos = await prisma.photo.findMany({
      where: {
        userId: req.user.id,
        dateTaken: {
          gte: startDate,
          lt: endDate
        }
      },
      select: {
        id: true,
        thumbnailUrl: true,
        location: true,
        city: true,
        country: true,
        dateTaken: true,
        tags: true,
        latitude: true,
        longitude: true
      },
      orderBy: {
        dateTaken: 'asc'
      }
    });

    // Group by month
    const timeline = photos.reduce((acc, photo) => {
      if (!photo.dateTaken) return acc;
      
      const month = photo.dateTaken.getMonth();
      const monthKey = new Date(year, month, 1).toISOString();
      
      if (!acc[monthKey]) {
        acc[monthKey] = {
          month: monthKey,
          photos: [],
          locations: new Set(),
          countries: new Set()
        };
      }
      
      acc[monthKey].photos.push(photo);
      if (photo.location) acc[monthKey].locations.add(photo.location);
      if (photo.country) acc[monthKey].countries.add(photo.country);
      
      return acc;
    }, {} as Record<string, any>);

    // Convert to array and format
    const timelineArray = Object.values(timeline).map((period: any) => ({
      ...period,
      locations: Array.from(period.locations),
      countries: Array.from(period.countries),
      photoCount: period.photos.length
    }));

    res.json({
      success: true,
      data: timelineArray,
      year,
      totalPhotos: photos.length
    });
  } catch (error) {
    next(error);
  }
});

// Helper function to parse natural language queries
async function parseNaturalQuery(query: string): Promise<any> {
  const filters: any = {};
  const lowerQuery = query.toLowerCase();

  // Date parsing
  const currentYear = new Date().getFullYear();
  
  // Year patterns
  const yearMatch = lowerQuery.match(/\b(20\d{2})\b/);
  if (yearMatch) {
    const year = parseInt(yearMatch[1]);
    filters.dateFrom = new Date(year, 0, 1);
    filters.dateTo = new Date(year + 1, 0, 1);
  }

  // Month patterns
  const monthPattern = /(january|february|march|april|may|june|july|august|september|october|november|december)/i;
  const monthMatch = lowerQuery.match(monthPattern);
  if (monthMatch) {
    const monthNames = ['january', 'february', 'march', 'april', 'may', 'june',
                       'july', 'august', 'september', 'october', 'november', 'december'];
    const monthIndex = monthNames.indexOf(monthMatch[1].toLowerCase());
    const year = yearMatch ? parseInt(yearMatch[1]) : currentYear;
    filters.dateFrom = new Date(year, monthIndex, 1);
    filters.dateTo = new Date(year, monthIndex + 1, 1);
  }

  // Relative time patterns
  if (lowerQuery.includes('last year')) {
    filters.dateFrom = new Date(currentYear - 1, 0, 1);
    filters.dateTo = new Date(currentYear, 0, 1);
  } else if (lowerQuery.includes('this year')) {
    filters.dateFrom = new Date(currentYear, 0, 1);
    filters.dateTo = new Date(currentYear + 1, 0, 1);
  }

  // Location patterns
  const locationWords = ['in', 'at', 'from', 'to', 'visit', 'trip to', 'vacation in'];
  for (const word of locationWords) {
    const pattern = new RegExp(`${word}\\s+([\\w\\s]+?)(?:\\s+(?:with|in|on|during)|$)`, 'i');
    const match = lowerQuery.match(pattern);
    if (match) {
      filters.location = match[1].trim();
      break;
    }
  }

  // People patterns (with my...)
  const peoplePattern = /with my\s+(\w+)/i;
  const peopleMatch = lowerQuery.match(peoplePattern);
  if (peopleMatch) {
    // This would typically map to face groups
    // For now, we'll store the relationship
    filters.peopleQuery = peopleMatch[1];
  }

  // Activity/scene tags
  const commonTags = ['beach', 'mountain', 'city', 'restaurant', 'museum', 'park', 
                     'sunset', 'sunrise', 'nature', 'urban', 'food', 'selfie',
                     'group', 'landscape', 'architecture', 'ocean', 'forest'];
  
  const foundTags = commonTags.filter(tag => lowerQuery.includes(tag));
  if (foundTags.length > 0) {
    filters.tags = foundTags;
  }

  // Extract remaining text for description search
  let descriptionQuery = query;
  if (filters.location) {
    descriptionQuery = descriptionQuery.replace(new RegExp(filters.location, 'gi'), '');
  }
  if (foundTags.length > 0) {
    foundTags.forEach(tag => {
      descriptionQuery = descriptionQuery.replace(new RegExp(tag, 'gi'), '');
    });
  }
  
  // Clean up description query
  descriptionQuery = descriptionQuery
    .replace(/\b(in|at|from|to|with|my|the|and|or|but)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
  
  if (descriptionQuery.length > 2) {
    filters.description = descriptionQuery;
  }

  return filters;
}

export default router;