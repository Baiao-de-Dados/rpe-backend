// evaluations.module.ts
import { Module } from '@nestjs/common';
import { EvaluationsService } from './evaluations.service';
import { EvaluationsController } from './evaluations.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { EvaluationValidationService } from './services/evaluation-validation.service';
import { CryptoModule } from '../encryption/crypto.module';
import { Peer360EvaluationService } from './services/peer360-evaluation.service';
import { ReferenceService } from './services/reference.service';
import { AutoEvaluationService } from './services/auto-evaluation.service';
import { MentorEvaluationService } from './services/mentor-evaluation.service';
import { CycleValidationService } from './services/cycle-validation.service';
import { CycleConfigModule } from '../cycle-config/cycle-config.module';

@Module({
    imports: [PrismaModule, CryptoModule, CycleConfigModule],
    controllers: [EvaluationsController],
    providers: [
        EvaluationsService,
        EvaluationValidationService,
        Peer360EvaluationService,
        ReferenceService,
        AutoEvaluationService,
        MentorEvaluationService,
        CycleValidationService,
    ],
})
export class EvaluationsModule {}
