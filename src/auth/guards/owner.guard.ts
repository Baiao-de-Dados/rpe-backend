import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';

@Injectable()
export class OwnerGuard implements CanActivate {
    canActivate(ctx: ExecutionContext): boolean {
        const request = ctx.switchToHttp().getRequest();
        const userId = request.user.id;
        const resourceOwnerId = Number(request.params.id);

        if (userId !== resourceOwnerId) {
            throw new ForbiddenException('Você não tem permissão para acessar este recurso.');
        }
        return true;
    }
}
