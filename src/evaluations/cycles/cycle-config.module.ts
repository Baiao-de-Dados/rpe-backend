import { Module } from '@nestjs/common';
import { CycleConfigController } from './cycle-config.controller';
import { CycleConfigService } from './cycle-config.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [CycleConfigController],
    providers: [CycleConfigService],
    exports: [CycleConfigService],
})
export class CycleConfigModule {}
