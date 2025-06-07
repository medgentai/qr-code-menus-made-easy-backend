import {
  Controller,
  Post,
  Delete,
  Get,
  Param,
  UseGuards,
  HttpStatus,
  Req,
  BadRequestException,
} from '@nestjs/common';
import { FastifyRequest } from 'fastify';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiConsumes,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { UploadsService } from './uploads.service';
import { UploadMenuItemImageDto } from './dto/upload-menu-item-image.dto';
import { UploadOrganizationLogoDto } from './dto/upload-organization-logo.dto';
import { UploadVenueImageDto } from './dto/upload-venue-image.dto';
import { UploadCategoryImageDto } from './dto/upload-category-image.dto';
import { UploadUserProfileImageDto } from './dto/upload-user-profile-image.dto';
import { UploadResponse } from './interfaces/upload.interfaces';
import { UploadResponseEntity } from './entities/upload-response.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('uploads')
@Controller('uploads')
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}



  @Post('menu-item')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Upload menu item image' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Image uploaded successfully',
    type: UploadResponseEntity,
  })
  async uploadMenuItemImage(
    @Req() req: FastifyRequest,
    @GetUser('id') userId: string,
  ): Promise<UploadResponse> {
    const { file, fields } = await this.processMultipartData(req);

    const dto: UploadMenuItemImageDto = {
      menuItemId: fields.menuItemId as string,
      altText: fields.altText as string,
    };

    return this.uploadsService.uploadMenuItemImage(file, dto, userId);
  }

  @Post('organization-logo/:organizationId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Upload organization logo' })
  @ApiParam({ name: 'organizationId', description: 'Organization ID' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Logo uploaded successfully',
    type: UploadResponseEntity,
  })
  async uploadOrganizationLogo(
    @Req() req: FastifyRequest,
    @Param('organizationId') organizationId: string,
    @GetUser('id') userId: string,
  ): Promise<UploadResponse> {
    const { file, fields } = await this.processMultipartData(req);

    const dto: UploadOrganizationLogoDto = {
      altText: fields.altText as string,
    };

    return this.uploadsService.uploadOrganizationLogo(file, dto, userId, organizationId);
  }

  @Post('venue-image')
  @ApiOperation({ summary: 'Upload venue image' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Venue image uploaded successfully',
    type: UploadResponseEntity,
  })
  async uploadVenueImage(
    @Req() req: FastifyRequest,
    @GetUser('id') userId: string,
  ): Promise<UploadResponse> {
    const { file, fields } = await this.processMultipartData(req);

    const dto: UploadVenueImageDto = {
      venueId: fields.venueId as string,
      altText: fields.altText as string,
    };

    return this.uploadsService.uploadVenueImage(file, dto, userId);
  }

  @Post('category-image')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Upload category image' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Category image uploaded successfully',
    type: UploadResponseEntity,
  })
  async uploadCategoryImage(
    @Req() req: FastifyRequest,
    @GetUser('id') userId: string,
  ): Promise<UploadResponse> {
    const { file, fields } = await this.processMultipartData(req);

    const dto: UploadCategoryImageDto = {
      categoryId: fields.categoryId as string,
      altText: fields.altText as string,
    };

    return this.uploadsService.uploadCategoryImage(file, dto, userId);
  }

  @Post('user-profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Upload user profile image' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Profile image uploaded successfully',
    type: UploadResponseEntity,
  })
  async uploadUserProfileImage(
    @Req() req: FastifyRequest,
    @GetUser('id') userId: string,
  ): Promise<UploadResponseEntity> {
    const { file, fields } = await this.processMultipartData(req);

    const dto: UploadUserProfileImageDto = {
      altText: fields.altText,
    };

    return this.uploadsService.uploadUserProfileImage(file, dto, userId);
  }



  @Delete('media/:id')
  @ApiOperation({ summary: 'Delete media file' })
  @ApiParam({
    name: 'id',
    description: 'Media file ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Media file deleted successfully',
  })
  async deleteMediaFile(
    @Param('id') mediaFileId: string,
    @GetUser('id') userId: string,
  ): Promise<{ message: string }> {
    await this.uploadsService.deleteMediaFile(mediaFileId, userId);
    return { message: 'Media file deleted successfully' };
  }

  private async processMultipartData(req: FastifyRequest): Promise<{
    file: Express.Multer.File;
    fields: Record<string, any>;
  }> {
    try {
      const parts = req.parts();
      let file: Express.Multer.File | null = null;
      const fields: Record<string, any> = {};

      for await (const part of parts) {
        if (part.type === 'file') {
          // Convert stream to buffer
          const chunks: Buffer[] = [];
          for await (const chunk of part.file) {
            chunks.push(chunk);
          }
          const buffer = Buffer.concat(chunks);

          // Convert Fastify file to Multer-like file object
          file = {
            fieldname: part.fieldname,
            originalname: part.filename,
            encoding: part.encoding,
            mimetype: part.mimetype,
            size: buffer.length,
            buffer: buffer,
            destination: '',
            filename: part.filename,
            path: '',
            stream: part.file,
          };
        } else {
          // Handle form fields
          fields[part.fieldname] = part.value;
        }
      }

      if (!file) {
        throw new BadRequestException('No file uploaded');
      }

      return { file, fields };
    } catch (error) {
      throw new BadRequestException(`Failed to process upload: ${error.message}`);
    }
  }
}
