import { ColumnDefinition, DataTypeOption, ExportConfig } from '../types';

export const DATA_TYPES: DataTypeOption[] = [
  // Personal
  { key: 'name_full', label: 'Nome Completo', category: 'personal', description: 'Ex: Ana Silva / John Doe' },
  { key: 'name_first', label: 'Primeiro Nome', category: 'personal', description: 'Ex: Carlos, Maria' },
  { key: 'name_last', label: 'Sobrenome', category: 'personal', description: 'Ex: Oliveira, Santos' },
  { key: 'cpf', label: 'CPF (Brasil)', category: 'personal', description: 'Ex: 123.456.789-00' },
  { key: 'cnpj', label: 'CNPJ (Brasil)', category: 'personal', description: 'Ex: 12.345.678/0001-90' },
  
  // Contact
  { key: 'email', label: 'Endereço de E-mail', category: 'contact', description: 'Ex: usuario@dominio.com' },
  { key: 'phone', label: 'Telefone Celular', category: 'contact', description: 'Ex: (11) 98765-4321' },
  { key: 'company_name', label: 'Nome de Empresa', category: 'contact', description: 'Ex: Tech Solutions Ltda' },

  // Location
  { key: 'address_street', label: 'Rua / Logradouro', category: 'location', description: 'Ex: Av. Paulista, 1000' },
  { key: 'address_city', label: 'Cidade', category: 'location', description: 'Ex: São Paulo, Rio de Janeiro' },
  { key: 'address_state', label: 'Estado (UF)', category: 'location', description: 'Ex: SP, RJ, MG' },
  { key: 'address_zip', label: 'CEP / Código Postal', category: 'location', description: 'Ex: 01310-100' },
  { key: 'country', label: 'País', category: 'location', description: 'Ex: Brasil, Estados Unidos' },

  // Identifiers & Tech
  { key: 'autoincrement', label: 'Auto Incremento (ID)', category: 'identifiers', description: 'Ex: 1, 2, 3...' },
  { key: 'uuid', label: 'UUID v4', category: 'identifiers', description: 'Ex: f47ac10b-58cc-4372-a567-0e02b2c3d479' },
  { key: 'boolean', label: 'Booleano (True/False)', category: 'identifiers', description: 'Ex: true, false' },

  // Numeric
  { key: 'integer', label: 'Número Inteiro', category: 'numeric', description: 'Ex: 42, 100, 500', defaultOptions: { min: 1, max: 1000 } },
  { key: 'decimal', label: 'Número Decimal / Preço', category: 'numeric', description: 'Ex: 99.90, 1499.50', defaultOptions: { min: 10, max: 5000, decimals: 2 } },

  // Datetime
  { key: 'date', label: 'Data (AAAA-MM-DD)', category: 'datetime', description: 'Ex: 2026-08-26' },
  { key: 'timestamp', label: 'Data e Hora (ISO)', category: 'datetime', description: 'Ex: 2026-08-26T14:30:00Z' },

  // Text & Custom
  { key: 'sentence', label: 'Texto / Descrição', category: 'text', description: 'Ex: Frase de teste gerada' },
  { key: 'custom_list', label: 'Lista Customizada (Opções)', category: 'custom', description: 'Ex: Ativo, Inativo, Pendente', defaultOptions: { customValues: ['Ativo', 'Inativo', 'Pendente'] } },
  { key: 'custom_regex', label: 'Máscara / Padrão Customizado', category: 'custom', description: 'Ex: ABC-####', defaultOptions: { regexFormat: 'PRD-####' } },
];

