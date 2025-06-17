import { Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Module({
    providers: [PrismaService],
    exports: [PrismaService], // Importante: exporte para que outros módulos possam usar
})
export class PrismaModule {}
