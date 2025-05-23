import { SetMetadata } from '@nestjs/common';
import { Role } from '@repo/core';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
