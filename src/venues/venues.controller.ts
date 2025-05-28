import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
  HttpStatus,
  Query
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags
} from '@nestjs/swagger';
import { VenuesService } from './venues.service';
import { CreateVenueDto } from './dto/create-venue.dto';
import { UpdateVenueDto } from './dto/update-venue.dto';
import { CreateTableDto } from './dto/create-table.dto';
import { UpdateTableDto } from './dto/update-table.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { VenueEntity } from './entities/venue.entity';
import { TableEntity } from './entities/table.entity';

// Define the RequestWithUser interface
interface RequestWithUser extends Request {
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
    [key: string]: any;
  };
}

@ApiTags('venues')
@Controller('venues')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class VenuesController {
  constructor(private readonly venuesService: VenuesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new venue' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'The venue has been successfully created.',
    type: VenueEntity
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Bad Request.'
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Forbidden. User is not a member of the organization.'
  })
  create(@Body() createVenueDto: CreateVenueDto, @Req() req: RequestWithUser) {
    return this.venuesService.create(createVenueDto, req.user.id);
  }

  @Get('organization/:organizationId')
  @ApiOperation({ summary: 'Get all venues for an organization' })
  @ApiParam({ name: 'organizationId', description: 'Organization ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Return all venues for the organization.',
    type: [VenueEntity]
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Forbidden. User is not a member of the organization.'
  })
  findAllForOrganization(
    @Param('organizationId') organizationId: string,
    @Req() req: RequestWithUser
  ) {
    return this.venuesService.findAllForOrganization(organizationId, req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a venue by ID' })
  @ApiParam({ name: 'id', description: 'Venue ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Return the venue.',
    type: VenueEntity
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Venue not found.'
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Forbidden. User is not a member of the organization.'
  })
  findOne(@Param('id') id: string, @Req() req: RequestWithUser) {
    return this.venuesService.findOne(id, req.user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a venue' })
  @ApiParam({ name: 'id', description: 'Venue ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The venue has been successfully updated.',
    type: VenueEntity
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Bad Request.'
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Venue not found.'
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Forbidden. User is not a member of the organization.'
  })
  update(
    @Param('id') id: string,
    @Body() updateVenueDto: UpdateVenueDto,
    @Req() req: RequestWithUser
  ) {
    return this.venuesService.update(id, updateVenueDto, req.user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a venue' })
  @ApiParam({ name: 'id', description: 'Venue ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The venue has been successfully deleted.',
    type: VenueEntity
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Venue not found.'
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Forbidden. User is not a member of the organization.'
  })
  remove(@Param('id') id: string, @Req() req: RequestWithUser) {
    return this.venuesService.remove(id, req.user.id);
  }

  // Table Management Endpoints

  @Post('tables')
  @ApiOperation({ summary: 'Create a new table for a venue' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'The table has been successfully created.',
    type: TableEntity
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Bad Request.'
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Forbidden. User is not a member of the organization.'
  })
  createTable(@Body() createTableDto: CreateTableDto, @Req() req: RequestWithUser) {
    return this.venuesService.createTable(createTableDto, req.user.id);
  }

  @Get('venue/:venueId/tables')
  @ApiOperation({ summary: 'Get all tables for a venue' })
  @ApiParam({ name: 'venueId', description: 'Venue ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Return all tables for the venue.',
    type: [TableEntity]
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Forbidden. User is not a member of the organization.'
  })
  findAllTablesForVenue(
    @Param('venueId') venueId: string,
    @Req() req: RequestWithUser
  ) {
    return this.venuesService.findAllTablesForVenue(venueId, req.user.id);
  }

  @Get('tables/:id')
  @ApiOperation({ summary: 'Get a table by ID' })
  @ApiParam({ name: 'id', description: 'Table ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Return the table.',
    type: TableEntity
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Table not found.'
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Forbidden. User is not a member of the organization.'
  })
  findOneTable(@Param('id') id: string, @Req() req: RequestWithUser) {
    return this.venuesService.findOneTable(id, req.user.id);
  }

  @Patch('tables/:id')
  @ApiOperation({ summary: 'Update a table' })
  @ApiParam({ name: 'id', description: 'Table ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The table has been successfully updated.',
    type: TableEntity
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Bad Request.'
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Table not found.'
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Forbidden. User is not a member of the organization.'
  })
  updateTable(
    @Param('id') id: string,
    @Body() updateTableDto: UpdateTableDto,
    @Req() req: RequestWithUser
  ) {
    return this.venuesService.updateTable(id, updateTableDto, req.user.id);
  }

  @Delete('tables/:id')
  @ApiOperation({ summary: 'Delete a table' })
  @ApiParam({ name: 'id', description: 'Table ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The table has been successfully deleted.',
    type: TableEntity
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Table not found.'
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Forbidden. User is not a member of the organization.'
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Cannot delete table with an associated QR code.'
  })
  removeTable(@Param('id') id: string, @Req() req: RequestWithUser) {
    return this.venuesService.removeTable(id, req.user.id);
  }
}
