# 🚀 Dev Studio v3.0 — Toolkit Completo para Desenvolvedores

<div align="center">

![Dev Studio Version](https://img.shields.io/badge/Dev%20Studio-v3.0-blueviolet?style=for-the-badge)
![React](https://img.shields.io/badge/React-18.3-61DAFB?style=for-the-badge&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=for-the-badge&logo=typescript)
![Node.js](https://img.shields.io/badge/Node.js-22.x-339933?style=for-the-badge&logo=node.js)
![Express](https://img.shields.io/badge/Express-5.x-000000?style=for-the-badge&logo=express)
![Gemini AI](https://img.shields.io/badge/Google%20Gemini%20AI-2.x-8E44AD?style=for-the-badge)
![License](https://img.shields.io/badge/license-MIT-green?style=for-the-badge)

*Uma suite integrada de ferramentas modernas para desenvolvedores, analistas e engenheiros de software.*

**Desenvolvido por [ScParis](https://github.com/ScParis)**

</div>

---

## 🌟 Visão Geral

O **Dev Studio** é uma plataforma web moderna e unificada que reúne **9 ferramentas essenciais** para aumentar a produtividade no dia a dia de desenvolvimento de software.

Com uma arquitetura Monorepo moderna composta por uma **Single Page Application (SPA) em React + Vite + TypeScript** no frontend e um **Servidor API Express + TypeScript** no backend integrado à **IA Google Gemini**, a suite oferece transformações de dados, testes de APIs, decodificação de segurança, geração de Mocks e assistente inteligente.

---

## 🧰 Ferramentas Integradas (9 em 1)

### 1. 🧩 **JSON Mapper & Transformation Engine (`/json`)**
- **Transformação Visual JMESPath**: Extraia, filtre e mapeie JSONs de origem para destinos complexos.
- **JSON Finder Interativo**: Navegue visualmente pela árvore do JSON e obtenha o caminho exato (*path*) de qualquer nó.
- **Tutorial Interativo**: 5 módulos completos do básico ao avançado com exercícios executáveis.
- **Assistente IA**: Ajuda a construir expressões JMESPath para estruturas complexas.

### 2. 🏢 **CNPJ Studio (`/cnpj`)**
- Consulta detalhada de dados cadastrais de empresas brasileiras via **ReceitaWS**.
- Preenchimento automático com proteção contra bloqueios de CORS por meio de proxy backend dedicado.

### 3. ⚖️ **Diff Studio (`/diff`)**
- Comparação *side-by-side* de textos, códigos e arquivos JSON.
- Destaque visual e estatísticas detalhadas de adições, remoções e modificações.

### 4. 🔐 **JWT Studio (`/jwt`)**
- Decodificação e inspeção instantânea de tokens **JWT (JSON Web Token)**.
- Validação visual de Header, Payload e Assinatura com indicação de data de expiração (*exp*).

### 5. 🔍 **Regex Studio (`/regex`)**
- Testador de Expressões Regulares com destaque de grupos de captura em tempo real.
- Explicador humano de Regex e gerador automático de padrões a partir de descrições em linguagem natural via **IA Gemini**.

### 6. 🗄️ **SQL Studio (`/sql`)**
- Formatador e embelezador de consultas SQL (PostgreSQL, MySQL, SQLite, SQL Server).
- Explicação de consultas complexas e gerador de queries assistido por **IA Gemini**.

### 7. 🌐 **API Studio (REST Client) (`/api`)**
- Cliente HTTP integrado para testar requisições (`GET`, `POST`, `PUT`, `DELETE`, `PATCH`).
- Suporte a cabeçalhos customizados, corpos JSON/Texto e **Proxy CORS seguro** com proteção **SSRF**.

### 8. 🛠️ **Mock Studio (`/mock`)**
- Servidor e interceptador de Mocks HTTP para desenvolvimento e testes.
- Criação de respostas dinâmicas, regras personalizadas e compartilhamento via **Tunneling** (`cloudflared` / `localtunnel`).

### 9. 🤖 **Nexus AI & Studio Dashboard (`/studio`)**
- Dashboard principal com métricas, atalhos rápidos e hub de Inteligência Artificial.
- Assistente para refatoração, explicação de erros e geração de dados de teste.

---

## 🏗️ Arquitetura do Projeto

O repositório é estruturado em formato **Monorepo**:

```
JSON-Mapping-Tool/
├── backend/                  # Servidor API Node.js + Express + TypeScript
│   ├── src/
│   │   ├── server.ts         # Endpoints REST, Proxies e Integração Gemini
│   │   ├── security.ts       # Validador SSRF e Rate Limiter
│   │   └── mockStore.ts      # Armazenamento e execução de Mocks
│   ├── package.json
│   └── tsconfig.json
├── frontend/                 # Application React + Vite + TailwindCSS
│   ├── src/
│   │   ├── components/       # Componentes de UI reutilizáveis
│   │   ├── pages/            # As 9 ferramentas da suite Dev Studio
│   │   ├── services/         # Integrações de API e configurações de IA
│   │   └── App.tsx           # Roteamento central com React Router
│   ├── package.json
│   └── vite.config.ts
├── old/                      # Arquivos legados da versão v2.2 (HTML/JS estático)
├── package.json              # Script raiz com concurrently
├── IMPROVEMENTS.md           # Histórico detalhado de segurança e melhorias
└── README.md                 # Documentação oficial
```

---

## 🛡️ Recursos de Segurança

- **Proteção SSRF (Server-Side Request Forgery)**: O backend valida URLs de proxy impedindo acesso a IPs internos (`127.0.0.1`, `10.0.0.0/8`, `192.168.0.0/16`, `localhost`).
- **Rate Limiting**: Limitação de requisições por IP nos endpoints sensíveis de IA e Proxy.
- **Sanitização contra XSS**: Manipulação segura de elementos DOM usando `DOMPurify` e `textContent`.
- **CORS Controlado**: Configuração de origens permitidas via variáveis de ambiente.

---

## 🚀 Como Executar Localmente

### **Pré-requisitos**
- **Node.js**: Versão `18.x` ou superior (recomendado `22.x`)
- **npm**: Versão `9.x` ou superior

### **Passo 1: Clonar o Repositório**
```bash
git clone https://github.com/ScParis/JSON-Mapping-Tool.git
cd JSON-Mapping-Tool
```

### **Passo 2: Configurar Variáveis de Ambiente**
Crie um arquivo `.env` no diretório `backend/` baseado no `.env.example`:
```env
PORT=3001
GEMINI_API_KEY=sua_chave_gemini_aqui
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
```

### **Passo 3: Instalar Dependências**
```bash
# Instalar dependências no backend e frontend
npm install --prefix backend
npm install --prefix frontend
```

> 💡 **Nota para Usuários Linux em Discos Externos (NTFS / FAT32)**:
> Se estiver rodando o projeto a partir de uma partição montada sem suporte a permissões de execução POSIX ou symlinks, execute a instalação com `--no-bin-links`:
> ```bash
> npm install --no-bin-links --prefix backend
> npm install --no-bin-links --prefix frontend
> ```

### **Passo 4: Iniciar o Servidor de Desenvolvimento**
Na raiz do projeto, execute:
```bash
npm run dev
```

Isso iniciará simultaneamente:
- **Backend API**: `http://localhost:3001`
- **Frontend SPA**: `http://localhost:5173`

---

## 🧪 Executando os Testes Automatizados

O projeto conta com suíte de testes unitários para a segurança do backend e utilitários de transformação no frontend:

```bash
# Executar testes do backend
npm test --prefix backend

# Executar testes do frontend
npm test --prefix frontend
```

---

## 📝 Changelog Resumido

### **v3.0 (Atual - Fev 2026)**
- 🚀 **Dev Studio Launch**: Evolução para suite Monorepo com React + Vite + Express.
- 🤖 **Integração Gemini AI**: Assistente inteligente para SQL, Regex, Mocks e JSON.
- 🛡️ **Segurança Avançada**: Proteção contra SSRF e Rate Limiting no backend.
- 🧰 **9 Ferramentas**: JSON Mapper, CNPJ, Diff, JWT, Regex, SQL, API Client, Mock Server e Studio.

### **v2.2 (Legado - Mantido em `old/`)**
- 🎓 Tutorial de JMESPath e JSON Finder em HTML/CSS/JS estático.

---

## 📄 Licença

Este projeto está licenciado sob a Licença MIT.

---

<div align="center">

Made with ❤️ by [ScParis](https://github.com/ScParis)

</div>
