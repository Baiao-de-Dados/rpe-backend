// evaluations.module.ts
import { Module } from '@nestjs/common';
import { EvaluationsService } from './evaluations.service';
import { EvaluationsController } from './evaluations.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { CryptoModule } from 'src/crypto/crypto.module';

@Module({
    imports: [PrismaModule, CryptoModule],
    controllers: [EvaluationsController],
    providers: [EvaluationsService],
})
export class EvaluationsModule {}
