import { Module } from '@nestjs/common';
import { RhPanelController } from './controllers/rh-panel.controller';
import { RhPanelService } from './services/rh-panel.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { CommonModule } from '../../common/common.module';

@Module({
    imports: [PrismaModule, CommonModule],
    controllers: [RhPanelController],
    providers: [RhPanelService],
    exports: [RhPanelService],
})
export class RhPanelModule {}
