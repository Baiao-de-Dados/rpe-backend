import { Module } from '@nestjs/common';
import { ImportEvaluationsService } from './import-evaluations.service';
import { ImportEvaluationsController } from './import-evaluations.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { LogModule } from 'src/log/log.module';
import { EvaluationsModule } from '../../evaluations/evaluations.module';

@Module({
    imports: [PrismaModule, LogModule, EvaluationsModule],
    providers: [ImportEvaluationsService],
    controllers: [ImportEvaluationsController],
})
export class ImportEvaluationsModule {}
