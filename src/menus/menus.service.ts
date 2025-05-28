import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OrganizationsService } from '../organizations/organizations.service';
import { CreateMenuDto } from './dto/create-menu.dto';
import { UpdateMenuDto } from './dto/update-menu.dto';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CreateMenuItemDto } from './dto/create-menu-item.dto';
import { UpdateMenuItemDto } from './dto/update-menu-item.dto';

@Injectable()
export class MenusService {
  constructor(
    private prisma: PrismaService,
    private organizationsService: OrganizationsService,
  ) {}

  // Menu CRUD operations
  async createMenu(createMenuDto: CreateMenuDto, userId: string) {
    const isMember = await this.organizationsService.isMember(
      createMenuDto.organizationId,
      userId,
    );
    if (!isMember) {
      throw new ForbiddenException('You are not a member of this organization');
    }

    return this.prisma.menu.create({
      data: createMenuDto,
    });
  }

  async findAllMenus(organizationId: string, userId: string) {
    const isMember = await this.organizationsService.isMember(
      organizationId,
      userId,
    );
    if (!isMember) {
      throw new ForbiddenException('You are not a member of this organization');
    }

    return this.prisma.menu.findMany({
      where: { organizationId },
      include: {
        categories: {
          include: {
            items: true,
          },
        },
      },
    });
  }

  async findMenuById(id: string, userId: string) {
    const menu = await this.prisma.menu.findUnique({
      where: { id },
      include: {
        categories: {
          include: {
            items: true,
          },
        },
      },
    });

    if (!menu) {
      throw new NotFoundException(`Menu with ID ${id} not found`);
    }

    const isMember = await this.organizationsService.isMember(
      menu.organizationId,
      userId,
    );
    if (!isMember) {
      throw new ForbiddenException('You are not a member of this organization');
    }

    return menu;
  }

  async updateMenu(id: string, updateMenuDto: UpdateMenuDto, userId: string) {
    const menu = await this.prisma.menu.findUnique({
      where: { id },
    });

    if (!menu) {
      throw new NotFoundException(`Menu with ID ${id} not found`);
    }

    const isMember = await this.organizationsService.isMember(
      menu.organizationId,
      userId,
    );
    if (!isMember) {
      throw new ForbiddenException('You are not a member of this organization');
    }

    return this.prisma.menu.update({
      where: { id },
      data: updateMenuDto,
    });
  }

  async removeMenu(id: string, userId: string) {
    const menu = await this.prisma.menu.findUnique({
      where: { id },
    });

    if (!menu) {
      throw new NotFoundException(`Menu with ID ${id} not found`);
    }

    const isMember = await this.organizationsService.isMember(
      menu.organizationId,
      userId,
    );
    if (!isMember) {
      throw new ForbiddenException('You are not a member of this organization');
    }

    return this.prisma.menu.delete({
      where: { id },
    });
  }

  // Category CRUD operations
  async createCategory(menuId: string, createCategoryDto: CreateCategoryDto, userId: string) {
    const menu = await this.prisma.menu.findUnique({
      where: { id: menuId },
    });

    if (!menu) {
      throw new NotFoundException(`Menu with ID ${menuId} not found`);
    }

    const isMember = await this.organizationsService.isMember(
      menu.organizationId,
      userId,
    );
    if (!isMember) {
      throw new ForbiddenException('You are not a member of this organization');
    }

    return this.prisma.category.create({
      data: {
        ...createCategoryDto,
        menuId,
      },
    });
  }

  async findAllCategories(menuId: string, userId: string) {
    const menu = await this.prisma.menu.findUnique({
      where: { id: menuId },
    });

    if (!menu) {
      throw new NotFoundException(`Menu with ID ${menuId} not found`);
    }

    const isMember = await this.organizationsService.isMember(
      menu.organizationId,
      userId,
    );
    if (!isMember) {
      throw new ForbiddenException('You are not a member of this organization');
    }

    return this.prisma.category.findMany({
      where: { menuId },
      include: {
        items: true,
      },
    });
  }

