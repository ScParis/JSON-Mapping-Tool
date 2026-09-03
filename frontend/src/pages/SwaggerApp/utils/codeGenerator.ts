import { HttpMethod, OpenApiOperation, OpenApiSchema, OpenApiSpec, AuthState } from '../types';

export function generateCurlCommand(
  method: HttpMethod,
  baseUrl: string,
  path: string,
  parameters: Record<string, any>,
  operation: OpenApiOperation,
  requestBody: string,
  auth?: AuthState
): string {
  let resolvedPath = path;

  // Replace path parameters
  if (operation.parameters) {
    operation.parameters
      .filter(p => p.in === 'path')
      .forEach(p => {
        const val = parameters[p.name] !== undefined && parameters[p.name] !== '' 
          ? parameters[p.name] 
          : (p.schema?.example || p.example || `{${p.name}}`);
        resolvedPath = resolvedPath.replace(`{${p.name}}`, encodeURIComponent(String(val)));
      });
  }

  // Query parameters
  const queryParams: string[] = [];
  if (operation.parameters) {
    operation.parameters
      .filter(p => p.in === 'query')
      .forEach(p => {
        const val = parameters[p.name];
        if (val !== undefined && val !== '') {
          queryParams.push(`${encodeURIComponent(p.name)}=${encodeURIComponent(String(val))}`);
        }
      });
  }

  // Assemble full URL
  const cleanBase = baseUrl.replace(/\/+$/, '');
  const cleanPath = resolvedPath.replace(/^\/+/, '');
  let fullUrl = `${cleanBase}/${cleanPath}`;
  if (queryParams.length > 0) {
    fullUrl += `?${queryParams.join('&')}`;
  }

  const lines: string[] = [`curl -X ${method.toUpperCase()} "${fullUrl}"`];

  // Headers
  if (operation.parameters) {
    operation.parameters
      .filter(p => p.in === 'header')
      .forEach(p => {
        const val = parameters[p.name];
        if (val !== undefined && val !== '') {
          lines.push(`  -H "${p.name}: ${val}"`);
        }
      });
  }

  // Auth Headers
  if (auth) {
    if (auth.type === 'bearer' && auth.bearerToken) {
      lines.push(`  -H "Authorization: Bearer ${auth.bearerToken}"`);
    } else if (auth.type === 'apiKey' && auth.apiKeyName && auth.apiKeyValue) {
      if (auth.apiKeyIn === 'header') {
        lines.push(`  -H "${auth.apiKeyName}: ${auth.apiKeyValue}"`);
      }
    } else if (auth.type === 'basic' && (auth.basicUsername || auth.basicPassword)) {
      const token = btoa(`${auth.basicUsername}:${auth.basicPassword}`);
      lines.push(`  -H "Authorization: Basic ${token}"`);
    }
  }

  // Content-Type & Body
  if (requestBody && requestBody.trim() && method !== 'get' && method !== 'head') {
    lines.push(`  -H "Content-Type: application/json"`);
    // Escaping JSON for shell
    const escaped = requestBody.replace(/'/g, `'\\''`);
    lines.push(`  -d '${escaped}'`);
  }

  return lines.join(' \\\n');
}

export function generateFetchCode(
  method: HttpMethod,
  baseUrl: string,
  path: string,
  parameters: Record<string, any>,
  operation: OpenApiOperation,
  requestBody: string,
  auth?: AuthState
): string {
  let resolvedPath = path;

  if (operation.parameters) {
    operation.parameters
      .filter(p => p.in === 'path')
      .forEach(p => {
        const val = parameters[p.name] !== undefined && parameters[p.name] !== '' 
          ? parameters[p.name] 
          : `{${p.name}}`;
        resolvedPath = resolvedPath.replace(`{${p.name}}`, String(val));
      });
  }

  const cleanBase = baseUrl.replace(/\/+$/, '');
  const cleanPath = resolvedPath.replace(/^\/+/, '');
  let fullUrl = `${cleanBase}/${cleanPath}`;

  const headers: Record<string, string> = {};

  if (requestBody && method !== 'get' && method !== 'head') {
    headers['Content-Type'] = 'application/json';
  }

  if (auth?.type === 'bearer' && auth.bearerToken) {
    headers['Authorization'] = `Bearer ${auth.bearerToken}`;
  } else if (auth?.type === 'apiKey' && auth.apiKeyName && auth.apiKeyValue && auth.apiKeyIn === 'header') {
    headers[auth.apiKeyName] = auth.apiKeyValue;
  }

  const options: any = {
    method: method.toUpperCase(),
    headers
  };

  if (requestBody && method !== 'get' && method !== 'head') {
    try {
      options.body = JSON.parse(requestBody);
    } catch {
      options.body = requestBody;
    }
  }

  return `// Requisição JavaScript (Fetch API)
const response = await fetch('${fullUrl}', {
  method: '${options.method}',
  headers: ${JSON.stringify(options.headers, null, 4)},
  ${options.body ? `body: JSON.stringify(${JSON.stringify(options.body, null, 4)})` : ''}
});

const data = await response.json();
console.log(data);`;
}

export function generateTypeScriptTypes(spec: OpenApiSpec): string {
  const schemas = spec.components?.schemas || spec.definitions || {};
  const schemaNames = Object.keys(schemas);

  if (schemaNames.length === 0) {
    return '// Nenhum schema ou modelo encontrado em "components.schemas" ou "definitions".';
  }

  const output: string[] = [
    `/**`,
    ` * Tipos TypeScript gerados automaticamente a partir de:`,
    ` * ${spec.info?.title || 'OpenAPI Specification'} (v${spec.info?.version || '1.0.0'})`,
    ` */\n`
  ];

  schemaNames.forEach(name => {
    const schema = schemas[name];
    output.push(schemaToInterface(name, schema));
  });

  return output.join('\n\n');
}

function schemaToInterface(name: string, schema: OpenApiSchema): string {
  const sanitizedName = name.replace(/[^a-zA-Z0-9_]/g, '_');
  const properties = schema.properties || {};
  const required = schema.required || [];

  if (schema.enum) {
    const enumVals = schema.enum.map(v => (typeof v === 'string' ? `'${v}'` : String(v))).join(' | ');
    return `export type ${sanitizedName} = ${enumVals || 'string'};`;
  }

  if (schema.type !== 'object' && !schema.properties && schema.type) {
    return `export type ${sanitizedName} = ${mapPrimitiveType(schema)};`;
  }

  const lines: string[] = [];
  if (schema.description) {
    lines.push(`/** ${schema.description} */`);
  }
  lines.push(`export interface ${sanitizedName} {`);

  Object.entries(properties).forEach(([propName, propSchema]) => {
    const isRequired = required.includes(propName);
    const opt = isRequired ? '' : '?';
    const typeStr = mapPropertyType(propSchema);
    const doc = propSchema.description ? `  /** ${propSchema.description} */\n` : '';
    lines.push(`${doc}  ${propName}${opt}: ${typeStr};`);
  });

  if (Object.keys(properties).length === 0) {
    lines.push('  [key: string]: any;');
  }

  lines.push('}');
  return lines.join('\n');
}

function mapPropertyType(schema: OpenApiSchema): string {
  if (schema.$ref) {
    const parts = schema.$ref.split('/');
    return parts[parts.length - 1].replace(/[^a-zA-Z0-9_]/g, '_');
  }

  if (schema.enum) {
    return schema.enum.map(v => (typeof v === 'string' ? `'${v}'` : String(v))).join(' | ') || 'string';
  }

  if (schema.type === 'array') {
    if (schema.items) {
      return `${mapPropertyType(schema.items)}[]`;
    }
    return 'any[]';
  }

  return mapPrimitiveType(schema);
}

function mapPrimitiveType(schema: OpenApiSchema): string {
  switch (schema.type) {
    case 'integer':
    case 'number':
      return 'number';
    case 'string':
      return 'string';
    case 'boolean':
      return 'boolean';
    case 'object':
      return 'Record<string, any>';
    default:
      return 'any';
  }
}
