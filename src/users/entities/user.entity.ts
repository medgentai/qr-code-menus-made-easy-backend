import { ApiProperty } from '@nestjs/swagger';
import { User, UserRole, UserStatus } from '@prisma/client';

export class UserEntity implements Partial<User> {
  @ApiProperty({
    description: 'The unique identifier of the user',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'The email of the user',
    example: 'user@example.com',
  })
  email: string;

  @ApiProperty({
    description: 'The name of the user',
    example: 'John Doe',
  })
  name: string;

  @ApiProperty({
    description: 'The user role',
    example: 'USER',
    enum: ['ADMIN', 'USER'],
  })
  role?: UserRole;

  @ApiProperty({
    description: 'The user status',
    example: 'ACTIVE',
    enum: ['ACTIVE', 'INACTIVE', 'SUSPENDED'],
  })
  status?: UserStatus;

  @ApiProperty({
    description: 'The profile image URL',
    example: 'https://example.com/profile.jpg',
    required: false,
  })
  profileImageUrl?: string | null;

  @ApiProperty({
    description: 'The phone number',
    example: '+1234567890',
    required: false,
  })
  phoneNumber?: string | null;

  @ApiProperty({
    description: 'The date when the user was created',
    example: '2023-01-01T00:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'The date when the user was last updated',
    example: '2023-01-01T00:00:00.000Z',
  })
  updatedAt: Date;

  @ApiProperty({
    description: 'The date of last login',
    example: '2023-01-01T00:00:00.000Z',
    required: false,
  })
  lastLoginAt?: Date | null;
}
