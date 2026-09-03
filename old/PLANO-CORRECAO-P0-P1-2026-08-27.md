# Plano de correção — P0 e P1 (Dev Studio)

**Data:** 2026-08-27
**Base:** `ANALISE-2026-08-27.md`
**Dono:** dev único (ScParis)
**Objetivo:** deixar o projeto deployável (P0) e endurecido para exposição pública (P1).

> Convenção: cada item traz **problema → arquivos → o que fazer → como validar → esforço**.

---

## P0 — Desbloquear deploy

### P0.1 — Centralizar a URL do backend (remover `localhost:3001` hardcoded)
**Prazo: 2026-09-03 · Esforço: ~2h**

**Problema.** ~20 chamadas usam `http://localhost:3001` fixo. Em produção o frontend (Vercel) aponta para um backend que não existe naquele host, então tudo que depende do back (proxy, CNPJ, IA, mock, túnel) quebra.

**Arquivos afetados**
- `frontend/src/pages/ApiApp/ApiApp.tsx:147`
- `frontend/src/pages/CnpjApp/CnpjApp.tsx:169`
- `frontend/src/pages/DiffApp/DiffApp.tsx:62`
- `frontend/src/pages/RegexApp/RegexApp.tsx:99,124`
- `frontend/src/pages/MockApp/MockApp.tsx` (115, 135, 156, 185, 212, 389, 461, 466, 503, 522, 567, 597, 618, 624)
- `frontend/src/pages/StudioApp/services/geminiService.ts:4`
- `frontend/src/services/aiConfig.ts:149`

**O que fazer**

1. Criar `frontend/src/config.ts`:

```ts
// URL base do backend. Em dev usa localhost; em produção vem do env do build.
export const BACKEND_URL =
  (import.meta.env?.VITE_BACKEND_URL as string | undefined)?.replace(/\/$/, '')
  || 'http://localhost:3001';
```

2. Substituir os literais. Ex. em `geminiService.ts`:

```ts
import { BACKEND_URL } from '../../../config';
// remover: const BACKEND_URL = 'http://localhost:3001';
```

E nas chamadas `fetch`/`EventSource`:

```ts
const res = await fetch(`${BACKEND_URL}/api/mock/endpoints`);
const eventSource = new EventSource(`${BACKEND_URL}/api/mock/endpoints/${id}/events`);
const hookUrl = `${BACKEND_URL}/hooks/${activeEndpoint.id}${selectedRequest.path}`;
```

> Atenção ao `mockUrl`/`hookUrl` exibidos ao usuário (`MockApp.tsx:522,624`): em produção provavelmente devem apontar para a URL pública do túnel (`publicHooksBase`), não para `BACKEND_URL`. Decidir caso a caso.

3. Documentar as variáveis. Adicionar ao `frontend/.env.example` (criar se não existir):

```
VITE_BACKEND_URL=http://localhost:3001
```

E configurar `VITE_BACKEND_URL` no painel da Vercel apontando para o backend publicado.

**Como validar**
- `grep -rn "localhost:3001" frontend/src` → deve retornar **zero** (exceto o fallback dentro de `config.ts`).
- `npm run build --prefix frontend` sem erros.
- Rodar local com `VITE_BACKEND_URL` setado e conferir que CNPJ, proxy e mock funcionam.

---

### P0.2 — CORS: default seguro
**Prazo: 2026-09-03 · Esforço: ~30min**

**Problema.** `backend/src/server.ts:23-35`: quando `ALLOWED_ORIGINS` está vazio, o CORS libera **qualquer origem** (`allowedOrigins.length === 0` → `callback(null, true)`). É o default, então produção sobe permissiva por omissão.

**O que fazer.** Inverter a lógica: sem lista configurada, negar (ou permitir só same-origin). Separar comportamento dev/prod:

```ts
app.use(cors({
    origin: (origin, callback) => {
        // Requests sem Origin (curl, server-to-server) seguem permitidos.
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) return callback(null, true);
        // Em dev, liberar localhost para DX; em prod, negar.
        if (process.env.NODE_ENV !== 'production' && /^http:\/\/localhost(:\d+)?$/.test(origin)) {
            return callback(null, true);
        }
        return callback(new Error('Bloqueado por política CORS'));
    }
}));
```

Setar `ALLOWED_ORIGINS=https://<dominio-do-front>` no ambiente de produção e adicionar a variável ao `backend/.env.example`.

**Como validar**
- Sem `ALLOWED_ORIGINS`, request com `Origin: https://evil.com` → bloqueado.
- Com `ALLOWED_ORIGINS` correto, front em produção funciona.

---

### P0.3 — Atualizar dependências vulneráveis
**Prazo: 2026-08-29 · Esforço: ~30min**

**Problema.** `npm audit` no backend: 4 vulnerabilidades (3 high, 1 low), ex. `brace-expansion` (DoS).

**O que fazer**
```bash
cd backend && npm audit fix && npm audit
cd ../frontend && npm audit fix && npm audit
```
Se sobrar algo só resolvível com `--force`, avaliar breaking change antes de aplicar. Rodar o build depois para garantir que nada quebrou.

**Como validar**
- `npm audit` sem vulnerabilidades high.
- `npm run build` (front) e `npm run dev` (back) sobem sem erro.

