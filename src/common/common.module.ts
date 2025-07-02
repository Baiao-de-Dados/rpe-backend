import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { SystemConfigService } from './services/system-config.service';
import { SeedService } from './services/seed.service';
import { SeedController } from './controllers/seed.controller';

@Module({
    imports: [PrismaModule],
    providers: [SystemConfigService, SeedService],
    controllers: [SeedController],
    exports: [SystemConfigService],
})
export class CommonModule {}
