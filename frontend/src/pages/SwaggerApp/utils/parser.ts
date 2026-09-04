import yaml from 'js-yaml';
import { OpenApiSpec, ParseError } from '../types';

export function isJsonString(str: string): boolean {
  try {
    const trimmed = str.trim();
    if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) return false;
    JSON.parse(trimmed);
    return true;
  } catch {
    return false;
  }
}

// Extrai uma especificação OpenAPI embutida num documento Markdown.
// As docs da pipe.run (e do ReadMe em geral) entregam a versão `.md` da página
// com o OpenAPI dentro de um bloco de código ```json ... ```. Quando o usuário
// cola esse markdown inteiro, tentamos localizar o primeiro bloco cercado que
// contenha um objeto com "openapi"/"swagger"/"paths" e usamos só esse trecho.
function extractSpecFromMarkdown(content: string): string | null {
  const fenceRegex = /```(?:json|yaml|yml)?\s*\n([\s\S]*?)```/gi;
  let match: RegExpExecArray | null;
  while ((match = fenceRegex.exec(content)) !== null) {
    const block = match[1]?.trim();
    if (!block) continue;
    if (!/["']?(openapi|swagger|paths)["']?\s*:/.test(block)) continue;
    try {
      const candidate = block.startsWith('{') || block.startsWith('[')
        ? JSON.parse(block)
        : yaml.load(block);
      if (candidate && typeof candidate === 'object') {
        return block;
      }
    } catch {
      // bloco não parseável — continua procurando o próximo
    }
  }
  return null;
}

export function parseOpenApiSpec(content: string): { spec: OpenApiSpec | null; error: ParseError | null } {
  if (!content || !content.trim()) {
    return { spec: null, error: { message: 'Especificação vazia.' } };
  }

  try {
    let parsed: any;
    const trimmed = content.trim();

    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
      try {
        parsed = JSON.parse(trimmed);
      } catch (jsonErr: any) {
        // Fallback to YAML parse
        parsed = yaml.load(content);
      }
    } else {
      // Se não começa com JSON/array, pode ser YAML puro OU um markdown com o
      // OpenAPI embutido num bloco de código. Tentamos extrair o bloco primeiro;
      // se não houver, caímos no parse YAML normal.
      const embedded = extractSpecFromMarkdown(content);
      if (embedded) {
        parsed = embedded.startsWith('{') || embedded.startsWith('[')
          ? JSON.parse(embedded)
          : yaml.load(embedded);
      } else {
        parsed = yaml.load(content);
      }
    }

    if (!parsed || typeof parsed !== 'object') {
      return { spec: null, error: { message: 'O conteúdo deve ser um objeto estruturado em YAML ou JSON.' } };
    }

    return { spec: parsed as OpenApiSpec, error: null };
  } catch (err: any) {
    const line = err.mark?.line ? err.mark.line + 1 : undefined;
    const column = err.mark?.column ? err.mark.column + 1 : undefined;
    const message = err.reason || err.message || 'Erro de sintaxe no documento.';

    return {
      spec: null,
      error: { message, line, column }
    };
  }
}

export function convertToJson(content: string): { json: string; error?: string } {
  try {
    const { spec, error } = parseOpenApiSpec(content);
    if (error || !spec) {
      return { json: '', error: error?.message || 'Falha ao processar YAML para conversão.' };
    }
    return { json: JSON.stringify(spec, null, 2) };
  } catch (e: any) {
    return { json: '', error: e.message };
  }
}

export function convertToYaml(content: string): { yaml: string; error?: string } {
  try {
    const { spec, error } = parseOpenApiSpec(content);
    if (error || !spec) {
      return { yaml: '', error: error?.message || 'Falha ao processar conteúdo para YAML.' };
    }
    const yamlString = yaml.dump(spec, {
      indent: 2,
      lineWidth: -1,
      noRefs: true,
      skipInvalid: true
    });
    return { yaml: yamlString };
  } catch (e: any) {
    return { yaml: '', error: e.message };
  }
}

export function formatSpec(content: string, language: 'yaml' | 'json'): { formatted: string; error?: string } {
  if (language === 'json') {
    const res = convertToJson(content);
    return { formatted: res.json, error: res.error };
  } else {
    const res = convertToYaml(content);
    return { formatted: res.yaml, error: res.error };
  }
}
