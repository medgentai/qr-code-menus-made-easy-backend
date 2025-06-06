import { ApiProperty } from '@nestjs/swagger';
import { MemberRole, StaffType } from '@prisma/client';
import { IsEnum, IsNotEmpty, IsOptional, IsArray, IsString } from 'class-validator';

export class UpdateMemberRoleDto {
  @ApiProperty({
    description: 'The new role of the member',
    example: 'STAFF',
    enum: ['ADMINISTRATOR', 'MANAGER', 'STAFF'],
  })
  @IsEnum(MemberRole, {
    message: 'Role must be one of: ADMINISTRATOR, MANAGER, STAFF',
  })
  @IsNotEmpty()
  role: MemberRole;

  @ApiProperty({
    description: 'The staff type (only applicable for STAFF role)',
    example: 'KITCHEN',
    enum: ['KITCHEN', 'FRONT_OF_HOUSE'],
    required: false,
  })
  @IsEnum(StaffType, {
    message: 'Staff type must be one of: KITCHEN, FRONT_OF_HOUSE',
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
