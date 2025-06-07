import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as AWS from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';
import { S3UploadResult } from '../interfaces/upload.interfaces';

@Injectable()
export class S3Service {
  private readonly logger = new Logger(S3Service.name);
  private readonly s3: AWS.S3;
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

    this.s3 = new AWS.S3({
      accessKeyId,
      secretAccessKey,
      region,
    });

    // Test S3 connection on startup
    this.testConnection();
  }

  private async testConnection() {
    try {
      await this.s3.headBucket({ Bucket: this.bucketName }).promise();
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

      const uploadResult = await this.s3
        .upload(uploadParams)
        .promise();

      return {
        key,
        url: uploadResult.Location,
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
      await this.s3
        .deleteObject({
          Bucket: this.bucketName,
          Key: key,
        })
        .promise();


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
      const url = await this.s3.getSignedUrlPromise('getObject', {
        Bucket: this.bucketName,
        Key: key,
        Expires: expiresIn,
      });

      return url;
    } catch (error) {
      this.logger.error(`Failed to generate signed URL: ${error.message}`, error.stack);
      throw new Error(`Failed to generate signed URL: ${error.message}`);
    }
  }
}
