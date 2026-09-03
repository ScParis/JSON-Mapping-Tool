import { BACKEND_URL } from '../config';

export type AiProvider = 'openai' | 'gemini' | 'claude' | 'grok' | 'custom';

export interface AiConfig {
    provider: AiProvider;
    apiKey: string;
    model?: string;
    baseUrl?: string;
}

const STORAGE_KEY = 'devstudio_ai_config_v1';

export const DEFAULT_AI_CONFIG: AiConfig = {
    provider: 'gemini',
    apiKey: '',
    model: 'gemini-3.6-flash',
    baseUrl: ''
};

export function getAiConfig(): AiConfig {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
            const parsed = JSON.parse(raw);
            const config: AiConfig = { ...DEFAULT_AI_CONFIG, ...parsed };
            // Migração automática para modelos Gemini descontinuados ou restritos
            if (config.provider === 'gemini' && (!config.model || config.model.includes('gemini-1.5') || config.model.includes('gemini-2.5') || config.model === 'gemini-pro')) {
                config.model = 'gemini-3.6-flash';
            }
            return config;
        }
    } catch (e) {
        console.error('Erro ao ler aiConfig:', e);
    }
    return DEFAULT_AI_CONFIG;
}

export function saveAiConfig(config: AiConfig): void {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
        window.dispatchEvent(new CustomEvent('ai-config-changed', { detail: config }));
    } catch (e) {
        console.error('Erro ao salvar aiConfig:', e);
    }
}

export async function runAiRequest(prompt: string, options?: { systemPrompt?: string }): Promise<string> {
    const config = getAiConfig();
    const systemPrompt = options?.systemPrompt || '';

    // Provider API executions
    if (config.provider === 'gemini') {
        const apiKey = config.apiKey || import.meta.env.VITE_GEMINI_API_KEY || '';
        if (!apiKey) {
            return await tryBackendFallback(prompt);
        }

        let primaryModel = config.model || 'gemini-3.6-flash';
        if (primaryModel.includes('gemini-1.5') || primaryModel.includes('gemini-2.5') || primaryModel === 'gemini-pro') {
            primaryModel = 'gemini-3.6-flash';
        }

        // Fila de modelos com fallback para alta demanda (503) ou modelos indisponíveis
        const candidateModels = [
            primaryModel,
            primaryModel !== 'gemini-3.6-flash' ? 'gemini-3.6-flash' : 'gemini-3.5-flash-lite',
            'gemini-3.5-flash-lite'
        ].filter((m, i, arr) => arr.indexOf(m) === i);

        const fullText = systemPrompt ? `${systemPrompt}\n\n${prompt}` : prompt;
        let lastErrorMsg = '';

        for (const currentModel of candidateModels) {
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${currentModel}:generateContent?key=${apiKey}`;

            for (let attempt = 0; attempt < 2; attempt++) {
                try {
                    const res = await fetch(url, {
                        method: 'POST',
                        headers: { 
                            'Content-Type': 'application/json',
                            'x-goog-api-key': apiKey 
                        },
                        body: JSON.stringify({
                            contents: [{ parts: [{ text: fullText }] }]
                        })
                    });

                    if (res.ok) {
                        const data = await res.json();
                        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
                        if (text) return text;
                    }

                    const errJson = await res.json().catch(() => ({}));
                    lastErrorMsg = errJson.error?.message || `Erro Gemini API: ${res.status} ${res.statusText}`;

                    // Se o modelo estiver com alta demanda (503) ou rate limit (429)
                    if (res.status === 503 || res.status === 429) {
                        if (attempt === 0) {
                            await new Promise(r => setTimeout(r, 900));
                            continue;
                        }
                        // Na segunda tentativa de 503, passa para o próximo modelo do fallback
                        break;
                    }

                    // Se o modelo for descontinuado ou não encontrado (404)
                    if (res.status === 404 || lastErrorMsg.includes('not found') || lastErrorMsg.includes('no longer available')) {
                        break;
                    }

                    // Se for erro de autenticação ou chave inválida (400, 401, 403), propaga o erro imediatamente
                    if (res.status === 400 || res.status === 401 || res.status === 403) {
                        throw new Error(lastErrorMsg);
                    }
                } catch (fetchErr: any) {
                    if (fetchErr.message && !fetchErr.message.includes('fetch') && !fetchErr.message.includes('network') && !fetchErr.message.includes('Failed to fetch')) {
                        throw fetchErr;
                    }
                    lastErrorMsg = fetchErr.message || 'Falha de rede ao conectar à API do Google Gemini';
                }
            }
        }

        throw new Error(lastErrorMsg || 'Serviço temporariamente indisponível. Por favor, tente novamente em instantes.');
    }

    if (config.provider === 'openai' || config.provider === 'grok' || config.provider === 'custom') {
        const apiKey = config.apiKey;
        let endpoint = 'https://api.openai.com/v1/chat/completions';
        let defaultModel = 'gpt-4o-mini';

        if (config.provider === 'grok') {
            endpoint = 'https://api.x.ai/v1/chat/completions';
            defaultModel = 'grok-2-latest';
        } else if (config.provider === 'custom') {
            endpoint = (config.baseUrl?.replace(/\/$/, '') || 'http://localhost:11434/v1') + '/chat/completions';
            defaultModel = config.model || 'llama3';
        }

        if (!apiKey && config.provider !== 'custom') {
            return await tryBackendFallback(prompt);
        }

        const messages: any[] = [];
        if (systemPrompt) messages.push({ role: 'system', content: systemPrompt });
        messages.push({ role: 'user', content: prompt });

        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;

        const res = await fetch(endpoint, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                model: config.model || defaultModel,
                messages,
                temperature: 0.3
            })
        });

        if (!res.ok) {
            const errJson = await res.json().catch(() => ({}));
            throw new Error(errJson.error?.message || `Erro ${config.provider.toUpperCase()} API: ${res.statusText}`);
        }

        const data = await res.json();
        return data.choices?.[0]?.message?.content || '';
    }

    if (config.provider === 'claude') {
        const apiKey = config.apiKey;
        if (!apiKey) return await tryBackendFallback(prompt);

        const res = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01',
                'dangerously-allow-browser': 'true'
            },
            body: JSON.stringify({
                model: config.model || 'claude-3-5-sonnet-20241022',
                max_tokens: 2048,
                system: systemPrompt || undefined,
                messages: [{ role: 'user', content: prompt }]
            })
        });

        if (!res.ok) {
            const errJson = await res.json().catch(() => ({}));
            throw new Error(errJson.error?.message || `Erro Claude API: ${res.statusText}`);
        }

        const data = await res.json();
        return data.content?.[0]?.text || '';
    }

    return await tryBackendFallback(prompt);
}

async function tryBackendFallback(prompt: string): Promise<string> {
    try {
        const response = await fetch(`${BACKEND_URL}/api/ai/process`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: prompt, action: 'EXPLAIN' })
        });
        if (response.ok) {
            const data = await response.json();
            if (data.text) return data.text;
        }
    } catch (e) {
        // Backend fallback failed
    }
    throw new Error('Nenhuma chave de API configurada. Clique em "Configurar IA" para adicionar sua API Key (OpenAI, Gemini, Grok, Claude).');
}
