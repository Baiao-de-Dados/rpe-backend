import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { LeaderController } from './controllers/leader.controller';
import { LeaderService } from './services/leader.service';

@Module({
    imports: [PrismaModule],
    controllers: [LeaderController],
    providers: [LeaderService],
})
export class LeaderModule {}
