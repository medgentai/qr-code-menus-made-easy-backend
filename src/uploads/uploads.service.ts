import { Injectable, Logger, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OrganizationsService } from '../organizations/organizations.service';
import { S3Service } from './services/s3.service';
import { ImageProcessingService } from './services/image-processing.service';
import { UploadResponse, MediaFileData } from './interfaces/upload.interfaces';
import { UploadMenuItemImageDto } from './dto/upload-menu-item-image.dto';
import { UploadOrganizationLogoDto } from './dto/upload-organization-logo.dto';
import { UploadVenueImageDto } from './dto/upload-venue-image.dto';
import { UploadCategoryImageDto } from './dto/upload-category-image.dto';
import { UploadUserProfileImageDto } from './dto/upload-user-profile-image.dto';

@Injectable()
export class UploadsService {
  private readonly logger = new Logger(UploadsService.name);

  constructor(
    private prisma: PrismaService,
    private organizationsService: OrganizationsService,
    private s3Service: S3Service,
    private imageProcessingService: ImageProcessingService,
  ) {}

  async uploadMenuItemImage(
    file: Express.Multer.File,
    dto: UploadMenuItemImageDto,
    userId: string,
  ): Promise<UploadResponse> {
    // Validate file
    this.validateImageFile(file);

    // Get organization context
    const menuItem = await this.prisma.menuItem.findUnique({
      where: { id: dto.menuItemId },
      include: {
        category: {
          include: {
            menu: {
              include: {
                organization: true,
              },
            },
          },
        },
      },
    });

    if (!menuItem) {
      throw new NotFoundException('Menu item not found');
    }

    const organizationId = menuItem.category.menu.organization.id;

    // Check if user has permission to upload menu item images (OWNER, ADMINISTRATOR, or MANAGER)
    const hasPermission = await this.organizationsService.hasRole(
      organizationId,
      userId,
      ['OWNER', 'ADMINISTRATOR', 'MANAGER'],
    );

    if (!hasPermission) {
      throw new ForbiddenException('You do not have permission to upload menu item images');
    }

    // Process and upload menu item image with consistent naming
    const { originalUrl, mediaFile } = await this.processAndUploadMenuItemImage(
      file,
      organizationId,
      dto.menuItemId,
      userId,
    );

    // Update menu item with image URL
    await this.prisma.menuItem.update({
      where: { id: dto.menuItemId },
      data: {
        imageUrl: originalUrl,
      },
    });

    this.logger.log(`Menu item image uploaded: ${dto.menuItemId}`);

    return {
      id: mediaFile.id,
      url: originalUrl,
      fileName: mediaFile.fileName,
      originalName: mediaFile.originalName,
      fileSize: mediaFile.fileSize,
      mimeType: mediaFile.mimeType,
    };
  }

  async uploadOrganizationLogo(
    file: Express.Multer.File,
    _dto: UploadOrganizationLogoDto,
    userId: string,
    organizationId: string,
  ): Promise<UploadResponse> {
    // Validate file
    this.validateImageFile(file);

    // Check if user has permission to upload organization logo (OWNER or ADMINISTRATOR)
    const hasPermission = await this.organizationsService.hasRole(
      organizationId,
      userId,
      ['OWNER', 'ADMINISTRATOR'],
    );

    if (!hasPermission) {
      throw new ForbiddenException('You do not have permission to upload organization logo');
    }

    // Process and upload organization logo with consistent filename
    const { originalUrl, mediaFile } = await this.processAndUploadOrganizationLogo(
      file,
      organizationId,
      userId,
    );

    // Update organization with logo URL
    await this.prisma.organization.update({
      where: { id: organizationId },
      data: {
        logoUrl: originalUrl,
      },
    });

    this.logger.log(`Organization logo uploaded: ${organizationId}`);

    return {
      id: mediaFile.id,
      url: originalUrl,
      fileName: mediaFile.fileName,
      originalName: mediaFile.originalName,
      fileSize: mediaFile.fileSize,
      mimeType: mediaFile.mimeType,
    };
  }

