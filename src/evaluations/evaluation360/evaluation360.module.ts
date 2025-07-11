import { Module } from '@nestjs/common';
import { Peer360EvaluationService } from './services/peer360-evaluation.service';

@Module({
    providers: [Peer360EvaluationService],
    exports: [Peer360EvaluationService],
})
export class Evaluation360Module {}
