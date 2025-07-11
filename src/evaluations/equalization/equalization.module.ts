import { Module } from '@nestjs/common';
import { EqualizationService } from './equalization.service';
import { EqualizationController } from './equalization.controller';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    providers: [EqualizationService],
    controllers: [EqualizationController],
})
export class EqualizationModule {}
