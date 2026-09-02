import assert from 'assert';
import { encryptSecret, decryptSecret, maskApiKey, generateMasterKey } from './crypto';

console.log('🧪 Iniciando testes do módulo crypto (AES-256-GCM)...');

// 1. Teste básico de cifragem e decifragem com chave gerada
const testKey = 'AIzaSyA_ExemploChaveGeminiReal1234567890';
const masterKey = generateMasterKey();

assert.strictEqual(masterKey.length, 64, 'Master key deve ter 64 caracteres hex (32 bytes)');

const encrypted = encryptSecret(testKey, masterKey);
assert(encrypted.encryptedKey, 'encryptedKey deve existir');
assert(encrypted.iv, 'iv deve existir');
assert.strictEqual(encrypted.iv.length, 32, 'IV hex deve ter 32 caracteres (16 bytes)');
assert(encrypted.authTag, 'authTag deve existir');
assert.strictEqual(encrypted.authTag.length, 32, 'AuthTag hex deve ter 32 caracteres (16 bytes)');

const decrypted = decryptSecret(encrypted, masterKey);
assert.strictEqual(decrypted, testKey, 'Texto decifrado deve ser exatamente igual ao original');
console.log('  ✅ Cifragem e decifragem preservam integridade');

// 2. Teste de IV aleatório (duas cifragens da mesma chave devem produzir resultados diferentes)
const encrypted2 = encryptSecret(testKey, masterKey);
assert.notStrictEqual(encrypted.encryptedKey, encrypted2.encryptedKey, 'Dois ciphertexts não devem ser idênticos');
assert.notStrictEqual(encrypted.iv, encrypted2.iv, 'IVs devem ser únicos por chamada');
console.log('  ✅ IVs aleatórios garantem não-determinismo');

// 3. Teste de detecção de adulteração (Tampering) no ciphertext
assert.throws(() => {
    const tampered = { ...encrypted, encryptedKey: encrypted.encryptedKey.slice(0, -2) + 'ff' };
    decryptSecret(tampered, masterKey);
}, /Unsupported state or unable to authenticate data|bad decrypt/i, 'Ciphertext adulterado deve lançar exceção');
console.log('  ✅ Adulteração no ciphertext detectada com sucesso');

// 4. Teste de detecção de adulteração na authTag
assert.throws(() => {
    const tamperedTag = { ...encrypted, authTag: '0'.repeat(32) };
    decryptSecret(tamperedTag, masterKey);
}, /Unsupported state or unable to authenticate data|bad decrypt/i, 'AuthTag inválida deve lançar exceção');
console.log('  ✅ Adulteração na authTag detectada com sucesso');

// 5. Teste de máscara de chave
const masked = maskApiKey('AIzaSyB1234567890abcdefghijklm');
assert.strictEqual(masked, 'AIzaSy...jklm', 'Máscara deve exibir os 6 primeiros e 4 últimos caracteres');

const shortMasked = maskApiKey('curta');
assert.strictEqual(shortMasked, '••••••••', 'Chave curta deve ser totalmente ocultada');
console.log('  ✅ Máscara de chave protege visualização');

console.log('🎉 Todos os testes de criptografia passaram com 100% de sucesso!');