  async uploadVenueImage(
    file: Express.Multer.File,
    dto: UploadVenueImageDto,
    userId: string,
  ): Promise<UploadResponse> {
    // Validate file
    this.validateImageFile(file);

    // Get organization context
    const venue = await this.prisma.venue.findUnique({
      where: { id: dto.venueId },
      include: { organization: true },
    });

    if (!venue) {
      throw new NotFoundException('Venue not found');
    }

    const organizationId = venue.organization.id;

    // Check if user has permission to upload venue images (OWNER, ADMINISTRATOR, or MANAGER)
    // Ensure userId is a string
    const userIdString = typeof userId === 'string' ? userId : (userId as any)?.id || userId;

    const hasPermission = await this.organizationsService.hasRole(
      organizationId,
      userIdString,
      ['OWNER', 'ADMINISTRATOR', 'MANAGER'],
    );

    if (!hasPermission) {
      throw new ForbiddenException('You do not have permission to upload venue images');
    }

    // Process and upload venue image with consistent naming
    const { originalUrl, mediaFile } = await this.processAndUploadVenueImage(
      file,
      organizationId,
      dto.venueId,
      userIdString,
    );

    // Update venue with image URL
    await this.prisma.venue.update({
      where: { id: dto.venueId },
      data: {
        imageUrl: originalUrl,
      },
    });

    this.logger.log(`✅ Venue image uploaded successfully: ${dto.venueId}`);

    return {
      id: mediaFile.id,
      url: originalUrl,
      fileName: mediaFile.fileName,
      originalName: mediaFile.originalName,
      fileSize: mediaFile.fileSize,
      mimeType: mediaFile.mimeType,
    };
  }

  private async processAndUploadSingleImage(
    file: Express.Multer.File,
    folder: string,
    organizationId: string | null,
    venueId: string | null,
    userId: string,
  ): Promise<{
    originalUrl: string;
    mediaFile: any;
  }> {
    try {
      // Process and optimize image for web
      const optimizedBuffer = await this.imageProcessingService.optimizeForWeb(file.buffer);

      // Upload single optimized image
      const originalUpload = await this.s3Service.uploadFile(
        optimizedBuffer,
        file.originalname,
        file.mimetype,
        folder,
      );

      // Save media file record
      const mediaFile = await this.prisma.mediaFile.create({
        data: {
          fileName: originalUpload.key.split('/').pop()!,
          originalName: file.originalname,
          fileSize: optimizedBuffer.length, // Use optimized file size
          mimeType: 'image/jpeg', // Always JPEG after optimization
          s3Key: originalUpload.key,
          s3Url: originalUpload.url,
          organizationId: organizationId || undefined, // Convert null to undefined for Prisma
          venueId,
          uploadedBy: userId,
        },
      });

      // Use consistent public URL format
      const publicUrl = this.s3Service.getPublicUrl(originalUpload.key);

      return {
        originalUrl: publicUrl,
        mediaFile,
      };
    } catch (error) {
      this.logger.error(`Failed to process and upload single image: ${error.message}`, error.stack);
      throw new BadRequestException(`Failed to upload image: ${error.message}`);
    }
  }

