import { ColumnDefinition, DataTypeKey } from '../types';

function inferDataTypeFromKey(key: string, sampleValue?: any): DataTypeKey {
  const k = key.toLowerCase().trim();

  if (k === 'id' || k.endsWith('_id') || k.endsWith('id')) {
    if (typeof sampleValue === 'string' && sampleValue.length > 20) return 'uuid';
    return 'autoincrement';
  }
  if (k.includes('email') || k.includes('mail')) return 'email';
  if (k.includes('cpf')) return 'cpf';
  if (k.includes('cnpj')) return 'cnpj';
  if (k.includes('phone') || k.includes('telef') || k.includes('celular') || k.includes('fone')) return 'phone';
  if (k.includes('fullname') || k.includes('nome_completo') || k.includes('full_name')) return 'name_full';
  if (k.includes('firstname') || k.includes('primeiro_nome') || k.includes('first_name')) return 'name_first';
  if (k.includes('lastname') || k.includes('sobrenome') || k.includes('last_name')) return 'name_last';
  if (k.includes('name') || k.includes('nome')) return 'name_full';
  if (k.includes('city') || k.includes('cidade')) return 'address_city';
  if (k.includes('state') || k.includes('estado') || k.includes('uf')) return 'address_state';
  if (k.includes('zip') || k.includes('cep')) return 'address_zip';
  if (k.includes('address') || k.includes('end') || k.includes('rua') || k.includes('logradouro')) return 'address_street';
  if (k.includes('company') || k.includes('empresa')) return 'company_name';
  if (k.includes('country') || k.includes('pais')) return 'country';
  if (k.includes('uuid')) return 'uuid';
  if (k.includes('status') || k.includes('type') || k.includes('tipo') || k.includes('categoria')) return 'custom_list';
  if (k.includes('price') || k.includes('preco') || k.includes('valor') || k.includes('total') || k.includes('amount')) return 'decimal';
  if (k.includes('age') || k.includes('idade') || k.includes('count') || k.includes('qtd') || k.includes('quantidade')) return 'integer';
  if (k.includes('date') || k.includes('data')) return 'date';
  if (k.includes('time') || k.includes('created') || k.includes('updated')) return 'timestamp';
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
  const text = await file.text();
  const fileName = file.name;
  const ext = fileName.split('.').pop()?.toLowerCase();

  let keys: { name: string; sample?: any }[] = [];

  if (ext === 'json') {
    try {
      const parsed = JSON.parse(text);
      const targetObj = Array.isArray(parsed) ? parsed[0] : parsed;
      if (targetObj && typeof targetObj === 'object') {
        keys = Object.keys(targetObj).map(k => ({ name: k, sample: targetObj[k] }));
      }
    } catch (e) {
      throw new Error('Falha ao analisar arquivo JSON. Certifique-se de que a sintaxe seja válida.');
    }
  } else if (ext === 'csv' || ext === 'tsv' || ext === 'txt') {
    const delimiter = ext === 'tsv' ? '\t' : (text.includes(';') ? ';' : ',');
    const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
    if (lines.length > 0) {
      const headerCols = lines[0].split(delimiter).map(c => c.replace(/^["']|["']$/g, '').trim());
      const sampleRow = lines.length > 1 ? lines[1].split(delimiter) : [];
      keys = headerCols.map((colName, idx) => ({
        name: colName,
        sample: sampleRow[idx]
      }));
    }
  } else {
    // Fallback for doc/docx/other text files: extract words/headers
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
