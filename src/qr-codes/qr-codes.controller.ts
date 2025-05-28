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
  Headers,
  Ip,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { QrCodesService } from './qr-codes.service';
import { CreateQrCodeDto } from './dto/create-qr-code.dto';
import { UpdateQrCodeDto } from './dto/update-qr-code.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { QrCodeEntity } from './entities/qr-code.entity';
import { Public } from '../auth/decorators/public.decorator';
import { RequestWithUser } from '../common/interfaces/request-with-user.interface';

@ApiTags('qr-codes')
@Controller('qr-codes')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class QrCodesController {
  constructor(private readonly qrCodesService: QrCodesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new QR code' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'The QR code has been successfully created.',
    type: QrCodeEntity,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Bad Request.',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized.',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Forbidden.',
  })
  create(@Body() createQrCodeDto: CreateQrCodeDto, @Req() req: RequestWithUser) {
    return this.qrCodesService.create(createQrCodeDto, req.user.id);
  }

  @Get('venue/:venueId')
  @ApiOperation({ summary: 'Get all QR codes for a venue' })
  @ApiParam({ name: 'venueId', description: 'Venue ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Return all QR codes for the venue.',
    type: [QrCodeEntity],
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized.',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Forbidden.',
  })
  findAllForVenue(@Param('venueId') venueId: string, @Req() req: RequestWithUser) {
    return this.qrCodesService.findAllForVenue(venueId, req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a QR code by ID' })
  @ApiParam({ name: 'id', description: 'QR code ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Return the QR code.',
    type: QrCodeEntity,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'QR code not found.',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized.',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Forbidden.',
  })
  findOne(@Param('id') id: string, @Req() req: RequestWithUser) {
    return this.qrCodesService.findOne(id, req.user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a QR code' })
  @ApiParam({ name: 'id', description: 'QR code ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The QR code has been successfully updated.',
    type: QrCodeEntity,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'QR code not found.',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized.',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Forbidden.',
  })
  update(
    @Param('id') id: string,
    @Body() updateQrCodeDto: UpdateQrCodeDto,
    @Req() req: RequestWithUser,
  ) {
    return this.qrCodesService.update(id, updateQrCodeDto, req.user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a QR code' })
  @ApiParam({ name: 'id', description: 'QR code ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The QR code has been successfully deleted.',
    type: QrCodeEntity,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'QR code not found.',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized.',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Forbidden.',
  })
  remove(@Param('id') id: string, @Req() req: RequestWithUser) {
    return this.qrCodesService.remove(id, req.user.id);
  }

  @Post(':id/scan')
  @Public()
  @ApiOperation({ summary: 'Record a QR code scan' })
  @ApiParam({ name: 'id', description: 'QR code ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The QR code scan has been successfully recorded.',
    type: QrCodeEntity,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'QR code not found.',
  })
  recordScan(
    @Param('id') id: string,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string,
  ) {
    return this.qrCodesService.recordScan(id, ip, userAgent);
  }
}
