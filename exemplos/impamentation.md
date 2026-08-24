# JSON Mapper — Instruções de Implementação do Frontend
## 1. Visão Geral
O **JSON Mapper** é uma ferramenta web para mapeamento visual de dados entre estruturas JSON. O usuário fornece um JSON de origem e um JSON de saída (template), e o sistema gera automaticamente o JSON mapeado com os dados preenchidos.
**Stack tecnológica:**
- React 18 + TypeScript
- Vite (bundler)
- Tailwind CSS + Design Tokens (HSL)
- shadcn/ui (componentes base)
- Lucide React (ícones)
---
## 2. Estrutura de Arquivos
```
src/
├── components/
│   ├── Header.tsx          # Cabeçalho com navegação por abas
│   ├── Sidebar.tsx         # Painel lateral com ações e status
│   ├── JsonPanel.tsx       # Editor/visualizador de JSON reutilizável
│   ├── Toolbar.tsx         # Barra de ferramentas (formatar, minificar, importar/exportar)
│   ├── NavLink.tsx         # Link de navegação auxiliar
│   └── ui/                 # Componentes shadcn/ui (button, dialog, etc.)
├── hooks/
│   └── useJsonMapper.ts    # Hook central com toda a lógica de estado e mapeamento
├── pages/
│   └── Index.tsx           # Página principal — composição do layout
├── index.css               # Design tokens e estilos globais
└── App.tsx                 # Roteamento e providers
```
---
## 3. Design System
### 3.1 Tokens de Cor (HSL)
Definidos em `src/index.css` e mapeados em `tailwind.config.ts`. **Nunca use cores hardcoded nos componentes.** Sempre use tokens semânticos:
| Token | Uso |
|---|---|
| `--background` / `--foreground` | Fundo e texto principal da página |
| `--card` / `--card-foreground` | Fundo e texto de painéis/cards |
| `--primary` / `--primary-foreground` | Botões principais, destaques |
| `--muted` / `--muted-foreground` | Elementos secundários, placeholders |
| `--accent` / `--accent-foreground` | Destaques sutis (dicas, badges) |
| `--destructive` | Erros e ações destrutivas |
| `--success` | Validação positiva |
| `--warning` | Estados intermediários |
| `--json-key`, `--json-string`, `--json-number`, `--json-null` | Syntax highlighting do editor |
### 3.2 Tipografia
- **Sans-serif:** `Inter` (via `--font-sans`) — UI geral
- **Monospace:** `JetBrains Mono` (via `--font-mono`) — editores JSON
### 3.3 Tema Escuro
Suportado via classe `.dark` no `:root`. Todos os tokens possuem variantes escuras.
---
## 4. Componentes
### 4.1 `Header` (`src/components/Header.tsx`)
**Responsabilidade:** Cabeçalho fixo com logotipo e navegação por abas.
| Prop | Tipo | Descrição |
|---|---|---|
| `activeTab` | `string` | Aba ativa (`"mapper"`, `"help"`, `"config"`) |
| `onTabChange` | `(tab: string) => void` | Callback de mudança de aba |
**Abas disponíveis:**
- `mapper` — Mapeador (principal)
- `help` — Ajuda
- `config` — Configurações
---
### 4.2 `Sidebar` (`src/components/Sidebar.tsx`)
**Responsabilidade:** Painel lateral esquerdo com ações rápidas, informações de status e dicas.
| Prop | Tipo | Descrição |
|---|---|---|
| `mappedFields` | `number` | Número de campos mapeados |
| `status` | `"ready" \| "mapping" \| "done"` | Estado atual do mapeamento |
| `lastAction` | `string` | Descrição da última ação executada |
| `onLoadExamples` | `() => void` | Carrega dados de exemplo |
| `onClearAll` | `() => void` | Limpa todos os campos |
**Seções:**
1. **Ações Rápidas** — Botões: Novo Mapeamento, Carregar Exemplos, Limpar Tudo
2. **Informações** — Campos mapeados, status, última ação
3. **Dicas** — Card com orientações de uso
---
### 4.3 `JsonPanel` (`src/components/JsonPanel.tsx`)
**Responsabilidade:** Componente reutilizável de edição/visualização de JSON. Usado 3 vezes na tela principal.
| Prop | Tipo | Descrição |
|---|---|---|
| `title` | `string` | Título do painel |
| `icon` | `ReactNode` | Ícone no header |
| `value` | `string` | Conteúdo JSON (string) |
| `onChange` | `(value: string) => void` | Callback de edição (opcional) |
| `isValid` | `boolean` | Indica se o JSON é válido |
| `readOnly` | `boolean` | Modo somente leitura |
| `statusLabel` | `string` | Texto do status no rodapé |
| `statusType` | `"valid" \| "waiting" \| "error"` | Tipo visual do indicador |
**Funcionalidades embutidas:**
- Copiar para clipboard
- Limpar conteúdo
- Importar arquivo `.json`
- Exportar/download como `.json`
- Indicador de status colorido no rodapé
---
### 4.4 `Toolbar` (`src/components/Toolbar.tsx`)
**Responsabilidade:** Barra de ferramentas global acima dos painéis.
| Prop | Tipo | Descrição |
|---|---|---|
| `onValidate` | `() => void` | Validar JSONs |
| `onFormat` | `() => void` | Formatar (pretty-print) |
| `onMinify` | `() => void` | Minificar |
| `sourceValid` | `boolean` | JSON de origem válido |
| `targetValid` | `boolean` | JSON de saída válido |
**Botões:**
- Badge de validação (verde/vermelho)
- Formatar
- Minify
- Importar (placeholder)
- Exportar (placeholder)
---
## 5. Hook Central: `useJsonMapper`
Localizado em `src/hooks/useJsonMapper.ts`. Gerencia todo o estado da aplicação.
### 5.1 Estado
| Campo | Tipo | Descrição |
|---|---|---|
| `sourceJson` | `string` | JSON de origem (editável) |
| `targetJson` | `string` | JSON de saída/template (editável) |
| `mappedJson` | `string` | JSON resultante do mapeamento |
| `sourceValid` | `boolean` | Validação do JSON de origem |
| `targetValid` | `boolean` | Validação do JSON de saída |
| `mappedFields` | `number` | Contagem de campos mapeados |
| `status` | `"ready" \| "mapping" \| "done"` | Estado do processo |
| `lastAction` | `string` | Última ação executada |
### 5.2 Ações
| Função | Descrição |
|---|---|
| `updateSource(value)` | Atualiza JSON de origem + valida |
| `updateTarget(value)` | Atualiza JSON de saída + valida |
| `formatJson()` | Pretty-print de ambos os JSONs |
| `minifyJson()` | Minifica ambos os JSONs |
| `loadExamples()` | Carrega dados de exemplo predefinidos |
| `clearAll()` | Limpa todos os campos |
| `generateMapping()` | Executa o mapeamento (simulado, 800ms delay) |
### 5.3 Lógica de Mapeamento
Atualmente o mapeamento é **hardcoded** para os exemplos de demonstração. O `generateMapping()` faz uma transformação direta:
```
pedido.id           → order.number
pedido.data         → order.date
pedido.itens[].id   → order.items[].code
pedido.itens[].nome → order.items[].description
pedido.entrega.tipo → order.delivery.type
pedido.entrega.preco→ order.delivery.cost
cliente.id          → customer.id
cliente.nome        → customer.name
cliente.email       → customer.contact
```
> **Para produção:** Substituir por mapeamento dinâmico (drag-and-drop, expressões configuráveis, ou integração com IA).
---
## 6. Layout da Página Principal (`Index.tsx`)
```
┌─────────────────────────────────────────────────┐
│                    Header                        │
├──────────┬──────────────────────────────────────┤
│          │           Toolbar                     │
│          ├──────────┬──────────┬────────────────┤
│ Sidebar  │  JSON    │  JSON   │   JSON         │
│          │  Origem  │  Saída  │   Mapeado      │
│          │          │         │   (readonly)   │
│          ├──────────┴──────────┴────────────────┤
│          │      [ Gerar Mapeamento ]            │
└──────────┴──────────────────────────────────────┘
```
- Layout: `flex` vertical (header + conteúdo)
- Conteúdo: `flex` horizontal (sidebar + main)
- Main: `flex` vertical (toolbar + grid 3 colunas + botão)
- Grid: `grid-cols-3` com gap uniforme
---
## 7. Estilos Globais (`index.css`)
### Classes utilitárias customizadas
| Classe | Uso |
|---|---|
| `.json-editor` | Textarea do editor (font mono, text-sm) |
| `.json-key`, `.json-string`, etc. | Syntax highlighting (preparado para uso futuro) |
| `.panel-header` | Header dos painéis JSON |
| `.status-dot` | Indicador circular de status |
| `.status-valid` | Dot verde (sucesso) |
| `.status-waiting` | Dot cinza (aguardando) |
---
## 8. Como Rodar
```bash
# Instalar dependências
npm install
# Rodar em desenvolvimento
npm run dev
# Acessa em http://localhost:8080
# Build para produção
npm run build
```
---
## 9. Próximos Passos Sugeridos
1. **Syntax Highlighting** — Implementar colorização real no editor usando as classes `.json-key`, `.json-string`, etc. (ex: CodeMirror ou Monaco Editor)
2. **Mapeamento Dinâmico** — Substituir a lógica hardcoded por mapeamento interativo (drag-and-drop entre campos)
3. **Responsividade** — Adaptar layout para mobile (colapsar sidebar, empilhar painéis)
4. **Persistência** — Salvar mapeamentos no localStorage ou backend
5. **Validação de Schema** — Suporte a JSON Schema para validação estrutural
6. **Histórico** — Undo/redo de alterações
7. **Temas** — Seletor de tema claro/escuro