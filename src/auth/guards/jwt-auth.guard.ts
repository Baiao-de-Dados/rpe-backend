import { Injectable, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
    constructor(private reflector: Reflector) {
        super();
    }

    canActivate(context: ExecutionContext) {
        // Verificar se a rota é pública
        const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        console.log('JwtAuthGuard - Route is public:', isPublic);
        console.log('JwtAuthGuard - Route path:', context.getHandler().name);

        if (isPublic) {
            console.log('JwtAuthGuard - Allowing public access');
            return true;
        }

        console.log('JwtAuthGuard - Requiring authentication');
        // Se não é pública, aplicar autenticação JWT
        return super.canActivate(context);
    }
}
