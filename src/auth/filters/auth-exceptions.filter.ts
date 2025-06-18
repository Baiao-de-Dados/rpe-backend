import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    UnauthorizedException,
    ForbiddenException,
    HttpException,
} from '@nestjs/common';
import { Response } from 'express';

@Catch(UnauthorizedException, ForbiddenException)
export class AuthExceptionFilter implements ExceptionFilter {
    catch(exception: HttpException, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const status = exception.getStatus();

        let message = 'Acesso não autorizado';
        if (exception instanceof UnauthorizedException) {
            message = 'Autenticação necessária para acessar este recurso';
        } else if (exception instanceof ForbiddenException) {
            message = 'Você não tem permissão para acessar este recurso';
        }

        response.status(status).json({
            statusCode: status,
            timestamp: new Date().toISOString(),
            path: ctx.getRequest().url,
            message,
        });
    }
}
