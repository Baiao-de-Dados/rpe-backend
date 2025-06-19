import { UserRoleEnum } from '@prisma/client';

/**
 * Hierarquia de roles do sistema
 * Quanto maior o número, maior o privilégio
 */
export const ROLE_HIERARCHY: Record<UserRoleEnum, number> = {
    [UserRoleEnum.EMPLOYER]: 1, // Menor privilégio
    [UserRoleEnum.MENTOR]: 2,
    [UserRoleEnum.LEADER]: 3,
    [UserRoleEnum.MANAGER]: 4,
    [UserRoleEnum.RH]: 5,
    [UserRoleEnum.COMMITTEE]: 6,
    [UserRoleEnum.ADMIN]: 7,
    [UserRoleEnum.DEVELOPER]: 8, // Maior privilégio
};

/**
 * Verifica se o usuário tem permissão para uma role específica
 * @param userRoles - Array de roles do usuário
 * @param requiredRole - Role mínima necessária
 * @returns true se tem permissão
 */
export function hasRolePermission(userRoles: UserRoleEnum[], requiredRole: UserRoleEnum): boolean {
    const requiredLevel = ROLE_HIERARCHY[requiredRole];

    return userRoles.some((role) => {
        const userLevel = ROLE_HIERARCHY[role];
        return userLevel >= requiredLevel;
    });
}

/**
 * Verifica se o usuário tem permissão para qualquer uma das roles especificadas
 * @param userRoles - Array de roles do usuário
 * @param requiredRoles - Array de roles necessárias (OR)
 * @returns true se tem permissão para pelo menos uma
 */
export function hasAnyRolePermission(
    userRoles: UserRoleEnum[],
    requiredRoles: UserRoleEnum[],
): boolean {
    return requiredRoles.some((requiredRole) => hasRolePermission(userRoles, requiredRole));
}

/**
 * Retorna a role de maior privilégio do usuário
 * @param userRoles - Array de roles do usuário
 * @returns Role de maior privilégio
 */
export function getHighestRole(userRoles: UserRoleEnum[]): UserRoleEnum | null {
    if (!userRoles.length) return null;

    return userRoles.reduce((highest, current) => {
        return ROLE_HIERARCHY[current] > ROLE_HIERARCHY[highest] ? current : highest;
    });
}
