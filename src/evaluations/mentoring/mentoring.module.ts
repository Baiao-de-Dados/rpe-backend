import { Module } from '@nestjs/common';
import { MentorEvaluationService } from './service/mentor-evaluation.service';

@Module({
    providers: [MentorEvaluationService],
    exports: [MentorEvaluationService],
})
export class MentoringModule {}
