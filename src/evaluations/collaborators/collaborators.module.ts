import { Module } from '@nestjs/common';
import { CollaboratorsService } from './collaborators.service';
import { CollaboratorsController } from './collaborators.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { LogModule } from 'src/log/log.module';

@Module({
    imports: [PrismaModule, LogModule],
    providers: [CollaboratorsService],
    controllers: [CollaboratorsController],
})
export class CollaboratorsModule {}