---

## P1 — Endurecimento e confiabilidade

### P1.4 — Sanitizar HTML no HSM Studio
**Prazo: 2026-09-10 · Esforço: ~30min**

**Problema.** `frontend/src/pages/StudioApp/components/HsmStudio.tsx:97` (`renderFormattedBody`) monta `__html` a partir de `bodyText` do usuário, aplicando regex de `*bold*`/`_italic_`/`~del~` **sem escapar `<`/`>`**. Permite injeção de HTML/script (self-XSS; vira risco maior se o body vier de dado externo/importado).

**O que fazer.** Escapar antes de aplicar as regras de formatação e/ou passar por DOMPurify (já é dependência do projeto — usado em `lib/markdown.ts`):

```ts
import DOMPurify from 'dompurify';

const escapeHtml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const renderFormattedBody = (rawText: string) => {
  let text = escapeHtml(rawText);
  // ...aplicar substituições de variável e *bold*/_italic_/~del~ sobre o texto já escapado...
  return { __html: DOMPurify.sanitize(text) };
};
```

> Como o markup gerado é fixo (`<strong>`, `<em>`, `<del>`, `<span class=...>`), dá para restringir o DOMPurify a essas tags/atributos via `ALLOWED_TAGS`/`ALLOWED_ATTR`.

**Como validar.** Digitar `<img src=x onerror=alert(1)>` no body → renderiza como texto, não executa.

---

### P1.5 — Autenticar túnel e interceptador público
**Prazo: 2026-09-10 · Esforço: ~2-3h**

**Problema.** `POST /api/tunnel/start` (`server.ts:784`) expõe o backend local à internet via `cloudflared`/`localtunnel` **sem autenticação**. Qualquer um com a URL alcança `/hooks/*`, `/api/mock/*`, `/api/proxy` e os endpoints de IA (o proxy encaminha para qualquer host público — S5, relay aberto).

**O que fazer** (defesa em camadas, escolher conforme necessidade)
- Exigir um token secreto (`TUNNEL_SECRET`) para chamar `/api/tunnel/start|stop` e para as rotas administrativas de mock (`/api/mock/*`), via header `Authorization`/`x-api-token`. As rotas `/hooks/*` continuam abertas (é a função delas), mas isoladas do resto.
- Restringir o `POST /api/proxy` a uma allow-list de domínios ou exigir token, para não virar open proxy quando o túnel estiver ativo.
- Log/alerta ao abrir túnel e timeout de auto-fechamento (ex.: derrubar sozinho após N minutos ociosos).

Middleware simples:

```ts
function requireToken(req, res, next) {
  const token = req.headers['x-api-token'];
  if (!process.env.ADMIN_TOKEN || token === process.env.ADMIN_TOKEN) return next();
  return res.status(401).json({ error: 'Não autorizado' });
}
app.post('/api/tunnel/start', requireToken, /* ... */);
```

**Como validar.** Sem token → 401 em `/api/tunnel/start` e `/api/mock/*`. `/hooks/:id` continua respondendo.

---

### P1.6 — Persistir (ou declarar efêmero) o Mock Store
**Prazo: 2026-09-17 · Esforço: ~4-6h (persistência) ou ~15min (documentar)**

**Problema.** `backend/src/mockStore.ts` mantém endpoints, regras e requests em `Map` na memória. Restart do processo apaga tudo; não escala para múltiplas instâncias (a Vercel/serverless nem mantém processo vivo entre requests).

**O que fazer** — escolher conforme ambição:
- **Mínimo (rápido):** documentar no README que o mock é efêmero e roda só em backend persistente de instância única (não serverless). Desabilitar a feature em builds serverless.
- **Recomendado:** trocar o `Map` por um store persistente. SQLite (`better-sqlite3`) para deploy single-node, ou Redis se precisar multi-instância + SSE compartilhado. Encapsular atrás da mesma interface atual de `MockStore` para minimizar mudança nos endpoints.

> Observação de arquitetura: SSE (`/api/mock/.../events`) e `spawn` de `cloudflared` **não funcionam em serverless**. Se o alvo for Vercel Functions, o backend de mock/túnel precisa de um host tradicional (Railway/Render/VPS). Definir isso antes de investir na persistência.

**Como validar.** Criar endpoint + regra, reiniciar o backend, confirmar que persistiram.

---

## Sequenciamento sugerido
1. **2026-08-29:** P0.3 (audit fix) — trivial, tira ruído.
2. **2026-09-03:** P0.1 + P0.2 juntos (ambos tocam config de deploy) → primeiro deploy real funcional.
3. **2026-09-10:** P1.4 + P1.5 (endurecimento antes de expor túnel a sério).
4. **2026-09-17:** P1.6 (depois de decidir o host do backend).

## Riscos / decisões em aberto
- **Onde hospedar o backend?** Vercel serverless **não** suporta SSE nem `spawn` de túnel — isso condiciona P0.1 (URL), P1.5 e P1.6. Decisão prévia a tudo.
- **Chaves de IA no `localStorage` (S1):** fora do P0/P1 por ser trade-off de produto (conveniência × segurança). Se o público for externo, migrar para fluxo 100% via backend com as chaves só no servidor.
