import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { PrismaModule } from '../prisma/prisma.module';
import { CryptoModule } from 'src/cryptography/crypto.module';
import { EncryptionInterceptor } from 'src/cryptography/interceptor/encryption.interceptor';
import { RhModule } from './rh/rh.module';
import { EmployerModule } from './employer/employer.module';
import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { LogModule } from 'src/log/log.module';
import { ManagerModule } from './manager/manager.module';
import { LeaderModule } from './leader/leader.module';
import { CommitteeModule } from './committee/committee.module';
@Module({
    imports: [
        PrismaModule,
        CryptoModule,
        LogModule,
        RhModule,
        EmployerModule,
        ManagerModule,
        LeaderModule,
        CommitteeModule,
        MulterModule.register({
            storage: memoryStorage(),
            limits: { fileSize: 30 * 1024 * 1024 }, // até 30 MB
        }),
    ],
    providers: [UserService, EncryptionInterceptor],
    controllers: [UserController],
    exports: [UserService],
})
export class UserModule {}
