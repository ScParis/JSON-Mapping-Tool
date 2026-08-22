import React, { useState, useEffect } from 'react';
import { 
  Radio, Plus, Trash2, Copy, Check, ArrowRight, ShieldAlert, Sparkles, 
  Server, ListFilter, Cpu, X, PlusCircle, ArrowLeft, Brain, Send, 
  Settings, Clock, Globe, WifiOff, FileCode, CheckCircle, HelpCircle, 
  ExternalLink, ChevronRight, Play, Eye, AlertTriangle, RefreshCw, EyeOff
} from 'lucide-react';
import Editor from '@monaco-editor/react';
import { PageHeader, Card, Button, Input, Badge, Tabs, Select } from '../../components/ui';

interface RuleMatchCondition {
    type: 'header' | 'query' | 'body';
    key?: string;
    operator: 'equals' | 'contains' | 'exists' | 'regex';
    value: string;
}

interface MockRule {
    id: string;
    pathPattern: string;
    method: string;
    matchConditions?: RuleMatchCondition[];
    responseStatus: number;
    responseHeaders: Record<string, string>;
    responseBody: string;
    responseDelay?: number;
    corsEnabled?: boolean;
    networkFailure?: 'close' | 'empty';
}

interface InterceptedRequest {
    id: string;
    method: string;
    path: string;
    headers: Record<string, string>;
    body: any;
    query: Record<string, string>;
    timestamp: string;
    responseStatus?: number;
    matchedRuleId?: string;
    responseBody?: string;
}

interface MockEndpoint {
    id: string;
    rules: MockRule[];
    requests: InterceptedRequest[];
}

