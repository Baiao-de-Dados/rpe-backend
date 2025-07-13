import { Module } from '@nestjs/common';
import { EqualizationService } from './equalization.service';
import { EqualizationController } from './equalization.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { LogModule } from 'src/log/log.module';

@Module({
    imports: [PrismaModule, LogModule],
    providers: [EqualizationService],
    controllers: [EqualizationController],
})
export class EqualizationModule {}
