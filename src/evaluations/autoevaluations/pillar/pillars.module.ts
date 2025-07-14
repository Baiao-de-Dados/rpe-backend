import { Module } from '@nestjs/common';
import { PillarsService } from './pillars.service';
import { PillarsController } from './pillars.controller';
import { PrismaModule } from '../../../prisma/prisma.module';
import { CycleConfigModule } from 'src/cycles/cycle-config.module';

@Module({
    imports: [PrismaModule, CycleConfigModule],
    controllers: [PillarsController],
    providers: [PillarsService],
    exports: [PillarsService],
})
export class PillarsModule {}
