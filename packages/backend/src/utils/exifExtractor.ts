import exifr from 'exifr';
import { PhotoMetadata } from '../types';

export class ExifExtractor {
  /**
   * Extract metadata from image buffer
   */
  static async extractMetadata(imageBuffer: Buffer, fileName: string): Promise<PhotoMetadata> {
    try {
      const exifData = await exifr.parse(imageBuffer, {
        gps: true,
        dates: true,
        dimensions: true,
        orientation: true
      });

      const metadata: PhotoMetadata = {
        fileName,
        mimeType: this.getMimeTypeFromFileName(fileName),
        fileSize: imageBuffer.length
      };

      // Extract dimensions
      if (exifData?.ImageWidth && exifData?.ImageHeight) {
        metadata.width = exifData.ImageWidth;
        metadata.height = exifData.ImageHeight;
      }

      // Extract GPS coordinates
      if (exifData?.latitude && exifData?.longitude) {
        metadata.latitude = exifData.latitude;
        metadata.longitude = exifData.longitude;
      }

      // Extract altitude
      if (exifData?.GPSAltitude) {
        metadata.altitude = exifData.GPSAltitude;
      }

      // Extract date taken
      if (exifData?.DateTimeOriginal) {
        metadata.dateTaken = new Date(exifData.DateTimeOriginal);
      } else if (exifData?.DateTime) {
        metadata.dateTaken = new Date(exifData.DateTime);
      } else if (exifData?.CreateDate) {
        metadata.dateTaken = new Date(exifData.CreateDate);
      }

      return metadata;
    } catch (error) {
      console.error('EXIF extraction error:', error);
      
      // Return basic metadata even if EXIF extraction fails
      return {
        fileName,
        mimeType: this.getMimeTypeFromFileName(fileName),
        fileSize: imageBuffer.length
      };
    }
  }

  /**
   * Get MIME type from filename
   */
  private static getMimeTypeFromFileName(fileName: string): string {
    const extension = fileName.toLowerCase().split('.').pop();
    
    switch (extension) {
      case 'jpg':
      case 'jpeg':
        return 'image/jpeg';
      case 'png':
        return 'image/png';
      case 'webp':
        return 'image/webp';
      case 'gif':
        return 'image/gif';
      case 'bmp':
        return 'image/bmp';
      case 'tiff':
      case 'tif':
        return 'image/tiff';
      default:
        return 'image/jpeg'; // Default fallback
    }
  }

  /**
   * Validate if coordinates are valid
   */
  static isValidCoordinates(lat?: number, lng?: number): boolean {
    if (lat === undefined || lng === undefined) return false;
    
    return (
      lat >= -90 && lat <= 90 && 
      lng >= -180 && lng <= 180 &&
      lat !== 0 && lng !== 0 // Exclude null island
    );
  }

  /**
   * Convert DMS (Degrees, Minutes, Seconds) to decimal degrees
   */
  static dmsToDecimal(degrees: number, minutes: number, seconds: number, direction: string): number {
    let decimal = degrees + minutes / 60 + seconds / 3600;
    
    if (direction === 'S' || direction === 'W') {
      decimal = decimal * -1;
    }
    
    return decimal;
  }

  /**
   * Get camera make and model from EXIF
   */
  static async getCameraInfo(imageBuffer: Buffer): Promise<{ make?: string; model?: string }> {
    try {
      const exifData = await exifr.parse(imageBuffer, {
        cameras: true
      });

      return {
        make: exifData?.Make,
        model: exifData?.Model
      };
    } catch (error) {
      console.error('Camera info extraction error:', error);
      return {};
    }
  }

  /**
   * Check if image has GPS data
   */
  static async hasGPSData(imageBuffer: Buffer): Promise<boolean> {
    try {
      const gpsData = await exifr.gps(imageBuffer);
      return gpsData && typeof gpsData.latitude === 'number' && typeof gpsData.longitude === 'number';
    } catch (error) {
      return false;
    }
  }
}