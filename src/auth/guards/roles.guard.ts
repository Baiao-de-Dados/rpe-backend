import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRoleEnum } from '@prisma/client';
import { ROLES_KEY, EXACT_ROLES_KEY } from '../decorators/roles.decorator';
import { hasAnyRolePermission } from '../role-hierarchy';

interface AuthenticatedUser {
    roles: UserRoleEnum[];
    // [key: string]: any -> se quiser adicionar outras propriedades como user.email ou user.id
}

interface AuthenticatedRequest extends Request {
    user: AuthenticatedUser;
}

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

        console.log('RolesGuard - Required roles (hierarchical):', requiredRoles);
        console.log('RolesGuard - Required roles (exact):', exactRoles);

        // Se não tem nenhuma restrição, libera acesso
        if (!requiredRoles && !exactRoles) {
            console.log('RolesGuard - No role restrictions, allowing access');
            return true;
        }
        const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
        const user = request.user;

        console.log('RolesGuard - User from request:', user);

        if (!user) {
            console.log('RolesGuard - User not authenticated');
            throw new ForbiddenException('User not authenticated');
        }

        if (!user.roles || user.roles.length === 0) {
            console.log('RolesGuard - User has no roles assigned');
            throw new ForbiddenException('User has no roles assigned');
        }

        console.log('RolesGuard - User roles:', user.roles);

        // Verificar roles com hierarquia
        if (requiredRoles) {
            const hasHierarchicalAccess = hasAnyRolePermission(user.roles, requiredRoles);
            console.log('RolesGuard - Has hierarchical access:', hasHierarchicalAccess);
            if (hasHierarchicalAccess) {
                return true;
            }
        }

        // Verificar roles exatas (sem hierarquia)
        if (exactRoles) {
            const hasExactAccess = exactRoles.some((role) => user.roles.includes(role));
            console.log('RolesGuard - Has exact access:', hasExactAccess);
            if (hasExactAccess) {
                return true;
            }
        }

        // Se chegou aqui, não tem acesso
        const allRequiredRoles = [...(requiredRoles || []), ...(exactRoles || [])];
        console.log(
            'RolesGuard - Access denied. Required:',
            allRequiredRoles,
            'User has:',
            user.roles,
        );
        throw new ForbiddenException(
            `Access denied. Required roles: ${allRequiredRoles.join(', ')}. Your roles: ${user.roles.join(', ')}`,
        );
    }
}
