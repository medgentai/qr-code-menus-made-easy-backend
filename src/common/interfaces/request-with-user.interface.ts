import { Request } from '@nestjs/common';
import { User } from '@prisma/client';

/**
 * Extended Request interface that includes the authenticated user
 * This is used in controllers and services that need access to the authenticated user
 */
export interface RequestWithUser extends Request {
  user: User;
}
