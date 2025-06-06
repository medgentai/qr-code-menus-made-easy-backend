import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsEnum, IsOptional, IsArray, IsString } from 'class-validator';
import { MemberRole, StaffType } from '@prisma/client';

export class CreateInvitationDto {
  @ApiProperty({
    description: 'The email of the user to invite',
    example: 'user@example.com',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: 'The role of the invited member',
    example: 'STAFF',
    enum: ['ADMINISTRATOR', 'MANAGER', 'STAFF'],
    default: 'STAFF',
  })
  @IsEnum(MemberRole, {
    message: 'Role must be one of: ADMINISTRATOR, MANAGER, STAFF',
  })
  @IsOptional()
  role?: MemberRole = 'STAFF';

  @ApiProperty({
    description: 'The staff type (only applicable for STAFF role)',
    example: 'KITCHEN',
    enum: ['KITCHEN', 'FRONT_OF_HOUSE', 'GENERAL'],
    required: false,
  })
  @IsEnum(StaffType, {
    message: 'Staff type must be one of: KITCHEN, FRONT_OF_HOUSE, GENERAL',
  })
  @IsOptional()
  staffType?: StaffType;

  @ApiProperty({
    description: 'Array of venue IDs the member is assigned to',
    example: ['venue-id-1', 'venue-id-2'],
    type: [String],
    required: false,
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  venueIds?: string[];
}
