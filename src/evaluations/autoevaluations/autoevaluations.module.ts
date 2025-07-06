import { forwardRef, Module } from '@nestjs/common';
import { CriteriaModule } from './criteria/criteria.module';
import { PillarsModule } from './pillar/pillars.module';
import { AutoEvaluationService } from './services/auto-evaluation.service';
import { EvaluationsModule } from '../evaluations.module';

@Module({
    imports: [CriteriaModule, PillarsModule, forwardRef(() => EvaluationsModule)],
    providers: [AutoEvaluationService],
    exports: [CriteriaModule, PillarsModule, AutoEvaluationService],
})
export class AutoEvaluationModule {}