const FIRST_NAMES = ['Ana', 'Bruno', 'Carlos', 'Daniela', 'Eduardo', 'Fernanda', 'Gabriel', 'Helena', 'Igor', 'Juliana', 'Lucas', 'Mariana', 'Natan', 'Patricia', 'Rafael', 'Sofia', 'Thiago', 'Vanessa'];
const LAST_NAMES = ['Silva', 'Santos', 'Oliveira', 'Souza', 'Rodrigues', 'Ferreira', 'Alves', 'Pereira', 'Lima', 'Gomes', 'Costa', 'Ribeiro', 'Martins', 'Carvalho', 'Almeida', 'Lopes', 'Soares', 'Fernandes'];
const CITIES = ['São Paulo', 'Rio de Janeiro', 'Belo Horizonte', 'Curitiba', 'Porto Alegre', 'Salvador', 'Brasília', 'Fortaleza', 'Recife', 'Campinas', 'Florianópolis', 'Goiânia'];
const STATES = ['SP', 'RJ', 'MG', 'PR', 'RS', 'BA', 'DF', 'CE', 'PE', 'SC', 'GO', 'ES'];
const STREETS = ['Av. Paulista', 'Rua das Flores', 'Av. Copacabana', 'Rua XV de Novembro', 'Av. Brasil', 'Rua São João', 'Av. Rebouças', 'Rua Augusta'];
const COMPANIES = ['Tech Solutions Ltda', 'Nexus Inovações', 'Apex Sistemas', 'CyberData Brasil', 'Global Logística', 'Omni Corp', 'Alpha Digital', 'Horizonte TI'];
const DOMAINS = ['gmail.com', 'outlook.com', 'empresa.com.br', 'devstudio.io', 'tech.br'];

const getRandomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const getRandomItem = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

function generateCpf(): string {
  const n = Array.from({ length: 9 }, () => getRandomInt(0, 9));
  const d1 = (n.reduce((acc, val, i) => acc + val * (10 - i), 0) * 10) % 11 % 10;
  const d2 = ([...n, d1].reduce((acc, val, i) => acc + val * (11 - i), 0) * 10) % 11 % 10;
  return `${n.slice(0,3).join('')}.${n.slice(3,6).join('')}.${n.slice(6,9).join('')}-${d1}${d2}`;
}

function generateCnpj(): string {
  const n = Array.from({ length: 8 }, () => getRandomInt(0, 9));
  const base = [...n, 0, 0, 0, 1];
  const mult1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const mult2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  
  const d1 = (base.reduce((acc, val, i) => acc + val * mult1[i], 0) % 11 < 2) ? 0 : 11 - (base.reduce((acc, val, i) => acc + val * mult1[i], 0) % 11);
  const base2 = [...base, d1];
  const d2 = (base2.reduce((acc, val, i) => acc + val * mult2[i], 0) % 11 < 2) ? 0 : 11 - (base2.reduce((acc, val, i) => acc + val * mult2[i], 0) % 11);
  
  return `${n.slice(0,2).join('')}.${n.slice(2,5).join('')}.${n.slice(5,8).join('')}/0001-${d1}${d2}`;
}

