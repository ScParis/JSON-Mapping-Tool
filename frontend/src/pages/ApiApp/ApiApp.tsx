import React, { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { Send, Plus, Trash2, ShieldAlert, Copy, Check, Clock, Database, Globe } from 'lucide-react';
import { PageHeader, Card, Button, Input, Badge, Tabs, Select } from '../../components/ui';

interface KeyValuePair {
    id: string;
    key: string;
    value: string;
    enabled: boolean;
}

const HTTP_METHODS = [
    { value: 'GET', label: 'GET' },
    { value: 'POST', label: 'POST' },
    { value: 'PUT', label: 'PUT' },
    { value: 'DELETE', label: 'DELETE' },
    { value: 'PATCH', label: 'PATCH' }
];

export default function ApiApp() {
    const [theme, setTheme] = useState<'light' | 'dark' | 'midnight'>(() => {
        return (localStorage.getItem('portal-theme') as 'light' | 'dark' | 'midnight') || 'midnight';
    });

    const [method, setMethod] = useState<'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'>('GET');
    const [url, setUrl] = useState('https://api.github.com/users/octocat');

    // Headers & Params
    const [headers, setHeaders] = useState<KeyValuePair[]>([
        { id: '1', key: 'User-Agent', value: 'Dev-Studio-Client', enabled: true }
    ]);
    const [params, setParams] = useState<KeyValuePair[]>([]);

    // Request Body
    const [reqBody, setReqBody] = useState('{\n  "name": "morpheus",\n  "job": "leader"\n}');

    // Active configuration tab
    const [configTab, setConfigTab] = useState<'params' | 'headers' | 'body'>('params');

    // Response State
    const [responseStatus, setResponseStatus] = useState<number | null>(null);
    const [responseStatusText, setResponseStatusText] = useState('');
    const [responseTime, setResponseTime] = useState<number | null>(null);
    const [responseSize, setResponseSize] = useState<string>('');
    const [responseHeaders, setResponseHeaders] = useState<Record<string, string>>({});
    const [responseBody, setResponseBody] = useState('');
    
    // UI state
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [copiedResp, setCopiedResp] = useState(false);

    useEffect(() => {
        const handleThemeChange = () => {
            const currentTheme = (localStorage.getItem('portal-theme') as 'light' | 'dark' | 'midnight') || 'midnight';
            setTheme(currentTheme);
        };
        window.addEventListener('theme-changed', handleThemeChange);
        return () => window.removeEventListener('theme-changed', handleThemeChange);
    }, []);

    // Sync Params state with URL input query parameters
    const handleUrlChange = (newUrl: string) => {
        setUrl(newUrl);
        try {
            const urlObj = new URL(newUrl);
            const searchParams = Array.from(urlObj.searchParams.entries());
            if (searchParams.length > 0) {
                const newParams = searchParams.map(([k, v], idx) => ({
                    id: String(idx + 1),
                    key: k,
                    value: v,
                    enabled: true
                }));
                setParams(newParams);
            }
        } catch (e) { }
    };

    // Sync URL when query parameter rows change
    const updateUrlFromParams = (updatedParams: KeyValuePair[]) => {
        try {
            const cleanUrl = url.split('?')[0];
            const activeParams = updatedParams.filter(p => p.enabled && p.key);
            if (activeParams.length === 0) {
                setUrl(cleanUrl);
                return;
            }
            const queryParts = activeParams.map(p => `${encodeURIComponent(p.key)}=${encodeURIComponent(p.value)}`);
            setUrl(`${cleanUrl}?${queryParts.join('&')}`);
        } catch (e) { }
    };

    const handleParamChange = (id: string, field: 'key' | 'value' | 'enabled', val: any) => {
        const updated = params.map(p => p.id === id ? { ...p, [field]: val } : p);
        setParams(updated);
        if (field === 'key' || field === 'value' || field === 'enabled') {
            updateUrlFromParams(updated);
        }
    };

    const addParam = () => {
        const newParam = { id: String(Date.now()), key: '', value: '', enabled: true };
        setParams([...params, newParam]);
    };

    const removeParam = (id: string) => {
        const updated = params.filter(p => p.id !== id);
        setParams(updated);
        updateUrlFromParams(updated);
    };

    // Headers handlers
    const handleHeaderChange = (id: string, field: 'key' | 'value' | 'enabled', val: any) => {
        setHeaders(headers.map(h => h.id === id ? { ...h, [field]: val } : h));
    };

    const addHeader = () => {
        setHeaders([...headers, { id: String(Date.now()), key: '', value: '', enabled: true }]);
    };

    const removeHeader = (id: string) => {
        setHeaders(headers.filter(h => h.id !== id));
    };

    // Send HTTP Request
    const sendRequest = async () => {
        setIsLoading(true);
        setError('');
        setResponseStatus(null);
        setResponseHeaders({});
        setResponseBody('');
        
        const startTime = Date.now();

        try {
            const processedHeaders: Record<string, string> = {};
            headers.filter(h => h.enabled && h.key).forEach(h => {
                processedHeaders[h.key] = h.value;
            });

            if (['POST', 'PUT', 'PATCH'].includes(method) && !Object.keys(processedHeaders).some(k => k.toLowerCase() === 'content-type')) {
                processedHeaders['Content-Type'] = 'application/json';
            }

            const response = await fetch('http://localhost:3001/api/proxy', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    url,
                    method,
                    headers: processedHeaders,
                    body: ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method) ? reqBody : undefined
                })
            });

            const latency = Date.now() - startTime;
            setResponseTime(latency);

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || errorData.details || 'Falha na requisição.');
            }

            const resData = await response.json();
            
            setResponseStatus(resData.status);
            setResponseStatusText(resData.statusText || 'OK');
            setResponseHeaders(resData.headers || {});

            let bodyStr = '';
            if (typeof resData.data === 'object') {
                bodyStr = JSON.stringify(resData.data, null, 2);
            } else {
                bodyStr = String(resData.data);
            }
            setResponseBody(bodyStr);

            const byteLength = new TextEncoder().encode(bodyStr).length;
            if (byteLength > 1024 * 1024) {
                setResponseSize(`${(byteLength / (1024 * 1024)).toFixed(2)} MB`);
            } else if (byteLength > 1024) {
                setResponseSize(`${(byteLength / 1024).toFixed(2)} KB`);
            } else {
                setResponseSize(`${byteLength} B`);
            }

        } catch (e: any) {
            console.error(e);
            setError(e.message || 'Falha ao realizar a requisição de API.');
        } finally {
            setIsLoading(false);
        }
    };

    const copyToClipboard = (text: string, setCopied: (v: boolean) => void) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const configTabs = [
        { id: 'params', label: `Params (${params.length})` },
        { id: 'headers', label: `Headers (${headers.length})` },
        { id: 'body', label: 'Body' }
    ];

    return (
        <div className="ds-container flex flex-col h-full overflow-hidden flex-1">
            <PageHeader
                title="API Tester"
                description="Realize requisições HTTP REST diretamente do seu navegador. As requisições são roteadas via servidor backend para contornar políticas de CORS."
                icon={Globe}
                badge="Ferramentas Dev"
            />

            {/* Request Bar */}
            <Card variant="glass" padding="sm" className="flex items-center gap-3 mb-6">
                <div className="w-32">
                    <Select
                        value={method}
                        onChange={(e: any) => setMethod(e.target.value)}
                        options={HTTP_METHODS}
                        className={`font-black ${
                            method === 'GET' ? 'text-emerald-500' :
                            method === 'POST' ? 'text-indigo-500' :
                            method === 'PUT' ? 'text-amber-500' :
                            method === 'DELETE' ? 'text-red-500' : 'text-purple-500'
                        }`}
                    />
                </div>

                <div className="flex-1">
                    <Input
                        value={url}
                        onChange={(e) => handleUrlChange(e.target.value)}
                        placeholder="https://api.example.com/endpoint"
                        className="font-mono text-xs"
                    />
                </div>

                <Button
                    onClick={sendRequest}
                    disabled={isLoading || !url}
                    isLoading={isLoading}
                    variant="primary"
                    size="md"
                    icon={Send}
                >
                    Enviar
                </Button>
            </Card>

            {/* Split Panels */}
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 overflow-hidden min-h-0">
                {/* Request Configuration Card */}
                <Card variant="glass" padding="none" className="flex flex-col overflow-hidden shadow-sm h-full">
                    {/* Tabs Header */}
                    <div className="p-3 border-b border-base/80 bg-base/20">
                        <Tabs
                            tabs={configTabs}
                            activeTab={configTab}
                            onChange={(id) => setConfigTab(id as any)}
                        />
                    </div>

                    {/* Tab Body */}
                    <div className="flex-1 p-5 overflow-y-auto custom-scrollbar flex flex-col gap-4">
                        {configTab === 'params' && (
                            <div className="flex flex-col gap-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-black uppercase text-muted tracking-wider">Query Parameters</span>
                                    <Button onClick={addParam} variant="secondary" size="sm" icon={Plus}>
                                        Adicionar
                                    </Button>
                                </div>

                                {params.length === 0 ? (
                                    <div className="text-center py-6 text-muted font-medium text-xs">
                                        Nenhum parâmetro de URL definido.
                                    </div>
                                ) : (
                                    <div className="flex flex-col gap-2">
                                        {params.map((p) => (
                                            <div key={p.id} className="flex items-center gap-2">
                                                <input
                                                    type="checkbox"
                                                    checked={p.enabled}
                                                    onChange={(e) => handleParamChange(p.id, 'enabled', e.target.checked)}
                                                    className="w-4 h-4 accent-indigo-500 rounded cursor-pointer"
                                                />
                                                <div className="flex-1">
                                                    <Input
                                                        value={p.key}
                                                        onChange={(e) => handleParamChange(p.id, 'key', e.target.value)}
                                                        placeholder="Chave"
                                                        className="font-mono text-xs"
                                                    />
                                                </div>
                                                <div className="flex-1">
                                                    <Input
                                                        value={p.value}
                                                        onChange={(e) => handleParamChange(p.id, 'value', e.target.value)}
                                                        placeholder="Valor"
                                                        className="font-mono text-xs"
                                                    />
                                                </div>
                                                <Button
                                                    onClick={() => removeParam(p.id)}
                                                    variant="ghost"
                                                    size="sm"
                                                    icon={Trash2}
                                                    className="text-muted hover:text-red-500"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {configTab === 'headers' && (
                            <div className="flex flex-col gap-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-black uppercase text-muted tracking-wider">Request Headers</span>
                                    <Button onClick={addHeader} variant="secondary" size="sm" icon={Plus}>
                                        Adicionar
                                    </Button>
                                </div>

                                <div className="flex flex-col gap-2">
                                    {headers.map((h) => (
                                        <div key={h.id} className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                checked={h.enabled}
                                                onChange={(e) => handleHeaderChange(h.id, 'enabled', e.target.checked)}
                                                className="w-4 h-4 accent-indigo-500 rounded cursor-pointer"
                                            />
                                            <div className="flex-1">
                                                <Input
                                                    value={h.key}
                                                    onChange={(e) => handleHeaderChange(h.id, 'key', e.target.value)}
                                                    placeholder="Header"
                                                    className="font-mono text-xs"
                                                />
                                            </div>
                                            <div className="flex-1">
                                                <Input
                                                    value={h.value}
                                                    onChange={(e) => handleHeaderChange(h.id, 'value', e.target.value)}
                                                    placeholder="Valor"
                                                    className="font-mono text-xs"
                                                />
                                            </div>
                                            <Button
                                                onClick={() => removeHeader(h.id)}
                                                variant="ghost"
                                                size="sm"
                                                icon={Trash2}
                                                className="text-muted hover:text-red-500"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {configTab === 'body' && (
                            <div className="flex-1 flex flex-col gap-3 min-h-[250px]">
                                <span className="text-[10px] font-black uppercase text-muted tracking-wider">Payload (Raw JSON)</span>
                                <div className="flex-1 border border-base/80 rounded-2xl overflow-hidden relative">
                                    <Editor
                                        height="100%"
                                        language="json"
                                        value={reqBody}
                                        onChange={(val) => setReqBody(val || '')}
                                        theme={theme === 'light' ? 'vs' : 'vs-dark'}
                                        options={{
                                            minimap: { enabled: false },
                                            fontSize: 12,
                                            automaticLayout: true,
                                            fontFamily: 'JetBrains Mono, Fira Code, monospace',
                                            padding: { top: 12, bottom: 12 }
                                        }}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </Card>

                {/* Response Panel Card */}
                <Card variant="glass" padding="none" className="flex flex-col overflow-hidden shadow-sm h-full">
                    {/* Console Info Header */}
                    <div className="p-4 border-b border-base/80 bg-base/20 flex items-center justify-between gap-4 flex-wrap">
                        <span className="text-xs font-black uppercase text-primary tracking-wider flex items-center gap-1.5">
                            Resposta do Servidor
                        </span>

                        {responseStatus !== null && (
                            <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-wider text-muted">
                                <Badge variant={
                                    responseStatus >= 200 && responseStatus < 300 ? 'success' :
                                    responseStatus >= 300 && responseStatus < 400 ? 'warning' : 'danger'
                                }>
                                    {responseStatus} {responseStatusText}
                                </Badge>
                                {responseTime && (
                                    <span className="flex items-center gap-1">
                                        <Clock size={12} className="text-indigo-500" /> {responseTime} ms
                                    </span>
                                )}
                                {responseSize && (
                                    <span className="flex items-center gap-1">
                                        <Database size={12} className="text-purple-500" /> {responseSize}
                                    </span>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Console Body */}
                    <div className="flex-1 p-5 overflow-y-auto custom-scrollbar flex flex-col gap-4">
                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center h-full gap-3 py-10">
                                <div className="flex gap-1.5 items-center">
                                    <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                    <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                    <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                </div>
                                <span className="text-[10px] font-bold text-muted uppercase tracking-widest">Enviando requisição...</span>
                            </div>
                        ) : error ? (
                            <div className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500">
                                <ShieldAlert className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                <div className="text-xs font-medium leading-relaxed">{error}</div>
                            </div>
                        ) : responseBody ? (
                            <div className="flex-1 flex flex-col gap-3 min-h-[300px]">
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-black uppercase text-muted tracking-wider">Payload Retornado</span>
                                    <Button
                                        onClick={() => copyToClipboard(responseBody, setCopiedResp)}
                                        variant="ghost"
                                        size="sm"
                                        icon={copiedResp ? Check : Copy}
                                        title="Copiar JSON"
                                    />
                                </div>
                                <div className="flex-1 border border-base/80 rounded-2xl overflow-hidden relative">
                                    <Editor
                                        height="100%"
                                        language="json"
                                        value={responseBody}
                                        options={{
                                            readOnly: true,
                                            minimap: { enabled: false },
                                            fontSize: 12,
                                            automaticLayout: true,
                                            fontFamily: 'JetBrains Mono, Fira Code, monospace',
                                            padding: { top: 12, bottom: 12 }
                                        }}
                                    />
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-center p-6 text-muted font-medium gap-2">
                                <Send className="opacity-20" size={28} />
                                <p className="text-xs">Configure o método, parâmetros e clique em <strong className="text-primary font-bold">Enviar</strong> para disparar a requisição de API.</p>
                            </div>
                        )}
                    </div>
                </Card>
            </div>
        </div>
    );
}
