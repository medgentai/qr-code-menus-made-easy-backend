import { ApiProperty } from '@nestjs/swagger';
import { MemberRole } from '@prisma/client';
import { IsEnum, IsNotEmpty } from 'class-validator';

export class UpdateMemberRoleDto {
  @ApiProperty({
    description: 'The new role of the member',
    example: 'ADMIN',
    enum: ['ADMIN', 'MANAGER', 'STAFF', 'MEMBER'],
  })
  @IsEnum(MemberRole, {
    message: 'Role must be one of: ADMIN, MANAGER, STAFF, MEMBER',
  })
  @IsNotEmpty()
  role: MemberRole;
}
