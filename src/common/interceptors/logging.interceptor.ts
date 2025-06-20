import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
    constructor(private readonly logger: PinoLogger) {
        this.logger.setContext(LoggingInterceptor.name);
    }

    intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
        const req = context.switchToHttp().getRequest<Request>();
        const start = Date.now();

        return next.handle().pipe(
            tap({
                next: () => {
                    const res = context.switchToHttp().getResponse<Response>();
                    this.logger.info(
                        {
                            method: req.method,
                            url: req.url,
                            status: res.statusCode,
                            duration: `${Date.now() - start}ms`,
                        },
                        'Request handled',
                    );
                },
                error: (error: unknown) => {
                    this.logger.error(
                        { method: req.method, url: req.url, error },
                        'Error during request',
                    );
                },
            }),
        );
    }
}
