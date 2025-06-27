import { Module } from '@nestjs/common';
import { RhPanelController } from './controllers/rh-panel.controller';
import { RhPanelService } from './services/rh-panel.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { CommonModule } from '../../common/common.module';
import { RHUserController } from './controllers/rh.controller';
import { RHUserService } from './services/rh.service';

@Module({
    imports: [PrismaModule, CommonModule],
    controllers: [RhPanelController, RHUserController],
    providers: [RhPanelService, RHUserService],
    exports: [RhPanelService, RHUserService],
})
export class RhModule {}
