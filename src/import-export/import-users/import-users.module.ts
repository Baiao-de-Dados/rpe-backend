import { Module } from '@nestjs/common';
import { ImportUsersService } from './import-users.service';
import { ImportUsersController } from './import-users.controller';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    providers: [ImportUsersService],
    controllers: [ImportUsersController],
})
export class ImportUsersModule {}
