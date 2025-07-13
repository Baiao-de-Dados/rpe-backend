import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UserFromJwt } from '../strategies/jwt.strategy';
import { UserRole } from '@prisma/client';

interface AuthenticatedRequest extends Request {
    user: UserFromJwt;
}

export const CurrentUser = createParamDecorator(
    (
        data: string | undefined,
        ctx: ExecutionContext,
    ): UserFromJwt | number | string | Date | UserRole[] => {
        const request = ctx.switchToHttp().getRequest<AuthenticatedRequest>();
        const user = request.user;

        if (data) {
            return user[data];
        }

        return user;
    },
);
