import { SetMetadata } from '@nestjs/common';
import { UserRole } from '@prisma/client';

export const ROLES_KEY = 'roles';
export const EXACT_ROLES_KEY = 'exact_roles';

// Decorator principal com hierarquia
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);

// Decorator para roles exatas (sem hierarquia)
export const ExactRoles = (...roles: UserRole[]) => SetMetadata(EXACT_ROLES_KEY, roles);

// Decorators de conveniência COM hierarquia
export const RequireEmployer = () => SetMetadata(ROLES_KEY, [UserRole.EMPLOYER]);
export const RequireMentor = () => SetMetadata(ROLES_KEY, [UserRole.MENTOR]);
export const RequireLeader = () => SetMetadata(ROLES_KEY, [UserRole.LEADER]);
export const RequireManager = () => SetMetadata(ROLES_KEY, [UserRole.MANAGER]);
export const RequireRH = () => SetMetadata(ROLES_KEY, [UserRole.RH]);
export const RequireCommittee = () => SetMetadata(ROLES_KEY, [UserRole.COMMITTEE]);
export const RequireDeveloper = () => SetMetadata(ROLES_KEY, [UserRole.DEVELOPER]);
export const RequireAdmin = () => SetMetadata(ROLES_KEY, [UserRole.ADMIN]);

// Decorators de conveniência SEM hierarquia (apenas essas roles)
export const OnlyEmployer = () => SetMetadata(EXACT_ROLES_KEY, [UserRole.EMPLOYER]);
export const OnlyMentor = () => SetMetadata(EXACT_ROLES_KEY, [UserRole.MENTOR]);
export const OnlyLeader = () => SetMetadata(EXACT_ROLES_KEY, [UserRole.LEADER]);
export const OnlyManager = () => SetMetadata(EXACT_ROLES_KEY, [UserRole.MANAGER]);
export const OnlyRH = () => SetMetadata(EXACT_ROLES_KEY, [UserRole.RH]);
export const OnlyCommittee = () => SetMetadata(EXACT_ROLES_KEY, [UserRole.COMMITTEE]);
export const OnlyDeveloper = () => SetMetadata(EXACT_ROLES_KEY, [UserRole.DEVELOPER]);
export const OnlyAdmin = () => SetMetadata(EXACT_ROLES_KEY, [UserRole.ADMIN]);
