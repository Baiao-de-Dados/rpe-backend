import { Module } from '@nestjs/common';
import { ImportUsersService } from './import-users.service';
import { ImportUsersController } from './import-users.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { LogModule } from 'src/log/log.module';

@Module({
    imports: [PrismaModule, LogModule],
    providers: [ImportUsersService],
    controllers: [ImportUsersController],
})
export class ImportUsersModule {}
