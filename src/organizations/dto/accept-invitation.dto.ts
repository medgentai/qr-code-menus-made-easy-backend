import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class AcceptInvitationDto {
  @ApiProperty({
    description: 'The invitation token',
    example: 'abc123def456',
  })
  @IsString()
  @IsNotEmpty()
  token: string;
}