  async uploadCategoryImage(
    file: Express.Multer.File,
    dto: UploadCategoryImageDto,
    userId: string,
  ): Promise<UploadResponse> {
    // Validate file
    this.validateImageFile(file);

    // Get organization context
    const category = await this.prisma.category.findUnique({
      where: { id: dto.categoryId },
      include: {
        menu: {
          include: {
            organization: true,
          },
        },
      },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    const organizationId = category.menu.organization.id;

    // Check if user has permission to upload category images (OWNER, ADMINISTRATOR, or MANAGER)
    const hasPermission = await this.organizationsService.hasRole(
      organizationId,
      userId,
      ['OWNER', 'ADMINISTRATOR', 'MANAGER'],
    );

    if (!hasPermission) {
      throw new ForbiddenException('You do not have permission to upload category images');
    }

    // Process and upload category image with consistent naming
    const { originalUrl, mediaFile } = await this.processAndUploadCategoryImage(
      file,
      organizationId,
      dto.categoryId,
      userId,
    );

    // Update category with image URL
    await this.prisma.category.update({
      where: { id: dto.categoryId },
      data: {
        imageUrl: originalUrl,
      },
    });

    this.logger.log(`Category image uploaded: ${dto.categoryId}`);

    return {
      id: mediaFile.id,
      url: originalUrl,
      fileName: mediaFile.fileName,
      originalName: mediaFile.originalName,
      fileSize: mediaFile.fileSize,
      mimeType: mediaFile.mimeType,
    };
  }

  async uploadUserProfileImage(
    file: Express.Multer.File,
    _dto: UploadUserProfileImageDto,
    userId: string,
  ): Promise<UploadResponse> {
    // Validate file
    this.validateImageFile(file);

    // Get user to verify they exist
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Process and upload image (single image only)
    const { originalUrl, mediaFile } = await this.processAndUploadSingleImage(
      file,
      'users/profiles',
      null, // No organization for user profiles
      null, // No venue for user profiles
      userId,
    );

    // Update user with profile image URL
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        profileImageUrl: originalUrl,
      },
    });

    this.logger.log(`User profile image uploaded: ${userId}`);

