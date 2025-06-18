import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { PrismaModule } from '../prisma/prisma.module'; // Importe o PrismaModule
import { CryptoModule } from 'src/crypto/crypto.module';
import { EncryptionInterceptor } from 'src/interceptors/encryption.interceptor';

@Module({
    imports: [PrismaModule, CryptoModule], // Adicione o PrismaModule aqui
    providers: [UserService, EncryptionInterceptor],
    controllers: [UserController],
    exports: [UserService],
})
export class UserModule {}
