import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { SystemConfigService } from './services/system-config.service';

@Module({
    imports: [PrismaModule],
    providers: [SystemConfigService],
    exports: [SystemConfigService],
})
export class CommonModule {}