function generateUuid(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

function generateCustomPattern(pattern: string): string {
  return pattern.replace(/#/g, () => getRandomInt(0, 9).toString())
                .replace(/\?/g, () => String.fromCharCode(65 + getRandomInt(0, 25)));
}

export function generateFieldValue(col: ColumnDefinition, rowIndex: number): any {
  if (col.nullPercentage > 0 && Math.random() * 100 < col.nullPercentage) {
    return null;
  }

  const opts = col.options || {};

  switch (col.type) {
    case 'autoincrement':
      return rowIndex + 1;
    case 'name_first':
      return getRandomItem(FIRST_NAMES);
    case 'name_last':
      return getRandomItem(LAST_NAMES);
    case 'name_full':
      return `${getRandomItem(FIRST_NAMES)} ${getRandomItem(LAST_NAMES)}`;
    case 'cpf':
      return generateCpf();
    case 'cnpj':
      return generateCnpj();
    case 'email': {
      const fn = getRandomItem(FIRST_NAMES).toLowerCase();
      const ln = getRandomItem(LAST_NAMES).toLowerCase();
      return `${fn}.${ln}${getRandomInt(1, 99)}@${getRandomItem(DOMAINS)}`;
    }
    case 'phone':
      return `(11) 9${getRandomInt(1000, 9999)}-${getRandomInt(1000, 9999)}`;
    case 'company_name':
      return getRandomItem(COMPANIES);
    case 'address_street':
      return `${getRandomItem(STREETS)}, ${getRandomInt(10, 2000)}`;
    case 'address_city':
      return getRandomItem(CITIES);
    case 'address_state':
      return getRandomItem(STATES);
    case 'address_zip':
      return `${getRandomInt(10000, 99999)}-${getRandomInt(100, 999)}`;
    case 'country':
      return 'Brasil';
    case 'uuid':
      return generateUuid();
    case 'boolean':
      return Math.random() > 0.5;
    case 'integer':
      return getRandomInt(opts.min ?? 1, opts.max ?? 1000);
    case 'decimal': {
      const min = opts.min ?? 10;
      const max = opts.max ?? 5000;
      const val = Math.random() * (max - min) + min;
      return Number(val.toFixed(opts.decimals ?? 2));
    }
    case 'date': {
      const year = getRandomInt(2020, 2026);
      const month = String(getRandomInt(1, 12)).padStart(2, '0');
      const day = String(getRandomInt(1, 28)).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
    case 'timestamp':
      return new Date(Date.now() - getRandomInt(0, 365 * 24 * 3600 * 1000)).toISOString();
    case 'sentence':
      return `Exemplo de dado gerado para o campo ${col.title}`;
    case 'custom_list':
      if (opts.customValues && opts.customValues.length > 0) {
        return getRandomItem(opts.customValues);
      }
      return 'Opção 1';
    case 'custom_regex':
      return generateCustomPattern(opts.regexFormat || 'PRD-####');
    default:
      return `Dado_${rowIndex + 1}`;
  }
}

export function generateDataSet(columns: ColumnDefinition[], rowCount: number): Record<string, any>[] {
  const records: Record<string, any>[] = [];
  for (let i = 0; i < rowCount; i++) {
    const row: Record<string, any> = {};
    columns.forEach(col => {
      row[col.title] = generateFieldValue(col, i);
    });
    records.push(row);
  }
  return records;
}

export function exportFormattedData(data: Record<string, any>[], columns: ColumnDefinition[], config: ExportConfig): string {
  const { format, tableName, sqlDialect, includeDropTable } = config;

  if (format === 'json') {
    return JSON.stringify(data, null, 2);
  }

  if (format === 'csv' || format === 'tsv') {
    const delimiter = format === 'csv' ? ',' : '\t';
    const headers = columns.map(c => `"${c.title.replace(/"/g, '""')}"`).join(delimiter);
    const rows = data.map(row => {
      return columns.map(c => {
        const val = row[c.title];
        if (val === null || val === undefined) return '';
        if (typeof val === 'string') return `"${val.replace(/"/g, '""')}"`;
        return String(val);
      }).join(delimiter);
    });
    return [headers, ...rows].join('\n');
  }

  if (format === 'xml') {
    const tag = tableName.toLowerCase().replace(/[^a-z0-9]/gi, '_') || 'record';
    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<dataset>\n`;
    data.forEach(row => {
      xml += `  <${tag}>\n`;
      columns.forEach(c => {
        const val = row[c.title];
        const valStr = val === null || val === undefined ? '' : String(val).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        xml += `    <${c.title}>${valStr}</${c.title}>\n`;
      });
      xml += `  </${tag}>\n`;
    });
    xml += `</dataset>`;
    return xml;
  }

  if (format === 'sql') {
    const safeTable = tableName.replace(/[^a-zA-Z0-9_]/g, '') || 'minha_tabela';
    let sql = '';
    
    if (includeDropTable) {
      if (sqlDialect === 'postgres') sql += `DROP TABLE IF EXISTS "${safeTable}";\n\n`;
      else sql += `DROP TABLE IF EXISTS \`${safeTable}\`;\n\n`;
    }

    const colsStr = columns.map(c => sqlDialect === 'postgres' ? `"${c.title}"` : `\`${c.title}\``).join(', ');

    const valueRows = data.map(row => {
      const vals = columns.map(c => {
        const val = row[c.title];
        if (val === null || val === undefined) return 'NULL';
        if (typeof val === 'number' || typeof val === 'boolean') return String(val);
        return `'${String(val).replace(/'/g, "''")}'`;
      }).join(', ');
      return `(${vals})`;
    });

    sql += `INSERT INTO ${sqlDialect === 'postgres' ? `"${safeTable}"` : `\`${safeTable}\``} (${colsStr}) VALUES\n`;
    sql += valueRows.join(',\n') + ';\n';
    return sql;
  }

  return JSON.stringify(data, null, 2);
}
