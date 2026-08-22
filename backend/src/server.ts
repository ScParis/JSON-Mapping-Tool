import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import crypto from 'crypto';
import path from 'path';
import { spawn, ChildProcess } from 'child_process';
import { validateUrlForSSRF, rateLimiter } from './security';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// ── Tunnel State ──────────────────────────────────────────────────────────────
let tunnelProcess: ChildProcess | null = null;
let tunnelUrl: string | null = null;
let tunnelStatus: 'idle' | 'connecting' | 'open' | 'error' = 'idle';
let tunnelError: string | null = null;
let tunnelProvider: 'cloudflared' | 'localtunnel' | null = null;

const CLOUDFLARED_BIN = path.join(__dirname, '..', 'bin', 'cloudflared');

const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
    : [];

app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Bloqueado por política CORS'));
        }
    }
}));
app.use(express.json());

// Proxy seguro para a API da ReceitaWS, evitando erros de CORS no frontend
// O ReceitaWS requer que as requisições venham do server side ou tenham um proxy.
app.get('/api/cnpj/:cnpj', async (req, res) => {
    try {
        const { cnpj } = req.params;
        const cleanCnpj = cnpj.replace(/\D/g, '');

        const response = await fetch(`https://receitaws.com.br/v1/cnpj/${cleanCnpj}`, {
            headers: { 'Accept': 'application/json' }
        });

        if (!response.ok) {
            return res.status(response.status).json({ error: `ReceitaWS error: ${response.statusText}` });
        }

        const data: any = await response.json();

        if (data.status === "ERROR") {
            return res.status(400).json({ error: data.message });
        }

        res.json(data);
    } catch (error: any) {
        console.error('Error fetching CNPJ:', error);
        res.status(500).json({ error: 'Failed to fetch CNPJ data', details: error.message });
    }
});

// Proxy genérico seguro para evitar bloqueio de CORS no cliente de API do frontend
app.post('/api/proxy', async (req, res) => {
    try {
        const { url, method, headers, body } = req.body;
        if (!url) {
            return res.status(400).json({ error: 'URL é obrigatória' });
        }

        // Validação de SSRF antes de realizar a requisição
        const isUrlSafe = await validateUrlForSSRF(url);
        if (!isUrlSafe) {
            return res.status(403).json({ error: 'Requisição bloqueada por política de segurança (SSRF). Acesso a endereços privados ou locais é proibido.' });
        }

        const fetchOptions: any = {
            method: method || 'GET',
            headers: headers || {},
        };

        if (body && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
            fetchOptions.body = typeof body === 'object' ? JSON.stringify(body) : body;
        }

        const response = await fetch(url, fetchOptions);
        const responseHeaders: any = {};
        response.headers.forEach((val, key) => {
            responseHeaders[key] = val;
        });

        let responseData;
        const contentType = response.headers.get('content-type') || '';
        try {
            if (contentType.includes('application/json')) {
                responseData = await response.json();
            } else {
                responseData = await response.text();
            }
        } catch (e) {
            responseData = await response.text();
        }

        res.status(response.status).json({
            status: response.status,
            statusText: response.statusText,
            headers: responseHeaders,
            data: responseData
        });
    } catch (error: any) {
        console.error('Proxy error:', error);
        res.status(500).json({ error: 'Erro no proxy de API', details: error.message });
    }
});

import { GoogleGenAI } from "@google/genai";

// Tipos para garantir consistência usando objeto ao invés de enum para evitar crash em strip-only do ts-node
export const AIAction = {
    REFINE: 'REFINE',
    SUMMARIZE: 'SUMMARIZE',
    FIX_GRAMMAR: 'FIX_GRAMMAR',
    EXTEND: 'EXTEND',
    FORMAT_JSON: 'FORMAT_JSON',
    CONVERT_HTML: 'CONVERT_HTML',
    FORMAT_SLACK: 'FORMAT_SLACK',
    EXPLAIN: 'EXPLAIN',
    EXPLAIN_REGEX: 'EXPLAIN_REGEX',
    GENERATE_REGEX: 'GENERATE_REGEX',
    FORMAT_SQL: 'FORMAT_SQL',
    EXPLAIN_SQL: 'EXPLAIN_SQL',
    GENERATE_MOCK: 'GENERATE_MOCK',
    GENERATE_MOCK_RULE: 'GENERATE_MOCK_RULE',
} as const;

