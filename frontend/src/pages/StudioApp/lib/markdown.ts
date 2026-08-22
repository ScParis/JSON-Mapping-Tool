import { marked } from 'marked';
import DOMPurify from 'dompurify';
import hljs from 'highlight.js';
import { TextFormat } from '../types';

export const CONTRACT_VARIABLES = [
  'CONTRATANTE_NOME_EMPRESARIAL', 'CONTRATANTE_CNPJ', 'CONTRATANTE_ENDERECO_COMPLETO',
  'CONTRATANTE_NOME_SOCIO', 'CONTRATANTE_CEP', 'CONTRATANTE_LOGRADOURO',
  'CONTRATANTE_NUMERO', 'CONTRATANTE_COMPLEMENTO', 'CONTRATANTE_BAIRRO',
  'CONTRATANTE_MUNICIPIO', 'CONTRATANTE_UF', 'CONTRATANTE_PONTO_FOCAL_NOME',
  'CONTRATANTE_REPRESENTANTE_NOME', 'CONTRATANTE_REPRESENTANTE_CARGO',
  'PROPOSTA_COMERCIAL_DATA', 'DATA_ASSINATURA_CONTRATO', 'OBJETIVO_1',
  'OBJETIVO_2', 'ESCOPO_SERVICOS_LISTA', 'MODELO_TRABALHO_CARGA_HORARIA_TOTAL_NUM',
  'MODELO_TRABALHO_CARGA_HORARIA_TOTAL_EXTENSO', 'MODELO_TRABALHO_NUMERO_SESSOES_NUM',
  'MODELO_TRABALHO_NUMERO_SESSOES_EXTENSO', 'MODELO_TRABALHO_DURACAO_SESSAO_EXTENSO',
  'MODELO_TRABALHO_PRAZO_CONCLUSAO_DIAS_NUM', 'MODELO_TRABALHO_PRAZO_CONCLUSAO_DIAS_EXTENSO',
  'PAGAMENTO_VALOR_TOTAL_NUMERICO', 'PAGAMENTO_VALOR_TOTAL_EXTENSO',
  'PAGAMENTO_DESCRICAO_PARCELAS', 'PAGAMENTO_FORMA_GERAL',
  'VIGENCIA_INICIO_SERVICOS_DIA_FORMATADO', 'VIGENCIA_DURACAO_ESTIMADA_DIAS_NUM',
  'VIGENCIA_DURACAO_HORAS_CONTRATADAS_NUM'
];

export const PIPERUN_ENTITIES: Record<string, string[]> = {
  generico: ['paginaAtual', 'totalPaginas', 'hoje', 'hojeExtenso', 'saudacao'],
  usuario: ['id', 'nome', 'email', 'telefone', 'assinatura'],
  pessoa: ['id', 'nome', 'nomeSimples', 'cpf', 'email', 'telefone', 'enderecoCompleto', 'cargo'],
  empresa: ['id', 'nome', 'razaoSocial', 'cnpj', 'ie', 'website', 'enderecoCompleto'],
  oportunidade: ['id', 'titulo', 'valor', 'valorMrr', 'dataCriacao', 'url', 'empresa', 'pessoa', 'propostaMaisNova', 'dono', 'funil', 'etapa'],
  proposta: ['sigla', 'valor', 'valorMrr', 'moeda', 'metodoPagamentoPs', 'dataExpiracao', 'itens', 'itensTabela'],
  propostaItem: ['quantidadeFormatada', 'duracaoFormatada', 'valorUnitarioFormatado', 'descontoFormatado', 'subtotalFormatado', 'caracteristicasFormatadas', 'item']
};

export const isVariableValid = (path: string): boolean => {
  if (!path) return false;
  const cleanPath = path.trim();
  if (CONTRACT_VARIABLES.includes(cleanPath)) return true;
  if (cleanPath.includes('.')) {
    const segments = cleanPath.split('.');
    const entity = segments[0];
    const attrs = PIPERUN_ENTITIES[entity];
    if (!attrs) return false;
    const baseAttr = segments[1].split('(')[0];
    return attrs.some(a => baseAttr.startsWith(a));
  }
  return false;
};

