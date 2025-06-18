import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UserFromJwt } from '../strategies/jwt.strategy';

export const CurrentUser = createParamDecorator(
    (data: unknown, ctx: ExecutionContext): UserFromJwt => {
        const request = ctx.switchToHttp().getRequest();
        return request.user;
    },
);
