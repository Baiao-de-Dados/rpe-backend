import { Module } from '@nestjs/common';
import { CommitteeController } from './committee.controller';
import { CommitteeService } from './committee.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { AiModule } from '../../ai/ai.module';
import { CycleConfigService } from '../../cycles/cycle-config.service';

@Module({
    imports: [PrismaModule, AiModule],
    controllers: [CommitteeController],
    providers: [CommitteeService, CycleConfigService],
    exports: [CommitteeService],
})
export class CommitteeModule {} 