  async findCategoryById(id: string, userId: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: {
        menu: true,
        items: true,
      },
    });

    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    const isMember = await this.organizationsService.isMember(
      category.menu.organizationId,
      userId,
    );
    if (!isMember) {
      throw new ForbiddenException('You are not a member of this organization');
    }

    return category;
  }

  async updateCategory(id: string, updateCategoryDto: UpdateCategoryDto, userId: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: {
        menu: true,
      },
    });

    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    const isMember = await this.organizationsService.isMember(
      category.menu.organizationId,
      userId,
    );
    if (!isMember) {
      throw new ForbiddenException('You are not a member of this organization');
    }

    return this.prisma.category.update({
      where: { id },
      data: updateCategoryDto,
    });
  }

  async removeCategory(id: string, userId: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: {
        menu: true,
      },
    });

    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    const isMember = await this.organizationsService.isMember(
      category.menu.organizationId,
      userId,
    );
    if (!isMember) {
      throw new ForbiddenException('You are not a member of this organization');
    }

    return this.prisma.category.delete({
      where: { id },
    });
  }

  // MenuItem CRUD operations
  async createMenuItem(categoryId: string, createMenuItemDto: CreateMenuItemDto, userId: string) {
    const category = await this.prisma.category.findUnique({
      where: { id: categoryId },
      include: {
        menu: true,
      },
    });

    if (!category) {
      throw new NotFoundException(`Category with ID ${categoryId} not found`);
    }

    const isMember = await this.organizationsService.isMember(
      category.menu.organizationId,
      userId,
    );
    if (!isMember) {
      throw new ForbiddenException('You are not a member of this organization');
    }

    return this.prisma.menuItem.create({
      data: {
        ...createMenuItemDto,
        categoryId,
      },
    });
  }

  async findAllMenuItems(categoryId: string, userId: string) {
    const category = await this.prisma.category.findUnique({
      where: { id: categoryId },
      include: {
        menu: true,
      },
    });

    if (!category) {
      throw new NotFoundException(`Category with ID ${categoryId} not found`);
    }

    const isMember = await this.organizationsService.isMember(
      category.menu.organizationId,
      userId,
    );
    if (!isMember) {
      throw new ForbiddenException('You are not a member of this organization');
    }

    return this.prisma.menuItem.findMany({
      where: { categoryId },
    });
  }

  async findMenuItemById(id: string, userId: string) {
    const menuItem = await this.prisma.menuItem.findUnique({
      where: { id },
      include: {
        category: {
          include: {
            menu: true,
          },
        },
        modifierGroups: {
          include: {
            modifierGroup: {
              include: {
                modifiers: true,
              },
            },
          },
        },
      },
    });

    if (!menuItem) {
      throw new NotFoundException(`Menu item with ID ${id} not found`);
    }

    const isMember = await this.organizationsService.isMember(
      menuItem.category.menu.organizationId,
      userId,
    );
    if (!isMember) {
      throw new ForbiddenException('You are not a member of this organization');
    }

    return menuItem;
  }

  async updateMenuItem(id: string, updateMenuItemDto: UpdateMenuItemDto, userId: string) {
    const menuItem = await this.prisma.menuItem.findUnique({
      where: { id },
      include: {
        category: {
          include: {
            menu: true,
          },
        },
      },
    });

    if (!menuItem) {
      throw new NotFoundException(`Menu item with ID ${id} not found`);
    }

    const isMember = await this.organizationsService.isMember(
      menuItem.category.menu.organizationId,
      userId,
    );
    if (!isMember) {
      throw new ForbiddenException('You are not a member of this organization');
    }

    return this.prisma.menuItem.update({
      where: { id },
      data: updateMenuItemDto,
    });
  }

  async removeMenuItem(id: string, userId: string) {
    const menuItem = await this.prisma.menuItem.findUnique({
      where: { id },
      include: {
        category: {
          include: {
            menu: true,
          },
        },
      },
    });

    if (!menuItem) {
      throw new NotFoundException(`Menu item with ID ${id} not found`);
    }

    const isMember = await this.organizationsService.isMember(
      menuItem.category.menu.organizationId,
      userId,
    );
    if (!isMember) {
      throw new ForbiddenException('You are not a member of this organization');
    }

    return this.prisma.menuItem.delete({
      where: { id },
    });
  }
}
