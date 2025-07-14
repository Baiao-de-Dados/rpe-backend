import { forwardRef, Module } from '@nestjs/common';
import { EvaluationsService } from './evaluations.service';
import { EvaluationsController } from './evaluations.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { EvaluationValidationService } from './services/evaluation-validation.service';
import { CryptoModule } from '../cryptography/crypto.module';
import { Evaluation360Module } from './evaluation360/evaluation360.module';
import { ReferencesModule } from './references/references.module';
import { MentoringModule } from './mentoring/mentoring.module';
import { CycleValidationService } from './services/cycle-validation.service';
import { CycleConfigModule } from '../cycles/cycle-config.module';
import { AutoEvaluationModule } from './autoevaluations/autoevaluations.module';
import { CollaboratorsService } from './collaborators/collaborators.service';
import { LogModule } from 'src/log/log.module';
import { EvaluationDraftService } from './services/evaluation-draft.service';

@Module({
    imports: [
        PrismaModule,
        CryptoModule,
        CycleConfigModule,
        LogModule,
        AutoEvaluationModule,
        Evaluation360Module,
        ReferencesModule,
        MentoringModule,
    ],
    controllers: [EvaluationsController],
    providers: [
        EvaluationsService,
        EvaluationValidationService,
        CycleValidationService,
        CollaboratorsService,
        EvaluationDraftService,
    ],
    exports: [forwardRef(() => AutoEvaluationModule), CycleValidationService, CollaboratorsService],
})
export class EvaluationsModule {}