// Endpoint Gemini Seguro (Rate limited a 20 req/min)
app.post('/api/ai/process', rateLimiter(20, 60 * 1000), async (req, res) => {
    try {
        const { text, action } = req.body;
        if (!text || !text.trim()) {
            return res.json({ text: '' });
        }

        const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return res.status(500).json({ 
                error: 'Chave de API do Gemini não configurada. Por favor, adicione a variável API_KEY ou GEMINI_API_KEY no arquivo .env do backend e reinicie o servidor.' 
            });
        }

        const ai = new GoogleGenAI({ apiKey });

        const thinkingActions = [AIAction.EXPLAIN, AIAction.EXTEND, AIAction.REFINE, AIAction.EXPLAIN_SQL, AIAction.EXPLAIN_REGEX];
        const isThinkingTask = thinkingActions.includes(action);

        const modelName = isThinkingTask ? 'gemini-3-pro-preview' : 'gemini-3-flash-preview';

        let prompt = '';
        switch (action) {
            case AIAction.REFINE:
                prompt = `Aja como um editor profissional. Melhore a clareza, o fluxo e a formatação do seguinte texto. Se for código, melhore a legibilidade e adicione comentários. Mantenha o formato original (se for Markdown, devolva Markdown; se for SQL, devolva SQL). Texto:\n\n${text}`;
                break;
            case AIAction.SUMMARIZE:
                prompt = `Resuma o seguinte conteúdo em tópicos concisos (Markdown).:\n\n${text}`;
                break;
            case AIAction.FIX_GRAMMAR:
                prompt = `Corrija erros de gramática, ortografia ou sintaxe de código no seguinte texto. Retorne apenas o texto corrigido:\n\n${text}`;
                break;
            case AIAction.EXTEND:
                prompt = `Expanda os conceitos apresentados no seguinte texto com mais detalhes e exemplos úteis. Retorne no mesmo formato da entrada:\n\n${text}`;
                break;
            case AIAction.FORMAT_JSON:
                prompt = `Você é um especialista em formatação de dados. Analise o texto abaixo:
            1. Identifique todas as estruturas JSON (objetos {} ou arrays []) presentes.
            2. Se houver JSON minificado, mal formatado ou solto no texto, formate-o corretamente (pretty-print) com indentação de 2 espaços.
            3. Garanta que todo JSON identificado esteja envolvido por blocos de código triplos (\`\`\`json ... \`\`\`).
            4. Mantenha todo o restante do texto (títulos, descrições, outros blocos de código) INALTERADO.
            
            Retorne APENAS o resultado final formatado:\n\n${text}`;
                break;
            case AIAction.CONVERT_HTML:
                prompt = `Converta o seguinte fragmento de HTML para um Markdown limpo, semântico e profissional. Retorne APENAS o código Markdown resultante:\n\n${text}`;
                break;
            case AIAction.FORMAT_SLACK:
                prompt = `Converta o seguinte texto para o formato 'mrkdwn' do Slack. Mantenha emojis e formatação de links <url|texto>. Retorne APENAS o texto formatado:\n\n${text}`;
                break;
            case AIAction.EXPLAIN:
                prompt = `Você é um analista técnico sênior. Analise o seguinte código, script ou conjunto de dados e explique o que ele faz, como funciona e quais são os pontos principais. Use Markdown para a explicação.
            
            Entrada:\n${text}`;
                break;
            case AIAction.EXPLAIN_REGEX:
                prompt = `Você é um especialista em expressões regulares. Explique detalhadamente o funcionamento da seguinte Regex, destacando grupos de captura, âncoras e flags em tópicos legíveis:\n\n${text}`;
                break;
            case AIAction.GENERATE_REGEX:
                prompt = `Gere uma expressão regular robusta com base na seguinte descrição: "${text}". Retorne apenas a Regex em um bloco de código triplo contendo a expressão de forma limpa, sem introduções ou conversas adicionais.`;
                break;
            case AIAction.FORMAT_SQL:
                prompt = `Formate e embeleze a seguinte consulta SQL para que fique perfeitamente legível, estruturada e identada. Retorne apenas o código SQL resultante:\n\n${text}`;
                break;
            case AIAction.EXPLAIN_SQL:
                prompt = `Você é um DBA sênior. Analise e explique a seguinte consulta SQL, descrevendo o que ela realiza, as tabelas envolvidas, possíveis gargalos de performance e sugestões de índices usando Markdown:\n\n${text}`;
                break;
            case AIAction.GENERATE_MOCK:
                prompt = `Gere uma lista fictícia de dados (mock data) realista em formato JSON com base na seguinte descrição de tabela ou instrução: "${text}". Retorne apenas um array JSON de objetos contendo entre 5 a 10 registros fictícios estruturados de forma limpa. Não inclua markdown na resposta, retorne apenas o JSON bruto iniciando com [ e terminando com ] para que eu possa fazer parse diretamente.`;
                break;
            case AIAction.GENERATE_MOCK_RULE:
                prompt = `Você é um gerador de regras de mock de API experiente. Com base na seguinte solicitação/instrução do usuário: "${text}", gere um objeto JSON que represente a configuração de uma regra de mock de API de alto nível, semelhante ao Beeceptor.
Você pode usar condições de correspondência (matchConditions), ativar CORS, simular latência de rede (responseDelay) ou falhas de rede. Também pode incluir tags dinâmicas como {{request.query.id}}, {{request.body.name}}, {{request.headers.name}}, {{random.uuid}}, {{random.name}} ou {{random.email}} no responseBody se solicitado.

O objeto JSON de retorno deve possuir obrigatoriamente a seguinte estrutura de campos:
{
  "pathPattern": "/caminho/do/endpoint (deve começar com /)",
  "method": "MÉTODO_HTTP (ex: GET, POST, PUT, DELETE, PATCH, ou ALL)",
  "responseStatus": 200, // número correspondente ao status HTTP (ex: 200, 201, 400, 401, 500)
  "responseHeaders": {
    "Content-Type": "application/json"
  },
  "responseBody": "corpo da resposta fictícia em formato string (se for JSON, deve ser uma string JSON válida)",
  "responseDelay": 0, // opcional, atraso de rede simulado em milissegundos (ex: 500)
  "corsEnabled": true, // opcional, boolean indicando se CORS deve ser ativado nas respostas
  "networkFailure": null, // opcional, string indicando se deve simular falha de rede: "close" (fecha a conexão TCP imediatamente) ou "empty" (resposta sem dados)
  "matchConditions": [ // opcional, regras adicionais para aplicar este mock apenas se preenchido
    {
      "type": "header" | "query" | "body",
      "key": "nome_do_campo_ou_header",
      "operator": "equals" | "contains" | "exists" | "regex",
      "value": "valor_esperado"
    }
  ]
}
Retorne EXCLUSIVAMENTE o objeto JSON bruto, iniciando com { e terminando com }, sem blocos de código markdown (e sem crases/markdown blocks), sem explicações ou introduções. Garanta que o JSON retornado seja 100% válido e seguro para fazer JSON.parse.`;
                break;
            default:
                return res.status(400).json({ error: 'Invalid action' });
        }

        const config: any = {
            temperature: 0.2,
            topP: 0.95,
        };

        if (isThinkingTask) {
            config.thinkingConfig = { thinkingBudget: 32768 };
        }

        const response = await ai.models.generateContent({
            model: modelName,
            contents: [{ parts: [{ text: prompt }] }],
            config
        });

        const resultText = response.text;
        res.json({ text: resultText ? resultText.trim() : text });

    } catch (error: any) {
        console.error("Gemini AI Error:", error);
        res.status(500).json({ error: 'Failed to process AI text', details: error.message });
    }
});

