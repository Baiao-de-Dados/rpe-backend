export const ENCRYPTED_FIELDS_KEY = Symbol('ENCRYPTED_FIELDS');

export function EncryptedField() {
    return (target: object, propertyKey: string) => {
        const existing: string[] =
            Reflect.getMetadata(ENCRYPTED_FIELDS_KEY, target.constructor) || [];
        Reflect.defineMetadata(
            ENCRYPTED_FIELDS_KEY,
            [...existing, propertyKey],
            target.constructor,
        );
    };
}
