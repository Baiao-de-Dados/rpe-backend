import { Module } from '@nestjs/common';
import { RhPanelController } from './controllers/rh-panel.controller';
import { RhPanelService } from './services/rh-panel.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { CommonModule } from '../../common/common.module';
import { RHController } from './controllers/rh.controller';
import { RHService } from './services/rh.service';

@Module({
    imports: [PrismaModule, CommonModule],
    controllers: [RhPanelController, RHController],
    providers: [RhPanelService, RHService],
    exports: [RhPanelService, RHService],
})
export class RhModule {}
