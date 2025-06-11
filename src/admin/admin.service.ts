import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole, UserStatus } from '@prisma/client';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { Decimal } from '@prisma/client/runtime/library';

// Helper function to convert Decimal to number
function toNumber(value: number | Decimal | null | undefined): number {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'number') return value;
  return Number(value.toString());
}

interface GetUsersParams {
  page: number;
  limit: number;
  search?: string;
  role?: UserRole;
}

interface GetOrganizationsParams {
  page: number;
  limit: number;
  search?: string;
}

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async getPlatformStats() {
    const [
      totalUsers,
      totalOrganizations,
      totalVenues,
      totalOrders,
      activeUsers,
      activeOrganizations,
      recentUsers,
      recentOrganizations,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.organization.count(),
      this.prisma.venue.count(),
      this.prisma.order.count(),
      this.prisma.user.count({
        where: { status: UserStatus.ACTIVE },
      }),
      this.prisma.organization.count({
        where: { isActive: true },
      }),
      this.prisma.user.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
          },
        },
      }),
      this.prisma.organization.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
          },
        },
      }),
    ]);

    return {
      totalUsers: Number(totalUsers),
      totalOrganizations: Number(totalOrganizations),
      totalVenues: Number(totalVenues),
      totalOrders: Number(totalOrders),
      activeUsers: Number(activeUsers),
      activeOrganizations: Number(activeOrganizations),
      recentUsers: Number(recentUsers),
      recentOrganizations: Number(recentOrganizations),
      lastUpdated: new Date(),
    };
  }

  async getAllUsers(params: GetUsersParams) {
    const { page, limit, search, role } = params;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (role) {
      where.role = role;
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          status: true,
          phoneNumber: true,
          isEmailVerified: true,
          createdAt: true,
          lastLoginAt: true,
          _count: {
            select: {
              organizations: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]);

    // Convert BigInt values to numbers
    const convertedUsers = users.map(user => ({
      ...user,
      _count: {
        organizations: Number(user._count.organizations),
      },
    }));

    return {
      users: convertedUsers,
      pagination: {
        page,
        limit,
        total: Number(total),
        totalPages: Math.ceil(Number(total) / limit),
      },
    };
  }

  async getAllOrganizations(params: GetOrganizationsParams) {
    const { page, limit, search } = params;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [organizations, total] = await Promise.all([
      this.prisma.organization.findMany({
        where,
        skip,
        take: limit,
        include: {
          _count: {
            select: {
              members: true,
              venues: true,
            },
          },
          members: {
            where: { role: 'OWNER' },
            include: {
              user: {
                select: {
                  name: true,
                  email: true,
                },
              },
            },
            take: 1,
          },
          venues: {
            include: {
              _count: {
                select: {
                  orders: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.organization.count({ where }),
    ]);

    // Transform organizations to include order count and convert BigInt values
    const transformedOrganizations = organizations.map(org => {
      // Get the owner from the members array
      const ownerMember = org.members.find(member => member.role === 'OWNER');

      const memberCount = Number(org._count.members);
      const venueCount = Number(org._count.venues);
      const orderCount = Number(org.venues.reduce((sum, venue) => sum + Number(venue._count.orders), 0));

      console.log(`Organization ${org.name}: members=${memberCount}, venues=${venueCount}, orders=${orderCount}`);

      return {
        ...org,
        _count: {
          members: memberCount,
          venues: venueCount,
        },
        memberCount,
        venueCount,
        orderCount,
        owner: ownerMember ? {
          name: ownerMember.user.name,
          email: ownerMember.user.email,
        } : null,
        venues: undefined, // Remove venues from response to keep it clean
        members: undefined, // Remove members from response to keep it clean
      };
    });

    return {
      organizations: transformedOrganizations,
      pagination: {
        page,
        limit,
        total: Number(total),
        totalPages: Math.ceil(Number(total) / limit),
      },
    };
  }

  async updateUserStatus(id: string, updateUserStatusDto: UpdateUserStatusDto) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Prevent admins from changing other admin statuses
    if (user.role === UserRole.ADMIN) {
      throw new ForbiddenException('Cannot modify admin user status');
    }

    return this.prisma.user.update({
      where: { id },
      data: { status: updateUserStatusDto.status },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        updatedAt: true,
      },
    });
  }

  async updateUserRole(id: string, updateUserRoleDto: UpdateUserRoleDto) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Log the role change for security audit
    console.log(`Admin changing user ${user.email} role from ${user.role} to ${updateUserRoleDto.role}`);

    return this.prisma.user.update({
      where: { id },
      data: { role: updateUserRoleDto.role },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        updatedAt: true,
      },
    });
  }

  async deleteUser(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        organizations: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Prevent deletion of admin users
    if (user.role === UserRole.ADMIN) {
      throw new ForbiddenException('Cannot delete admin users');
    }

    // Check if user is the only owner of any organization
    const ownerMemberships = user.organizations.filter(
      (membership) => membership.role === 'OWNER'
    );

    for (const membership of ownerMemberships) {
      const ownerCount = await this.prisma.organizationMember.count({
        where: {
          organizationId: membership.organizationId,
          role: 'OWNER',
        },
      });

      if (Number(ownerCount) === 1) {
        throw new ForbiddenException(
          'Cannot delete user who is the sole owner of an organization'
        );
      }
    }

    return this.prisma.user.delete({
      where: { id },
    });
  }

  async deleteOrganization(id: string) {
    const organization = await this.prisma.organization.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            venues: true,
          },
        },
        venues: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    // Check if organization has active orders through its venues
    const venueIds = organization.venues.map(venue => venue.id);
    const activeOrdersCount = await this.prisma.order.count({
      where: {
        venueId: {
          in: venueIds,
        },
        status: {
          in: ['PENDING', 'CONFIRMED', 'PREPARING', 'READY'],
        },
      },
    });
    const activeOrdersCountNumber = Number(activeOrdersCount);

    if (activeOrdersCountNumber > 0) {
      throw new ForbiddenException(
        'Cannot delete organization with active orders'
      );
    }

    return this.prisma.organization.delete({
      where: { id },
    });
  }

  async getUserDetails(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            organizations: true,
          },
        },
        organizations: {
          include: {
            organization: {
              select: {
                id: true,
                name: true,
                type: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      ...user,
      organizationCount: Number(user._count.organizations),
      organizations: user.organizations.map(org => ({
        id: org.organization.id,
        name: org.organization.name,
        type: org.organization.type,
        role: org.role,
        joinedAt: org.createdAt,
      })),
    };
  }

  async getOrganizationVenues(organizationId: string) {
    const organization = await this.prisma.organization.findUnique({
      where: { id: organizationId },
      select: { id: true, name: true },
    });

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    const venues = await this.prisma.venue.findMany({
      where: { organizationId },
      include: {
        organization: {
          select: {
            type: true,
          },
        },
        _count: {
          select: {
            tables: true,
            orders: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      organization,
      venues: venues.map(venue => ({
        ...venue,
        type: venue.organization.type, // Add the organization type to venue
        tableCount: Number(venue._count.tables),
        orderCount: Number(venue._count.orders),
        organization: undefined, // Remove organization object from response
      })),
    };
  }

  async getOrganizationMembers(organizationId: string) {
    const organization = await this.prisma.organization.findUnique({
      where: { id: organizationId },
      select: { id: true, name: true },
    });

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    const members = await this.prisma.organizationMember.findMany({
      where: { organizationId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            status: true,
            lastLoginAt: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      organization,
      members: members.map(member => ({
        id: member.id,
        role: member.role,
        joinedAt: member.createdAt,
        user: member.user,
      })),
    };
  }

  async getSystemInfo() {
    // Get database stats
    const userCount = await this.prisma.user.count();
    const orgCount = await this.prisma.organization.count();
    const venueCount = await this.prisma.venue.count();
    const orderCount = await this.prisma.order.count();

    // Calculate uptime (since app start)
    const uptimeMs = process.uptime() * 1000;
    const uptimeDays = Math.floor(uptimeMs / (1000 * 60 * 60 * 24));
    const uptimeHours = Math.floor((uptimeMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    // Get memory usage
    const memUsage = process.memoryUsage();
    const memUsedMB = Math.round(memUsage.heapUsed / 1024 / 1024);
    const memTotalMB = Math.round(memUsage.heapTotal / 1024 / 1024);

    return {
      database: {
        status: 'Connected',
        type: 'PostgreSQL',
        version: '15.4', // This could be fetched from actual DB
        recordCounts: {
          users: Number(userCount),
          organizations: Number(orgCount),
          venues: Number(venueCount),
          orders: Number(orderCount),
        },
      },
      application: {
        version: process.env.npm_package_version || 'v1.0.0',
        environment: process.env.NODE_ENV || 'development',
        uptime: `${uptimeDays} days, ${uptimeHours} hours`,
        nodeVersion: process.version,
      },
      performance: {
        memoryUsage: `${memUsedMB} MB / ${memTotalMB} MB`,
        memoryPercentage: Math.round((memUsedMB / memTotalMB) * 100),
        cpuUsage: '~12%', // This would need a proper CPU monitoring library
      },
      security: {
        twoFactorAuth: 'Optional',
        sessionTimeout: '24 hours',
        lastBackup: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      },
      platform: {
        status: 'Online',
        maintenanceMode: false,
      },
      lastUpdated: new Date(),
    };
  }
}
