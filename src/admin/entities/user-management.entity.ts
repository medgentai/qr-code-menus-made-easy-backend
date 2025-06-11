import { ApiProperty } from '@nestjs/swagger';
import { UserRole, UserStatus } from '@prisma/client';

export class UserManagementEntity {
  @ApiProperty({
    description: 'User ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'User email',
    example: 'user@example.com',
  })
  email: string;

  @ApiProperty({
    description: 'User name',
    example: 'John Doe',
  })
  name: string;

  @ApiProperty({
    description: 'User role',
    enum: UserRole,
    example: UserRole.USER,
  })
  role: UserRole;

  @ApiProperty({
    description: 'User status',
    enum: UserStatus,
    example: UserStatus.ACTIVE,
  })
  status: UserStatus;

  @ApiProperty({
    description: 'User phone number',
    example: '+1234567890',
    required: false,
  })
  phoneNumber?: string;

  @ApiProperty({
    description: 'Whether email is verified',
    example: true,
  })
  isEmailVerified: boolean;

  @ApiProperty({
    description: 'User creation date',
    example: '2025-01-01T00:00:00Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Last login date',
    example: '2025-01-08T10:30:00Z',
    required: false,
  })
  lastLoginAt?: Date;

  @ApiProperty({
    description: 'Number of organization memberships',
    example: 2,
  })
  organizationCount: number;
}
