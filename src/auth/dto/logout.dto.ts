import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';

/**
 * DTO for logout endpoint
 */
export class LogoutDto {
  @ApiProperty({
    description: 'Whether to logout from all sessions',
    required: false,
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  logoutAll?: boolean = false;
}
