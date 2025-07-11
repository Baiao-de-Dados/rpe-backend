import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    UnauthorizedException,
    ForbiddenException,
    HttpException,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { LogService } from '../../log/log.service';

@Catch(UnauthorizedException, ForbiddenException)
export class AuthExceptionFilter implements ExceptionFilter {
    constructor(private readonly logService: LogService) {}

    catch(exception: HttpException, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const status = exception.getStatus();

        let message = 'Acesso não autorizado';
        let action = 'AUTH_FAILURE';
        if (exception instanceof UnauthorizedException) {
            message = 'Autenticação necessária para acessar este recurso';
            action = 'AUTH_FAILURE';
        } else if (exception instanceof ForbiddenException) {
            message = 'Você não tem permissão para acessar este recurso';
            action = 'FORBIDDEN';
        }

        const request = ctx.getRequest<Request>();
        // Log de falha de autenticação/forbidden
        void this.logService.createLog({
            userId: (request.user as any)?.id ?? null,
            action,
            metadata: {
                url: request.url,
                method: request.method,
                ip:
                    request.ip ||
                    request.headers['x-forwarded-for'] ||
                    request.socket?.remoteAddress,
                userAgent: request.headers['user-agent'] || '',
                error: exception.message,
            },
        });

        response.status(status).json({
            statusCode: status,
            timestamp: new Date().toISOString(),
            path: request.url,
            message,
        });
    }
}
