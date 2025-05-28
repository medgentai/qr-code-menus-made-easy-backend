import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateQrCodeDto } from './dto/create-qr-code.dto';
import { UpdateQrCodeDto } from './dto/update-qr-code.dto';
import { VenuesService } from '../venues/venues.service';
import { MenusService } from '../menus/menus.service';
import * as QRCode from 'qrcode';

@Injectable()
export class QrCodesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly venuesService: VenuesService,
    private readonly menusService: MenusService,
  ) {}

  /**
   * Create a new QR code
   */
  async create(createQrCodeDto: CreateQrCodeDto, userId: string) {
    const { venueId, menuId, tableId, name, description, isActive } = createQrCodeDto;

    // Check if venue exists and user has access
    const venue = await this.venuesService.findOne(venueId, userId);

    // Check if menu exists and user has access
    await this.menusService.findMenuById(menuId, userId);

    // If tableId is provided, check if table exists and belongs to the venue
    if (tableId) {
      const table = await this.prisma.table.findUnique({
        where: { id: tableId },
      });

      if (!table) {
        throw new NotFoundException(`Table with ID ${tableId} not found`);
      }

      if (table.venueId !== venueId) {
        throw new BadRequestException('Table does not belong to the specified venue');
      }

      // Check if table already has a QR code
      const existingQrCode = await this.prisma.qrCode.findUnique({
        where: { tableId },
      });

      if (existingQrCode) {
        throw new BadRequestException(`Table with ID ${tableId} already has a QR code`);
      }
    }

    // Generate QR code data (URL that will be encoded in the QR code)
    const organization = await this.prisma.organization.findUnique({
      where: { id: venue.organizationId },
      select: { slug: true },
    });

    if (!organization) {
      throw new NotFoundException(`Organization not found`);
    }

    // Always include venue ID in the URL for public ordering
    const qrCodeData = tableId
      ? `https://menu.scanserve.com/${organization.slug}?table=${tableId}&venue=${venueId}`
      : `https://menu.scanserve.com/${organization.slug}?venue=${venueId}`;

    // Generate QR code image
    const qrCodeBuffer = await QRCode.toBuffer(qrCodeData);
    const qrCodeBase64 = qrCodeBuffer.toString('base64');
    const qrCodeUrl = `data:image/png;base64,${qrCodeBase64}`;

    // Create QR code in database
    return this.prisma.qrCode.create({
      data: {
        venueId,
        menuId,
        tableId,
        name,
        description,
        qrCodeUrl,
        qrCodeData,
        isActive: isActive ?? true,
      },
    });
  }

  /**
   * Find all QR codes for a venue
   */
  async findAllForVenue(venueId: string, userId: string) {
    // Check if venue exists and user has access
    await this.venuesService.findOne(venueId, userId);

    return this.prisma.qrCode.findMany({
      where: { venueId },
      include: {
        table: true,
        menu: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  /**
   * Find a QR code by ID
   */
  async findOne(id: string, userId: string) {
    const qrCode = await this.prisma.qrCode.findUnique({
      where: { id },
      include: {
        venue: true,
        table: true,
        menu: {
          select: {
            id: true,
            name: true,
          },
        },
        scans: {
          orderBy: {
            scannedAt: 'desc',
          },
          take: 10,
        },
      },
    });

    if (!qrCode) {
      throw new NotFoundException(`QR code with ID ${id} not found`);
    }

    // Check if user has access to the venue
    await this.venuesService.findOne(qrCode.venueId, userId);

    return qrCode;
  }

  /**
   * Update a QR code
   */
  async update(id: string, updateQrCodeDto: UpdateQrCodeDto, userId: string) {
    const qrCode = await this.findOne(id, userId);

    // If menuId is provided, check if menu exists and user has access
    if (updateQrCodeDto.menuId) {
      await this.menusService.findMenuById(updateQrCodeDto.menuId, userId);
    }

    return this.prisma.qrCode.update({
      where: { id },
      data: updateQrCodeDto,
    });
  }

  /**
   * Delete a QR code
   */
  async remove(id: string, userId: string) {
    // Check if QR code exists and user has access
    await this.findOne(id, userId);

    return this.prisma.qrCode.delete({
      where: { id },
    });
  }

  /**
   * Record a QR code scan
   */
  async recordScan(id: string, ipAddress?: string, userAgent?: string) {
    const qrCode = await this.prisma.qrCode.findUnique({
      where: { id },
    });

    if (!qrCode) {
      throw new NotFoundException(`QR code with ID ${id} not found`);
    }

    // Create scan record
    await this.prisma.qrCodeScan.create({
      data: {
        qrCodeId: id,
        ipAddress,
        userAgent,
      },
    });

    // Update scan count
    return this.prisma.qrCode.update({
      where: { id },
      data: {
        scanCount: {
          increment: 1,
        },
      },
    });
  }
}
