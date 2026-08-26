import * as XLSX from 'xlsx';
import { ColumnDefinition, DataTypeKey } from '../types';

function inferDataTypeFromKey(key: string, sampleValue?: any): DataTypeKey {
  const k = key.toLowerCase().trim();

  if (k === 'id' || k.endsWith('_id') || k.endsWith('id')) {
    if (typeof sampleValue === 'string' && sampleValue.length > 20) return 'uuid';
    return 'autoincrement';
  }
  if (k.includes('email') || k.includes('mail') || k.includes('e-mail')) return 'email';
  if (k.includes('cpf')) return 'cpf';
  if (k.includes('cnpj')) return 'cnpj';
  if (k.includes('phone') || k.includes('telef') || k.includes('celular') || k.includes('fone')) return 'phone';
  if (k.includes('fullname') || k.includes('nome_completo') || k.includes('full_name') || k.includes('nome completo')) return 'name_full';
  if (k.includes('firstname') || k.includes('primeiro_nome') || k.includes('first_name') || k.includes('primeiro nome')) return 'name_first';
  if (k.includes('lastname') || k.includes('sobrenome') || k.includes('last_name')) return 'name_last';
  if (k.includes('name') || k.includes('nome') || k.includes('dono') || k.includes('usuario') || k.includes('contato')) return 'name_full';
  if (k.includes('city') || k.includes('cidade')) return 'address_city';
  if (k.includes('state') || k.includes('estado') || k.includes('uf')) return 'address_state';
  if (k.includes('zip') || k.includes('cep')) return 'address_zip';
  if (k.includes('address') || k.includes('end') || k.includes('rua') || k.includes('logradouro')) return 'address_street';
  if (k.includes('company') || k.includes('empresa') || k.includes('organizacao')) return 'company_name';
  if (k.includes('country') || k.includes('pais')) return 'country';
  if (k.includes('uuid')) return 'uuid';
  if (k.includes('status') || k.includes('situacao') || k.includes('type') || k.includes('tipo') || k.includes('categoria') || k.includes('origem') || k.includes('tags') || k.includes('temperatura')) return 'custom_list';
  if (k.includes('price') || k.includes('preco') || k.includes('valor') || k.includes('total') || k.includes('amount') || k.includes('mrr') || k.includes('p&s')) return 'decimal';
  if (k.includes('age') || k.includes('idade') || k.includes('count') || k.includes('qtd') || k.includes('quantidade') || k.includes('probabilidade')) return 'integer';
  if (k.includes('date') || k.includes('data') || k.includes('fechamento') || k.includes('previsao')) return 'date';
  if (k.includes('time') || k.includes('created') || k.includes('updated') || k.includes('timestamp')) return 'timestamp';
  if (k.includes('active') || k.includes('is_') || k.includes('ativo') || k.includes('enabled')) return 'boolean';

  if (typeof sampleValue === 'number') {
    return Number.isInteger(sampleValue) ? 'integer' : 'decimal';
  }
  if (typeof sampleValue === 'boolean') {
    return 'boolean';
  }

  return 'sentence';
}

export async function parseFileToSchema(file: File): Promise<{ fileName: string; columns: ColumnDefinition[] }> {
  const fileName = file.name;
  const ext = fileName.split('.').pop()?.toLowerCase();

  let keys: { name: string; sample?: any }[] = [];

  if (ext === 'xlsx' || ext === 'xls') {
    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      if (!firstSheetName) {
        throw new Error('Nenhuma aba encontrada na planilha Excel.');
      }
      const worksheet = workbook.Sheets[firstSheetName];
      const rows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      
      if (rows.length > 0) {
        const headerRow = rows[0] || [];
        const sampleRow = rows.length > 1 ? rows[1] : [];
        keys = headerRow
          .filter(h => h !== null && h !== undefined && String(h).trim().length > 0)
          .map((colName, idx) => ({
            name: String(colName).trim(),
            sample: sampleRow[idx]
          }));
      }
    } catch (e: any) {
      throw new Error(`Falha ao ler planilha Excel (.xlsx/.xls): ${e.message}`);
    }
  } else if (ext === 'json') {
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const targetObj = Array.isArray(parsed) ? parsed[0] : parsed;
      if (targetObj && typeof targetObj === 'object') {
        keys = Object.keys(targetObj).map(k => ({ name: k, sample: targetObj[k] }));
      }
    } catch (e) {
      throw new Error('Falha ao analisar arquivo JSON. Certifique-se de que a sintaxe seja válida.');
    }
  } else if (ext === 'csv' || ext === 'tsv' || ext === 'txt') {
    const text = await file.text();
    const delimiter = ext === 'tsv' ? '\t' : (text.includes(';') ? ';' : ',');
    const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
    if (lines.length > 0) {
      const headerCols = lines[0].split(delimiter).map(c => c.replace(/^["']|["']$/g, '').trim());
      const sampleRow = lines.length > 1 ? lines[1].split(delimiter) : [];
      keys = headerCols
        .filter(c => c.length > 0)
        .map((colName, idx) => ({
          name: colName,
          sample: sampleRow[idx]
        }));
    }
  } else {
    const text = await file.text();
    const cleanText = text.replace(/[^a-zA-Z0-9_\s,]/g, ' ');
    const possibleKeys = cleanText.split(/[\s,\n]+/).filter(w => w.length > 2 && !/^\d+$/.test(w)).slice(0, 15);
    const uniqueKeys = Array.from(new Set(possibleKeys));
    keys = uniqueKeys.map(k => ({ name: k }));
  }

  if (keys.length === 0) {
    throw new Error('Não foi possível identificar colunas ou campos no arquivo enviado.');
  }

  const columns: ColumnDefinition[] = keys.map((k, idx) => {
    const inferredType = inferDataTypeFromKey(k.name, k.sample);
    return {
      id: `col_${Date.now()}_${idx}`,
      title: k.name,
      type: inferredType,
      nullPercentage: 0,
      options: inferredType === 'custom_list' ? { customValues: ['Ativo', 'Inativo', 'Pendente'] } : undefined
    };
  });

  return { fileName, columns };
}
