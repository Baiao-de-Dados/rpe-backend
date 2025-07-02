import { Module } from '@nestjs/common';
import { TrackController } from './track.controller';
import { PrismaService } from '../prisma/prisma.service';

@Module({
    controllers: [TrackController],
    providers: [PrismaService],
})
export class TrackModule {}
