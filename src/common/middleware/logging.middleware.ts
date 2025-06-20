import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { PinoLogger } from 'nestjs-pino';

@Injectable()
export class LoggingMiddleware implements NestMiddleware {
    constructor(private readonly logger: PinoLogger) {
        this.logger.setContext(LoggingMiddleware.name);
    }

    use(req: Request, res: Response, next: NextFunction) {
        const start = Date.now();
        this.logger.info(
            { method: req.method, url: req.url, body: req.body as unknown },
            'Incoming request',
        );

        res.on('finish', () => {
            this.logger.info(
                {
                    method: req.method,
                    url: req.url,
                    status: res.statusCode,
                    duration: `${Date.now() - start}ms`,
                },
                'Request completed',
            );
        });

        next();
    }
}
