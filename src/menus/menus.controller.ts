import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  HttpStatus,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { MenusService } from './menus.service';
import { CreateMenuDto } from './dto/create-menu.dto';
import { UpdateMenuDto } from './dto/update-menu.dto';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CreateMenuItemDto } from './dto/create-menu-item.dto';
import { UpdateMenuItemDto } from './dto/update-menu-item.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { MenuEntity } from './entities/menu.entity';
import { CategoryEntity } from './entities/category.entity';
import { MenuItemEntity } from './entities/menu-item.entity';
import { RequestWithUser } from '../common/interfaces/request-with-user.interface';

@ApiTags('menus')
@Controller('menus')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class MenusController {
  constructor(private readonly menusService: MenusService) {}

  // Menu endpoints
  @Post()
  @ApiOperation({ summary: 'Create a new menu' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'The menu has been successfully created.',
    type: MenuEntity,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data.',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized.',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Forbidden.',
  })
  createMenu(@Body() createMenuDto: CreateMenuDto, @Req() req: RequestWithUser) {
    return this.menusService.createMenu(createMenuDto, req.user.id);
  }

  @Get('organization/:organizationId')
  @ApiOperation({ summary: 'Get all menus for an organization' })
  @ApiParam({ name: 'organizationId', description: 'Organization ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returns all menus for the organization.',
    type: [MenuEntity],
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized.',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Forbidden.',
  })
  findAllMenus(
    @Param('organizationId') organizationId: string,
    @Req() req: RequestWithUser,
  ) {
    return this.menusService.findAllMenus(organizationId, req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a menu by ID' })
  @ApiParam({ name: 'id', description: 'Menu ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returns the menu.',
    type: MenuEntity,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Menu not found.',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized.',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Forbidden.',
  })
  findMenuById(@Param('id') id: string, @Req() req: RequestWithUser) {
    return this.menusService.findMenuById(id, req.user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a menu' })
  @ApiParam({ name: 'id', description: 'Menu ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The menu has been successfully updated.',
    type: MenuEntity,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Menu not found.',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized.',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Forbidden.',
  })
  updateMenu(
    @Param('id') id: string,
    @Body() updateMenuDto: UpdateMenuDto,
    @Req() req: RequestWithUser,
  ) {
    return this.menusService.updateMenu(id, updateMenuDto, req.user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a menu' })
  @ApiParam({ name: 'id', description: 'Menu ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The menu has been successfully deleted.',
    type: MenuEntity,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Menu not found.',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized.',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Forbidden.',
  })
  removeMenu(@Param('id') id: string, @Req() req: RequestWithUser) {
    return this.menusService.removeMenu(id, req.user.id);
  }

  // Category endpoints
  @Post(':menuId/categories')
  @ApiOperation({ summary: 'Create a new category in a menu' })
  @ApiParam({ name: 'menuId', description: 'Menu ID' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'The category has been successfully created.',
    type: CategoryEntity,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Menu not found.',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized.',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Forbidden.',
  })
  createCategory(
    @Param('menuId') menuId: string,
    @Body() createCategoryDto: CreateCategoryDto,
    @Req() req: RequestWithUser,
  ) {
    return this.menusService.createCategory(menuId, createCategoryDto, req.user.id);
  }

  @Get(':menuId/categories')
  @ApiOperation({ summary: 'Get all categories in a menu' })
  @ApiParam({ name: 'menuId', description: 'Menu ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returns all categories in the menu.',
    type: [CategoryEntity],
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Menu not found.',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized.',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Forbidden.',
  })
  findAllCategories(
    @Param('menuId') menuId: string,
    @Req() req: RequestWithUser,
  ) {
    return this.menusService.findAllCategories(menuId, req.user.id);
  }

  @Get('categories/:id')
  @ApiOperation({ summary: 'Get a category by ID' })
  @ApiParam({ name: 'id', description: 'Category ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returns the category.',
    type: CategoryEntity,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Category not found.',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized.',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Forbidden.',
  })
  findCategoryById(@Param('id') id: string, @Req() req: RequestWithUser) {
    return this.menusService.findCategoryById(id, req.user.id);
  }

  @Patch('categories/:id')
  @ApiOperation({ summary: 'Update a category' })
  @ApiParam({ name: 'id', description: 'Category ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The category has been successfully updated.',
    type: CategoryEntity,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Category not found.',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized.',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Forbidden.',
  })
  updateCategory(
    @Param('id') id: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
    @Req() req: RequestWithUser,
  ) {
    return this.menusService.updateCategory(id, updateCategoryDto, req.user.id);
  }

  @Delete('categories/:id')
  @ApiOperation({ summary: 'Delete a category' })
  @ApiParam({ name: 'id', description: 'Category ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The category has been successfully deleted.',
    type: CategoryEntity,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Category not found.',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized.',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Forbidden.',
  })
  removeCategory(@Param('id') id: string, @Req() req: RequestWithUser) {
    return this.menusService.removeCategory(id, req.user.id);
  }

  // MenuItem endpoints
  @Post('categories/:categoryId/items')
  @ApiOperation({ summary: 'Create a new menu item in a category' })
  @ApiParam({ name: 'categoryId', description: 'Category ID' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'The menu item has been successfully created.',
    type: MenuItemEntity,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Category not found.',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized.',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Forbidden.',
  })
  createMenuItem(
    @Param('categoryId') categoryId: string,
    @Body() createMenuItemDto: CreateMenuItemDto,
    @Req() req: RequestWithUser,
  ) {
    return this.menusService.createMenuItem(categoryId, createMenuItemDto, req.user.id);
  }

  @Get('categories/:categoryId/items')
  @ApiOperation({ summary: 'Get all menu items in a category' })
  @ApiParam({ name: 'categoryId', description: 'Category ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returns all menu items in the category.',
    type: [MenuItemEntity],
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Category not found.',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized.',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Forbidden.',
  })
  findAllMenuItems(
    @Param('categoryId') categoryId: string,
    @Req() req: RequestWithUser,
  ) {
    return this.menusService.findAllMenuItems(categoryId, req.user.id);
  }

  @Get('items/:id')
  @ApiOperation({ summary: 'Get a menu item by ID' })
  @ApiParam({ name: 'id', description: 'Menu Item ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returns the menu item.',
    type: MenuItemEntity,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Menu item not found.',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized.',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Forbidden.',
  })
  findMenuItemById(@Param('id') id: string, @Req() req: RequestWithUser) {
    return this.menusService.findMenuItemById(id, req.user.id);
  }

  @Patch('items/:id')
  @ApiOperation({ summary: 'Update a menu item' })
  @ApiParam({ name: 'id', description: 'Menu Item ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The menu item has been successfully updated.',
    type: MenuItemEntity,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Menu item not found.',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized.',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Forbidden.',
  })
  updateMenuItem(
    @Param('id') id: string,
    @Body() updateMenuItemDto: UpdateMenuItemDto,
    @Req() req: RequestWithUser,
  ) {
    return this.menusService.updateMenuItem(id, updateMenuItemDto, req.user.id);
  }

  @Delete('items/:id')
  @ApiOperation({ summary: 'Delete a menu item' })
  @ApiParam({ name: 'id', description: 'Menu Item ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The menu item has been successfully deleted.',
    type: MenuItemEntity,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Menu item not found.',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized.',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Forbidden.',
  })
  removeMenuItem(@Param('id') id: string, @Req() req: RequestWithUser) {
    return this.menusService.removeMenuItem(id, req.user.id);
  }
}
