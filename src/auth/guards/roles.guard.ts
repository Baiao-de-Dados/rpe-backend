import {
    Injectable,
    CanActivate,
    ExecutionContext,
    ForbiddenException,
    Inject,
    forwardRef,
} from '@nestjs/common';
import { LogService } from '../../log/log.service';
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
    constructor(
        private reflector: Reflector,
        @Inject(forwardRef(() => LogService)) private readonly logService: LogService,
    ) {}

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
            // Log tentativa de acesso sem autenticação
            const req = context.switchToHttp().getRequest();
            void this.logService.createLog({
                userId: null,
                action: 'UNAUTHORIZED_ACCESS',
                metadata: {
                    reason: 'User not authenticated',
                    url: req.url,
                    method: req.method,
                    ip: req.ip || req.headers['x-forwarded-for'] || req.socket?.remoteAddress,
                },
            });
            throw new ForbiddenException('User not authenticated');
        }

        if (!user.roles || user.roles.length === 0) {
            // Log tentativa de acesso sem roles
            const req = context.switchToHttp().getRequest();
            void this.logService.createLog({
                userId: (user as any)?.id ?? null,
                action: 'UNAUTHORIZED_ACCESS',
                metadata: {
                    reason: 'User has no roles assigned',
                    url: req.url,
                    method: req.method,
                    ip: req.ip || req.headers['x-forwarded-for'] || req.socket?.remoteAddress,
                },
            });
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

        // Log tentativa de acesso negado por roles
        const req = context.switchToHttp().getRequest();
        void this.logService.createLog({
            userId: (user as any)?.id ?? null,
            action: 'UNAUTHORIZED_ACCESS',
            metadata: {
                reason: 'Access denied by roles',
                url: req.url,
                method: req.method,
                ip: req.ip || req.headers['x-forwarded-for'] || req.socket?.remoteAddress,
                userRoles: user.roles,
                requiredRoles,
                exactRoles,
            },
        });
        throw new ForbiddenException(`Access denied.`);
    }
}
