import AWS from 'aws-sdk';
import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';
import { S3UploadResult } from '../types';

// Initialize S3
const s3 = new AWS.S3({
  region: process.env.AWS_REGION || 'us-east-1',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET || 'travel-memory-photos';

export class StorageService {
  /**
   * Upload image to S3 with thumbnail generation
   */
  static async uploadImage(
    imageBuffer: Buffer,
    fileName: string,
    mimeType: string
  ): Promise<S3UploadResult> {
    try {
      const fileExtension = fileName.split('.').pop() || 'jpg';
      const uniqueFileName = `${uuidv4()}.${fileExtension}`;
      const thumbnailFileName = `thumb_${uniqueFileName}`;

      // Generate thumbnail
      const thumbnailBuffer = await sharp(imageBuffer)
        .resize(400, 400, {
          fit: 'inside',
          withoutEnlargement: true
        })
        .jpeg({ quality: 80 })
        .toBuffer();

      // Upload original image
      const originalUpload = s3.upload({
        Bucket: BUCKET_NAME,
        Key: `photos/${uniqueFileName}`,
        Body: imageBuffer,
        ContentType: mimeType,
        ACL: 'public-read',
        Metadata: {
          originalFileName: fileName,
          uploadedAt: new Date().toISOString()
        }
      }).promise();

      // Upload thumbnail
      const thumbnailUpload = s3.upload({
        Bucket: BUCKET_NAME,
        Key: `thumbnails/${thumbnailFileName}`,
        Body: thumbnailBuffer,
        ContentType: 'image/jpeg',
        ACL: 'public-read',
        Metadata: {
          originalFileName: fileName,
          type: 'thumbnail',
          uploadedAt: new Date().toISOString()
        }
      }).promise();

      // Wait for both uploads
      const [originalResult, thumbnailResult] = await Promise.all([
        originalUpload,
        thumbnailUpload
      ]);

      return {
        key: uniqueFileName,
        url: originalResult.Location,
        thumbnailUrl: thumbnailResult.Location
      };
    } catch (error) {
      console.error('Storage upload error:', error);
      throw new Error('Failed to upload image');
    }
  }

  /**
   * Delete image and thumbnail from S3
   */
  static async deleteImage(s3Key: string): Promise<void> {
    try {
      const thumbnailKey = `thumb_${s3Key}`;

      const deleteParams = {
        Bucket: BUCKET_NAME,
        Delete: {
          Objects: [
            { Key: `photos/${s3Key}` },
            { Key: `thumbnails/${thumbnailKey}` }
          ]
        }
      };

      await s3.deleteObjects(deleteParams).promise();
    } catch (error) {
      console.error('Storage delete error:', error);
      // Don't throw error for delete operations
    }
  }

  /**
   * Get signed URL for temporary access
   */
  static getSignedUrl(s3Key: string, expiresIn: number = 3600): string {
    try {
      return s3.getSignedUrl('getObject', {
        Bucket: BUCKET_NAME,
        Key: `photos/${s3Key}`,
        Expires: expiresIn
      });
    } catch (error) {
      console.error('Error generating signed URL:', error);
      return '';
    }
  }

  /**
   * Get image buffer from S3 for AI processing
   */
  static async getImageBuffer(s3Key: string): Promise<Buffer> {
    try {
      const params = {
        Bucket: BUCKET_NAME,
        Key: `photos/${s3Key}`
      };

      const result = await s3.getObject(params).promise();
      return result.Body as Buffer;
    } catch (error) {
      console.error('Error fetching image from S3:', error);
      throw new Error('Failed to fetch image');
    }
  }

  /**
   * Generate optimized image variants
   */
  static async generateImageVariants(
    originalBuffer: Buffer,
    s3Key: string
  ): Promise<{ medium: string; large: string }> {
    try {
      // Medium size (1200px)
      const mediumBuffer = await sharp(originalBuffer)
        .resize(1200, 1200, {
          fit: 'inside',
          withoutEnlargement: true
        })
        .jpeg({ quality: 85 })
        .toBuffer();

      // Large size (2400px)
      const largeBuffer = await sharp(originalBuffer)
        .resize(2400, 2400, {
          fit: 'inside',
          withoutEnlargement: true
        })
        .jpeg({ quality: 90 })
        .toBuffer();

      const baseName = s3Key.split('.')[0];

      // Upload variants
      const [mediumResult, largeResult] = await Promise.all([
        s3.upload({
          Bucket: BUCKET_NAME,
          Key: `variants/medium_${baseName}.jpg`,
          Body: mediumBuffer,
          ContentType: 'image/jpeg',
          ACL: 'public-read'
        }).promise(),
        s3.upload({
          Bucket: BUCKET_NAME,
          Key: `variants/large_${baseName}.jpg`,
          Body: largeBuffer,
          ContentType: 'image/jpeg',
          ACL: 'public-read'
        }).promise()
      ]);

      return {
        medium: mediumResult.Location,
        large: largeResult.Location
      };
    } catch (error) {
      console.error('Error generating image variants:', error);
      throw new Error('Failed to generate image variants');
    }
  }

  /**
   * Check if bucket exists and create if necessary
   */
  static async ensureBucketExists(): Promise<void> {
    try {
      await s3.headBucket({ Bucket: BUCKET_NAME }).promise();
    } catch (error) {
      if (error.statusCode === 404) {
        try {
          await s3.createBucket({
            Bucket: BUCKET_NAME,
            CreateBucketConfiguration: {
              LocationConstraint: process.env.AWS_REGION || 'us-east-1'
            }
          }).promise();
          console.log(`Created S3 bucket: ${BUCKET_NAME}`);
        } catch (createError) {
          console.error('Failed to create S3 bucket:', createError);
        }
      } else {
        console.error('Error checking S3 bucket:', error);
      }
    }
  }
}