import { Module } from '@nestjs/common';
import { CriteriaService } from './criteria.service';
import { CriteriaController } from './criteria.controller';
import { PrismaModule } from '../../../prisma/prisma.module';
import { CycleConfigModule } from '../../../cycles/cycle-config.module';

@Module({
    imports: [PrismaModule, CycleConfigModule],
    controllers: [CriteriaController],
    providers: [CriteriaService],
    exports: [CriteriaService],
})
export class CriteriaModule {}
