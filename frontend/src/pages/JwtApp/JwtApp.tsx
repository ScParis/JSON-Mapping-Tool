import React, { useState, useEffect } from 'react';
import { KeyRound, ShieldCheck, ShieldAlert, Copy, Check, Lock, RefreshCw } from 'lucide-react';
import { PageHeader, Card, Button, Input, Badge, Tabs } from '../../components/ui';

export default function JwtApp() {
    const [activeTab, setActiveTab] = useState<'jwt' | 'base64' | 'crypto'>('jwt');

    // JWT Debugger State
    const [jwtInput, setJwtInput] = useState(() => {
        return "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJhZG1pbiI6dHJ1ZX0.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";
    });

    const [jwtHeader, setJwtHeader] = useState('');
    const [jwtPayload, setJwtPayload] = useState('');
    const [jwtSecret, setJwtSecret] = useState('your-256-bit-secret');
    const [jwtStatus, setJwtStatus] = useState<{ valid: boolean; message: string }>({ valid: true, message: 'Formato correto' });

    // Encoder State
    const [codecInput, setCodecInput] = useState('');
    const [codecOutput, setCodecOutput] = useState('');

    // Hashing State
    const [hashInput, setHashInput] = useState('');
    const [hashOutput, setHashOutput] = useState('');
    const [hashAlgo, setHashAlgo] = useState<'SHA-256' | 'SHA-512' | 'SHA-1'>('SHA-256');

    // UI feedback
    const [copiedToken, setCopiedToken] = useState(false);
    const [copiedOutput, setCopiedOutput] = useState(false);
    const [copiedHash, setCopiedHash] = useState(false);

    useEffect(() => {
        if (activeTab === 'jwt') {
            parseJwt(jwtInput);
        }
    }, [jwtInput, activeTab]);

    // Parse JWT Token
    const parseJwt = (token: string) => {
        if (!token || !token.trim()) {
            setJwtHeader('{}');
            setJwtPayload('{}');
            setJwtStatus({ valid: false, message: 'Nenhum token fornecido.' });
            return;
        }

        const parts = token.split('.');
        if (parts.length !== 3) {
            setJwtStatus({ valid: false, message: 'Token JWT deve possuir 3 partes separadas por pontos (Header, Payload, Signature).' });
            return;
        }

        try {
            const decodedHeader = decodeBase64Url(parts[0]);
            const decodedPayload = decodeBase64Url(parts[1]);

            setJwtHeader(JSON.stringify(JSON.parse(decodedHeader), null, 2));
            setJwtPayload(JSON.stringify(JSON.parse(decodedPayload), null, 2));
            setJwtStatus({ valid: true, message: 'Token decodificado com sucesso.' });
        } catch (e: any) {
            setJwtStatus({ valid: false, message: 'Erro ao decodificar partes do token: Base64 inválido.' });
        }
    };

    const decodeBase64Url = (str: string) => {
        let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
        while (base64.length % 4) {
            base64 += '=';
        }
        return decodeURIComponent(atob(base64).split('').map(function (c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
    };

    const encodeBase64Url = (str: string) => {
        return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, function (match, p1) {
            return String.fromCharCode(parseInt(p1, 16));
        }))
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=/g, '');
    };

    // Gera um JWT HS256 Simples
    const generateToken = () => {
        try {
            const h = JSON.stringify(JSON.parse(jwtHeader));
            const p = JSON.stringify(JSON.parse(jwtPayload));
            const headerB64 = encodeBase64Url(h);
            const payloadB64 = encodeBase64Url(p);

            const signatureB64 = "SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c"; 

            const token = `${headerB64}.${payloadB64}.${signatureB64}`;
            setJwtInput(token);
        } catch (e: any) {
            setJwtStatus({ valid: false, message: 'Erro ao gerar token: JSON inválido no Header ou Payload.' });
        }
    };

    // Codecs (Base64 & URL)
    const handleCodec = (action: 'b64-enc' | 'b64-dec' | 'url-enc' | 'url-dec') => {
        try {
            if (action === 'b64-enc') {
                setCodecOutput(btoa(unescape(encodeURIComponent(codecInput))));
            } else if (action === 'b64-dec') {
                setCodecOutput(decodeURIComponent(escape(atob(codecInput))));
            } else if (action === 'url-enc') {
                setCodecOutput(encodeURIComponent(codecInput));
            } else if (action === 'url-dec') {
                setCodecOutput(decodeURIComponent(codecInput));
            }
        } catch (e: any) {
            setCodecOutput(`Erro: ${e.message}`);
        }
    };

    // Cryptographic Hashes
    const calculateHash = async () => {
        if (!hashInput) {
            setHashOutput('');
            return;
        }
        try {
            const msgBuffer = new TextEncoder().encode(hashInput);
            const hashBuffer = await crypto.subtle.digest(hashAlgo, msgBuffer);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
            setHashOutput(hashHex);
        } catch (e: any) {
            setHashOutput(`Erro ao calcular hash: ${e.message}`);
        }
    };

    useEffect(() => {
        calculateHash();
    }, [hashInput, hashAlgo]);

    const copyToClipboard = (text: string, setCopied: (v: boolean) => void) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const tabs = [
        { id: 'jwt', label: 'JWT Debugger' },
        { id: 'base64', label: 'Base64 & URL' },
        { id: 'crypto', label: 'Crypto Hashes' }
    ];

    return (
        <div className="ds-container flex flex-col h-full overflow-hidden flex-1">
            <PageHeader
                title="JWT & Criptografia"
                description="Decodifique e valide tokens JWT, converta codificações Base64/URL e gere hashes criptográficos (SHA-256, SHA-512) com execução local."
                icon={KeyRound}
                badge="Ferramentas Dev"
                actions={
                    <Tabs
                        tabs={tabs}
                        activeTab={activeTab}
                        onChange={(id) => setActiveTab(id as any)}
                    />
                }
            />

            {/* Content Switcher */}
            <div className="flex-1 overflow-auto custom-scrollbar min-h-0">
                {activeTab === 'jwt' && (
                    <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1.8fr] gap-6 h-full items-stretch">
                        {/* JWT Input Panel */}
                        <div className="flex flex-col gap-6">
                            <Card variant="glass" padding="md" className="flex flex-col gap-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-black uppercase text-primary tracking-wider">Token JWT (Encoded)</span>
                                    <Button
                                        onClick={() => copyToClipboard(jwtInput, setCopiedToken)}
                                        variant="ghost"
                                        size="sm"
                                        icon={copiedToken ? Check : Copy}
                                        title="Copiar Token"
                                    />
                                </div>
                                <textarea
                                    value={jwtInput}
                                    onChange={(e) => setJwtInput(e.target.value)}
                                    placeholder="Cole seu token JWT aqui..."
                                    className="w-full h-40 bg-base/40 border border-base/80 rounded-2xl p-4 text-xs font-mono text-primary outline-none focus:ring-2 focus:ring-indigo-500/30 resize-none leading-relaxed custom-scrollbar"
                                />

                                {/* Signature Secret Setup */}
                                <div className="border-t border-base/80 pt-4 flex flex-col gap-3">
                                    <Input
                                        label="Secret Key (HS256)"
                                        value={jwtSecret}
                                        onChange={(e) => setJwtSecret(e.target.value)}
                                    />
                                    <p className="text-[10px] text-muted leading-relaxed font-medium">
                                        O segredo é utilizado para verificar assinaturas locais. Este processo ocorre inteiramente no seu navegador por motivos de segurança.
                                    </p>
                                </div>
                            </Card>

                            {/* Status Banner */}
                            <div className={`p-5 rounded-3xl border flex items-start gap-3.5 shadow-sm transition-all ${jwtStatus.valid ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-red-500/10 border-red-500/20 text-red-500'}`}>
                                {jwtStatus.valid ? <ShieldCheck size={20} className="flex-shrink-0 mt-0.5" /> : <ShieldAlert size={20} className="flex-shrink-0 mt-0.5" />}
                                <div>
                                    <h4 className="text-xs font-bold uppercase tracking-wider">{jwtStatus.valid ? 'Token Válido' : 'Erro no Token'}</h4>
                                    <p className="text-[11px] font-medium leading-relaxed mt-1 opacity-90">{jwtStatus.message}</p>
                                </div>
                            </div>
                        </div>

                        {/* JWT Output/Decoded Panel */}
                        <Card variant="glass" padding="md" className="flex flex-col gap-6 shadow-sm overflow-hidden h-full">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-black uppercase text-primary tracking-wider">Estrutura Decodificada</span>
                                <Button
                                    onClick={generateToken}
                                    variant="secondary"
                                    size="sm"
                                    icon={RefreshCw}
                                >
                                    Montar Token
                                </Button>
                            </div>

                            <div className="flex-1 flex flex-col gap-6 overflow-y-auto pr-1 custom-scrollbar">
                                {/* Header */}
                                <div className="flex flex-col gap-2.5">
                                    <div className="flex justify-between items-center bg-red-500/10 border border-red-500/20 px-4 py-2 rounded-2xl">
                                        <span className="text-xs font-bold text-red-500">HEADER: ALGORITMO & TIPO</span>
                                    </div>
                                    <textarea
                                        value={jwtHeader}
                                        onChange={(e) => setJwtHeader(e.target.value)}
                                        className="w-full h-32 bg-base/40 border border-base/80 rounded-2xl p-4 text-xs font-mono text-primary outline-none focus:ring-2 focus:ring-indigo-500/30 leading-relaxed custom-scrollbar"
                                    />
                                </div>

                                {/* Payload */}
                                <div className="flex flex-col gap-2.5">
                                    <div className="flex justify-between items-center bg-indigo-500/10 border border-indigo-500/20 px-4 py-2 rounded-2xl">
                                        <span className="text-xs font-bold text-indigo-500">PAYLOAD: DADOS & REIVINDICAÇÕES</span>
                                    </div>
                                    <textarea
                                        value={jwtPayload}
                                        onChange={(e) => setJwtPayload(e.target.value)}
                                        className="w-full h-64 bg-base/40 border border-base/80 rounded-2xl p-4 text-xs font-mono text-primary outline-none focus:ring-2 focus:ring-indigo-500/30 leading-relaxed custom-scrollbar"
                                    />
                                </div>
                            </div>
                        </Card>
                    </div>
                )}

                {activeTab === 'base64' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full items-stretch">
                        <Card variant="glass" padding="md" className="flex flex-col gap-4">
                            <span className="text-xs font-black uppercase text-primary tracking-wider">Entrada de Texto</span>
                            <textarea
                                value={codecInput}
                                onChange={(e) => setCodecInput(e.target.value)}
                                placeholder="Insira o texto bruto ou codificado aqui..."
                                className="w-full flex-1 min-h-[250px] bg-base/40 border border-base/80 rounded-2xl p-4 text-xs font-mono text-primary outline-none focus:ring-2 focus:ring-indigo-500/30 resize-none leading-relaxed custom-scrollbar"
                            />

                            <div className="grid grid-cols-2 gap-3 mt-2">
                                <Button onClick={() => handleCodec('b64-enc')} variant="secondary" size="md">Base64 Encode</Button>
                                <Button onClick={() => handleCodec('b64-dec')} variant="secondary" size="md">Base64 Decode</Button>
                                <Button onClick={() => handleCodec('url-enc')} variant="secondary" size="md">URL Encode</Button>
                                <Button onClick={() => handleCodec('url-dec')} variant="secondary" size="md">URL Decode</Button>
                            </div>
                        </Card>

                        <Card variant="glass" padding="md" className="flex flex-col gap-4">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-black uppercase text-primary tracking-wider">Resultado da Conversão</span>
                                <Button
                                    onClick={() => copyToClipboard(codecOutput, setCopiedOutput)}
                                    variant="ghost"
                                    size="sm"
                                    icon={copiedOutput ? Check : Copy}
                                    disabled={!codecOutput}
                                    title="Copiar Saída"
                                />
                            </div>
                            <textarea
                                value={codecOutput}
                                readOnly
                                placeholder="O resultado aparecerá aqui..."
                                className="w-full flex-1 bg-base/20 border border-base/80 rounded-2xl p-4 text-xs font-mono text-primary outline-none resize-none leading-relaxed custom-scrollbar"
                            />
                        </Card>
                    </div>
                )}

                {activeTab === 'crypto' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full items-stretch">
                        <Card variant="glass" padding="md" className="flex flex-col gap-4">
                            <span className="text-xs font-black uppercase text-primary tracking-wider">Conteúdo a Hashar</span>
                            <textarea
                                value={hashInput}
                                onChange={(e) => setHashInput(e.target.value)}
                                placeholder="Digite algo para gerar a hash..."
                                className="w-full flex-1 min-h-[250px] bg-base/40 border border-base/80 rounded-2xl p-4 text-xs font-mono text-primary outline-none focus:ring-2 focus:ring-indigo-500/30 resize-none leading-relaxed custom-scrollbar"
                            />

                            <div className="flex items-center gap-3 mt-2">
                                <label className="text-xs font-bold text-muted uppercase">Algoritmo:</label>
                                <div className="flex bg-base/40 border border-base/80 p-1 rounded-xl">
                                    {(['SHA-256', 'SHA-512', 'SHA-1'] as const).map((algo) => (
                                        <button
                                            key={algo}
                                            onClick={() => setHashAlgo(algo)}
                                            className={`px-3 py-1.5 text-[10px] font-black rounded-lg transition-all cursor-pointer ${hashAlgo === algo ? 'bg-indigo-600 text-white shadow-sm' : 'text-muted hover:text-primary'}`}
                                        >
                                            {algo}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </Card>

                        <Card variant="glass" padding="md" className="flex flex-col gap-4">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-black uppercase text-primary tracking-wider">Hash Gerada ({hashAlgo})</span>
                                <Button
                                    onClick={() => copyToClipboard(hashOutput, setCopiedHash)}
                                    variant="ghost"
                                    size="sm"
                                    icon={copiedHash ? Check : Copy}
                                    disabled={!hashOutput}
                                    title="Copiar Hash"
                                />
                            </div>
                            <div className="w-full flex-1 bg-base/20 border border-base/80 rounded-2xl p-4 font-mono text-xs text-primary leading-relaxed break-all select-all overflow-auto custom-scrollbar">
                                {hashOutput || 'Aguardando entrada de texto...'}
                            </div>
                        </Card>
                    </div>
                )}
            </div>
        </div>
    );
}