// Endpoint Chat AI Contextualizado (Rate limited a 20 req/min)
app.post('/api/ai/chat', rateLimiter(20, 60 * 1000), async (req, res) => {
    try {
        const { message, history, context } = req.body;
        
        const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return res.status(500).json({ 
                error: 'Chave de API do Gemini não configurada. Por favor, adicione a variável API_KEY ou GEMINI_API_KEY no arquivo .env do backend e reinicie o servidor.' 
            });
        }

        if (!message) {
            return res.status(400).json({ error: 'A mensagem do usuário é obrigatória.' });
        }

        const ai = new GoogleGenAI({ apiKey });

        const contents = [];
        
        if (history && Array.isArray(history)) {
            for (const msg of history) {
                // Filtramos a primeira instrução padrão para evitar confusão de papéis
                if (msg.id === '1') continue;
                contents.push({
                    role: msg.sender === 'user' ? 'user' : 'model',
                    parts: [{ text: msg.text }]
                });
            }
        }

        contents.push({
            role: 'user',
            parts: [{ text: message }]
        });

        const systemInstruction = `Você é o Assistente Gemini integrado no Universal Studio Pro do Dev-Studio.
O usuário está atualmente editando um arquivo no editor. O conteúdo do arquivo está listado abaixo.
Use-o como contexto direto para responder, explicar, depurar ou realizar alterações conforme solicitado pelo usuário.
Seja objetivo, técnico e amigável. Retorne respostas estruturadas em Markdown.

--- CONTEÚDO ATUAL DO WORKSPACE ---
${context || '(Arquivo vazio no momento)'}
----------------------------------`;

        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents,
            config: {
                temperature: 0.7,
                topP: 0.95,
                systemInstruction
            }
        });

        const reply = response.text;
        res.json({ text: reply ? reply.trim() : 'Não consegui formular uma resposta no momento.' });

    } catch (error: any) {
        console.error("Gemini AI Chat Error:", error);
        res.status(500).json({ error: 'Falha no processamento do Chat AI', details: error.message });
    }
});

