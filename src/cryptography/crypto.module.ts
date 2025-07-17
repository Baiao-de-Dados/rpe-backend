import { Module } from '@nestjs/common';
import { EncryptionService } from './encryption.service';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { EncryptionInterceptor } from './interceptor/encryption.interceptor';

@Module({
    providers: [
        EncryptionService,
        {
            provide: APP_INTERCEPTOR,
            useClass: EncryptionInterceptor,
        },
    ],
    exports: [EncryptionService],
})
export class CryptoModule {}
