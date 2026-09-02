# Tutorial de Deploy — Frontend na Vercel + Backend no Koyeb

**Para:** Scherman (não-dev) · **Data:** 2026-08-27 · **Projeto:** Nexora Devkit

Este guia é passo a passo, escrito para quem **não é desenvolvedor**. Siga na ordem. Não pule etapas.

---

## O que vamos fazer (visão geral)

O seu sistema tem duas partes:

1. **Frontend** (a tela que o usuário vê) → já roda na **Vercel**. Vai continuar lá.
2. **Backend** (o "motor" que faz IA, CNPJ, proxy, Mock e SSE) → hoje roda só na sua máquina. Vamos publicá-lo no **Koyeb** (grátis, sem cartão de crédito).

No final, o Frontend na Vercel vai "conversar" com o Backend no Koyeb, e o **módulo Mock Interceptor continua 100% funcional**.

> **Por que Koyeb e não Vercel para o backend?** A Vercel não sabe manter um processo ligado o tempo todo (necessário para o SSE do Mock e para receber webhooks). O Koyeb mantém. É a escolha mais simples e gratuita para o seu caso.

**Tempo estimado:** 40 a 60 minutos na primeira vez.

---

## Antes de começar — o que você precisa ter em mãos

- Sua conta do **GitHub** (o código precisa estar num repositório GitHub).
- Sua **chave da API do Google Gemini** (a mesma que está no arquivo `backend/.env`, no campo `API_KEY`).
- Acesso ao painel da **Vercel** onde o frontend já está publicado.

Se o código ainda não está no GitHub, resolva isso primeiro (peça ajuda a alguém do time de dev só para o "push" inicial). Koyeb e Vercel publicam **a partir do GitHub**.

---

## PARTE 1 — Publicar o Backend no Koyeb

### Passo 1.1 — Criar a conta

1. Acesse **https://www.koyeb.com** e clique em **Sign up**.
2. Escolha **Sign up with GitHub** (mais fácil — já conecta o GitHub de uma vez).
3. Autorize o Koyeb a acessar seus repositórios do GitHub.

### Passo 1.2 — Criar o serviço (o backend)

1. No painel do Koyeb, clique em **Create Service** → **Web Service**.
2. Em "Deployment method", escolha **GitHub**.
3. Selecione o repositório do seu projeto (ex.: `nexora-devkit`).
4. Em **Branch**, deixe a principal (geralmente `main`).

### Passo 1.3 — Apontar para a pasta do backend (MUITO IMPORTANTE)

Seu repositório tem duas pastas: `frontend` e `backend`. O Koyeb precisa saber que vai publicar **só o backend**.

1. Procure o campo **Work directory** (ou "Monorepo" / "Root directory").
2. Escreva exatamente: `backend`

> Se você não configurar isso, o Koyeb tenta rodar o projeto inteiro e falha.

### Passo 1.4 — Comandos de build e start

O Koyeb geralmente detecta que é um projeto Node automaticamente. Confirme (ou preencha) assim:

- **Build command:** `npm install && npm run build`
- **Run command:** `npm start`

> Esses comandos já foram preparados no seu projeto. O `build` compila o código; o `start` liga o servidor.

### Passo 1.5 — Porta (Instance / Ports)

1. Na seção **Exposing your service** (ou "Ports"), confirme que a porta é **8000**.
2. O Koyeb injeta a porta automaticamente numa variável chamada `PORT`, e o seu backend já usa essa variável. Então **não precisa mexer no código**. Só garanta que o "Port" no painel bate com o "Health check port" (o Koyeb costuma acertar sozinho).

> Se aparecer erro de health check, volte aqui e confirme a porta.

### Passo 1.6 — Variáveis de ambiente (as "configurações secretas")

Ainda na tela de criação, procure **Environment variables** e adicione **três** variáveis (botão "Add variable" para cada):

| Nome (Key) | Valor (Value) | Observação |
|---|---|---|
| `API_KEY` | *sua chave do Gemini* | A mesma do arquivo `backend/.env`. Marque como **Secret** se houver a opção. |
| `ENABLE_TUNNEL` | `false` | Mantém o túnel desligado em produção (não é necessário quando o backend já é público). |
| `ALLOWED_ORIGINS` | *deixe em branco por enquanto* | Vamos preencher no Passo 3, depois que o frontend estiver no ar. |