    return {
      id: mediaFile.id,
      url: originalUrl,
      fileName: mediaFile.fileName,
      originalName: mediaFile.originalName,
      fileSize: mediaFile.fileSize,
      mimeType: mediaFile.mimeType,
    };
  }

  private async processAndUploadVenueImage(
    file: Express.Multer.File,
    organizationId: string,
    venueId: string,
    userId: string,
  ): Promise<{
    originalUrl: string;
    mediaFile: any;
  }> {
    try {
      // Process and optimize image for web
      const optimizedBuffer = await this.imageProcessingService.optimizeForWeb(file.buffer);

      // ALWAYS use .jpg extension for consistency (we optimize to JPEG anyway)
      const venueFileName = `venue-${venueId}.jpg`;

      // First, delete any existing venue images for this venue
      const existingMediaFiles = await this.prisma.mediaFile.findMany({
        where: {
          venueId: venueId,
          organizationId: organizationId,
        },
      });

      // Delete all existing files from S3 and database
      for (const existingFile of existingMediaFiles) {
        try {
          await this.s3Service.deleteFile(existingFile.s3Key);
        } catch (deleteError) {
          this.logger.warn(`Failed to delete old venue image from S3: ${deleteError.message}`);
        }

        await this.prisma.mediaFile.delete({
          where: { id: existingFile.id },
        });
      }

      // Upload new file to S3
      const originalUpload = await this.s3Service.uploadFile(
        optimizedBuffer,
        venueFileName,
        'image/jpeg', // Always use JPEG
        `organizations/${organizationId}/venues`,
      );

      // Create new media file record
      const mediaFile = await this.prisma.mediaFile.create({
        data: {
          fileName: venueFileName,
          originalName: file.originalname,
          fileSize: optimizedBuffer.length, // Use optimized file size
          mimeType: 'image/jpeg', // Always JPEG after optimization
          s3Key: originalUpload.key,
          s3Url: originalUpload.url,
          organizationId: organizationId,
          venueId: venueId,
          uploadedBy: userId,
        },
      });

      // Use consistent public URL format
      const publicUrl = this.s3Service.getPublicUrl(originalUpload.key);

      return {
        originalUrl: publicUrl,
        mediaFile,
      };
    } catch (error) {
      this.logger.error(`Failed to process and upload venue image: ${error.message}`, error.stack);
      throw new BadRequestException(`Failed to upload venue image: ${error.message}`);
    }
  }

  private async processAndUploadMenuItemImage(
    file: Express.Multer.File,
    organizationId: string,
    menuItemId: string,
    userId: string,
  ): Promise<{
    originalUrl: string;
    mediaFile: any;
  }> {
    try {
      // Process and optimize image for web
      const optimizedBuffer = await this.imageProcessingService.optimizeForWeb(file.buffer);

      // ALWAYS use .jpg extension for consistency (we optimize to JPEG anyway)
      const menuItemFileName = `menu-item-${menuItemId}.jpg`;

      // First, delete any existing menu item images for this menu item
      const existingMediaFiles = await this.prisma.mediaFile.findMany({
        where: {
          organizationId: organizationId,
          s3Key: {
            contains: `menu-item-${menuItemId}`,
          },
        },
      });

      // Delete all existing files from S3 and database
      for (const existingFile of existingMediaFiles) {
        try {
          await this.s3Service.deleteFile(existingFile.s3Key);
        } catch (deleteError) {
          this.logger.warn(`Failed to delete old menu item image from S3: ${deleteError.message}`);
        }

        await this.prisma.mediaFile.delete({
          where: { id: existingFile.id },
        });
      }

      // Upload new file to S3
      const originalUpload = await this.s3Service.uploadFile(
        optimizedBuffer,
        menuItemFileName,
        'image/jpeg', // Always use JPEG
        `organizations/${organizationId}/menu-items`,
      );

      // Create new media file record
      const mediaFile = await this.prisma.mediaFile.create({
        data: {
          fileName: menuItemFileName,
          originalName: file.originalname,
          fileSize: optimizedBuffer.length, // Use optimized file size
          mimeType: 'image/jpeg', // Always JPEG after optimization
          s3Key: originalUpload.key,
          s3Url: originalUpload.url,
          organizationId: organizationId,
          venueId: null, // Menu items don't belong to specific venues
          uploadedBy: userId,
        },
      });

      // Use consistent public URL format
      const publicUrl = this.s3Service.getPublicUrl(originalUpload.key);

      return {
        originalUrl: publicUrl,
        mediaFile,
      };
    } catch (error) {
      this.logger.error(`Failed to process and upload menu item image: ${error.message}`, error.stack);
      throw new BadRequestException(`Failed to upload menu item image: ${error.message}`);
    }
  }

  private async processAndUploadCategoryImage(
    file: Express.Multer.File,
    organizationId: string,
    categoryId: string,
    userId: string,
  ): Promise<{
    originalUrl: string;
    mediaFile: any;
  }> {
    try {
      // Process and optimize image for web
      const optimizedBuffer = await this.imageProcessingService.optimizeForWeb(file.buffer);

      // ALWAYS use .jpg extension for consistency (we optimize to JPEG anyway)
      const categoryFileName = `category-${categoryId}.jpg`;

      // First, delete any existing category images for this category
      const existingMediaFiles = await this.prisma.mediaFile.findMany({
        where: {
          organizationId: organizationId,
          s3Key: {
            contains: `category-${categoryId}`,
          },
        },
      });

      // Delete all existing files from S3 and database
      for (const existingFile of existingMediaFiles) {
        try {
          await this.s3Service.deleteFile(existingFile.s3Key);
        } catch (deleteError) {
          this.logger.warn(`Failed to delete old category image from S3: ${deleteError.message}`);
        }

        await this.prisma.mediaFile.delete({
          where: { id: existingFile.id },
        });
      }

      // Upload new file to S3
      const originalUpload = await this.s3Service.uploadFile(
        optimizedBuffer,
        categoryFileName,
        'image/jpeg', // Always use JPEG
        `organizations/${organizationId}/categories`,
      );

      // Create new media file record
      const mediaFile = await this.prisma.mediaFile.create({
        data: {
          fileName: categoryFileName,
          originalName: file.originalname,
          fileSize: optimizedBuffer.length, // Use optimized file size
          mimeType: 'image/jpeg', // Always JPEG after optimization
          s3Key: originalUpload.key,
          s3Url: originalUpload.url,
          organizationId: organizationId,
          venueId: null, // Categories don't belong to specific venues
          uploadedBy: userId,
        },
      });

      // Use consistent public URL format
      const publicUrl = this.s3Service.getPublicUrl(originalUpload.key);

      return {
        originalUrl: publicUrl,
        mediaFile,
      };
    } catch (error) {
      this.logger.error(`Failed to process and upload category image: ${error.message}`, error.stack);
      throw new BadRequestException(`Failed to upload category image: ${error.message}`);
    }
  }

  private async processAndUploadOrganizationLogo(
    file: Express.Multer.File,
    organizationId: string,
    userId: string,
  ): Promise<{
    originalUrl: string;
    mediaFile: any;
  }> {
    try {
      // Process and optimize image for web
      const optimizedBuffer = await this.imageProcessingService.optimizeForWeb(file.buffer);

      // ALWAYS use .jpg extension for consistency (we optimize to JPEG anyway)
      const logoFileName = `logo.jpg`;

      // First, delete any existing organization logos
      const existingMediaFiles = await this.prisma.mediaFile.findMany({
        where: {
          organizationId: organizationId,
          venueId: null, // Logo files have null venueId
        },
      });

      // Delete all existing logo files from S3 and database
      for (const existingFile of existingMediaFiles) {
        try {
          await this.s3Service.deleteFile(existingFile.s3Key);
        } catch (deleteError) {
          this.logger.warn(`Failed to delete old organization logo from S3: ${deleteError.message}`);
        }

        await this.prisma.mediaFile.delete({
          where: { id: existingFile.id },
        });
      }

      // Upload new file to S3
      const originalUpload = await this.s3Service.uploadFile(
        optimizedBuffer,
        logoFileName,
        'image/jpeg', // Always use JPEG
        `organizations/${organizationId}`,
      );

      // Create new media file record
      const mediaFile = await this.prisma.mediaFile.create({
        data: {
          fileName: logoFileName,
          originalName: file.originalname,
          fileSize: optimizedBuffer.length, // Use optimized file size
          mimeType: 'image/jpeg', // Always JPEG after optimization
          s3Key: originalUpload.key,
          s3Url: originalUpload.url,
          organizationId: organizationId,
          venueId: null,
          uploadedBy: userId,
        },
      });

      // Use consistent public URL format
      const publicUrl = this.s3Service.getPublicUrl(originalUpload.key);

      return {
        originalUrl: publicUrl,
        mediaFile,
      };
    } catch (error) {
      this.logger.error(`Failed to process and upload organization logo: ${error.message}`, error.stack);
      throw new BadRequestException(`Failed to upload organization logo: ${error.message}`);
    }
  }

  private validateImageFile(file: Express.Multer.File): void {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    // Check file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      throw new BadRequestException('File size exceeds 10MB limit');
    }

    // Check file type
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException('Only JPEG, PNG, and WebP images are allowed');
    }

    // Check file extension
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
    const fileExtension = file.originalname.toLowerCase().substring(file.originalname.lastIndexOf('.'));
    if (!allowedExtensions.includes(fileExtension)) {
      throw new BadRequestException('Invalid file extension');
    }
  }



  async deleteMediaFile(mediaFileId: string, _userId: string): Promise<void> {
    const mediaFile = await this.prisma.mediaFile.findUnique({
      where: { id: mediaFileId },
    });

    if (!mediaFile) {
      throw new NotFoundException('Media file not found');
    }

    try {
      // Delete from S3
      await this.s3Service.deleteFile(mediaFile.s3Key);

      // Delete from database
      await this.prisma.mediaFile.delete({
        where: { id: mediaFileId },
      });

      this.logger.log(`Media file deleted: ${mediaFileId}`);
    } catch (error) {
      this.logger.error(`Failed to delete media file: ${error.message}`, error.stack);
      throw new BadRequestException(`Failed to delete media file: ${error.message}`);
    }
  }
}