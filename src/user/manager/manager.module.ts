import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { ManagerService } from './services/manager.service';
import { ManagerController } from './controllers/manager.controller';

@Module({
    imports: [PrismaModule],
    providers: [ManagerService],
    controllers: [ManagerController],
})
export class ManagerModule {}
