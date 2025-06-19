import { Module } from '@nestjs/common';
import { PillarsService } from './pillars.service';
import { PillarsController } from './pillars.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [PillarsController],
    providers: [PillarsService],
    exports: [PillarsService],
})
export class PillarsModule {}
