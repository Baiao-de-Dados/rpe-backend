import { Module } from '@nestjs/common';
import { ExportEvaluationsService } from './export-evaluations.service';
import { ExportEvaluationsController } from './export-evaluations.controller';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    providers: [ExportEvaluationsService],
    controllers: [ExportEvaluationsController],
})
export class ExportEvaluationsModule {}