const variableExtension = {
  name: 'variable',
  level: 'inline' as const,
  start(src: string) { return src.indexOf('{{'); },
  tokenizer(src: string) {
    const rule = /^\{\{\s*([\w.]+)(?:[^}]*?)\}\}/; 
    const match = rule.exec(src);
    if (match) {
      return {
        type: 'variable',
        raw: match[0],
        path: match[1],
      };
    }
  },
  renderer(token: any) {
    const isValid = isVariableValid(token.path);
    return `<span class="variable-tag ${isValid ? 'variable-known' : 'variable-unknown'}" title="${isValid ? 'Válida' : 'Desconhecida'}">${token.raw}</span>`;
  }
};

const logicExtension = {
  name: 'logic',
  level: 'inline' as const,
  start(src: string) { return src.indexOf('{%'); },
  tokenizer(src: string) {
    const rule = /^\{%[\s\S]+?%\}/;
    const match = rule.exec(src);
    if (match) {
      return {
        type: 'logic',
        raw: match[0],
      };
    }
  },
  renderer(token: any) {
    return `<span class="bg-blue-500/10 text-blue-500 border border-blue-500/20 px-1.5 py-0.5 rounded font-mono text-[11px] font-bold" title="Lógica">${token.raw}</span>`;
  }
};

marked.use({
  gfm: true,
  breaks: true,
  extensions: [variableExtension, logicExtension],
  renderer: {
    code({ text, lang }: { text: string; lang?: string }) {
      const code = text || '';
      const language = lang || 'plaintext';
      const highlighted = hljs.getLanguage(language) ? hljs.highlight(code, { language }).value : code;
      return `<pre class="language-${language}"><code class="hljs language-${language}">${highlighted}</code></pre>`;
    }
  }
});

const parseCSVLine = (text: string, delimiter: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuote = false;
    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        if (char === '"') {
            if (inQuote && text[i + 1] === '"') { current += '"'; i++; } else { inQuote = !inQuote; }
        } else if (char === delimiter && !inQuote) {
            result.push(current);
            current = '';
        } else { current += char; }
    }
    result.push(current);
    return result;
};

export const detectDelimiter = (text: string): string => {
    const candidates = [',', ';', '\t', '|'];
    const lines = (text || '').trim().split('\n').filter(l => l.trim().length > 0).slice(0, 10);
    if (lines.length < 1) return ',';
    let bestDelimiter = ',';
    let maxConsistency = -1;
    for (const delim of candidates) {
        const counts = lines.map(line => parseCSVLine(line, delim).length);
        const avg = counts.reduce((a, b) => a + b, 0) / counts.length;
        if (avg <= 1) continue;
        const variance = counts.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / counts.length;
        const consistency = 1 / (variance + 0.0001);
        if (consistency > maxConsistency) {
            maxConsistency = consistency;
            bestDelimiter = delim;
        }
    }
    return bestDelimiter;
};

export const csvToJsonString = (text: string): string => {
  const delimiter = detectDelimiter(text);
  const lines = (text || '').trim().split('\n');
  if (lines.length < 2) return '[]';
  const headers = parseCSVLine(lines[0], delimiter).map(h => h.trim().replace(/^"|"$/g, ''));
  const result = [];
  for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      const values = parseCSVLine(line, delimiter);
      const obj: any = {};
      headers.forEach((header, index) => {
          let val = values[index] ? values[index].trim() : '';
          if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1).replace(/""/g, '"');
          if (val.toLowerCase() === 'true') obj[header] = true;
          else if (val.toLowerCase() === 'false') obj[header] = false;
          else if (!isNaN(Number(val)) && val !== '') obj[header] = Number(val);
          else obj[header] = val;
      });
      result.push(obj);
  }
  return JSON.stringify(result, null, 2);
};

