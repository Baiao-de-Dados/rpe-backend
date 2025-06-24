import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class AuditMiddleware implements NestMiddleware {
    private logger = new Logger('Audit');

    use(req: Request, res: Response, next: NextFunction) {
        const user = (req as any).user?.id || 'anonymous';
        const { method, originalUrl } = req;
        const timestamp = new Date().toISOString();

        this.logger.log(`[${timestamp}] user=${user} ${method} ${originalUrl}`);
        // Aqui você pode também salvar no DB via Prisma

        next();
    }
}