// Endpoint para Auditoria HSM (Rate limited a 20 req/min)
app.post('/api/ai/audit-hsm', rateLimiter(20, 60 * 1000), async (req, res) => {
    try {
        const { templateData } = req.body;
        if (!templateData) {
            return res.status(400).json({ error: 'Os dados do template são obrigatórios.' });
        }

        const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return res.status(500).json({ 
                error: 'Chave de API do Gemini não configurada. Por favor, adicione a variável API_KEY ou GEMINI_API_KEY no arquivo .env do backend.' 
            });
        }

        const ai = new GoogleGenAI({ apiKey });

        const systemInstruction = `Você é um Auditor Strict de HSM (Highly Structured Messages) da Meta.
Sua tarefa é auditar modelos seguindo as políticas rígidas de conformidade do WhatsApp.
Retorne APENAS um JSON estrito no seguinte formato:
{
  "qualityScore": number, // 1-100
  "grammarIssues": string[],
  "policyWarnings": string[],
  "improvedVersion": string
}`;

        const prompt = `Audite o seguinte template HSM: ${JSON.stringify(templateData)}`;

        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt,
            config: {
                systemInstruction,
                responseMimeType: "application/json"
            }
        });

        const replyText = response.text;
        res.json(JSON.parse(replyText || '{}'));
    } catch (error: any) {
        console.error("Gemini HSM Audit Error:", error);
        res.status(500).json({ error: 'Falha na auditoria do template HSM', details: error.message });
    }
});

