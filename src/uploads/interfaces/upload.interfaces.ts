export interface UploadResponse {
  id: string;
  url: string;
  fileName: string;
  originalName: string;
  fileSize: number;
  mimeType: string;
}

export interface ImageProcessingOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'jpeg' | 'png' | 'webp';
}

export interface S3UploadResult {
  key: string;
  url: string;
  bucket: string;
}

export interface MediaFileData {
  fileName: string;
  originalName: string;
  fileSize: number;
  mimeType: string;
  s3Key: string;
  s3Url: string;
  organizationId?: string;
  venueId?: string;
  uploadedBy: string;
}
