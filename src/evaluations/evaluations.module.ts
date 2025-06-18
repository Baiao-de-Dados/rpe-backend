// evaluations.module.ts
import { Module } from '@nestjs/common';
import { EvaluationsService } from './evaluations.service';
import { EvaluationsController } from './evaluations.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [EvaluationsController],
    providers: [EvaluationsService],
})
export class EvaluationsModule {}
