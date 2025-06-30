import { Module } from '@nestjs/common';
import { RhPanelController } from './controllers/rh-panel.controller';
import { RhPanelService } from './services/rh-panel.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { CommonModule } from '../../common/common.module';
import { RHController } from './controllers/rh.controller';
import { RHService } from './services/rh.service';
import { CriteriaModule } from 'src/criteria/criteria.module';
import { PillarsModule } from 'src/pillars/pillars.module';
import { CycleConfigModule } from 'src/cycle-config/cycle-config.module';

@Module({
    imports: [PrismaModule, CommonModule, CriteriaModule, PillarsModule, CycleConfigModule],
    controllers: [RhPanelController, RHController],
    providers: [RhPanelService, RHService],
    exports: [RhPanelService, RHService],
})
export class RhModule {}