> **Não** crie a variável `PORT` manualmente — o Koyeb cuida disso.

### Passo 1.7 — Escolher o plano grátis e publicar

1. Em **Instance**, escolha o tipo **Free** (Eco / Nano — o gratuito).
2. Dê um nome ao serviço, ex.: `dev-studio-backend`.
3. Clique em **Deploy**.

O Koyeb vai baixar o código, compilar e ligar. Isso leva alguns minutos. Quando terminar, o status fica **Healthy** (verde).

### Passo 1.8 — Guardar a URL do backend

No topo do serviço, o Koyeb mostra a URL pública, algo como:

```
https://dev-studio-backend-suaconta.koyeb.app
```

**Copie e guarde essa URL.** Você vai usá-la na Parte 2.

### Passo 1.9 — Testar se o backend está no ar

Abra essa URL no navegador. Deve aparecer o texto:

```
Nexora Devkit Backend is Running
```

Se apareceu, o backend está publicado. 🎉

---

## PARTE 2 — Conectar o Frontend (Vercel) ao Backend (Koyeb)

O frontend precisa saber o endereço do backend. Isso é feito por **uma variável de ambiente** na Vercel chamada `VITE_BACKEND_URL`.

> **Importante:** o valor dessa variável é "embutido" no site na hora que a Vercel gera a versão publicada. Por isso, **depois de configurar, é obrigatório publicar de novo (redeploy)** — senão nada muda.

### Passo 2.1 — Abrir as configurações na Vercel

1. Acesse **https://vercel.com** e entre no seu projeto (o frontend).
2. Vá em **Settings** (Configurações) → **Environment Variables**.

### Passo 2.2 — Criar a variável

1. Clique em **Add New** (ou "Add another").
2. Preencha:
   - **Key (Nome):** `VITE_BACKEND_URL`
   - **Value (Valor):** a URL do Koyeb que você guardou, **sem barra no final**.
     Exemplo: `https://dev-studio-backend-suaconta.koyeb.app`
   - **Environments:** marque **Production** (e também Preview/Development, se quiser testar nas prévias).
3. Clique em **Save**.

> **Cuidado com a barra no final.** Use `https://...koyeb.app` e **não** `https://...koyeb.app/`. O barra a mais pode quebrar as chamadas.

### Passo 2.3 — Republicar o frontend (redeploy)

1. Vá na aba **Deployments**.
2. No deploy mais recente, clique no menu **⋯** (três pontos) → **Redeploy**.
3. Confirme.

Sem esse passo, a variável nova **não** entra em vigor.

---

## PARTE 3 — Liberar a comunicação (CORS)

Por segurança, o backend só aceita chamadas de endereços autorizados. Precisamos autorizar o endereço do seu frontend.

### Passo 3.1 — Descobrir a URL do seu frontend

É o endereço público da Vercel, algo como:

```
https://seu-app.vercel.app
```

(Se você usa um domínio próprio, ex.: `https://app.suaempresa.com`, use esse também.)

### Passo 3.2 — Preencher `ALLOWED_ORIGINS` no Koyeb

1. Volte ao **Koyeb** → seu serviço `dev-studio-backend` → **Settings** → **Environment variables**.
2. Edite a variável `ALLOWED_ORIGINS` e coloque a(s) URL(s) do frontend, **separadas por vírgula, sem barra no final**:

   ```
   https://seu-app.vercel.app
   ```

   Se tiver domínio próprio também:

   ```
   https://seu-app.vercel.app,https://app.suaempresa.com
   ```

3. Salve. O Koyeb vai republicar o backend automaticamente (aguarde ficar **Healthy** de novo).

> **Por que isso importa?** Se `ALLOWED_ORIGINS` ficar vazio, o backend libera para qualquer site (inseguro). Preenchendo, só o SEU frontend consegue usar o backend.

---

## PARTE 4 — Testar tudo funcionando

Abra o seu site da Vercel (a URL pública) e teste cada módulo:

1. **CNPJ:** consulte um CNPJ válido. Deve retornar os dados.
2. **Studio / IA (Gemini):** peça uma geração/explicação. Deve responder.
3. **Diff / Regex:** rode a "Análise IA". Deve responder.
4. **API Client:** faça uma requisição via proxy. Deve funcionar.
5. **Mock Interceptor:** crie um endpoint, envie uma chamada e veja o log aparecer em tempo real (isso é o SSE funcionando).

Sobre o **Mock**: em produção, o painel de "Túnel Público (Cloudflare)" **não aparece mais** — e isso é o esperado. O motivo: como o backend já está público no Koyeb, os webhooks externos podem chamar diretamente:

```
https://dev-studio-backend-suaconta.koyeb.app/hooks/SEU_ENDPOINT
```

Ou seja, o túnel virou desnecessário. O módulo Mock continua completo: criar endpoints, ver logs ao vivo, cenários, tudo.

---

## PARTE 5 — Rodando na sua máquina (desenvolvimento local)

Quando você for mexer/testar localmente (não em produção), o funcionamento é o mesmo de sempre:

**Backend:**
```
cd backend
npm install
npm run dev
```

Se quiser testar o **túnel Cloudflare localmente** (para receber webhook externo na sua máquina), crie um arquivo `backend/.env` com:
```
API_KEY=sua_chave_gemini
ENABLE_TUNNEL=true
```
Aí o painel do túnel volta a aparecer no Mock. Em produção, mantenha `false`.

**Frontend:**
```
cd frontend
npm install
npm run dev
```
Localmente, sem a variável `VITE_BACKEND_URL`, o frontend usa `http://localhost:3001` automaticamente. Não precisa configurar nada.

---

## Resolução de problemas (o que fazer se der errado)

| Sintoma | Provável causa | O que fazer |
|---|---|---|
| Backend não abre / erro de health check no Koyeb | Porta errada ou `Work directory` não é `backend` | Confira Passos 1.3 e 1.5 |
| Site abre, mas IA/CNPJ não respondem | `VITE_BACKEND_URL` errada ou faltou o **redeploy** na Vercel | Refaça Passos 2.2 e 2.3 (atenção à barra no final) |
| Erro no navegador falando de **CORS** / "blocked" | `ALLOWED_ORIGINS` não inclui a URL do frontend | Refaça o Passo 3.2 com a URL exata |
| IA responde "chave inválida" | `API_KEY` errada no Koyeb | Confira o Passo 1.6 |
| Mock não mostra logs ao vivo | Backend "dormiu" ou reiniciou | No plano grátis pode haver reinício; recarregue a página para reconectar o SSE |
| Build falha no Koyeb | Cache antigo | No Koyeb, clique em **Redeploy** para reconstruir do zero |

---

## Checklist final

- [ ] Backend publicado no Koyeb e mostrando "Nexora Devkit Backend is Running"
- [ ] `API_KEY`, `ENABLE_TUNNEL=false` e `ALLOWED_ORIGINS` configuradas no Koyeb
- [ ] `VITE_BACKEND_URL` configurada na Vercel (sem barra no final)
- [ ] **Redeploy** feito na Vercel após configurar a variável
- [ ] `ALLOWED_ORIGINS` preenchida com a URL real do frontend
- [ ] Todos os módulos testados no site publicado

---

### Observação técnica (para quando um dev te ajudar)

Foram feitas 3 mudanças no código para viabilizar este deploy, todas já aplicadas:

1. **Flag `ENABLE_TUNNEL`** no backend (`server.ts`): o túnel Cloudflare agora só liga quando `ENABLE_TUNNEL=true`. Em produção fica desligado, e o painel some no frontend automaticamente.
2. **Scripts de produção** adicionados em `backend/package.json` (`build` e `start`) e `outDir: dist` no `tsconfig.json`, para o Koyeb compilar e rodar.
3. **URL centralizada** (`frontend/src/config.ts`): todo o frontend agora lê o endereço do backend de `VITE_BACKEND_URL`, com fallback para `localhost:3001` no desenvolvimento.

> Antes do primeiro deploy, rode `cd frontend && npm install && npm run build` na sua máquina para confirmar que o frontend compila sem erros (o backend já foi validado: compila com exit 0).
