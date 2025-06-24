import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { SystemConfigService } from './services/system-config.service';
import { SystemConfigController } from './controllers/system-config.controller';

@Module({
    imports: [PrismaModule],
    controllers: [SystemConfigController],
    providers: [SystemConfigService],
    exports: [SystemConfigService],
})
export class CommonModule {}
