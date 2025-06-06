import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  HttpStatus,
  UseGuards,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { InvitationsService } from './invitations.service';
import { AcceptInvitationDto } from './dto/accept-invitation.dto';
import { OrganizationInvitationEntity } from './entities/organization-invitation.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Public } from '../auth/decorators/public.decorator';
import { RequestWithUser } from '../common/interfaces/request-with-user.interface';

@ApiTags('invitations')
@Controller('invitations')
export class InvitationsController {
  constructor(private readonly invitationsService: InvitationsService) {}

  @Get(':token')
  @Public()
  @ApiOperation({ summary: 'Get invitation details by token (public)' })
  @ApiParam({ name: 'token', description: 'Invitation token' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Return invitation details.',
    type: OrganizationInvitationEntity
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Invalid invitation token.'
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invitation has expired.'
  })
  getInvitationByToken(@Param('token') token: string) {
    return this.invitationsService.getInvitationByToken(token);
  }

  @Post(':token/accept')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Accept an invitation' })
  @ApiParam({ name: 'token', description: 'Invitation token' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The invitation has been successfully accepted.',
    type: OrganizationInvitationEntity
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Invalid invitation token or user not found.'
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invitation has expired or already processed, or email mismatch.'
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'User is already a member of this organization.'
  })
  acceptInvitation(@Param('token') token: string, @Req() req: RequestWithUser) {
    return this.invitationsService.acceptInvitation(token, req.user.id);
  }
}
