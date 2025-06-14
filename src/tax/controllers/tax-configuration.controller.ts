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
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { TaxConfigurationService } from '../services/tax-configuration.service';
import { TaxCalculationService } from '../services/tax-calculation.service';
import { CreateTaxConfigurationDto } from '../dto/create-tax-configuration.dto';
import { UpdateTaxConfigurationDto } from '../dto/update-tax-configuration.dto';
import { CalculateTaxDto, OrderTotalsDto } from '../dto/tax-calculation.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { ServiceType } from '@prisma/client';

interface RequestWithUser {
  user: {
    id: string;
    email: string;
  };
}

@ApiTags('tax-configurations')
@Controller('organizations/:organizationId/tax-configurations')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class TaxConfigurationController {
  constructor(
    private readonly taxConfigurationService: TaxConfigurationService,
    private readonly taxCalculationService: TaxCalculationService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new tax configuration' })
  @ApiParam({ name: 'organizationId', description: 'Organization ID' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Tax configuration created successfully',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Duplicate default configuration',
  })
  create(
    @Param('organizationId') organizationId: string,
    @Body() createTaxConfigurationDto: CreateTaxConfigurationDto,
    @Req() req: RequestWithUser,
  ) {
    return this.taxConfigurationService.create(organizationId, createTaxConfigurationDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all tax configurations for an organization' })
  @ApiParam({ name: 'organizationId', description: 'Organization ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Tax configurations retrieved successfully',
  })
  findAll(@Param('organizationId') organizationId: string) {
    return this.taxConfigurationService.findByOrganization(organizationId);
  }

  @Get('preview')
  @ApiOperation({ summary: 'Get tax preview for an organization' })
  @ApiParam({ name: 'organizationId', description: 'Organization ID' })
  @ApiQuery({
    name: 'serviceType',
    enum: ServiceType,
    required: false,
    description: 'Service type for tax preview',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Tax preview retrieved successfully',
  })
  getTaxPreview(
    @Param('organizationId') organizationId: string,
    @Query('serviceType') serviceType?: ServiceType,
  ) {
    return this.taxCalculationService.getTaxPreview(
      organizationId,
      serviceType || ServiceType.DINE_IN,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific tax configuration' })
  @ApiParam({ name: 'organizationId', description: 'Organization ID' })
  @ApiParam({ name: 'id', description: 'Tax configuration ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Tax configuration retrieved successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Tax configuration not found',
  })
  findOne(
    @Param('organizationId') organizationId: string,
    @Param('id') id: string,
  ) {
    return this.taxConfigurationService.findOne(id, organizationId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a tax configuration' })
  @ApiParam({ name: 'organizationId', description: 'Organization ID' })
  @ApiParam({ name: 'id', description: 'Tax configuration ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Tax configuration updated successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Tax configuration not found',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Duplicate default configuration',
  })
  update(
    @Param('organizationId') organizationId: string,
    @Param('id') id: string,
    @Body() updateTaxConfigurationDto: UpdateTaxConfigurationDto,
  ) {
    return this.taxConfigurationService.update(id, organizationId, updateTaxConfigurationDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a tax configuration' })
  @ApiParam({ name: 'organizationId', description: 'Organization ID' })
  @ApiParam({ name: 'id', description: 'Tax configuration ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Tax configuration deleted successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Tax configuration not found',
  })
  remove(
    @Param('organizationId') organizationId: string,
    @Param('id') id: string,
  ) {
    return this.taxConfigurationService.remove(id, organizationId);
  }
}

@ApiTags('tax-calculations')
@Controller('tax')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class TaxCalculationController {
  constructor(private readonly taxCalculationService: TaxCalculationService) {}

  @Post('calculate')
  @ApiOperation({ summary: 'Calculate tax for an order' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Tax calculated successfully',
    type: OrderTotalsDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid calculation parameters',
  })
  calculateTax(@Body() calculateTaxDto: CalculateTaxDto): Promise<OrderTotalsDto> {
    console.log('Received tax calculation request:', JSON.stringify(calculateTaxDto, null, 2));
    this.taxCalculationService.validateTaxCalculationParams(calculateTaxDto.items);
    return this.taxCalculationService.calculateTax(calculateTaxDto);
  }
}
