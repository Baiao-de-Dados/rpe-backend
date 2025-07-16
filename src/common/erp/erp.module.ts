import { Module } from '@nestjs/common';
import { ErpController } from './erp.controller';
import { ErpService } from './erp.service';
import { PrismaService } from '../../prisma/prisma.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { AuthModule } from '../../auth/auth.module';
import { CryptoModule } from '../../cryptography/crypto.module';

@Module({
    imports: [PrismaModule, AuthModule, CryptoModule],
    providers: [ErpService, PrismaService],
    controllers: [ErpController],
    exports: [ErpService],
})
export class ErpModule {}
