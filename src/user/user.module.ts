import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { PrismaModule } from '../prisma/prisma.module';
import { CryptoModule } from 'src/encryption/crypto.module';
import { EncryptionInterceptor } from 'src/common/interceptors/encryption.interceptor';
import { RhPanelModule } from './rh/rh-panel.module';

@Module({
    imports: [PrismaModule, CryptoModule, RhPanelModule], // Adicione o PrismaModule aqui
    providers: [UserService, EncryptionInterceptor],
    controllers: [UserController],
    exports: [UserService],
})
export class UserModule {}
