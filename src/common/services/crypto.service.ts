import { Injectable, Logger } from '@nestjs/common';
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

@Injectable()
export class CryptoService {
    private readonly logger = new Logger(CryptoService.name);
    private readonly algorithm = 'aes-256-cbc';
    private readonly key: Buffer;

    constructor() {
        const encryptionKey = process.env.MP_ENCRYPTION_KEY;
        if (!encryptionKey) {
            throw new Error('MP_ENCRYPTION_KEY não configurada no ambiente');
        }

        this.key = Buffer.from(encryptionKey.padEnd(32, '0').slice(0, 32));
    }

    /**
     * Criptografa um texto usando AES-256-CBC
     * @param text Texto a ser criptografado
     * @returns String criptografada em formato base64
     */
    encrypt(text: string): string {
        try {
            const iv = randomBytes(16); // Vetor de inicialização aleatório
            const cipher = createCipheriv(this.algorithm, this.key, iv);

            let encrypted = cipher.update(text, 'utf8', 'hex');
            encrypted += cipher.final('hex');

            // Retorna IV + texto criptografado em base64
            const result = Buffer.concat([iv, Buffer.from(encrypted, 'hex')]);
            return result.toString('base64');
        } catch (error) {
            this.logger.error('Erro ao criptografar dados:', error);
            throw new Error('Falha na criptografia dos dados');
        }
    }

    /**
     * Descriptografa um texto criptografado usando AES-256-CBC
     * @param encryptedText Texto criptografado em formato base64
     * @returns Texto descriptografado
     */
    decrypt(encryptedText: string): string {
        try {
            const buffer = Buffer.from(encryptedText, 'base64');
            const iv = buffer.slice(0, 16); // Primeiros 16 bytes são o IV
            const encrypted = buffer.slice(16); // Resto é o texto criptografado

            const decipher = createDecipheriv(this.algorithm, this.key, iv);
            let decrypted = decipher.update(encrypted, undefined, 'utf8');
            decrypted += decipher.final('utf8');

            return decrypted;
        } catch (error) {
            this.logger.error('Erro ao descriptografar dados:', error);
            throw new Error('Falha na descriptografia dos dados');
        }
    }

    /**
     * Verifica se uma string está criptografada
     * @param text String a ser verificada
     * @returns true se parece estar criptografada
     */
    isEncrypted(text: string): boolean {
        try {
            // Tenta decodificar como base64 e verificar se tem pelo menos 32 bytes
            const buffer = Buffer.from(text, 'base64');
            return buffer.length >= 32;
        } catch {
            return false;
        }
    }
} 