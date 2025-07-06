import { forwardRef, Module } from '@nestjs/common';
import { EvaluationsService } from './evaluations.service';
import { EvaluationsController } from './evaluations.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { EvaluationValidationService } from './services/evaluation-validation.service';
import { CryptoModule } from '../cryptography/crypto.module';
import { Peer360EvaluationService } from './services/peer360-evaluation.service';
import { ReferenceService } from './services/reference.service';
import { MentorEvaluationService } from './services/mentor-evaluation.service';
import { CycleValidationService } from './services/cycle-validation.service';
import { CycleConfigModule } from './cycles/cycle-config.module';
import { AutoEvaluationModule } from './autoevaluations/autoevaluations.module';

@Module({
    imports: [PrismaModule, CryptoModule, CycleConfigModule, AutoEvaluationModule],
    controllers: [EvaluationsController],
    providers: [
        EvaluationsService,
        EvaluationValidationService,
        Peer360EvaluationService,
        ReferenceService,
        MentorEvaluationService,
        CycleValidationService,
    ],
    exports: [forwardRef(() => AutoEvaluationModule), CycleValidationService],
})
export class EvaluationsModule {}
