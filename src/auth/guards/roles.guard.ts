import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRoleEnum } from '@prisma/client';
import { ROLES_KEY, EXACT_ROLES_KEY } from '../decorators/roles.decorator';
import { hasAnyRolePermission } from '../role-hierarchy';

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private reflector: Reflector) {}

    canActivate(context: ExecutionContext): boolean {
        // Verificar roles com hierarquia
        const requiredRoles = this.reflector.getAllAndOverride<UserRoleEnum[]>(ROLES_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        // Verificar roles exatas (sem hierarquia)
        const exactRoles = this.reflector.getAllAndOverride<UserRoleEnum[]>(EXACT_ROLES_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        // Se não tem nenhuma restrição, libera acesso
        if (!requiredRoles && !exactRoles) {
            return true;
        }

        const { user } = context.switchToHttp().getRequest();

        if (!user) {
            throw new ForbiddenException('User not authenticated');
        }

        if (!user.roles || user.roles.length === 0) {
            throw new ForbiddenException('User has no roles assigned');
        }

        // Verificar roles com hierarquia
        if (requiredRoles) {
            const hasHierarchicalAccess = hasAnyRolePermission(user.roles, requiredRoles);
            if (hasHierarchicalAccess) {
                return true;
            }
        }

        // Verificar roles exatas (sem hierarquia)
        if (exactRoles) {
            const hasExactAccess = exactRoles.some((role) => user.roles.includes(role));
            if (hasExactAccess) {
                return true;
            }
        }

        // Se chegou aqui, não tem acesso
        const allRequiredRoles = [...(requiredRoles || []), ...(exactRoles || [])];
        throw new ForbiddenException(
            `Access denied. Required roles: ${allRequiredRoles.join(', ')}. Your roles: ${user.roles.join(', ')}`,
        );
    }
}
