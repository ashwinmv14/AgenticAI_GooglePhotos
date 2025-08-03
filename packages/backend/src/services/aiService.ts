import OpenAI from 'openai';
import AWS from 'aws-sdk';
import { AIAnalysisResult, FaceDetection } from '../types';

// Initialize AI services
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const rekognition = new AWS.Rekognition({
  region: process.env.AWS_REGION || 'us-east-1',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

export class AIService {
  /**
   * Analyze image using OpenAI GPT-4 Vision for description and scene understanding
   */
  static async analyzeImageWithOpenAI(imageUrl: string): Promise<{ description: string; tags: string[] }> {
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4-vision-preview",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Analyze this travel photo and provide: 1) A descriptive caption (2-3 sentences), 2) Relevant tags for search (activities, objects, scenery, mood). Format as JSON: {\"description\": \"...\", \"tags\": [\"tag1\", \"tag2\", ...]}"
              },
              {
                type: "image_url",
                image_url: {
                  url: imageUrl,
                  detail: "high"
                }
              }
            ]
          }
        ],
        max_tokens: 300,
        temperature: 0.3,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No content received from OpenAI');
      }

      // Parse JSON response
      const result = JSON.parse(content);
      return {
        description: result.description || 'Travel photo',
        tags: Array.isArray(result.tags) ? result.tags : []
      };
    } catch (error) {
      console.error('OpenAI analysis error:', error);
      return {
        description: 'Travel photo',
        tags: ['travel', 'photo']
      };
    }
  }

  /**
   * Detect faces using AWS Rekognition
   */
  static async detectFaces(imageBuffer: Buffer): Promise<FaceDetection[]> {
    try {
      const params = {
        Image: {
          Bytes: imageBuffer
        },
        Attributes: ['ALL']
      };

      const result = await rekognition.detectFaces(params).promise();
      
      if (!result.FaceDetails) {
        return [];
      }

      return result.FaceDetails.map(face => ({
        boundingBox: {
          x: face.BoundingBox?.Left || 0,
          y: face.BoundingBox?.Top || 0,
          width: face.BoundingBox?.Width || 0,
          height: face.BoundingBox?.Height || 0
        },
        confidence: face.Confidence || 0
      }));
    } catch (error) {
      console.error('Face detection error:', error);
      return [];
    }
  }

  /**
   * Search faces in collection (for grouping/clustering)
   */
  static async searchFacesByImage(imageBuffer: Buffer, faceId?: string): Promise<AWS.Rekognition.FaceMatch[]> {
    try {
      const collectionId = process.env.AWS_REKOGNITION_COLLECTION_ID;
      if (!collectionId) {
        throw new Error('Rekognition collection ID not configured');
      }

      const params: AWS.Rekognition.SearchFacesByImageRequest = {
        CollectionId: collectionId,
        Image: {
          Bytes: imageBuffer
        },
        MaxFaces: 10,
        FaceMatchThreshold: 80
      };

      const result = await rekognition.searchFacesByImage(params).promise();
      return result.FaceMatches || [];
    } catch (error) {
      if (error.code === 'InvalidParameterException' && error.message.includes('No faces in image')) {
        return [];
      }
      console.error('Face search error:', error);
      return [];
    }
  }

  /**
   * Index a face to collection for future matching
   */
  static async indexFace(imageBuffer: Buffer, externalImageId: string): Promise<string | null> {
    try {
      const collectionId = process.env.AWS_REKOGNITION_COLLECTION_ID;
      if (!collectionId) {
        throw new Error('Rekognition collection ID not configured');
      }

      const params: AWS.Rekognition.IndexFacesRequest = {
        CollectionId: collectionId,
        Image: {
          Bytes: imageBuffer
        },
        ExternalImageId: externalImageId,
        MaxFaces: 1,
        QualityFilter: 'AUTO'
      };

      const result = await rekognition.indexFaces(params).promise();
      
      if (result.FaceRecords && result.FaceRecords.length > 0) {
        return result.FaceRecords[0].Face?.FaceId || null;
      }
      
      return null;
    } catch (error) {
      console.error('Face indexing error:', error);
      return null;
    }
  }

  /**
   * Complete AI analysis of an image
   */
  static async analyzeImage(imageUrl: string, imageBuffer: Buffer): Promise<AIAnalysisResult> {
    try {
      // Run both analyses in parallel
      const [openAIResult, faces] = await Promise.all([
        this.analyzeImageWithOpenAI(imageUrl),
        this.detectFaces(imageBuffer)
      ]);

      return {
        description: openAIResult.description,
        tags: openAIResult.tags,
        faces
      };
    } catch (error) {
      console.error('Complete image analysis error:', error);
      return {
        description: 'Travel photo',
        tags: ['travel', 'photo'],
        faces: []
      };
    }
  }

  /**
   * Create Rekognition collection if it doesn't exist
   */
  static async ensureCollectionExists(): Promise<void> {
    try {
      const collectionId = process.env.AWS_REKOGNITION_COLLECTION_ID;
      if (!collectionId) {
        throw new Error('Rekognition collection ID not configured');
      }

      await rekognition.describeCollection({ CollectionId: collectionId }).promise();
    } catch (error) {
      if (error.code === 'ResourceNotFoundException') {
        // Collection doesn't exist, create it
        try {
          await rekognition.createCollection({
            CollectionId: process.env.AWS_REKOGNITION_COLLECTION_ID!
          }).promise();
          console.log('Created Rekognition collection');
        } catch (createError) {
          console.error('Failed to create Rekognition collection:', createError);
        }
      } else {
        console.error('Error checking Rekognition collection:', error);
      }
    }
  }
}