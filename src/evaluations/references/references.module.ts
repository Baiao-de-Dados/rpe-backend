import { Module } from '@nestjs/common';
import { ReferenceService } from './services/reference.service';

@Module({
    providers: [ReferenceService],
    exports: [ReferenceService],
})
export class ReferencesModule {}
