import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';

@Injectable()
export class EncryptionService {
    private readonly algorithm = 'aes-256-gcm';
    private readonly key: Buffer;

    constructor() {
        const keyHex = process.env.ENCRYPTION_KEY || '0123456789abcdef0123456789abcdef';
        // Pad or trim key to 32 bytes
        this.key = Buffer.from(keyHex.padEnd(32, '0').slice(0, 32), 'utf8');
    }

    encrypt(plaintext: string): string {
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);
        const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
        const tag = cipher.getAuthTag();
        // Format: iv:tag:ciphertext (all hex)
        return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted.toString('hex')}`;
    }

    decrypt(payload: string): string {
        const [ivHex, tagHex, ciphertextHex] = payload.split(':');
        const iv = Buffer.from(ivHex, 'hex');
        const tag = Buffer.from(tagHex, 'hex');
        const ciphertext = Buffer.from(ciphertextHex, 'hex');
        const decipher = crypto.createDecipheriv(this.algorithm, this.key, iv);
        decipher.setAuthTag(tag);
        const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
        return decrypted.toString('utf8');
    }

    safeDecrypt(payload: string): string {
        try {
            return this.decrypt(payload);
        } catch {
            return '[decryption error]';
        }
    }
}
