import { ApiProperty } from '@nestjs/swagger';
import { MemberRole } from '@prisma/client';
import { IsEmail, IsEnum, IsNotEmpty, IsOptional } from 'class-validator';

export class AddMemberDto {
  @ApiProperty({
    description: 'The email of the user to add as a member',
    example: 'user@example.com',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: 'The role of the member',
    example: 'MEMBER',
    enum: ['ADMIN', 'MANAGER', 'STAFF', 'MEMBER'],
    default: 'MEMBER',
  })
  @IsEnum(MemberRole, {
    message: 'Role must be one of: ADMIN, MANAGER, STAFF, MEMBER',
  })
  @IsOptional()
  role?: MemberRole = 'MEMBER';
}
