import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';

const ALGORITHM = 'aes-256-cbc';
const IV_LENGTH = 16;
const KEY_LENGTH = 32;
const ITERATIONS = 10_000;
const DIGEST = 'sha512';
const SECRET = getRequiredEnv('ENCRYPTION_KEY');
const PEPPER = getRequiredEnv('ENCRYPTION_PEPPER');

@Injectable()
export class EncryptionService {
    encrypt(plainText: string): string {
        const salt = crypto.randomBytes(16).toString('hex');
        const key = crypto.pbkdf2Sync(SECRET + PEPPER, salt, ITERATIONS, KEY_LENGTH, DIGEST);
        const iv = crypto.randomBytes(IV_LENGTH);

        const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
        const ciphertext = cipher.update(plainText, 'utf-8', 'hex') + cipher.final('hex');
        return `${salt}:${iv.toString('hex')}:${ciphertext}`;
    }

    decrypt(encrypted: string): string {
        const [salt, ivHex, ciphertext] = encrypted.split(':');
        const key = crypto.pbkdf2Sync(SECRET + PEPPER, salt, ITERATIONS, KEY_LENGTH, DIGEST);
        const iv = Buffer.from(ivHex, 'hex');
        const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
        const plainText = decipher.update(ciphertext, 'hex', 'utf-8') + decipher.final('utf-8');
        return plainText;
    }

    safeDecrypt(encrypted: string): string {
        try {
            return this.decrypt(encrypted);
        } catch {
            return encrypted;
        }
    }
}

function getRequiredEnv(key: string): string {
    const val = process.env[key];
    if (!val) {
        throw new Error(`Variável de ambiente ${key} não está definida`);
    }
    return val;
}
