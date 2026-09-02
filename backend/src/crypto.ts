import crypto from 'crypto';

export interface EncryptedPayload {
    encryptedKey: string;
    iv: string;
    authTag: string;
}

/**
 * Obtém ou deriva a chave mestra de 256 bits (32 bytes) a partir da variável ENCRYPTION_MASTER_KEY.
 * Se não configurada, gera uma chave determinística baseada no ambiente local com aviso explícito.
 */
function getMasterKeyBuffer(customKeyHex?: string): Buffer {
    const rawKey = customKeyHex || process.env.ENCRYPTION_MASTER_KEY;

    if (!rawKey) {
        console.warn('[SECURITY WARNING] ENCRYPTION_MASTER_KEY não definida no ambiente. Usando chave de fallback de desenvolvimento.');
        // Chave estática exclusiva para desenvolvimento local (nunca utilizar em produção real)
        return crypto.createHash('sha256').update('nexora-devkit-dev-master-key-insecure').digest();
    }

    // Se fornecida em hex (64 caracteres = 32 bytes)
    if (/^[0-9a-fA-F]{64}$/.test(rawKey)) {
        return Buffer.from(rawKey, 'hex');
    }

    // Caso seja uma string arbitrária, aplica SHA-256 para garantir exatamente 32 bytes
    return crypto.createHash('sha256').update(rawKey).digest();
}

/**
 * Cifra um segredo (chave de API) utilizando AES-256-GCM.
 * Gera um IV aleatório de 16 bytes a cada chamada e calcula a tag de autenticação.
 */
export function encryptSecret(plainText: string, customMasterKeyHex?: string): EncryptedPayload {
    if (!plainText) {
        throw new Error('Texto para criptografia não pode ser vazio');
    }

    const keyBuffer = getMasterKeyBuffer(customMasterKeyHex);
    const iv = crypto.randomBytes(16); // 128-bit IV recomendado para GCM

    const cipher = crypto.createCipheriv('aes-256-gcm', keyBuffer, iv);
    let encrypted = cipher.update(plainText, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    return {
        encryptedKey: encrypted,
        iv: iv.toString('hex'),
        authTag: authTag.toString('hex')
    };
}

/**
 * Decifra um segredo cifrado com AES-256-GCM.
 * Valida a autenticidade e integridade dos dados via tag de autenticação.
 */
export function decryptSecret(payload: EncryptedPayload, customMasterKeyHex?: string): string {
    const { encryptedKey, iv, authTag } = payload;

    if (!encryptedKey || !iv || !authTag) {
        throw new Error('Payload inválido para decriptografia. Requer encryptedKey, iv e authTag.');
    }

    const keyBuffer = getMasterKeyBuffer(customMasterKeyHex);
    const ivBuffer = Buffer.from(iv, 'hex');
    const authTagBuffer = Buffer.from(authTag, 'hex');

    const decipher = crypto.createDecipheriv('aes-256-gcm', keyBuffer, ivBuffer);
    decipher.setAuthTag(authTagBuffer);

    let decrypted = decipher.update(encryptedKey, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
}

/**
 * Cria uma máscara segura para exibição da chave na interface do usuário (ex: 'AIzaSy...7kL9').
 * Nunca expõe o corpo central do segredo.
 */
export function maskApiKey(apiKey: string): string {
    if (!apiKey) return '';
    const clean = apiKey.trim();
    if (clean.length <= 8) {
        return '••••••••';
    }
    const start = clean.slice(0, 6);
    const end = clean.slice(-4);
    return `${start}...${end}`;
}

/**
 * Gera uma chave mestra criptograficamente segura de 32 bytes em formato hexadecimal
 * para configuração na variável de ambiente ENCRYPTION_MASTER_KEY.
 */
export function generateMasterKey(): string {
    return crypto.randomBytes(32).toString('hex');
}
