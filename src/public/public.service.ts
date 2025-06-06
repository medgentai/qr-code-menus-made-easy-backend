import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { QrCodesService } from '../qr-codes/qr-codes.service';

@Injectable()
export class PublicService {
  constructor(
    private prisma: PrismaService,
    private qrCodesService: QrCodesService,
  ) {}

  /**
   * Find all active menus for an organization by slug
   */
  async findMenusByOrganizationSlug(slug: string) {
    const organization = await this.prisma.organization.findUnique({
      where: { slug },
    });

    if (!organization) {
      throw new NotFoundException(`Organization with slug ${slug} not found`);
    }

    return this.prisma.menu.findMany({
      where: {
        organizationId: organization.id,
        isActive: true
      },
      include: {
        categories: {
          where: { isActive: true },
          orderBy: { displayOrder: 'asc' },
          include: {
            items: {
              where: { isAvailable: true },
              orderBy: { displayOrder: 'asc' },
            },
          },
        },
      },
    });
  }

  /**
   * Find a menu by ID with its categories and items
   */
  async findMenuById(id: string) {
    const menu = await this.prisma.menu.findUnique({
      where: { id },
      include: {
        categories: {
          where: { isActive: true },
          orderBy: { displayOrder: 'asc' },
          include: {
            items: {
              where: { isAvailable: true },
              orderBy: { displayOrder: 'asc' },
            },
          },
        },
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    if (!menu) {
      throw new NotFoundException(`Menu with ID ${id} not found`);
    }

    return menu;
  }

  /**
   * Find a menu by organization slug and optional table or venue ID
   */
  async findMenuByOrganizationAndTable(slug: string, tableId?: string, venueId?: string) {
    const organization = await this.prisma.organization.findUnique({
      where: { slug },
    });

    if (!organization) {
      throw new NotFoundException(`Organization with slug ${slug} not found`);
    }

    // If tableId is provided, find the QR code for that table
    if (tableId) {
      const table = await this.prisma.table.findUnique({
        where: { id: tableId },
        include: {
          venue: true,
          qrCode: {
            include: {
              menu: {
                include: {
                  categories: {
                    where: { isActive: true },
                    orderBy: { displayOrder: 'asc' },
                    include: {
                      items: {
                        where: { isAvailable: true },
                        orderBy: { displayOrder: 'asc' },
                      },
                    },
                  },
                  organization: {
                    select: {
                      id: true,
                      name: true,
                      slug: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      if (!table) {
        throw new NotFoundException(`Table with ID ${tableId} not found`);
      }

      if (table.venue.organizationId !== organization.id) {
        throw new NotFoundException(`Table does not belong to organization ${slug}`);
      }

      if (!table.qrCode) {
        // If no QR code is found for the table, return the default menu
        return this.getDefaultMenu(organization.id);
      }

      // Record the scan
      await this.recordScanByQrCodeData(`https://menu.scanserve.com/${slug}?table=${tableId}`);

      // Include table information in the menu response
      const menuWithTable = {
        ...table.qrCode.menu,
        table: {
          id: table.id,
          name: table.name,
          capacity: table.capacity,
        },
      };

      return menuWithTable;
    }

    // If venueId is provided, find the QR code for that venue
    if (venueId) {
      const venue = await this.prisma.venue.findUnique({
        where: { id: venueId },
        include: {
          qrCodes: {
            where: { tableId: null },
            include: {
              menu: {
                include: {
                  categories: {
                    where: { isActive: true },
                    orderBy: { displayOrder: 'asc' },
                    include: {
                      items: {
                        where: { isAvailable: true },
                        orderBy: { displayOrder: 'asc' },
                      },
                    },
                  },
                  organization: {
                    select: {
                      id: true,
                      name: true,
                      slug: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      if (!venue) {
        throw new NotFoundException(`Venue with ID ${venueId} not found`);
      }

      if (venue.organizationId !== organization.id) {
        throw new NotFoundException(`Venue does not belong to organization ${slug}`);
      }

      if (venue.qrCodes.length === 0) {
        // If no QR code is found for the venue, return the default menu
        return this.getDefaultMenu(organization.id);
      }

      // Record the scan
      await this.recordScanByQrCodeData(`https://menu.scanserve.com/${slug}?venue=${venueId}`);

      return venue.qrCodes[0].menu;
    }

    // If neither tableId nor venueId is provided, return the default menu
    return this.getDefaultMenu(organization.id);
  }

  /**
   * Get the default menu for an organization
   */
  private async getDefaultMenu(organizationId: string) {
    const menus = await this.prisma.menu.findMany({
      where: {
        organizationId,
        isActive: true,
      },
      orderBy: { createdAt: 'desc' },
      include: {
        categories: {
          where: { isActive: true },
          orderBy: { displayOrder: 'asc' },
          include: {
            items: {
              where: { isAvailable: true },
              orderBy: { displayOrder: 'asc' },
            },
          },
        },
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
      take: 1,
    });

    if (menus.length === 0) {
      throw new NotFoundException(`No active menu found for this organization`);
    }

    return menus[0];
  }

  /**
   * Record a QR code scan by QR code data
   */
  private async recordScanByQrCodeData(qrCodeData: string) {
    try {
      const qrCode = await this.prisma.qrCode.findFirst({
        where: { qrCodeData },
      });

      if (qrCode) {
        await this.prisma.qrCodeScan.create({
          data: {
            qrCodeId: qrCode.id,
          },
        });

        await this.prisma.qrCode.update({
          where: { id: qrCode.id },
          data: {
            scanCount: {
              increment: 1,
            },
          },
        });
      }
    } catch (error) {
      // Silently fail if recording the scan fails
    }
  }

  /**
   * Record a QR code scan
   */
  async recordScan(id: string, ipAddress?: string, userAgent?: string) {
    return this.qrCodesService.recordScan(id, ipAddress, userAgent);
  }
}
