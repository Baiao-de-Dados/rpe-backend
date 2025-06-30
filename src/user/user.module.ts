import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { PrismaModule } from '../prisma/prisma.module';
import { CryptoModule } from 'src/encryption/crypto.module';
import { EncryptionInterceptor } from 'src/common/interceptors/encryption.interceptor';
import { RhModule } from './rh/rh.module';
import { EmployerModule } from './employer/employer.module';

@Module({
    imports: [PrismaModule, CryptoModule, RhModule, EmployerModule],
    providers: [UserService, EncryptionInterceptor],
    controllers: [UserController],
    exports: [UserService],
})
export class UserModule {}
