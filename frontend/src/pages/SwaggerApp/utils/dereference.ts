import { OpenApiParameter, OpenApiSchema, OpenApiSpec } from '../types';

/**
 * Resolves a JSON Pointer (e.g. "#/components/parameters/Page") against the spec root.
 */
export function resolveRef(ref: string, root: any, seen = new Set<string>()): any {
  if (!ref || typeof ref !== 'string' || !ref.startsWith('#/')) return null;
  if (seen.has(ref)) {
    return { type: 'object', description: `[Circular reference to ${ref}]` };
  }

  const parts = ref.replace(/^#\//, '').split('/').map(decodeURIComponent);
  let current = root;

  for (const part of parts) {
    if (current && typeof current === 'object' && part in current) {
      current = current[part];
    } else {
      return null;
    }
  }

  if (current && typeof current === 'object' && current.$ref) {
    seen.add(ref);
    return resolveRef(current.$ref, root, seen);
  }

  return current;
}

/**
 * Resolves a single parameter, expanding $ref if present and normalizing Swagger 2.0 / OAS 3.0 differences.
 */
export function resolveParameter(param: any, root: any): OpenApiParameter {
  if (!param) return param;

  let resolved = param;
  if (param.$ref) {
    const target = resolveRef(param.$ref, root);
    if (target) {
      resolved = { ...target, ...param };
      delete resolved.$ref;
    }
  }

  // Normalize Swagger 2.0 type/format at root of parameter into schema
  if (!resolved.schema && (resolved.type || resolved.enum || resolved.items)) {
    resolved = {
      ...resolved,
      schema: {
        type: resolved.type,
        format: resolved.format,
        enum: resolved.enum,
        default: resolved.default,
        items: resolved.items
      }
    };
  }

  // If parameter schema contains a $ref, resolve it as well
  if (resolved.schema && resolved.schema.$ref) {
    const schemaTarget = resolveRef(resolved.schema.$ref, root);
    if (schemaTarget) {
      resolved = {
        ...resolved,
        schema: {
          ...schemaTarget,
          ...resolved.schema
        }
      };
      delete resolved.schema.$ref;
    }
  }

  return resolved as OpenApiParameter;
}

/**
 * Merges path-level parameters and operation-level parameters, resolves all $refs,
 * auto-detects template path parameters {param}, and deduplicates.
 */
export function getOperationParameters(
  path: string,
  pathItem: any,
  operation: any,
  root: OpenApiSpec
): OpenApiParameter[] {
  const rawPathParams: any[] = Array.isArray(pathItem?.parameters) ? pathItem.parameters : [];
  const rawOpParams: any[] = Array.isArray(operation?.parameters) ? operation.parameters : [];

  // Map to deduplicate by name + in
  const paramMap = new Map<string, OpenApiParameter>();

  // 1. Add path-level parameters
  for (const raw of rawPathParams) {
    const resolved = resolveParameter(raw, root);
    if (resolved && resolved.name) {
      const key = `${resolved.in || 'query'}:${resolved.name}`;
      paramMap.set(key, resolved);
    }
  }

  // 2. Add / override with operation-level parameters
  for (const raw of rawOpParams) {
    const resolved = resolveParameter(raw, root);
    if (resolved && resolved.name) {
      const key = `${resolved.in || 'query'}:${resolved.name}`;
      paramMap.set(key, resolved);
    }
  }

  // 3. Auto-discover missing path template parameters e.g. /users/{id}
  const pathMatches = (path.match(/\{([^}]+)\}/g) || []).map(m => m.replace(/[{}]/g, ''));
  for (const pathVar of pathMatches) {
    const key = `path:${pathVar}`;
    if (!paramMap.has(key)) {
      paramMap.set(key, {
        name: pathVar,
        in: 'path',
        required: true,
        description: `Identificador do recurso (${pathVar})`,
        schema: { type: 'string' }
      });
    }
  }

  // Convert to array and order: 'path' first, then 'query', then 'header', then 'cookie'
  const inOrder: Record<string, number> = { path: 1, query: 2, header: 3, cookie: 4 };
  return Array.from(paramMap.values()).sort((a, b) => {
    const orderA = inOrder[a.in] || 99;
    const orderB = inOrder[b.in] || 99;
    if (orderA !== orderB) return orderA - orderB;
    return a.name.localeCompare(b.name);
  });
}

/**
 * Deeply resolves $ref schemas for display or code generation.
 */
export function resolveSchema(
  schema: any,
  root: any,
  maxDepth = 5,
  currentDepth = 0,
  seen = new Set<string>()
): OpenApiSchema {
  if (!schema || typeof schema !== 'object' || currentDepth >= maxDepth) {
    return schema;
  }

  if (schema.$ref) {
    if (seen.has(schema.$ref)) {
      return { type: 'object', title: schema.$ref.split('/').pop(), description: 'Referência circular' };
    }
    seen.add(schema.$ref);
    const resolved = resolveRef(schema.$ref, root, seen);
    if (resolved) {
      return resolveSchema({ ...resolved, ...schema, $ref: undefined }, root, maxDepth, currentDepth + 1, seen);
    }
  }

  const result: any = { ...schema };

  if (result.properties && typeof result.properties === 'object') {
    const nextProps: Record<string, any> = {};
    for (const [key, val] of Object.entries(result.properties)) {
      nextProps[key] = resolveSchema(val, root, maxDepth, currentDepth + 1, new Set(seen));
    }
    result.properties = nextProps;
  }

  if (result.items && typeof result.items === 'object') {
    result.items = resolveSchema(result.items, root, maxDepth, currentDepth + 1, new Set(seen));
  }

  if (Array.isArray(result.allOf)) {
    result.allOf = result.allOf.map((sub: any) => resolveSchema(sub, root, maxDepth, currentDepth + 1, new Set(seen)));
  }

  return result as OpenApiSchema;
}
