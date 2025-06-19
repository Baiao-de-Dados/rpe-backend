import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { map, Observable } from 'rxjs';
import { EncryptionService } from 'src/crypto/encryption.service';
import { ENCRYPTED_FIELDS_KEY } from 'src/crypto/decorators/encrypt-field.decorator';

type PlainObject = Record<string, unknown>;

@Injectable()
export class EncryptionInterceptor implements NestInterceptor {
    constructor(private readonly encryptionService: EncryptionService) {}

    intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
        // Request encryption
        const request = context.switchToHttp().getRequest<{ body?: PlainObject }>();
        if (request.body && typeof request.body === 'object') {
            this.processEncryption(request.body, request.body.constructor);
        }
        // Response decryption
        return next.handle().pipe(
            map((data: unknown) => {
                if (Array.isArray(data)) {
                    data.forEach((item) => {
                        if (item && typeof item === 'object') {
                            this.processDecryption(
                                item as PlainObject,
                                (item as PlainObject).constructor,
                            );
                        }
                    });
                }
                if (data && typeof data === 'object' && data !== null) {
                    this.processDecryption(data as PlainObject, (data as PlainObject).constructor);
                }
                return data;
            }),
        );
    }
    private processEncryption(object: PlainObject, dto: object['constructor']): void {
        const fields: string[] = (Reflect.getMetadata(ENCRYPTED_FIELDS_KEY, dto) as string[]) || [];
        for (const field of fields) {
            if (
                Object.prototype.hasOwnProperty.call(object, field) &&
                typeof object[field] === 'string'
            ) {
                try {
                    object[field] = this.encryptionService.encrypt(object[field]);
                } catch (error) {
                    console.log(`Error encrypting field ${field}:`, error);
                }
            }
        }
    }

    private processDecryption(object: PlainObject, dto: object['constructor']): void {
        const fields: string[] = (Reflect.getMetadata(ENCRYPTED_FIELDS_KEY, dto) as string[]) || [];
        for (const field of fields) {
            if (
                Object.prototype.hasOwnProperty.call(object, field) &&
                typeof object[field] === 'string'
            ) {
                try {
                    object[field] = this.encryptionService.decrypt(object[field]);
                } catch (error) {
                    console.log(`Error decrypting field ${field}:`, error);
                }
            }
        }
    }
}
