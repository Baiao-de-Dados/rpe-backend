import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { PinoLogger } from 'nestjs-pino';
import { getBrazilDate } from 'src/cycles/utils';

@Injectable()
export class LoggingMiddleware implements NestMiddleware {
    constructor(private readonly logger: PinoLogger) {
        this.logger.setContext(LoggingMiddleware.name);
    }

    use(req: Request, res: Response, next: NextFunction) {
        const start = getBrazilDate().getDate();
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
                    duration: `${getBrazilDate().getDate() - start}ms`,
                },
                'Request completed',
            );
        });

        next();
    }
}
