import { SetMetadata } from '@nestjs/common';
import { UserRoleEnum } from '@prisma/client';

export const ROLES_KEY = 'roles';
export const EXACT_ROLES_KEY = 'exact_roles';

// Decorator principal com hierarquia
export const Roles = (...roles: UserRoleEnum[]) => SetMetadata(ROLES_KEY, roles);

// Decorator para roles exatas (sem hierarquia)
export const ExactRoles = (...roles: UserRoleEnum[]) => SetMetadata(EXACT_ROLES_KEY, roles);

// Decorators de conveniência COM hierarquia
export const RequireEmployer = () => SetMetadata(ROLES_KEY, [UserRoleEnum.EMPLOYER]);
export const RequireMentor = () => SetMetadata(ROLES_KEY, [UserRoleEnum.MENTOR]);
export const RequireLeader = () => SetMetadata(ROLES_KEY, [UserRoleEnum.LEADER]);
export const RequireManager = () => SetMetadata(ROLES_KEY, [UserRoleEnum.MANAGER]);
export const RequireRH = () => SetMetadata(ROLES_KEY, [UserRoleEnum.RH]);
export const RequireCommittee = () => SetMetadata(ROLES_KEY, [UserRoleEnum.COMMITTEE]);
export const RequireDeveloper = () => SetMetadata(ROLES_KEY, [UserRoleEnum.DEVELOPER]);
export const RequireAdmin = () => SetMetadata(ROLES_KEY, [UserRoleEnum.ADMIN]);

// Decorators de conveniência SEM hierarquia (apenas essas roles)
export const OnlyEmployer = () => SetMetadata(EXACT_ROLES_KEY, [UserRoleEnum.EMPLOYER]);
export const OnlyMentor = () => SetMetadata(EXACT_ROLES_KEY, [UserRoleEnum.MENTOR]);
export const OnlyLeader = () => SetMetadata(EXACT_ROLES_KEY, [UserRoleEnum.LEADER]);
export const OnlyManager = () => SetMetadata(EXACT_ROLES_KEY, [UserRoleEnum.MANAGER]);
export const OnlyRH = () => SetMetadata(EXACT_ROLES_KEY, [UserRoleEnum.RH]);
export const OnlyCommittee = () => SetMetadata(EXACT_ROLES_KEY, [UserRoleEnum.COMMITTEE]);
export const OnlyDeveloper = () => SetMetadata(EXACT_ROLES_KEY, [UserRoleEnum.DEVELOPER]);
export const OnlyAdmin = () => SetMetadata(EXACT_ROLES_KEY, [UserRoleEnum.ADMIN]);
