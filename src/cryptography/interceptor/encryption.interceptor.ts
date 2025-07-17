import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { map, Observable } from 'rxjs';
import { EncryptionService } from '../encryption.service';
import { ENCRYPTED_FIELDS_KEY } from '../decorators/encrypt-field.decorator';

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

    private processEncryption(obj: PlainObject, dto: object['constructor']): void {
        const fields: string[] = Reflect.getMetadata(ENCRYPTED_FIELDS_KEY, dto) || [];
        for (const key of Object.keys(obj)) {
            const value = obj[key];
            if (typeof value === 'string' && fields.includes(key)) {
                obj[key] = this.encryptionService.encrypt(value);
            } else if (Array.isArray(value)) {
                value.forEach((item) =>
                    this.processEncryption(item as PlainObject, (item as PlainObject).constructor),
                );
            } else if (value && typeof value == 'object') {
                this.processEncryption(value as PlainObject, (value as PlainObject).constructor);
            }
        }
    }

    private processDecryption(obj: PlainObject, dto: object['constructor']): void {
        const fields: string[] = Reflect.getMetadata(ENCRYPTED_FIELDS_KEY, dto) || [];
        for (const key of Object.keys(obj)) {
            const value = obj[key];
            if (typeof value === 'string' && fields.includes(key)) {
                try {
                    obj[key] = this.encryptionService.decrypt(value);
                } catch {
                    // Campo já em plainText
                }
            } else if (Array.isArray(value)) {
                value.forEach((item) =>
                    this.processDecryption(item as PlainObject, (item as PlainObject).constructor),
                );
            } else if (value && typeof value === 'object') {
                this.processDecryption(value as PlainObject, (value as PlainObject).constructor);
            }
        }
    }
}
