import { Injectable, Logger } from '@nestjs/common';
import * as sharp from 'sharp';
import { ImageProcessingOptions } from '../interfaces/upload.interfaces';

@Injectable()
export class ImageProcessingService {
  private readonly logger = new Logger(ImageProcessingService.name);

  async processImage(
    buffer: Buffer,
    options: ImageProcessingOptions = {},
  ): Promise<Buffer> {
    try {
      const {
        width = 1920,
        height = 1080,
        quality = 90,
        format = 'jpeg',
      } = options;

      let sharpInstance = sharp(buffer)
        .resize(width, height, {
          fit: 'inside',
          withoutEnlargement: true,
        });

      // Apply format-specific processing
      switch (format) {
        case 'jpeg':
          sharpInstance = sharpInstance.jpeg({
            quality,
            progressive: true,
          });
          break;
        case 'png':
          sharpInstance = sharpInstance.png({
            quality,
            compressionLevel: 9,
          });
          break;
        case 'webp':
          sharpInstance = sharpInstance.webp({
            quality,
          });
          break;
        default:
          sharpInstance = sharpInstance.jpeg({ quality });
      }

      const processedBuffer = await sharpInstance.toBuffer();



      return processedBuffer;
    } catch (error) {
      this.logger.error(`Failed to process image: ${error.message}`, error.stack);
      throw new Error(`Failed to process image: ${error.message}`);
    }
  }



  async getImageMetadata(buffer: Buffer): Promise<sharp.Metadata> {
    try {
      const metadata = await sharp(buffer).metadata();
      return metadata;
    } catch (error) {
      this.logger.error(`Failed to get image metadata: ${error.message}`, error.stack);
      throw new Error(`Failed to get image metadata: ${error.message}`);
    }
  }

  async optimizeForWeb(buffer: Buffer): Promise<Buffer> {
    try {
      // Optimize image for web delivery with better compression
      const optimized = await sharp(buffer)
        .resize(1200, 800, {
          fit: 'inside',
          withoutEnlargement: true,
        })
        .jpeg({
          quality: 80,
          progressive: true,
          mozjpeg: true,
          optimiseScans: true,
          optimiseCoding: true,
        })
        .toBuffer();



      return optimized;
    } catch (error) {
      this.logger.error(`Failed to optimize image: ${error.message}`, error.stack);
      throw new Error(`Failed to optimize image: ${error.message}`);
    }
  }
}