// Endpoint para Conversão de Imagem/PDF para Markdown (Rate limited a 20 req/min)
app.post('/api/ai/convert-image', rateLimiter(20, 60 * 1000), async (req, res) => {
    try {
        const { base64Image, mimeType } = req.body;
        if (!base64Image || !mimeType) {
            return res.status(400).json({ error: 'A imagem em base64 e o mimeType são obrigatórios.' });
        }

        const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return res.status(500).json({ 
                error: 'Chave de API do Gemini não configurada. Por favor, adicione a variável API_KEY ou GEMINI_API_KEY no arquivo .env do backend.' 
            });
        }

        const ai = new GoogleGenAI({ apiKey });

        const imagePart = {
            inlineData: {
                mimeType: mimeType,
                data: base64Image,
            },
        };

        const textPart = {
            text: `Você é um extrator de texto e dados de alta precisão especializado em converter arquivos de imagem ou documentos PDF diretamente em Markdown estruturado, legível e semântico.
            
            Instruções estritas de formatação:
            1. Preserve e formate toda a hierarquia de cabeçalhos usando #, ##, ### de forma lógica.
            2. Converta quaisquer tabelas que encontrar na imagem ou documento PDF em tabelas no formato Markdown padrão de forma organizada e limpa.
            3. Preserve listas de tarefas, listas ordenadas e listas não ordenadas.
            4. Se houver trechos de código-fonte, coloque-os na sintaxe de bloco de código apropriada com a indicação da linguagem (ex: \`\`\`js ... \`\`\`).
            5. Mantenha as formatações inline originais como negrito e itálico onde fizer sentido para destacar pontos importantes.
            6. Se o arquivo PDF possuir múltiplas páginas, processe todas elas de forma contínua e lógica.
            7. Retorne APENAS o código Markdown resultante. Não faça comentários extras, não diga "Aqui está o seu markdown" ou adicione qualquer nota adicional. Retorne puramente o conteúdo convertido.`
        };

        const response = await ai.models.generateContent({
            model: 'gemini-3.5-flash',
            contents: [imagePart, textPart]
        });

        res.json({ text: response.text ? response.text.trim() : '' });
    } catch (error: any) {
        console.error("Gemini Image Conversion Error:", error);
        res.status(500).json({ error: 'Falha na conversão de imagem pelo Gemini', details: error.message });
    }
});

import { mockStore } from './mockStore';

function getNestedObjectValue(obj: any, path: string): string | undefined {
    try {
        const parts = path.split('.');
        let current = obj;
        for (const part of parts) {
            if (current === null || current === undefined) return undefined;
            current = current[part];
        }
        return current !== undefined ? String(current) : undefined;
    } catch (e) {
        return undefined;
    }
}

function parseTemplate(template: string, req: express.Request): string {
    if (!template) return template;
    return template.replace(/\{\{\s*([\w.-]+)\s*\}\}/g, (match, expression) => {
        const path = expression.trim();
        if (path === 'random.uuid') {
            return crypto.randomUUID();
        }
        if (path === 'random.number') {
            return String(Math.floor(Math.random() * 100000));
        }
        if (path === 'random.name') {
            const names = ['Ana', 'Bruno', 'Carlos', 'Diana', 'Eduardo', 'Fernanda', 'Gabriel', 'Helena', 'Igor', 'Julia'];
            return names[Math.floor(Math.random() * names.length)];
        }
        if (path === 'random.email') {
            const domains = ['gmail.com', 'outlook.com', 'yahoo.com', 'company.local'];
            const names = ['user', 'test', 'admin', 'contact', 'info'];
            const n = names[Math.floor(Math.random() * names.length)] + Math.floor(Math.random() * 1000);
            const d = domains[Math.floor(Math.random() * domains.length)];
            return `${n}@${d}`;
        }
        if (path.startsWith('request.')) {
            const reqPath = path.substring(8);
            if (reqPath === 'path') return req.path;
            if (reqPath === 'method') return req.method;
            if (reqPath.startsWith('query.')) {
                const queryKey = reqPath.substring(6);
                return String(req.query[queryKey] || '');
            }
            if (reqPath.startsWith('headers.')) {
                const headerKey = reqPath.substring(8).toLowerCase();
                const hVal = req.headers[headerKey];
                return String(Array.isArray(hVal) ? hVal.join(', ') : hVal || '');
            }
            if (reqPath.startsWith('body.')) {
                const bodyKey = reqPath.substring(5);
                return getNestedObjectValue(req.body, bodyKey) || '';
            }
        }
        return match;
    });
}

