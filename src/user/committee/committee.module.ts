import { Module } from '@nestjs/common';
import { CommitteeController } from './committee.controller';
import { CommitteeService } from './committee.service';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [CommitteeController],
    providers: [CommitteeService],
    exports: [CommitteeService],
})
export class CommitteeModule {} 