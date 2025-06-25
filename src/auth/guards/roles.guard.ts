import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@prisma/client';
import { ROLES_KEY, EXACT_ROLES_KEY } from '../decorators/roles.decorator';
import { hasAnyRolePermission } from '../role-hierarchy';

interface AuthenticatedUser {
    roles: UserRole[];
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
        const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        // Verificar roles exatas (sem hierarquia)
        const exactRoles = this.reflector.getAllAndOverride<UserRole[]>(EXACT_ROLES_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        // Se não tem nenhuma restrição, libera acesso
        if (!requiredRoles && !exactRoles) {
            return true;
        }
        const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
        const user = request.user;

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

        throw new ForbiddenException(`Access denied.`);
    }
}
