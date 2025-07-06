export const ENCRYPTED_FIELDS_KEY = Symbol('ENCRYPTED_FIELDS');

export function EncryptField(): PropertyDecorator {
    return (target, propertyKey) => {
        const fields: string[] =
            (Reflect.getMetadata(ENCRYPTED_FIELDS_KEY, target.constructor) as string[]) || [];
        fields.push(propertyKey as string);
        Reflect.defineMetadata(ENCRYPTED_FIELDS_KEY, fields, target.constructor);
    };
}
