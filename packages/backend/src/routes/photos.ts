import express from 'express';
import multer from 'multer';
import { authenticateToken } from '../middleware/auth';
import { StorageService } from '../services/storageService';
import { AIService } from '../services/aiService';
import { GeocodingService } from '../services/geocodingService';
import { ExifExtractor } from '../utils/exifExtractor';
import { prisma } from '../index';
import { AuthenticatedRequest } from '../types';

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760'), // 10MB default
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = (process.env.ALLOWED_MIME_TYPES || 'image/jpeg,image/png,image/webp').split(',');
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images are allowed.'));
    }
  }
});

// Upload single photo
router.post('/upload', authenticateToken, upload.single('photo'), async (req: AuthenticatedRequest, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
    }

    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    const imageBuffer = req.file.buffer;
    const fileName = req.file.originalname;

    // Extract EXIF metadata
    const metadata = await ExifExtractor.extractMetadata(imageBuffer, fileName);

    // Upload to S3
    const uploadResult = await StorageService.uploadImage(
      imageBuffer,
      fileName,
      metadata.mimeType
    );

    // Create photo record
    const photo = await prisma.photo.create({
      data: {
        fileName: metadata.fileName,
        originalUrl: uploadResult.url,
        thumbnailUrl: uploadResult.thumbnailUrl,
        s3Key: uploadResult.key,
        mimeType: metadata.mimeType,
        fileSize: metadata.fileSize,
        width: metadata.width,
        height: metadata.height,
        latitude: metadata.latitude,
        longitude: metadata.longitude,
        altitude: metadata.altitude,
        dateTaken: metadata.dateTaken,
        userId: req.user.id
      }
    });

    // Process AI analysis and geocoding in background
    setImmediate(async () => {
      try {
        const updates: any = {};

        // AI analysis
        const aiAnalysis = await AIService.analyzeImage(uploadResult.url, imageBuffer);
        updates.aiDescription = aiAnalysis.description;
        updates.tags = aiAnalysis.tags;

        // Process faces
        if (aiAnalysis.faces.length > 0) {
          for (const faceDetection of aiAnalysis.faces) {
            await prisma.face.create({
              data: {
                photoId: photo.id,
                boundingBox: faceDetection.boundingBox,
                confidence: faceDetection.confidence
              }
            });
          }
        }

        // Reverse geocoding
        if (metadata.latitude && metadata.longitude) {
          const geoData = await GeocodingService.reverseGeocode(
            metadata.latitude,
            metadata.longitude
          );
          
          if (geoData) {
            updates.location = geoData.location;
            updates.country = geoData.country;
            updates.city = geoData.city;
          }
        }

        // Update photo with AI analysis and location data
        if (Object.keys(updates).length > 0) {
          await prisma.photo.update({
            where: { id: photo.id },
            data: updates
          });
        }
      } catch (error) {
        console.error('Background processing error for photo:', photo.id, error);
      }
    });

    res.status(201).json({
      success: true,
      data: photo,
      message: 'Photo uploaded successfully'
    });
  } catch (error) {
    next(error);
  }
});

