import { forwardRef, Module } from '@nestjs/common';
import { Peer360EvaluationService } from './services/peer360-evaluation.service';
import { EvaluationsModule } from '../evaluations.module';

@Module({
    imports: [forwardRef(() => EvaluationsModule)],
    providers: [Peer360EvaluationService],
    exports: [Peer360EvaluationService],
})
export class Evaluation360Module {}
