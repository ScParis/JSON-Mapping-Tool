import dns from 'dns';
const originalLookup = dns.lookup;
dns.lookup = function (hostname: string, options: any, callback?: any) {
    if (typeof options === 'function') {
        callback = options;
        options = {};
    }
    if (hostname === 'google.com') {
        return callback(null, { address: '8.8.8.8', family: 4 });
    }
    return originalLookup(hostname, options, callback);
} as any;

import { isPrivateIP, validateUrlForSSRF } from './security';

async function runTests() {
    console.log("=== INICIANDO TESTES DE SEGURANÇA ===");

    const testIPs = [
        { ip: '127.0.0.1', expected: true },
        { ip: '10.0.0.5', expected: true },
        { ip: '192.168.1.100', expected: true },
        { ip: '172.16.5.5', expected: true },
        { ip: '172.32.0.1', expected: false }, // Fora da faixa privada /12
        { ip: '8.8.8.8', expected: false },
        { ip: '1.1.1.1', expected: false },
        { ip: '::1', expected: true },
        { ip: 'fe80::1', expected: true },
        { ip: 'fc00::1234', expected: true },
        { ip: '2001:db8::1', expected: false }, // Escopo global unicast
        { ip: '::ffff:127.0.0.1', expected: true }
    ];

    let failures = 0;

    for (const test of testIPs) {
        const result = isPrivateIP(test.ip);
        if (result !== test.expected) {
            console.error(`❌ Falha no IP: ${test.ip} - Esperado: ${test.expected}, Obtido: ${result}`);
            failures++;
        } else {
            console.log(`✅ IP: ${test.ip} -> ${result ? 'Privado (Bloqueado)' : 'Público (Permitido)'}`);
        }
    }

    console.log("\n=== TESTANDO VALIDAÇÃO DE URL (SSRF) ===");

    const testURLs = [
        { url: 'http://localhost:3000', expected: false },
        { url: 'http://127.0.0.1:3001/api/proxy', expected: false },
        { url: 'http://192.168.0.15/webhook', expected: false },
        { url: 'http://0x7f000001/hack', expected: false },
        { url: 'http://0177.0.0.01/hack', expected: false },
        { url: 'https://google.com', expected: true },
        { url: 'http://[::1]:3000', expected: false },
        { url: 'http://[fc00::1]:8080', expected: false }
    ];

    for (const test of testURLs) {
        const result = await validateUrlForSSRF(test.url);
        const isSafe = result;
        if (isSafe !== test.expected) {
            console.error(`❌ Falha na URL: ${test.url} - Esperado Seguro: ${test.expected}, Obtido: ${isSafe}`);
            failures++;
        } else {
            console.log(`✅ URL: ${test.url} -> ${isSafe ? 'Segura (Permitida)' : 'Insegura (Bloqueada)'}`);
        }
    }

    if (failures === 0) {
        console.log("\n🎉 TODOS OS TESTES PASSARAM COM SUCESSO!");
    } else {
        console.error(`\n❌ Ocorreram ${failures} falhas nos testes.`);
        process.exit(1);
    }
}

runTests().catch(console.error);