export default function MockApp() {
    // Endpoints & Active Endpoint State
    const [endpointsList, setEndpointsList] = useState<MockEndpoint[]>([]);
    const [activeEndpoint, setActiveEndpoint] = useState<MockEndpoint | null>(null);
    const [endpointInput, setEndpointInput] = useState('');
    const [endpointSearch, setEndpointSearch] = useState('');
    
    // Console Main View States
    const [requests, setRequests] = useState<InterceptedRequest[]>([]);
    const [selectedRequest, setSelectedRequest] = useState<InterceptedRequest | null>(null);
    const [rules, setRules] = useState<MockRule[]>([]);
    const [activeTab, setActiveTab] = useState<'logs' | 'rules' | 'docs'>('logs');
    const [filterPath, setFilterPath] = useState('');
    const [copiedUrl, setCopiedUrl] = useState(false);
    const [sseConnected, setSseConnected] = useState(false);

    // Rule Form states
    const [isEditingRule, setIsEditingRule] = useState(false);
    const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
    const [rulePath, setRulePath] = useState('/');
    const [ruleMethod, setRuleMethod] = useState('ALL');
    const [ruleStatus, setRuleStatus] = useState(200);
    const [ruleBody, setRuleBody] = useState('{\n  "message": "Mock Response Success"\n}');
    const [ruleHeaders, setRuleHeaders] = useState<{ key: string; value: string }[]>([
        { key: 'Content-Type', value: 'application/json' }
    ]);
    const [ruleDelay, setRuleDelay] = useState<number>(0);
    const [corsEnabled, setCorsEnabled] = useState(true);
    const [networkFailure, setNetworkFailure] = useState<'close' | 'empty' | null>(null);
    const [matchConditions, setMatchConditions] = useState<RuleMatchCondition[]>([]);

    // Replay request state
    const [replayStatus, setReplayStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [replayLog, setReplayLog] = useState<string | null>(null);

    // AI Co-pilot States
    const [aiPrompt, setAiPrompt] = useState('');
    const [aiLoading, setAiLoading] = useState(false);
    const [aiError, setAiError] = useState<string | null>(null);
    const [aiPreviewRule, setAiPreviewRule] = useState<any | null>(null);

    // Tunnel State
    const [tunnelStatus, setTunnelStatus] = useState<'idle' | 'connecting' | 'open' | 'error'>('idle');
    const [tunnelUrl, setTunnelUrl] = useState<string | null>(null);
    const [tunnelSubdomain, setTunnelSubdomain] = useState('');
    const [copiedTunnel, setCopiedTunnel] = useState(false);

    // Theme state
    const [theme, setTheme] = useState<'light' | 'dark' | 'midnight'>(() => {
        return (localStorage.getItem('portal-theme') as 'light' | 'dark' | 'midnight') || 'midnight';
    });

    useEffect(() => {
        const handleThemeChange = () => {
            const currentTheme = (localStorage.getItem('portal-theme') as 'light' | 'dark' | 'midnight') || 'midnight';
            setTheme(currentTheme);
        };
        window.addEventListener('theme-changed', handleThemeChange);
        return () => window.removeEventListener('theme-changed', handleThemeChange);
    }, []);

    // Poll tunnel status periodically to stay in sync with backend
    useEffect(() => {
        const checkTunnel = async () => {
            try {
                const res = await fetch('http://localhost:3001/api/tunnel/status');
                if (res.ok) {
                    const data = await res.json();
                    setTunnelStatus(data.status);
                    setTunnelUrl(data.url);
                }
            } catch (_) {
                // backend offline — reset to idle
                setTunnelStatus('idle');
                setTunnelUrl(null);
            }
        };
        checkTunnel(); // immediate on mount
        const interval = setInterval(checkTunnel, 4000); // then every 4s
        return () => clearInterval(interval);
    }, []);

    // Load endpoints on mount
    const fetchEndpoints = async () => {
        try {
            const res = await fetch('http://localhost:3001/api/mock/endpoints');
            if (res.ok) {
                const data = await res.json();
                setEndpointsList(data);
            }
        } catch (err) {
            console.error('Error fetching mock endpoints:', err);
        }
    };

    useEffect(() => {
        fetchEndpoints();
    }, []);

    // SSE event listener
    useEffect(() => {
        if (!activeEndpoint) {
            setSseConnected(false);
            return;
        }

        const eventSource = new EventSource(`http://localhost:3001/api/mock/endpoints/${activeEndpoint.id}/events`);
        setSseConnected(true);

        eventSource.onmessage = (event) => {
            try {
                const newReq: InterceptedRequest = JSON.parse(event.data);
                setRequests(prev => [newReq, ...prev]);
            } catch (e) {
                console.error('Error parsing incoming request event:', e);
            }
        };

        eventSource.onerror = (e) => {
            console.error('SSE Error:', e);
            setSseConnected(false);
        };

        return () => {
            eventSource.close();
            setSseConnected(false);
        };
    }, [activeEndpoint]);

    // Handle endpoint creation & selection
    const handleSelectEndpoint = async (slug: string) => {
        const cleaned = slug.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
        if (!cleaned) return;

        try {
            const res = await fetch('http://localhost:3001/api/mock/endpoints', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: cleaned })
            });

            if (res.ok) {
                const data = await res.json();
                setActiveEndpoint(data);
                setRequests(data.requests || []);
                setRules(data.rules || []);
                setSelectedRequest(null);
                setEndpointInput('');
                setIsEditingRule(false);
                fetchEndpoints();
            }
        } catch (err) {
            console.error('Error selecting mock endpoint:', err);
        }
    };

    const handleDeleteEndpoint = async (e: React.MouseEvent, slug: string) => {
        e.stopPropagation();
        if (!confirm(`Remover o endpoint /hooks/${slug}? Todas as regras associadas serão perdidas.`)) {
            return;
        }
        try {
            const res = await fetch(`http://localhost:3001/api/mock/endpoints/${slug}`, {
                method: 'DELETE'
            });
            if (res.ok) {
                fetchEndpoints();
                if (activeEndpoint?.id === slug) {
                    setActiveEndpoint(null);
                    setRequests([]);
                    setSelectedRequest(null);
                    setRules([]);
                }
            }
        } catch (err) {
            console.error('Error deleting mock endpoint:', err);
        }
    };

    // Header manipulation helpers
    const handleAddHeaderRow = () => {
        setRuleHeaders(prev => [...prev, { key: '', value: '' }]);
    };
    const handleUpdateHeaderRow = (index: number, field: 'key' | 'value', value: string) => {
        setRuleHeaders(prev => {
            const next = [...prev];
            next[index] = { ...next[index], [field]: value };
            return next;
        });
    };
    const handleRemoveHeaderRow = (index: number) => {
        setRuleHeaders(prev => prev.filter((_, i) => i !== index));
    };

    // Conditions manipulation helpers
    const handleAddCondition = () => {
        setMatchConditions(prev => [...prev, { type: 'header', key: '', operator: 'equals', value: '' }]);
    };
    const handleUpdateCondition = (index: number, field: keyof RuleMatchCondition, value: string) => {
        setMatchConditions(prev => {
            const next = [...prev];
            next[index] = { ...next[index], [field]: value } as RuleMatchCondition;
            return next;
        });
    };
    const handleRemoveCondition = (index: number) => {
        setMatchConditions(prev => prev.filter((_, i) => i !== index));
    };
    // Preset & Format helpers
    const handleApplyPreset = (presetKey: string) => {
        if (!presetKey) return;
        if (presetKey === 'piperun') {
            setRuleStatus(200);
            setRuleHeaders([{ key: 'Content-Type', value: 'application/json' }]);
            setRuleBody(JSON.stringify({
                success: true,
                message: "Webhook PipeRun recebido e processado com sucesso",
                data: { status: "processed", received_at: new Date().toISOString() }
            }, null, 2));
        } else if (presetKey === 'omie') {
            setRuleStatus(200);
            setRuleHeaders([{ key: 'Content-Type', value: 'application/json' }]);
            setRuleBody(JSON.stringify({
                codigo_status: "0",
                descricao_status: "Lote processado com sucesso",
                data: { protocolo: "OMIE-" + Math.floor(100000 + Math.random() * 900000) }
            }, null, 2));
        } else if (presetKey === 'json_ok') {
            setRuleStatus(200);
            setRuleHeaders([{ key: 'Content-Type', value: 'application/json' }]);
            setRuleBody(JSON.stringify({
                status: 200,
                message: "Operação realizada com sucesso",
                data: { id: 101, active: true }
            }, null, 2));
        } else if (presetKey === 'bad_request') {
            setRuleStatus(400);
            setRuleHeaders([{ key: 'Content-Type', value: 'application/json' }]);
            setRuleBody(JSON.stringify({
                error: "Bad Request",
                message: "Parâmetros obrigatórios ausentes: email, name",
                statusCode: 400
            }, null, 2));
        } else if (presetKey === 'unauthorized') {
            setRuleStatus(401);
            setRuleHeaders([{ key: 'Content-Type', value: 'application/json' }]);
            setRuleBody(JSON.stringify({
                error: "Unauthorized",
                message: "Token de autenticação inválido ou expirado",
                statusCode: 401
            }, null, 2));
        } else if (presetKey === 'server_error') {
            setRuleStatus(500);
            setRuleHeaders([{ key: 'Content-Type', value: 'application/json' }]);
            setRuleBody(JSON.stringify({
                error: "Internal Server Error",
                message: "Falha na conexão com serviço interno de destino",
                statusCode: 500
            }, null, 2));
        }
    };

    const handleFormatJson = () => {
        try {
            const parsed = JSON.parse(ruleBody);
            setRuleBody(JSON.stringify(parsed, null, 2));
        } catch (_) {
            alert('O corpo da resposta não contém um JSON válido para formatar.');
        }
    };

    // Form rule editing triggers
    const handleOpenCreateRule = () => {
        setEditingRuleId(null);
        setRulePath('/');
        setRuleMethod('ALL');
        setRuleStatus(200);
        setRuleBody('{\n  "message": "Mock Response Success"\n}');
        setRuleHeaders([{ key: 'Content-Type', value: 'application/json' }]);
        setRuleDelay(0);
        setCorsEnabled(true);
        setNetworkFailure(null);
        setMatchConditions([]);
        setIsEditingRule(true);
    };

    const handleEditRule = (rule: MockRule) => {
        setEditingRuleId(rule.id);
        setRulePath(rule.pathPattern);
        setRuleMethod(rule.method);
        setRuleStatus(rule.responseStatus);
        setRuleBody(rule.responseBody);
        
        const headersArr = Object.entries(rule.responseHeaders).map(([k, v]) => ({
            key: k,
            value: String(v)
        }));
        setRuleHeaders(headersArr.length > 0 ? headersArr : [{ key: 'Content-Type', value: 'application/json' }]);
        
        setRuleDelay(rule.responseDelay || 0);
        setCorsEnabled(rule.corsEnabled !== false);
        setNetworkFailure(rule.networkFailure || null);
        setMatchConditions(rule.matchConditions || []);
        setIsEditingRule(true);
    };

    const handleCreateRuleFromLog = () => {
        if (!selectedRequest) return;
        setEditingRuleId(null);
        setRulePath(selectedRequest.path);
        setRuleMethod(selectedRequest.method);
        setRuleStatus(200);
        
        const bodyStr = selectedRequest.body && Object.keys(selectedRequest.body).length > 0
            ? JSON.stringify(selectedRequest.body, null, 2)
            : JSON.stringify({ message: "Mock Response Success", source: "log_cloned" }, null, 2);
        setRuleBody(bodyStr);
        
        const clonedHeaders = Object.entries(selectedRequest.headers)
            .filter(([k]) => !['host', 'connection', 'content-length', 'user-agent', 'accept', 'accept-encoding', 'origin', 'referer'].includes(k.toLowerCase()))
            .map(([k, v]) => ({ key: k, value: String(v) }));
        setRuleHeaders(clonedHeaders.length > 0 ? clonedHeaders : [{ key: 'Content-Type', value: 'application/json' }]);
        
        setRuleDelay(0);
        setCorsEnabled(true);
        setNetworkFailure(null);
        setMatchConditions([]);
        setIsEditingRule(true);
        setActiveTab('rules');
    };

    // AI copilot generator
    const handleGenerateWithAi = async (promptText?: string) => {
        const query = promptText || aiPrompt;
        if (!query.trim()) return;
        setAiLoading(true);
        setAiError(null);
        setAiPreviewRule(null);
        try {
            const res = await fetch('http://localhost:3001/api/ai/process', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'GENERATE_MOCK_RULE',
                    prompt: query
                })
            });
            if (!res.ok) throw new Error('Falha ao processar resposta com IA');
            const data = await res.json();
            
            let parsedRule;
            try {
                parsedRule = JSON.parse(data.text);
            } catch(e) {
                const cleaned = data.text.replace(/```json/g, '').replace(/```/g, '').trim();
                parsedRule = JSON.parse(cleaned);
            }

            setAiPreviewRule(parsedRule);
            if (!promptText) setAiPrompt('');
        } catch (err: any) {
            setAiError(err.message || 'Erro ao gerar regra inteligente');
        } finally {
            setAiLoading(false);
        }
    };

    const handleApplyAiPreview = () => {
        if (!aiPreviewRule) return;
        
        setRulePath(aiPreviewRule.pathPattern || '/');
        setRuleMethod(aiPreviewRule.method || 'GET');
        setRuleStatus(aiPreviewRule.responseStatus || 200);
        
        const bodyText = typeof aiPreviewRule.responseBody === 'object'
            ? JSON.stringify(aiPreviewRule.responseBody, null, 2)
            : String(aiPreviewRule.responseBody || '');
        setRuleBody(bodyText);

        if (aiPreviewRule.responseHeaders) {
            const headersList = Object.entries(aiPreviewRule.responseHeaders).map(([k, v]) => ({
                key: k,
                value: String(v)
            }));
            setRuleHeaders(headersList.length > 0 ? headersList : [{ key: 'Content-Type', value: 'application/json' }]);
        }
        
        setRuleDelay(aiPreviewRule.responseDelay || 0);
        setCorsEnabled(aiPreviewRule.corsEnabled !== false);
        setNetworkFailure(aiPreviewRule.networkFailure || null);
        setMatchConditions(aiPreviewRule.matchConditions || []);
        
        setAiPreviewRule(null);
        setIsEditingRule(true);
        setActiveTab('rules');
    };

    // Save and Delete rules
    const handleSaveRule = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!activeEndpoint) return;

        try {
            const headersObj: Record<string, string> = {};
            ruleHeaders.forEach(h => {
                if (h.key.trim()) {
                    headersObj[h.key.trim()] = h.value;
                }
            });

            if (editingRuleId) {
                await fetch(`http://localhost:3001/api/mock/endpoints/${activeEndpoint.id}/rules/${editingRuleId}`, {
                    method: 'DELETE'
                });
            }

            const res = await fetch(`http://localhost:3001/api/mock/endpoints/${activeEndpoint.id}/rules`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    pathPattern: rulePath,
                    method: ruleMethod,
                    responseStatus: ruleStatus,
                    responseHeaders: headersObj,
                    responseBody: ruleBody,
                    responseDelay: ruleDelay,
                    matchConditions,
                    corsEnabled,
                    networkFailure: networkFailure || undefined
                })
            });

            if (res.ok) {
                const newRule = await res.json();
                if (editingRuleId) {
                    setRules(prev => prev.map(r => r.id === editingRuleId ? newRule : r));
                } else {
                    setRules(prev => [...prev, newRule]);
                }
                
                setIsEditingRule(false);
                setEditingRuleId(null);
                setMatchConditions([]);
            }
        } catch (err) {
            console.error('Error saving mock rule:', err);
        }
    };

    const handleDeleteRule = async (ruleId: string) => {
        if (!activeEndpoint) return;
        if (!confirm('Deseja excluir esta regra de resposta?')) return;
        try {
            const res = await fetch(`http://localhost:3001/api/mock/endpoints/${activeEndpoint.id}/rules/${ruleId}`, {
                method: 'DELETE'
            });
            if (res.ok) {
                setRules(prev => prev.filter(r => r.id !== ruleId));
            }
        } catch (err) {
            console.error(err);
        }
    };

    // Replay Intercepted Request
    const handleReplayRequest = async () => {
        if (!selectedRequest || !activeEndpoint) return;
        setReplayStatus('loading');
        setReplayLog(null);

        try {
            const qParams = new URLSearchParams(selectedRequest.query).toString();
            const hookUrl = `http://localhost:3001/hooks/${activeEndpoint.id}${selectedRequest.path}${qParams ? '?' + qParams : ''}`;

            const headers = new Headers();
            Object.entries(selectedRequest.headers).forEach(([k, v]) => {
                const kl = k.toLowerCase();
                if (!['host', 'connection', 'content-length', 'sec-', 'user-agent', 'accept-encoding', 'cookie', 'origin', 'referer'].some(prefix => kl.startsWith(prefix))) {
                    headers.append(k, v);
                }
            });

            const options: RequestInit = {
                method: selectedRequest.method,
                headers,
            };

            if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(selectedRequest.method.toUpperCase()) && selectedRequest.body) {
                options.body = typeof selectedRequest.body === 'object' 
                    ? JSON.stringify(selectedRequest.body) 
                    : selectedRequest.body;
            }

            const res = await fetch(hookUrl, options);
            const text = await res.text();
            
            let prettyBody = text;
            try {
                prettyBody = JSON.stringify(JSON.parse(text), null, 2);
            } catch(e) {}

            setReplayLog(`HTTP/1.1 ${res.status} ${res.statusText}\n` + 
                         Array.from(res.headers.entries()).map(([k,v]) => `${k}: ${v}`).join('\n') + 
                         `\n\n${prettyBody}`);

            setReplayStatus('success');
        } catch (err: any) {
            console.error('Replay error:', err);
            setReplayLog(`Replay Falhou: ${err.message}`);
            setReplayStatus('error');
        }
    };

    // Clear logs
    const handleClearLogs = async () => {
        if (!activeEndpoint) return;
        try {
            const res = await fetch(`http://localhost:3001/api/mock/endpoints/${activeEndpoint.id}/requests`, {
                method: 'DELETE'
            });
            if (res.ok) {
                setRequests([]);
                setSelectedRequest(null);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopiedUrl(true);
        setTimeout(() => setCopiedUrl(false), 2000);
    };

    const copyTunnel = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopiedTunnel(true);
        setTimeout(() => setCopiedTunnel(false), 2000);
    };

    const handleStartTunnel = async () => {
        setTunnelStatus('connecting');
        setTunnelUrl(null);
        try {
            const ctrl = new AbortController();
            const timer = setTimeout(() => ctrl.abort(), 25000); // cloudflared can take ~10s
            const res = await fetch('http://localhost:3001/api/tunnel/start', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({}),
                signal: ctrl.signal,
            });
            clearTimeout(timer);
            const data = await res.json();
            setTunnelStatus(data.status);
            setTunnelUrl(data.url || null);
        } catch (err: any) {
            if (err.name === 'AbortError') {
                setTunnelStatus('error');
            } else {
                setTunnelStatus('error');
            }
        }
    };

    const handleStopTunnel = async () => {
        try {
            await fetch('http://localhost:3001/api/tunnel/stop', { method: 'POST' });
        } catch (_) {}
        setTunnelStatus('idle');
        setTunnelUrl(null);
    };

    const mockUrl = activeEndpoint ? `http://localhost:3001/hooks/${activeEndpoint.id}` : '';
    const publicMockUrl = activeEndpoint && tunnelUrl ? `${tunnelUrl}/hooks/${activeEndpoint.id}` : null;

    const filteredRequests = requests.filter(req => {
        if (!filterPath) return true;
        return req.path.toLowerCase().includes(filterPath.toLowerCase()) || 
               req.method.toLowerCase().includes(filterPath.toLowerCase());
    });

    const filteredEndpoints = endpointsList.filter(ep => {
        if (!endpointSearch) return true;
        return ep.id.toLowerCase().includes(endpointSearch.toLowerCase());
    });

    const mainTabs = [
        { id: 'logs', label: `Logs (${requests.length})` },
        { id: 'rules', label: `Regras (${rules.length})` },
        { id: 'docs', label: 'Ajuda & Docs' }
    ];

    return (
        <div className="ds-container flex flex-col h-full overflow-hidden flex-1">
            <PageHeader
                title="Mock Interceptor"
                description="Crie URLs instantâneas locais, intercepte logs de chamadas externas e monte cenários avançados de APIs."
                icon={Radio}
                badge={sseConnected ? "Conectado SSE" : "Desconectado"}
            />

            {/* ── Tunnel Panel ─────────────────────────────────────────────── */}
            <Card
                variant={tunnelStatus === 'open' ? 'glass' : 'outline'}
                padding="md"
                className={`flex-shrink-0 transition-all ${
                    tunnelStatus === 'open'
                        ? 'border-emerald-500/30 bg-emerald-500/5'
                        : tunnelStatus === 'error'
                        ? 'border-rose-500/30 bg-rose-500/5'
                        : ''
                }`}
            >
                <div className="flex flex-wrap items-center gap-4">
                    {/* Icon + Label */}
                    <div className="flex items-center gap-3 flex-shrink-0">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                            tunnelStatus === 'open' ? 'bg-emerald-500/15' : 'bg-zinc-800/60 dark:bg-zinc-800/40'
                        }`}>
                            <Globe size={16} className={tunnelStatus === 'open' ? 'text-emerald-400' : 'text-zinc-400'} />
                        </div>
                        <div>
                            <p className="text-xs font-black text-primary">Túnel Público (Cloudflare)</p>
                            <p className="text-[10px] text-muted">Redireciona chamadas externas da internet para seus endpoints locais com slug (/hooks/slug)</p>
                        </div>
                    </div>

                    {/* Tunnel URL display or start button */}
                    {tunnelStatus === 'open' && tunnelUrl ? (
                        <div className="flex-1 flex items-center gap-2 min-w-0">
                            <div className="flex-1 flex items-center gap-2 bg-zinc-900/60 border border-emerald-500/20 px-3 py-2 rounded-xl min-w-0">
                                <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_6px_#10B981] flex-shrink-0 animate-pulse" />
                                <span className="font-mono text-xs text-emerald-300 truncate font-bold">
                                    {publicMockUrl || `${tunnelUrl}/hooks/${activeEndpoint?.id || ''}`}
                                </span>
                                <span className="text-[9px] font-bold text-orange-400 bg-orange-400/10 border border-orange-400/20 px-1.5 py-0.5 rounded-md flex-shrink-0">Cloudflare</span>
                            </div>
                            <Button
                                onClick={() => copyTunnel(publicMockUrl || `${tunnelUrl}/hooks/${activeEndpoint?.id || ''}`)}
                                variant="ghost"
                                size="sm"
                                icon={copiedTunnel ? Check : Copy}
                                title="Copiar URL Pública do Webhook"
                            />
                            <Button onClick={handleStopTunnel} variant="danger" size="sm" icon={WifiOff}>
                                Encerrar
                            </Button>
                        </div>
                    ) : (
                        <div className="flex-1 flex items-center gap-3 min-w-0">
                            <div className="flex items-center gap-2 flex-1 min-w-0 bg-zinc-900/30 border border-zinc-800/60 rounded-xl px-3 py-2">
                                <Globe size={12} className="text-orange-400 flex-shrink-0" />
                                <span className="text-xs text-zinc-500 font-mono truncate">
                                    {tunnelStatus === 'connecting'
                                        ? 'Gerando URL pública com a Cloudflare...'
                                        : 'https://xxxx.trycloudflare.com/hooks/slug (gerado ao abrir túnel)'}
                                </span>
                            </div>
                            <Button
                                onClick={handleStartTunnel}
                                disabled={tunnelStatus === 'connecting'}
                                variant="primary"
                                size="sm"
                                icon={tunnelStatus === 'connecting' ? RefreshCw : Globe}
                                className={tunnelStatus === 'connecting' ? 'animate-pulse' : ''}
                            >
                                {tunnelStatus === 'connecting' ? 'Conectando...' : 'Abrir Túnel'}
                            </Button>
                        </div>
                    )}

                    {tunnelStatus === 'error' && (
                        <span className="text-[10px] text-rose-400 font-semibold">Falha ao abrir túnel. Verifique a conexão.</span>
                    )}

                    {tunnelStatus === 'open' && publicMockUrl && (
                        <div className="w-full flex items-center gap-2 mt-1 pt-3 border-t border-emerald-500/10">
                            <span className="text-[10px] text-muted font-medium">URL Pública Ativa do Endpoint:</span>
                            <span className="font-mono text-[11px] text-emerald-300 font-bold truncate">{publicMockUrl}</span>
                            <button onClick={() => copyTunnel(publicMockUrl)} className="text-zinc-500 hover:text-emerald-400 transition-colors flex-shrink-0" title="Copiar URL">
                                {copiedTunnel ? <Check size={12} /> : <Copy size={12} />}
                            </button>
                        </div>
                    )}
                </div>
            </Card>

            <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 overflow-hidden min-h-0">
                {/* Endpoints Sidebar Card */}
                <Card variant="glass" padding="none" className="lg:col-span-3 flex flex-col overflow-hidden h-full">
                    <div className="p-4 border-b border-base/80 bg-base/20 flex flex-col gap-3">
                        <span className="text-[10px] font-black uppercase text-muted tracking-wider">Endpoints Mapeados</span>
                        <div className="flex gap-2">
                            <Input
                                value={endpointInput}
                                onChange={(e) => setEndpointInput(e.target.value)}
                                placeholder="Criar slug (ex: api-teste)..."
                                className="font-mono text-xs"
                                onKeyDown={(e) => e.key === 'Enter' && handleSelectEndpoint(endpointInput)}
                            />
                            <Button
                                onClick={() => handleSelectEndpoint(endpointInput || Math.random().toString(36).substring(2, 9))}
                                variant="primary"
                                size="sm"
                                icon={Plus}
                            />
                        </div>
                        <Input
                            value={endpointSearch}
                            onChange={(e) => setEndpointSearch(e.target.value)}
                            placeholder="Filtrar endpoints..."
                            className="text-xs"
                        />
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-1.5">
                        {filteredEndpoints.length === 0 ? (
                            <div className="py-8 text-center text-xs text-muted font-medium">
                                Nenhum endpoint encontrado.
                            </div>
                        ) : (
                            filteredEndpoints.map((ep) => {
                                const isSelected = activeEndpoint?.id === ep.id;
                                return (
                                    <div
                                        key={ep.id}
                                        onClick={() => handleSelectEndpoint(ep.id)}
                                        className={`flex items-center justify-between p-3 rounded-2xl border cursor-pointer transition-all ${
                                            isSelected
                                                ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-500 font-bold'
                                                : 'bg-base/20 hover:bg-base/40 border-base/80 text-primary'
                                        }`}
                                    >
                                        <div className="truncate flex-1 min-w-0 pr-2">
                                            <span className="text-xs font-mono font-bold block truncate">/hooks/{ep.id}</span>
                                            <span className="text-[10px] text-muted font-medium flex gap-2 mt-0.5">
                                                <span>{ep.requests?.length || 0} reqs</span>
                                                <span>•</span>
                                                <span>{ep.rules?.length || 0} regras</span>
                                            </span>
                                        </div>
                                        <Button
                                            onClick={(e: any) => handleDeleteEndpoint(e, ep.id)}
                                            variant="ghost"
                                            size="sm"
                                            icon={Trash2}
                                            className="text-muted hover:text-red-500 opacity-80"
                                        />
                                    </div>
                                );
                            })
                        )}
                    </div>
                </Card>

                {/* Dashboard / Workspace Area */}
                <div className="lg:col-span-9 flex flex-col overflow-hidden h-full gap-6">
                    {!activeEndpoint ? (
                        <Card variant="glass" className="flex-1 flex flex-col items-center justify-center text-center p-8">
                            <Radio size={48} className="text-indigo-500 mb-4 animate-pulse opacity-80" />
                            <h2 className="text-xl font-black text-primary mb-2">Painel de Mocks & Webhooks</h2>
                            <p className="text-xs text-muted max-w-md mb-6 leading-relaxed">
                                Selecione um endpoint na barra lateral ou crie um novo slug para gerenciar regras, visualizar logs em tempo real e inspecionar payloads HTTP.
                            </p>
                        </Card>
                    ) : (
                        <Card variant="glass" padding="none" className="flex-1 flex flex-col overflow-hidden h-full">
                            {/* Toolbar Header */}
                            <div className="p-4 border-b border-base/80 bg-base/20 flex flex-wrap items-center justify-between gap-4">
                                <div className="flex flex-wrap items-center gap-3">
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-black uppercase text-muted tracking-wider">URL Local:</span>
                                        <span className="font-mono text-xs text-indigo-500 font-bold bg-base/40 px-3 py-1 rounded-xl border border-base/80">
                                            {mockUrl}
                                        </span>
                                        <Button
                                            onClick={() => copyToClipboard(mockUrl)}
                                            variant="ghost"
                                            size="sm"
                                            icon={copiedUrl ? Check : Copy}
                                            title="Copiar URL Local"
                                        />
                                    </div>

                                    {publicMockUrl && (
                                        <div className="flex items-center gap-2 border-l border-base/80 pl-3">
                                            <span className="text-[10px] font-black uppercase text-emerald-400 tracking-wider">URL Pública (Cloudflare):</span>
                                            <span className="font-mono text-xs text-emerald-400 font-bold bg-emerald-500/10 px-3 py-1 rounded-xl border border-emerald-500/20">
                                                {publicMockUrl}
                                            </span>
                                            <Button
                                                onClick={() => copyTunnel(publicMockUrl)}
                                                variant="ghost"
                                                size="sm"
                                                icon={copiedTunnel ? Check : Copy}
                                                title="Copiar URL Pública do Webhook"
                                            />
                                        </div>
                                    )}
                                </div>

                                <div className="flex items-center gap-3">
                                    {activeTab === 'logs' && (
                                        <Button onClick={handleClearLogs} variant="danger" size="sm" icon={Trash2}>
                                            Limpar Logs
                                        </Button>
                                    )}
                                    <Tabs
                                        tabs={mainTabs}
                                        activeTab={activeTab}
                                        onChange={(id) => { setActiveTab(id as any); setIsEditingRule(false); }}
                                    />
                                </div>
                            </div>

                            {/* Main Content Area */}
                            <div className="flex-1 overflow-hidden flex flex-col p-6 min-h-0">
                                {activeTab === 'logs' && (
                                    <div className="flex gap-4 h-full min-h-0" style={{ minHeight: '400px' }}>
                                        {/* ── Request List ───────────────────────────── */}
                                        <div className={`flex flex-col gap-3 ${selectedRequest ? 'w-80 flex-shrink-0' : 'flex-1'} transition-all duration-300`}>
                                            <Input
                                                value={filterPath}
                                                onChange={(e) => setFilterPath(e.target.value)}
                                                placeholder="Filtrar por caminho ou método..."
                                                className="text-xs flex-shrink-0"
                                            />
                                            <div className="flex-1 overflow-y-auto space-y-1.5 custom-scrollbar">
                                                {filteredRequests.length === 0 ? (
                                                    <div className="py-12 text-center text-xs text-muted font-medium">
                                                        Nenhuma requisição interceptada até o momento.
                                                    </div>
                                                ) : (
                                                    filteredRequests.map((req) => (
                                                        <div
                                                            key={req.id}
                                                            onClick={() => setSelectedRequest(req)}
                                                            className={`p-3 rounded-2xl border cursor-pointer transition-all ${
                                                                selectedRequest?.id === req.id
                                                                    ? 'bg-indigo-500/10 border-indigo-500/40 shadow-sm shadow-indigo-500/10'
                                                                    : 'bg-base/20 hover:bg-base/40 border-base/80 hover:border-indigo-500/20'
                                                            }`}
                                                        >
                                                            <div className="flex items-center justify-between gap-2">
                                                                <div className="flex items-center gap-2 min-w-0">
                                                                    <Badge variant={
                                                                        req.method === 'GET' ? 'success' :
                                                                        req.method === 'POST' ? 'info' :
                                                                        req.method === 'DELETE' ? 'danger' :
                                                                        req.method === 'PUT' ? 'warning' : 'default'
                                                                    } size="sm">
                                                                        {req.method}
                                                                    </Badge>
                                                                    <span className="font-mono text-xs font-bold text-primary truncate">{req.path}</span>
                                                                </div>
                                                                <span className="text-[10px] text-muted font-mono flex-shrink-0">
                                                                    {new Date(req.timestamp).toLocaleTimeString()}
                                                                </span>
                                                            </div>
                                                            {req.matchedRuleId && (
                                                                <div className="mt-1.5 flex items-center gap-1.5">
                                                                    <span className="text-[10px] text-emerald-400 font-semibold">✓ Regra aplicada</span>
                                                                    {req.responseStatus && (
                                                                        <Badge variant="success" size="sm">HTTP {req.responseStatus}</Badge>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        </div>

                                        {/* ── Detail Inspector ────────────────────────── */}
                                        {selectedRequest && (
                                            <div className="flex-1 min-w-0 flex flex-col border border-indigo-500/20 rounded-2xl overflow-hidden bg-zinc-900/40 backdrop-blur">
                                                {/* Inspector Header */}
                                                <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800/80 bg-zinc-900/60 flex-shrink-0">
                                                    <div className="flex items-center gap-3 min-w-0">
                                                        <Badge variant={
                                                            selectedRequest.method === 'GET' ? 'success' :
                                                            selectedRequest.method === 'POST' ? 'info' :
                                                            selectedRequest.method === 'DELETE' ? 'danger' :
                                                            selectedRequest.method === 'PUT' ? 'warning' : 'default'
                                                        }>
                                                            {selectedRequest.method}
                                                        </Badge>
                                                        <span className="font-mono text-xs font-bold text-primary truncate">{selectedRequest.path}</span>
                                                        <span className="text-[10px] text-muted font-mono flex-shrink-0">
                                                            {new Date(selectedRequest.timestamp).toLocaleString()}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Button
                                                            onClick={handleCreateRuleFromLog}
                                                            variant="secondary"
                                                            size="sm"
                                                            icon={Sparkles}
                                                            className="text-xs"
                                                        >
                                                            Criar Regra deste Log
                                                        </Button>
                                                        <button
                                                            onClick={() => setSelectedRequest(null)}
                                                            className="p-1.5 rounded-lg text-zinc-500 hover:text-white hover:bg-zinc-800 transition-all flex-shrink-0"
                                                        >
                                                            <X size={14} />
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Inspector Body */}
                                                <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">

                                                    {/* Body */}
                                                    {selectedRequest.body && Object.keys(selectedRequest.body).length > 0 ? (
                                                        <section>
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Body</span>
                                                                <button
                                                                    onClick={() => navigator.clipboard.writeText(JSON.stringify(selectedRequest.body, null, 2))}
                                                                    className="text-zinc-600 hover:text-zinc-300 transition-colors"
                                                                    title="Copiar body"
                                                                >
                                                                    <Copy size={11} />
                                                                </button>
                                                            </div>
                                                            <pre className="bg-zinc-950/80 border border-zinc-800/80 rounded-xl p-4 text-xs font-mono text-emerald-300 overflow-auto max-h-64 leading-relaxed custom-scrollbar whitespace-pre-wrap break-all">
                                                                {JSON.stringify(selectedRequest.body, null, 2)}
                                                            </pre>
                                                        </section>
                                                    ) : (
                                                        <section>
                                                            <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest block mb-2">Body</span>
                                                            <p className="text-xs text-muted italic">Sem corpo na requisição.</p>
                                                        </section>
                                                    )}

                                                    {/* Query Params */}
                                                    {selectedRequest.query && Object.keys(selectedRequest.query).length > 0 && (
                                                        <section>
                                                            <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest block mb-2">Query Params</span>
                                                            <div className="space-y-1">
                                                                {Object.entries(selectedRequest.query).map(([k, v]) => (
                                                                    <div key={k} className="flex items-center gap-2 bg-zinc-950/50 px-3 py-2 rounded-xl border border-zinc-800/60">
                                                                        <span className="font-mono text-[11px] font-bold text-amber-300 flex-shrink-0">{k}</span>
                                                                        <span className="text-zinc-500 flex-shrink-0">=</span>
                                                                        <span className="font-mono text-[11px] text-zinc-300 truncate">{String(v)}</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </section>
                                                    )}

                                                    {/* Headers */}
                                                    {selectedRequest.headers && Object.keys(selectedRequest.headers).length > 0 && (
                                                        <section>
                                                            <span className="text-[10px] font-black text-sky-400 uppercase tracking-widest block mb-2">Headers</span>
                                                            <div className="space-y-1">
                                                                {Object.entries(selectedRequest.headers)
                                                                    .filter(([k]) => !['host', 'connection', 'content-length'].includes(k.toLowerCase()))
                                                                    .map(([k, v]) => (
                                                                        <div key={k} className="flex items-start gap-2 bg-zinc-950/50 px-3 py-2 rounded-xl border border-zinc-800/60">
                                                                            <span className="font-mono text-[11px] font-bold text-sky-300 flex-shrink-0 min-w-[140px]">{k}</span>
                                                                            <span className="font-mono text-[11px] text-zinc-400 break-all">{String(v)}</span>
                                                                        </div>
                                                                    ))}
                                                            </div>
                                                        </section>
                                                    )}

                                                    {/* Response info if rule was applied */}
                                                    {selectedRequest.matchedRuleId && (
                                                        <section className="border-t border-zinc-800/60 pt-4">
                                                            <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest block mb-2">Resposta Mock Aplicada</span>
                                                            <div className="flex items-center gap-3">
                                                                {selectedRequest.responseStatus && (
                                                                    <Badge variant="success">HTTP {selectedRequest.responseStatus}</Badge>
                                                                )}
                                                                <span className="text-[11px] text-zinc-400">Rule ID: <code className="text-zinc-300 font-mono">{selectedRequest.matchedRuleId}</code></span>
                                                            </div>
                                                            {selectedRequest.responseBody && (
                                                                <pre className="mt-3 bg-zinc-950/80 border border-emerald-500/15 rounded-xl p-4 text-xs font-mono text-emerald-300 overflow-auto max-h-48 leading-relaxed custom-scrollbar whitespace-pre-wrap break-all">
                                                                    {selectedRequest.responseBody}
                                                                </pre>
                                                            )}
                                                        </section>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {activeTab === 'rules' && (
                                    <div className="flex flex-col gap-4 overflow-y-auto custom-scrollbar flex-1 min-h-0">
                                        <div className="flex justify-between items-center flex-shrink-0">
                                            <span className="text-[10px] font-black uppercase text-muted tracking-wider">Regras Configuradas</span>
                                            <Button onClick={handleOpenCreateRule} variant="primary" size="sm" icon={Plus}>
                                                Nova Regra
                                            </Button>
                                        </div>

                                        {rules.length === 0 ? (
                                            <div className="py-12 text-center text-xs text-muted font-medium">
                                                Nenhuma regra mock criada para este endpoint.
                                            </div>
                                        ) : (
                                            <div className="flex flex-col gap-3">
                                                {rules.map((rule) => (
                                                    <div key={rule.id} className="p-4 rounded-2xl border border-base/80 bg-base/20 flex justify-between items-center">
                                                        <div className="flex flex-col gap-1">
                                                            <div className="flex items-center gap-2">
                                                                <Badge variant="info">{rule.method}</Badge>
                                                                <span className="font-mono text-xs font-bold text-primary">{rule.pathPattern}</span>
                                                                <Badge variant="success">HTTP {rule.responseStatus}</Badge>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <Button onClick={() => handleEditRule(rule)} variant="ghost" size="sm" icon={Settings} />
                                                            <Button onClick={() => handleDeleteRule(rule.id)} variant="ghost" size="sm" icon={Trash2} className="text-red-500" />
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {activeTab === 'docs' && (
                                    <div className="flex flex-col gap-4 text-xs text-muted leading-relaxed">
                                        <h3 className="text-sm font-bold text-primary">Como funciona o Mock Interceptor</h3>
                                        <p>Envie requisições HTTP para a URL configurada do endpoint. O servidor armazenará o histórico e aplicará as regras ativas de mock automaticamente.</p>
                                    </div>
                                )}
                            </div>
                        </Card>
                    )}
                </div>
            </div>

            {/* Rule Editor Modal Overlay */}
            {isEditingRule && (
                <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
                    <div className="bg-zinc-900 border border-zinc-700/80 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col my-auto max-h-[90vh]">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-950/60">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                                    <Settings size={18} />
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-zinc-100">
                                        {editingRuleId ? 'Editar Regra Mock' : 'Nova Regra Mock'}
                                    </h3>
                                    <p className="text-[11px] text-zinc-400 font-mono">
                                        Endpoint: <span className="text-indigo-400">{activeEndpoint?.id}</span>
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsEditingRule(false)}
                                className="p-2 rounded-xl text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-all"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        {/* Preset Bar */}
                        <div className="px-6 py-3 bg-indigo-950/30 border-b border-indigo-500/10 flex items-center justify-between gap-3 flex-wrap">
                            <div className="flex items-center gap-2 text-xs font-semibold text-indigo-300">
                                <Sparkles size={14} className="text-indigo-400" />
                                <span>Modelos Prontos (Presets):</span>
                            </div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                                <button
                                    type="button"
                                    onClick={() => handleApplyPreset('piperun')}
                                    className="px-2.5 py-1 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/30 text-indigo-200 text-[11px] font-medium transition-all"
                                >
                                    PipeRun Webhook
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleApplyPreset('omie')}
                                    className="px-2.5 py-1 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/30 text-indigo-200 text-[11px] font-medium transition-all"
                                >
                                    Omie ERP
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleApplyPreset('json_ok')}
                                    className="px-2.5 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-[11px] font-medium transition-all"
                                >
                                    API 200 OK
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleApplyPreset('bad_request')}
                                    className="px-2.5 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 text-[11px] font-medium transition-all"
                                >
                                    400 Bad Request
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleApplyPreset('unauthorized')}
                                    className="px-2.5 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 text-[11px] font-medium transition-all"
                                >
                                    401 Auth Error
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleApplyPreset('server_error')}
                                    className="px-2.5 py-1 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 text-[11px] font-medium transition-all"
                                >
                                    500 Error
                                </button>
                            </div>
                        </div>

                        {/* Modal Body / Form */}
                        <form onSubmit={handleSaveRule} className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-5">
                            {/* Basic Config Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                                        Padrão do Caminho (Path Pattern)
                                    </label>
                                    <Input
                                        value={rulePath}
                                        onChange={(e) => setRulePath(e.target.value)}
                                        placeholder="/ ou /persons ou *"
                                        required
                                        className="font-mono text-xs"
                                    />
                                    <span className="text-[10px] text-zinc-500 mt-1 block">
                                        Use <code className="text-zinc-400 font-bold">/</code> para a raiz ou <code className="text-zinc-400 font-bold">*</code> para qualquer subcaminho
                                    </span>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                                        Método HTTP
                                    </label>
                                    <select
                                        value={ruleMethod}
                                        onChange={(e) => setRuleMethod(e.target.value)}
                                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-indigo-500 font-mono"
                                    >
                                        <option value="ALL">TODOS (ALL)</option>
                                        <option value="GET">GET</option>
                                        <option value="POST">POST</option>
                                        <option value="PUT">PUT</option>
                                        <option value="DELETE">DELETE</option>
                                        <option value="PATCH">PATCH</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                                        Status HTTP
                                    </label>
                                    <select
                                        value={ruleStatus}
                                        onChange={(e) => setRuleStatus(Number(e.target.value))}
                                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-indigo-500 font-mono"
                                    >
                                        <option value={200}>200 OK</option>
                                        <option value={201}>201 Created</option>
                                        <option value={204}>204 No Content</option>
                                        <option value={400}>400 Bad Request</option>
                                        <option value={401}>401 Unauthorized</option>
                                        <option value={403}>403 Forbidden</option>
                                        <option value={404}>404 Not Found</option>
                                        <option value={422}>422 Unprocessable Entity</option>
                                        <option value={500}>500 Internal Error</option>
                                        <option value={502}>502 Bad Gateway</option>
                                        <option value={503}>503 Service Unavailable</option>
                                    </select>
                                </div>
                            </div>

                            {/* Delay (ms) */}
                            <div>
                                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                                    Simular Latência / Delay da Resposta (ms)
                                </label>
                                <Input
                                    type="number"
                                    value={ruleDelay}
                                    onChange={(e) => setRuleDelay(Number(e.target.value))}
                                    placeholder="0"
                                    min={0}
                                    max={10000}
                                    className="font-mono text-xs w-36"
                                />
                            </div>

                            {/* Response Body Editor */}
                            <div>
                                <div className="flex items-center justify-between mb-1.5">
                                    <label className="block text-xs font-semibold text-zinc-300">
                                        Corpo da Resposta (Response Body JSON)
                                    </label>
                                    <button
                                        type="button"
                                        onClick={handleFormatJson}
                                        className="text-[11px] text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
                                    >
                                        Formatar JSON
                                    </button>
                                </div>
                                <textarea
                                    value={ruleBody}
                                    onChange={(e) => setRuleBody(e.target.value)}
                                    rows={8}
                                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs font-mono text-emerald-300 focus:outline-none focus:border-indigo-500 custom-scrollbar leading-relaxed"
                                    placeholder="{\n  &quot;message&quot;: &quot;Sucesso&quot;\n}"
                                />
                            </div>

                            {/* Headers Section */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="block text-xs font-semibold text-zinc-300">
                                        Headers da Resposta
                                    </label>
                                    <button
                                        type="button"
                                        onClick={handleAddHeaderRow}
                                        className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1"
                                    >
                                        <Plus size={13} /> Adicionar Header
                                    </button>
                                </div>
                                <div className="space-y-2">
                                    {ruleHeaders.map((header, idx) => (
                                        <div key={idx} className="flex items-center gap-2">
                                            <Input
                                                value={header.key}
                                                onChange={(e) => handleUpdateHeaderRow(idx, 'key', e.target.value)}
                                                placeholder="Key (ex: Content-Type)"
                                                className="font-mono text-xs flex-1"
                                            />
                                            <Input
                                                value={header.value}
                                                onChange={(e) => handleUpdateHeaderRow(idx, 'value', e.target.value)}
                                                placeholder="Value (ex: application/json)"
                                                className="font-mono text-xs flex-1"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveHeaderRow(idx)}
                                                className="p-2 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Match Conditions (Optional) */}
                            <div className="border-t border-zinc-800/80 pt-4">
                                <div className="flex items-center justify-between mb-2">
                                    <div>
                                        <label className="block text-xs font-semibold text-zinc-300">
                                            Condições de Match (Filtros Avançados - Opcional)
                                        </label>
                                        <p className="text-[11px] text-zinc-500">
                                            A regra só se aplica se os parâmetros abaixo baterem com a requisição.
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleAddCondition}
                                        className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1"
                                    >
                                        <Plus size={13} /> Adicionar Condição
                                    </button>
                                </div>
                                {matchConditions.length === 0 ? (
                                    <p className="text-xs text-zinc-600 italic">Nenhuma condição definida (a regra responderá a todas as chamadas do endpoint).</p>
                                ) : (
                                    <div className="space-y-2">
                                        {matchConditions.map((cond, idx) => (
                                            <div key={idx} className="flex items-center gap-2 bg-zinc-950/60 p-2.5 rounded-xl border border-zinc-800">
                                                <select
                                                    value={cond.type}
                                                    onChange={(e) => handleUpdateCondition(idx, 'type', e.target.value)}
                                                    className="bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-1.5 text-xs text-zinc-200 font-mono"
                                                >
                                                    <option value="header">Header</option>
                                                    <option value="query">Query Param</option>
                                                    <option value="body">Body JSON</option>
                                                </select>
                                                <Input
                                                    value={cond.key || ''}
                                                    onChange={(e) => handleUpdateCondition(idx, 'key', e.target.value)}
                                                    placeholder="Chave/Propriedade"
                                                    className="font-mono text-xs flex-1"
                                                />
                                                <select
                                                    value={cond.operator}
                                                    onChange={(e) => handleUpdateCondition(idx, 'operator', e.target.value)}
                                                    className="bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-1.5 text-xs text-zinc-200 font-mono"
                                                >
                                                    <option value="equals">Igual (==)</option>
                                                    <option value="contains">Contém</option>
                                                    <option value="exists">Existe</option>
                                                    <option value="regex">Regex</option>
                                                </select>
                                                <Input
                                                    value={cond.value}
                                                    onChange={(e) => handleUpdateCondition(idx, 'value', e.target.value)}
                                                    placeholder="Valor esperado"
                                                    className="font-mono text-xs flex-1"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveCondition(idx)}
                                                    className="p-2 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Modal Actions */}
                            <div className="flex items-center justify-end gap-3 border-t border-zinc-800 pt-4">
                                <Button
                                    type="button"
                                    onClick={() => setIsEditingRule(false)}
                                    variant="ghost"
                                    size="sm"
                                >
                                    Cancelar
                                </Button>
                                <Button
                                    type="submit"
                                    variant="primary"
                                    size="sm"
                                >
                                    {editingRuleId ? 'Salvar Alterações' : 'Criar Regra'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
