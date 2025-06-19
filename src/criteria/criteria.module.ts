import { Module } from '@nestjs/common';
import { CriteriaService } from './criteria.service';
import { CriteriaController } from './criteria.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [CriteriaController],
    providers: [CriteriaService],
    exports: [CriteriaService],
})
export class CriteriaModule {}
