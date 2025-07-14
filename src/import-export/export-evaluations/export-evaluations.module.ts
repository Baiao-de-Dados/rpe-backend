import { Module } from '@nestjs/common';
import { ExportEvaluationsService } from './export-evaluations.service';
import { ExportEvaluationsController } from './export-evaluations.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { EvaluationsModule } from 'src/evaluations/evaluations.module';

@Module({
    imports: [PrismaModule, EvaluationsModule],
    providers: [ExportEvaluationsService],
    controllers: [ExportEvaluationsController],
})
export class ExportEvaluationsModule {}
