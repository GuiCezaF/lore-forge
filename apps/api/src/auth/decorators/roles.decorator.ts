import { SetMetadata } from '@nestjs/common';
import { AuthRole } from '../auth.types';

export const ROLES_KEY = 'loreforge_roles';
export const Roles = (...roles: AuthRole[]) => SetMetadata(ROLES_KEY, roles);
