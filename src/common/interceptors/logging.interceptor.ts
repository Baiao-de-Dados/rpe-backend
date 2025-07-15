import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';
import { LogService } from '../../log/log.service';
import { getBrazilDate } from 'src/cycles/utils';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
    constructor(
        private readonly logger: PinoLogger,
        private readonly logService: LogService,
    ) {}

    intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
        const req = context.switchToHttp().getRequest<Request>();
        const user = req.user as { id?: number; email?: string } | undefined;
        const { method, url } = req;
        const now = getBrazilDate().getDate();
        const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
        const userAgent = req.headers['user-agent'] || '';

        return next.handle().pipe(
            tap({
                next: () => {
                    const res = context.switchToHttp().getResponse<Response>();
                    const { statusCode } = res;
                    const duration = `${getBrazilDate().getDate() - now}ms`;
                    this.logger.info(`[${method}] ${url} - ${statusCode} (${duration})`);
                    // Salva log de acesso (não await, para não bloquear fluxo)
                    void this.logService.createLog({
                        userId: user?.id ?? null,
                        action: 'ACCESS',
                        metadata: {
                            method,
                            url,
                            statusCode,
                            duration,
                            ip,
                            userAgent,
                        },
                    });
                },
                error: (err: Error) => {
                    // Salva log de erro (não await, para não bloquear fluxo)
                    void this.logService.createLog({
                        userId: user?.id ?? null,
                        action: 'ERROR',
                        metadata: {
                            method,
                            url,
                            ip,
                            userAgent,
                            error: err.message,
                        },
                    });
                },
            }),
        );
    }
}
