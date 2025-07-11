import { Module } from '@nestjs/common';
import { ErpController } from './erp.controller';
import { ErpService } from './erp.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { AuthModule } from 'src/auth/auth.module';

@Module({
    imports: [PrismaModule, AuthModule],
    providers: [ErpService, PrismaService],
    controllers: [ErpController],
    exports: [ErpService],
})
export class ErpModule {}
