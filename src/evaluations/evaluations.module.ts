// evaluations.module.ts
import { Module } from '@nestjs/common';
import { EvaluationsService } from './evaluations.service';
import { EvaluationsController } from './evaluations.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { EvaluationValidationService } from './services/evaluation-validation.service';
import { AutoEvaluationService } from './services/auto-evaluation.service';
import { Evaluation360Service } from './services/evaluation360.service';
import { MentoringService } from './services/mentoring.service';
import { ReferenceService } from './services/reference.service';
import { CryptoModule } from 'src/crypto/crypto.module';

@Module({
    imports: [PrismaModule, CryptoModule],
    controllers: [EvaluationsController],
    providers: [
        EvaluationsService,
        EvaluationValidationService,
        AutoEvaluationService,
        Evaluation360Service,
        MentoringService,
        ReferenceService,
    ],
})
export class EvaluationsModule {}
