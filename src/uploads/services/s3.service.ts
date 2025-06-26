import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, HeadBucketCommand, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';
import { S3UploadResult } from '../interfaces/upload.interfaces';

@Injectable()
export class S3Service {
  private readonly logger = new Logger(S3Service.name);
  private readonly s3: S3Client;
  private readonly bucketName: string;

  constructor(private configService: ConfigService) {
    const accessKeyId = this.configService.get('AWS_ACCESS_KEY_ID');
    const secretAccessKey = this.configService.get('AWS_SECRET_ACCESS_KEY');
    const region = this.configService.get('AWS_REGION');
    this.bucketName = this.configService.get('AWS_S3_BUCKET') || 'scanserve-media';

    this.logger.log(`Initializing S3 with region: ${region}, bucket: ${this.bucketName}`);

    if (!accessKeyId || !secretAccessKey || !region) {
      this.logger.error('Missing AWS credentials or region in environment variables');
      this.logger.error(`AWS_ACCESS_KEY_ID: ${accessKeyId ? 'SET' : 'MISSING'}`);
      this.logger.error(`AWS_SECRET_ACCESS_KEY: ${secretAccessKey ? 'SET' : 'MISSING'}`);
      this.logger.error(`AWS_REGION: ${region ? 'SET' : 'MISSING'}`);
    }

    this.s3 = new S3Client({
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
      region,
    });

    // Test S3 connection on startup
    this.testConnection();
  }

  private async testConnection() {
    try {
      await this.s3.send(new HeadBucketCommand({ Bucket: this.bucketName }));
      this.logger.log(`✅ S3 connection successful. Bucket '${this.bucketName}' is accessible.`);
    } catch (error) {
      this.logger.error(`❌ S3 connection failed: ${error.message}`);
      this.logger.error('Please check:');
      this.logger.error('1. AWS credentials are correct');
      this.logger.error('2. S3 bucket exists');
      this.logger.error('3. Bucket permissions allow access');
      this.logger.error('4. AWS region is correct');
    }
  }

  async uploadFile(
    buffer: Buffer,
    originalName: string,
    mimeType: string,
    folder: string = 'uploads',
  ): Promise<S3UploadResult> {
    const fileExtension = originalName.split('.').pop();
    const fileName = `${uuidv4()}.${fileExtension}`;
    const key = `${folder}/${fileName}`;



    try {
      const uploadParams = {
        Bucket: this.bucketName,
        Key: key,
        Body: buffer,
        ContentType: mimeType,
        // Removed ACL since bucket doesn't allow ACLs
        // Files will be accessible via bucket policy instead
      };

      const command = new PutObjectCommand(uploadParams);
      const uploadResult = await this.s3.send(command);

      return {
        key,
        url: `https://${this.bucketName}.s3.${this.configService.get('AWS_REGION')}.amazonaws.com/${key}`,
        bucket: this.bucketName,
      };
    } catch (error) {
      this.logger.error(`Failed to upload file to S3: ${error.message}`);
      this.logger.error(`Error details:`, error);
      throw new Error(`Failed to upload file: ${error.message}`);
    }
  }

  async deleteFile(key: string): Promise<void> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });
      await this.s3.send(command);


    } catch (error) {
      this.logger.error(`Failed to delete file: ${error.message}`, error.stack);
      throw new Error(`Failed to delete file: ${error.message}`);
    }
  }

  getPublicUrl(key: string): string {
    const region = this.configService.get('AWS_REGION');
    return `https://${this.bucketName}.s3.${region}.amazonaws.com/${key}`;
  }

  async getSignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });
      const url = await getSignedUrl(this.s3, command, { expiresIn });

      return url;
    } catch (error) {
      this.logger.error(`Failed to generate signed URL: ${error.message}`, error.stack);
      throw new Error(`Failed to generate signed URL: ${error.message}`);
    }
  }
}
