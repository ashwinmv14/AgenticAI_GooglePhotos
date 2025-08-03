import axios from 'axios';
import { GeolocationData } from '../types';

export class GeocodingService {
  private static readonly MAPBOX_BASE_URL = 'https://api.mapbox.com/geocoding/v5/mapbox.places';
  
  /**
   * Reverse geocode coordinates to get location information
   */
  static async reverseGeocode(latitude: number, longitude: number): Promise<GeolocationData | null> {
    try {
      const accessToken = process.env.MAPBOX_ACCESS_TOKEN;
      if (!accessToken) {
        console.warn('Mapbox access token not configured');
        return null;
      }

      const url = `${this.MAPBOX_BASE_URL}/${longitude},${latitude}.json`;
      const response = await axios.get(url, {
        params: {
          access_token: accessToken,
          types: 'country,region,place,locality,neighborhood,address'
        },
        timeout: 5000
      });

      const features = response.data.features;
      if (!features || features.length === 0) {
        return null;
      }

      // Extract location components
      let country = '';
      let city = '';
      let location = '';

      for (const feature of features) {
        const placeType = feature.place_type[0];
        
        switch (placeType) {
          case 'country':
            country = feature.text;
            break;
          case 'place':
          case 'locality':
            if (!city) city = feature.text;
            break;
          case 'region':
            if (!city) city = feature.text;
            break;
          case 'neighborhood':
          case 'address':
            if (!location) location = feature.place_name;
            break;
        }
      }

      // Use the most specific location as the primary location
      if (!location && features[0]) {
        location = features[0].place_name;
      }

      return {
        latitude,
        longitude,
        location: location || `${latitude}, ${longitude}`,
        country: country || 'Unknown',
        city: city || 'Unknown'
      };
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      return {
        latitude,
        longitude,
        location: `${latitude}, ${longitude}`,
        country: 'Unknown',
        city: 'Unknown'
      };
    }
  }

  /**
   * Forward geocode a location name to coordinates
   */
  static async forwardGeocode(locationName: string): Promise<{ latitude: number; longitude: number } | null> {
    try {
      const accessToken = process.env.MAPBOX_ACCESS_TOKEN;
      if (!accessToken) {
        console.warn('Mapbox access token not configured');
        return null;
      }

      const encodedLocation = encodeURIComponent(locationName);
      const url = `${this.MAPBOX_BASE_URL}/${encodedLocation}.json`;
      
      const response = await axios.get(url, {
        params: {
          access_token: accessToken,
          limit: 1
        },
        timeout: 5000
      });

      const features = response.data.features;
      if (!features || features.length === 0) {
        return null;
      }

      const [longitude, latitude] = features[0].center;
      return { latitude, longitude };
    } catch (error) {
      console.error('Forward geocoding error:', error);
      return null;
    }
  }

  /**
   * Get location suggestions for autocomplete
   */
  static async getLocationSuggestions(query: string, limit: number = 5): Promise<Array<{ name: string; coordinates: [number, number] }>> {
    try {
      const accessToken = process.env.MAPBOX_ACCESS_TOKEN;
      if (!accessToken) {
        return [];
      }

      const encodedQuery = encodeURIComponent(query);
      const url = `${this.MAPBOX_BASE_URL}/${encodedQuery}.json`;
      
      const response = await axios.get(url, {
        params: {
          access_token: accessToken,
          limit,
          types: 'country,region,place,locality'
        },
        timeout: 3000
      });

      const features = response.data.features || [];
      return features.map((feature: any) => ({
        name: feature.place_name,
        coordinates: feature.center
      }));
    } catch (error) {
      console.error('Location suggestions error:', error);
      return [];
    }
  }

  /**
   * Calculate distance between two coordinates in kilometers
   */
  static calculateDistance(
    lat1: number, 
    lon1: number, 
    lat2: number, 
    lon2: number
  ): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    
    return distance;
  }

  /**
   * Convert degrees to radians
   */
  private static toRad(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Cluster nearby photos by location
   */
  static clusterPhotosByLocation(
    photos: Array<{ id: string; latitude: number; longitude: number; [key: string]: any }>,
    radiusKm: number = 1
  ): Array<Array<typeof photos[0]>> {
    const clusters: Array<Array<typeof photos[0]>> = [];
    const used = new Set<string>();

    for (const photo of photos) {
      if (used.has(photo.id)) continue;

      const cluster = [photo];
      used.add(photo.id);

      // Find nearby photos
      for (const otherPhoto of photos) {
        if (used.has(otherPhoto.id)) continue;

        const distance = this.calculateDistance(
          photo.latitude,
          photo.longitude,
          otherPhoto.latitude,
          otherPhoto.longitude
        );

        if (distance <= radiusKm) {
          cluster.push(otherPhoto);
          used.add(otherPhoto.id);
        }
      }

      clusters.push(cluster);
    }

    return clusters;
  }
}