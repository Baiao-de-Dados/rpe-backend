import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UserFromJwt } from '../strategies/jwt.strategy';

interface AuthenticatedRequest extends Request {
    user: UserFromJwt;
}

export const CurrentUser = createParamDecorator(
    (data: unknown, ctx: ExecutionContext): UserFromJwt => {
        const request = ctx.switchToHttp().getRequest<AuthenticatedRequest>();
        return request.user;
    },
);
