import { Module } from '@nestjs/common';
import { CommonModule } from 'src/common/common.module';
import { EvaluationsModule } from 'src/evaluations/evaluations.module';
import { PrismaModule } from 'src/prisma/prisma.module';
import { EmployerService } from './services/employer.service';
import { EmployerController } from './controllers/employer.controller';

@Module({
    imports: [PrismaModule, CommonModule, EvaluationsModule],
    controllers: [EmployerController],
    providers: [EmployerService],
    exports: [EmployerService],
})
export class EmployerModule {}
