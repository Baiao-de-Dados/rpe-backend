import { forwardRef, Module } from '@nestjs/common';
import { MentorEvaluationService } from './service/mentor-evaluation.service';
import { EvaluationsModule } from '../evaluations.module';

@Module({
    imports: [forwardRef(() => EvaluationsModule)],
    providers: [MentorEvaluationService],
    exports: [MentorEvaluationService],
})
export class MentoringModule {}