export const renderPreview = (content: string, format: TextFormat): string => {
  if (!content || !content.trim()) return '';
  const sanitized = DOMPurify.sanitize(content);

  switch (format) {
    case TextFormat.JSON:
      try {
        const obj = JSON.parse(content);
        const highlighted = hljs.highlight(JSON.stringify(obj, null, 2), { language: 'json' }).value;
        return `<pre class="p-6 overflow-auto"><code class="hljs language-json">${highlighted}</code></pre>`;
      } catch (e) { return `<div class="p-4 bg-red-500/10 text-red-500 rounded">JSON Inválido</div>`; }
    case TextFormat.MARKDOWN:
      try {
        return DOMPurify.sanitize(marked.parse(content) as string, {
          ADD_TAGS: ['span', 'div', 'table', 'thead', 'tbody', 'tr', 'th', 'td'],
          ADD_ATTR: ['class', 'title']
        });
      } catch (e) { return `Erro no Markdown`; }
    case TextFormat.HTML:
      return `<div class="html-preview-container border border-base rounded-2xl overflow-hidden bg-white">
        <div class="p-2 bg-app border-b border-base text-[10px] font-bold uppercase tracking-widest text-muted flex items-center gap-2">
          <div class="w-2 h-2 rounded-full bg-red-450"></div>
          <div class="w-2 h-2 rounded-full bg-amber-400"></div>
          <div class="w-2 h-2 rounded-full bg-emerald-400"></div>
          Live Render
        </div>
        <div class="p-4">${content}</div>
      </div>`;
    case TextFormat.SQL:
      try {
        const highlighted = hljs.highlight(content, { language: 'sql' }).value;
        return `<div class="space-y-4 font-mono">
          <pre class="p-6 overflow-auto bg-zinc-900 rounded-2xl"><code class="hljs language-sql">${highlighted}</code></pre>
          <div class="p-4 bg-blue-500/5 border border-blue-500/10 rounded-xl text-[10px] font-bold text-blue-500 uppercase tracking-widest">
            Query ready for execution
          </div>
        </div>`;
      } catch (e) { return `<pre>${sanitized}</pre>`; }
    case TextFormat.CSV:
      try {
        const jsonStr = csvToJsonString(content);
        const data = JSON.parse(jsonStr);
        if (data.length === 0) return `<div class="p-4 text-muted">No data found</div>`;
        
        const headers = Object.keys(data[0]);
        let tableHtml = `<div class="table-wrapper overflow-x-auto rounded-xl border border-base bg-panel shadow-sm">
          <table class="w-full text-left border-collapse min-w-max">
            <thead><tr class="bg-app/50 border-b border-base">`;
        
        headers.forEach(h => {
          tableHtml += `<th class="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-muted">${h}</th>`;
        });
        
        tableHtml += `</tr></thead><tbody>`;
        
        data.forEach((row: any) => {
          tableHtml += `<tr class="border-b border-base/50 hover:bg-accent/5 transition-colors">`;
          headers.forEach(h => {
            tableHtml += `<td class="px-4 py-3 text-xs font-medium text-primary">${row[h]}</td>`;
          });
          tableHtml += `</tr>`;
        });
        
        tableHtml += `</tbody></table></div>`;
        return tableHtml;
      } catch (e) { return `<div class="p-4 bg-red-500/10 text-red-500 rounded">CSV Inválido</div>`; }
    default:
      return `<div class="whitespace-pre-wrap">${sanitized}</div>`;
  }
};

export const detectFormat = (text: string): TextFormat => {
  const trimmed = (text || '').trim();
  if (!trimmed) return TextFormat.MARKDOWN;
  if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
    try { JSON.parse(trimmed); return TextFormat.JSON; } catch (e) {}
  }
  return TextFormat.MARKDOWN;
};

export const DEFAULT_CONTENT = `### 👋 Universal Document Engine

Este é o seu novo workspace de alta performance. 
Experimente tokens dinâmicos: {{ pessoa.nome }}

\`\`\`json
{
  "status": "online",
  "version": "2.7.0",
  "engine": "Gemini 3 Pro"
}
\`\`\`

> [!TIP]
> Use Magic AI para refinar seus textos em tempo real.
`;