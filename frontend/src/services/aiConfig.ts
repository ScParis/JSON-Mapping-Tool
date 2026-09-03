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
    model: 'gemini-1.5-flash',
    baseUrl: ''
};

export function getAiConfig(): AiConfig {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
            const parsed = JSON.parse(raw);
            return { ...DEFAULT_AI_CONFIG, ...parsed };
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
        const model = config.model || 'gemini-1.5-flash';
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        
        const fullText = systemPrompt ? `${systemPrompt}\n\n${prompt}` : prompt;
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: fullText }] }]
            })
        });

        if (!res.ok) {
            const errJson = await res.json().catch(() => ({}));
            throw new Error(errJson.error?.message || `Erro Gemini API: ${res.statusText}`);
        }

        const data = await res.json();
        return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
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