// Upload multiple photos
router.post('/upload-batch', authenticateToken, upload.array('photos', 20), async (req: AuthenticatedRequest, res, next) => {
  try {
    if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No files uploaded'
      });
    }

    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    const uploadPromises = req.files.map(async (file) => {
      try {
        const imageBuffer = file.buffer;
        const fileName = file.originalname;

        // Extract metadata and upload
        const metadata = await ExifExtractor.extractMetadata(imageBuffer, fileName);
        const uploadResult = await StorageService.uploadImage(
          imageBuffer,
          fileName,
          metadata.mimeType
        );

        // Create photo record
        const photo = await prisma.photo.create({
          data: {
            fileName: metadata.fileName,
            originalUrl: uploadResult.url,
            thumbnailUrl: uploadResult.thumbnailUrl,
            s3Key: uploadResult.key,
            mimeType: metadata.mimeType,
            fileSize: metadata.fileSize,
            width: metadata.width,
            height: metadata.height,
            latitude: metadata.latitude,
            longitude: metadata.longitude,
            altitude: metadata.altitude,
            dateTaken: metadata.dateTaken,
            userId: req.user.id
          }
        });

        // Background processing
        setImmediate(async () => {
          try {
            const updates: any = {};

            const aiAnalysis = await AIService.analyzeImage(uploadResult.url, imageBuffer);
            updates.aiDescription = aiAnalysis.description;
            updates.tags = aiAnalysis.tags;

            if (aiAnalysis.faces.length > 0) {
              for (const faceDetection of aiAnalysis.faces) {
                await prisma.face.create({
                  data: {
                    photoId: photo.id,
                    boundingBox: faceDetection.boundingBox,
                    confidence: faceDetection.confidence
                  }
                });
              }
            }

            if (metadata.latitude && metadata.longitude) {
              const geoData = await GeocodingService.reverseGeocode(
                metadata.latitude,
                metadata.longitude
              );
              
              if (geoData) {
                updates.location = geoData.location;
                updates.country = geoData.country;
                updates.city = geoData.city;
              }
            }

            if (Object.keys(updates).length > 0) {
              await prisma.photo.update({
                where: { id: photo.id },
                data: updates
              });
            }
          } catch (error) {
            console.error('Background processing error for photo:', photo.id, error);
          }
        });

        return photo;
      } catch (error) {
        console.error('Error processing file:', file.originalname, error);
        return null;
      }
    });

    const results = await Promise.all(uploadPromises);
    const successfulUploads = results.filter(photo => photo !== null);

    res.status(201).json({
      success: true,
      data: successfulUploads,
      message: `${successfulUploads.length} photos uploaded successfully`
    });
  } catch (error) {
    next(error);
  }
});

// Get user's photos with optional filters
router.get('/', authenticateToken, async (req: AuthenticatedRequest, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const filters: any = {
      userId: req.user.id
    };

    // Apply filters
    if (req.query.location) {
      filters.location = {
        contains: req.query.location as string,
        mode: 'insensitive'
      };
    }

    if (req.query.country) {
      filters.country = req.query.country as string;
    }

    if (req.query.city) {
      filters.city = req.query.city as string;
    }

    if (req.query.dateFrom || req.query.dateTo) {
      filters.dateTaken = {};
      if (req.query.dateFrom) {
        filters.dateTaken.gte = new Date(req.query.dateFrom as string);
      }
      if (req.query.dateTo) {
        filters.dateTaken.lte = new Date(req.query.dateTo as string);
      }
    }

    if (req.query.tags) {
      const tags = (req.query.tags as string).split(',');
      filters.tags = {
        hasSome: tags
      };
    }

    const [photos, total] = await Promise.all([
      prisma.photo.findMany({
        where: filters,
        include: {
          faces: true,
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

// Get photo by ID
router.get('/:id', authenticateToken, async (req: AuthenticatedRequest, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    const photo = await prisma.photo.findFirst({
      where: {
        id: req.params.id,
        userId: req.user.id
      },
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
      }
    });

    if (!photo) {
      return res.status(404).json({
        success: false,
        error: 'Photo not found'
      });
    }

    res.json({
      success: true,
      data: photo
    });
  } catch (error) {
    next(error);
  }
});

// Delete photo
router.delete('/:id', authenticateToken, async (req: AuthenticatedRequest, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    const photo = await prisma.photo.findFirst({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });

    if (!photo) {
      return res.status(404).json({
        success: false,
        error: 'Photo not found'
      });
    }

    // Delete from S3
    await StorageService.deleteImage(photo.s3Key);

    // Delete from database (cascade will handle faces and album associations)
    await prisma.photo.delete({
      where: { id: photo.id }
    });

    res.json({
      success: true,
      message: 'Photo deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

export default router;