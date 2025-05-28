import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateVenueDto } from './dto/create-venue.dto';
import { UpdateVenueDto } from './dto/update-venue.dto';
import { CreateTableDto } from './dto/create-table.dto';
import { UpdateTableDto } from './dto/update-table.dto';
import { Venue, Table } from '@prisma/client';
import { OrganizationsService } from '../organizations/organizations.service';
import * as QRCode from 'qrcode';

@Injectable()
export class VenuesService {
  constructor(
    private prisma: PrismaService,
    private organizationsService: OrganizationsService
  ) {}

  /**
   * Create a new venue
   */
  async create(createVenueDto: CreateVenueDto, userId: string): Promise<Venue> {
    // Check if user is a member of the organization
    const isMember = await this.organizationsService.isMember(
      createVenueDto.organizationId,
      userId
    );

    if (!isMember) {
      throw new ForbiddenException('You are not a member of this organization');
    }

    // Create the venue
    return this.prisma.venue.create({
      data: createVenueDto,
    });
  }

  /**
   * Find all venues for an organization
   */
  async findAllForOrganization(organizationId: string, userId: string): Promise<Venue[]> {
    // Check if user is a member of the organization
    const isMember = await this.organizationsService.isMember(
      organizationId,
      userId
    );

    if (!isMember) {
      throw new ForbiddenException('You are not a member of this organization');
    }

    return this.prisma.venue.findMany({
      where: { organizationId },
    });
  }

  /**
   * Find one venue by ID
   */
  async findOne(id: string, userId: string): Promise<Venue> {
    const venue = await this.prisma.venue.findUnique({
      where: { id },
    });

    if (!venue) {
      throw new NotFoundException(`Venue with ID '${id}' not found`);
    }

    // Check if user is a member of the organization
    const isMember = await this.organizationsService.isMember(
      venue.organizationId,
      userId
    );

    if (!isMember) {
      throw new ForbiddenException('You are not a member of this organization');
    }

    return venue;
  }

  /**
   * Update a venue
   */
  async update(id: string, updateVenueDto: UpdateVenueDto, userId: string): Promise<Venue> {
    // Check if venue exists and user has access
    const venue = await this.findOne(id, userId);

    return this.prisma.venue.update({
      where: { id },
      data: updateVenueDto,
    });
  }

  /**
   * Delete a venue
   */
  async remove(id: string, userId: string): Promise<Venue> {
    // Check if venue exists and user has access
    const venue = await this.findOne(id, userId);

    return this.prisma.venue.delete({
      where: { id },
    });
  }

  /**
   * Create a new table for a venue
   */
  async createTable(createTableDto: CreateTableDto, userId: string): Promise<Table> {
    // Check if venue exists and user has access
    const venue = await this.findOne(createTableDto.venueId, userId);

    // Create the table
    const newTable = await this.prisma.table.create({
      data: createTableDto,
    });

    // Auto-generate QR code for the new table
    try {
      await this.generateQrCodeForTable(newTable, venue, userId);
    } catch (error) {
      console.error('Failed to auto-generate QR code for table:', error);
      // We don't want to fail the table creation if QR code generation fails
    }

    return newTable;
  }

  /**
   * Generate a QR code for a table
   */
  private async generateQrCodeForTable(table: Table, venue: Venue, userId: string): Promise<void> {
    // Get the default menu for the venue's organization
    const menus = await this.prisma.menu.findMany({
      where: {
        organizationId: venue.organizationId,
        isActive: true
      },
      orderBy: { createdAt: 'desc' },
      take: 1,
    });

    if (menus.length === 0) {
      throw new NotFoundException('No active menu found for this organization');
    }

    const defaultMenu = menus[0];

    // Generate QR code data (URL that will be encoded in the QR code)
    const organization = await this.prisma.organization.findUnique({
      where: { id: venue.organizationId },
      select: { slug: true },
    });

    if (!organization) {
      throw new NotFoundException(`Organization not found`);
    }

    const qrCodeData = `https://menu.scanserve.com/${organization.slug}?table=${table.id}`;

    // Generate QR code image
    const qrCodeBuffer = await QRCode.toBuffer(qrCodeData);
    const qrCodeBase64 = qrCodeBuffer.toString('base64');
    const qrCodeUrl = `data:image/png;base64,${qrCodeBase64}`;

    // Create QR code in database
    await this.prisma.qrCode.create({
      data: {
        venueId: venue.id,
        menuId: defaultMenu.id,
        tableId: table.id,
        name: `${table.name} QR Code`,
        description: `Auto-generated QR code for ${table.name}`,
        qrCodeUrl,
        qrCodeData,
        isActive: true,
        scanCount: 0,
      },
    });
  }

  /**
   * Find all tables for a venue
   */
  async findAllTablesForVenue(venueId: string, userId: string): Promise<Table[]> {
    // Check if venue exists and user has access
    const venue = await this.findOne(venueId, userId);

    return this.prisma.table.findMany({
      where: { venueId },
    });
  }

  /**
   * Find one table by ID
   */
  async findOneTable(id: string, userId: string): Promise<Table> {
    const table = await this.prisma.table.findUnique({
      where: { id },
      include: { venue: true },
    });

    if (!table) {
      throw new NotFoundException(`Table with ID '${id}' not found`);
    }

    // Check if user is a member of the organization
    const isMember = await this.organizationsService.isMember(
      table.venue.organizationId,
      userId
    );

    if (!isMember) {
      throw new ForbiddenException('You are not a member of this organization');
    }

    return table;
  }

  /**
   * Update a table
   */
  async updateTable(id: string, updateTableDto: UpdateTableDto, userId: string): Promise<Table> {
    // Check if table exists and user has access
    const table = await this.findOneTable(id, userId);

    return this.prisma.table.update({
      where: { id },
      data: updateTableDto,
    });
  }

  /**
   * Delete a table
   */
  async removeTable(id: string, userId: string): Promise<Table> {
    // Check if table exists and user has access
    const table = await this.findOneTable(id, userId);

    // Check if the table has a QR code associated with it
    const qrCode = await this.prisma.qrCode.findUnique({
      where: { tableId: id },
    });

    if (qrCode) {
      throw new BadRequestException('Cannot delete table with an associated QR code. Delete the QR code first.');
    }

    return this.prisma.table.delete({
      where: { id },
    });
  }
}
