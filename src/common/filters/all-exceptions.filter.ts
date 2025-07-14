import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';
import { PinoLogger } from 'nestjs-pino';
import { getBrazilDate } from 'src/cycles/utils';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
    constructor(private readonly logger: PinoLogger) {
        this.logger.setContext(AllExceptionsFilter.name);
    }

    catch(exception: unknown, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const req = ctx.getRequest<Request>();
        const res = ctx.getResponse<Response>();
        const status =
            exception instanceof HttpException
                ? exception.getStatus()
                : HttpStatus.INTERNAL_SERVER_ERROR;

        this.logger.error(
            {
                method: req.method,
                url: req.url,
                status,
                exception,
            },
            'Unhandled exception',
        );

        res.status(status).json({
            statusCode: status,
            timestamp: new Date(getBrazilDate()).toISOString(),
            path: req.url,
        });
    }
}