// Obter todos os endpoints ativos
app.get('/api/mock/endpoints', (req, res) => {
    try {
        res.json(mockStore.listEndpoints());
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// Criar novo endpoint mock (Beeceptor-like)
app.post('/api/mock/endpoints', (req, res) => {
    try {
        const { id } = req.body;
        let slug = id || Math.random().toString(36).substring(2, 9);
        slug = slug.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
        if (!slug) {
            return res.status(400).json({ error: 'Identificador do endpoint inválido' });
        }
        const ep = mockStore.getOrCreateEndpoint(slug);
        res.status(201).json(ep);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// Excluir um endpoint mock completo
app.delete('/api/mock/endpoints/:id', (req, res) => {
    try {
        const { id } = req.params;
        const deleted = mockStore.deleteEndpoint(id);
        if (deleted) {
            res.json({ success: true, message: `Endpoint ${id} deletado com sucesso` });
        } else {
            res.status(404).json({ error: `Endpoint ${id} não encontrado` });
        }
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// Limpar logs do endpoint
app.delete('/api/mock/endpoints/:id/requests', (req, res) => {
    try {
        const { id } = req.params;
        mockStore.clearRequests(id);
        res.json({ message: 'Request logs cleared' });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// Criar regra de mock no endpoint
app.post('/api/mock/endpoints/:id/rules', (req, res) => {
    try {
        const { id } = req.params;
        const { pathPattern, method, responseStatus, responseHeaders, responseBody, responseDelay, matchConditions, corsEnabled, networkFailure } = req.body;

        if (!pathPattern || !method || !responseStatus) {
            return res.status(400).json({ error: 'Campos obrigatórios: pathPattern, method, responseStatus' });
        }

        const rule = mockStore.addRule(id, {
            pathPattern,
            method,
            responseStatus: Number(responseStatus),
            responseHeaders: responseHeaders || {},
            responseBody: responseBody || '',
            responseDelay: responseDelay !== undefined ? Number(responseDelay) : undefined,
            matchConditions: matchConditions || [],
            corsEnabled: !!corsEnabled,
            networkFailure: networkFailure || undefined
        });

        res.status(201).json(rule);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// Deletar regra do mock
app.delete('/api/mock/endpoints/:id/rules/:ruleId', (req, res) => {
    try {
        const { id, ruleId } = req.params;
        const deleted = mockStore.deleteRule(id, ruleId);
        if (!deleted) {
            return res.status(404).json({ error: 'Regra não encontrada' });
        }
        res.json({ message: 'Regra excluída com sucesso' });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// Server-Sent Events (SSE) para atualização real-time das requests
app.get('/api/mock/endpoints/:id/events', (req, res) => {
    try {
        const { id } = req.params;

        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.flushHeaders();

        const listener = (request: any) => {
            res.write(`data: ${JSON.stringify(request)}\n\n`);
        };

        mockStore.addListener(id, listener);

        req.on('close', () => {
            mockStore.removeListener(id, listener);
        });
    } catch (err) {
        console.error('SSE connection error:', err);
    }
});

// Catch-all Webhook Interceptor (Captura chamadas em /hooks/:endpointId/*)
app.all(/^\/hooks\/([^\/]+)(?:\/(.*))?$/, (req, res) => {
    try {
        const endpointId = String(req.params[0]);
        let subPath = req.params[1] ? '/' + req.params[1] : '/';

        // 0. Responder requisições OPTIONS pré-voo (CORS preflight) para evitar bloqueios de CORS do navegador
        if (req.method === 'OPTIONS') {
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
            res.setHeader('Access-Control-Allow-Headers', '*');
            res.status(200).end();
            return;
        }

        // 1. Procurar regra customizada correspondente
        const endpoint = mockStore.getOrCreateEndpoint(endpointId);
        const matchedRule = endpoint.rules.find(rule => {
            // Match de método
            const methodMatch = rule.method === 'ALL' || rule.method.toUpperCase() === req.method.toUpperCase();
            if (!methodMatch) return false;

            // Match de path
            const pattern = rule.pathPattern.trim();
            let pathMatch = false;
            if (pattern === '*' || pattern === '') {
                pathMatch = true;
            } else if (pattern.endsWith('*')) {
                const basePattern = pattern.slice(0, -1);
                pathMatch = subPath.startsWith(basePattern);
            } else {
                pathMatch = subPath === pattern;
            }
            if (!pathMatch) return false;

            // Match de condições customizadas (Headers, Query, Body)
            if (rule.matchConditions && rule.matchConditions.length > 0) {
                for (const cond of rule.matchConditions) {
                    const { type, key, operator, value } = cond;
                    let targetVal: string | undefined = undefined;

                    if (type === 'header') {
                        if (key) {
                            const headerVal = req.headers[key.toLowerCase()];
                            targetVal = Array.isArray(headerVal) ? headerVal.join(', ') : headerVal;
                        }
                    } else if (type === 'query') {
                        if (key) {
                            targetVal = req.query[key] as string;
                        }
                    } else if (type === 'body') {
                        if (req.body && typeof req.body === 'object') {
                            if (key) {
                                targetVal = getNestedObjectValue(req.body, key);
                            } else {
                                targetVal = JSON.stringify(req.body);
                            }
                        } else if (req.body) {
                            targetVal = String(req.body);
                        }
                    }

                    // Validar operadores
                    if (operator === 'exists') {
                        if (targetVal === undefined || targetVal === null) return false;
                    } else if (operator === 'equals') {
                        if (targetVal !== value) return false;
                    } else if (operator === 'contains') {
                        if (!targetVal || !targetVal.includes(value)) return false;
                    } else if (operator === 'regex') {
                        if (!targetVal) return false;
                        try {
                            const rx = new RegExp(value);
                            if (!rx.test(targetVal)) return false;
                        } catch (e) {
                            return false;
                        }
                    }
                }
            }

            return true;
        });

        let responseStatus = 200;
        let responseBody = '';
        let matchedRuleId: string = 'DEFAULT';

        if (matchedRule) {
            matchedRuleId = matchedRule.id;
            responseStatus = matchedRule.responseStatus || 200;
            if (matchedRule.networkFailure === 'close') {
                responseBody = '[Conexão Interrompida pelo Mock]';
            } else if (matchedRule.networkFailure === 'empty') {
                responseBody = '';
            } else {
                responseBody = parseTemplate(matchedRule.responseBody, req);
            }
        } else {
            responseBody = JSON.stringify({
                status: 'success',
                message: 'Request intercepted successfully by Dev-Studio',
                details: {
                    endpointId,
                    subPath,
                    method: req.method,
                }
            });
        }

        // 2. Registrar a chamada interceptada com telemetria completa de resposta
        mockStore.addRequest(endpointId, {
            method: req.method,
            path: subPath,
            headers: req.headers as Record<string, string>,
            body: req.body,
            query: req.query as Record<string, string>,
            responseStatus,
            matchedRuleId,
            responseBody
        });

        // 3. Responder de fato
        const sendResponse = () => {
            if (matchedRule) {
                if (matchedRule.networkFailure === 'close') {
                    res.destroy();
                    return;
                }
                if (matchedRule.networkFailure === 'empty') {
                    res.status(200).end();
                    return;
                }
                if (matchedRule.corsEnabled) {
                    res.setHeader('Access-Control-Allow-Origin', '*');
                    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
                    res.setHeader('Access-Control-Allow-Headers', '*');
                }
                if (matchedRule.responseHeaders) {
                    Object.entries(matchedRule.responseHeaders).forEach(([k, v]) => {
                        res.setHeader(k, v);
                    });
                }
            }

            try {
                const jsonBody = JSON.parse(responseBody);
                res.status(responseStatus).json(jsonBody);
            } catch (e) {
                res.status(responseStatus).send(responseBody);
            }
        };

        const delay = (matchedRule && matchedRule.responseDelay) ? matchedRule.responseDelay : 0;
        if (delay > 0) {
            setTimeout(sendResponse, delay);
        } else {
            sendResponse();
        }
    } catch (err: any) {
        console.error('Webhook Interceptor error:', err);
        res.status(500).json({ error: 'Erro ao interceptar chamada webhook', details: err.message });
    }
});

// ── Endpoint Base ─────────────────────────────────────────────────────────────
app.get('/', (req, res) => {
    res.send('Dev-Studio Backend is Running');
});

// ── Tunnel Management API (Cloudflare Quick Tunnel) ───────────────────────────

// GET /api/tunnel/status
app.get('/api/tunnel/status', (req, res) => {
    res.json({
        status: tunnelStatus,
        url: tunnelUrl,
        error: tunnelError,
        provider: tunnelProvider,
        publicHooksBase: tunnelUrl ? `${tunnelUrl}/hooks` : null,
    });
});

// POST /api/tunnel/start — opens a Cloudflare Quick Tunnel
app.post('/api/tunnel/start', async (req, res) => {
    if (tunnelProcess && tunnelStatus === 'open') {
        return res.json({ status: 'open', url: tunnelUrl, provider: tunnelProvider, publicHooksBase: tunnelUrl ? `${tunnelUrl}/hooks` : null });
    }

    tunnelStatus = 'connecting';
    tunnelError = null;
    tunnelUrl = null;
    tunnelProvider = null;

    try {
        const proc = spawn(CLOUDFLARED_BIN, [
            'tunnel', '--url', `http://localhost:${PORT}`,
            '--no-autoupdate'
        ], { stdio: ['ignore', 'pipe', 'pipe'] });

        tunnelProcess = proc;

        let resolved = false;

        const onData = (data: Buffer) => {
            const text = data.toString();
            // Cloudflared prints the URL to stderr in the form: https://xxxx.trycloudflare.com
            const match = text.match(/https:\/\/[a-zA-Z0-9-]+\.trycloudflare\.com/);
            if (match && !resolved) {
                resolved = true;
                tunnelUrl = match[0];
                tunnelStatus = 'open';
                tunnelProvider = 'cloudflared';
                console.log(`[Tunnel/cloudflared] Open: ${tunnelUrl}`);
                res.json({ status: 'open', url: tunnelUrl, provider: 'cloudflared', publicHooksBase: `${tunnelUrl}/hooks` });
            }
        };

        proc.stdout?.on('data', onData);
        proc.stderr?.on('data', onData);

        proc.on('close', (code) => {
            console.log(`[Tunnel/cloudflared] Closed (code: ${code})`);
            tunnelProcess = null;
            tunnelUrl = null;
            tunnelProvider = null;
            if (tunnelStatus === 'open') tunnelStatus = 'idle';
        });

        proc.on('error', (err) => {
            console.error('[Tunnel/cloudflared] Error:', err.message);
            if (!resolved) {
                tunnelStatus = 'error';
                tunnelError = err.message;
                res.status(500).json({ status: 'error', error: err.message });
                resolved = true;
            }
        });

        // Timeout: if no URL received in 20s, fail gracefully
        setTimeout(() => {
            if (!resolved) {
                resolved = true;
                proc.kill();
                tunnelProcess = null;
                tunnelStatus = 'error';
                tunnelError = 'Timeout ao aguardar URL do túnel.';
                console.error('[Tunnel/cloudflared] Timeout');
                res.status(500).json({ status: 'error', error: 'Timeout ao iniciar túnel.' });
            }
        }, 20000);

    } catch (err: any) {
        tunnelStatus = 'error';
        tunnelError = err.message;
        console.error('[Tunnel] Failed:', err.message);
        res.status(500).json({ status: 'error', error: err.message });
    }
});

// POST /api/tunnel/stop
app.post('/api/tunnel/stop', (req, res) => {
    if (tunnelProcess) {
        tunnelProcess.kill();
        tunnelProcess = null;
    }
    tunnelUrl = null;
    tunnelStatus = 'idle';
    tunnelError = null;
    tunnelProvider = null;
    res.json({ status: 'idle' });
});

// Cleanup on process exit
process.on('exit', () => { if (tunnelProcess) tunnelProcess.kill(); });
process.on('SIGINT', () => { if (tunnelProcess) tunnelProcess.kill(); process.exit(); });

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
