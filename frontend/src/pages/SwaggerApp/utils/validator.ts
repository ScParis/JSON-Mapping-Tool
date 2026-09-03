import { OpenApiSpec } from '../types';

export interface ValidationError {
  type: 'error' | 'warning';
  message: string;
  path?: string;
}

export function validateOpenApiSpec(spec: OpenApiSpec | null): ValidationError[] {
  const issues: ValidationError[] = [];

  if (!spec) {
    return [{ type: 'error', message: 'Nenhuma especificação OpenAPI válida carregada.' }];
  }

  // Version Check
  if (!spec.openapi && !spec.swagger) {
    issues.push({
      type: 'error',
      message: 'Versão de especificação ausente. Declare "openapi: 3.0.3" ou "swagger: \\"2.0\\"".',
      path: 'openapi'
    });
  }

  // Info Block
  if (!spec.info) {
    issues.push({
      type: 'error',
      message: 'Bloco "info" é obrigatório em especificações OpenAPI.',
      path: 'info'
    });
  } else {
    if (!spec.info.title) {
      issues.push({
        type: 'error',
        message: '"info.title" é obrigatório.',
        path: 'info.title'
      });
    }
    if (!spec.info.version) {
      issues.push({
        type: 'warning',
        message: '"info.version" não especificado.',
        path: 'info.version'
      });
    }
  }

  // Paths
  if (!spec.paths || typeof spec.paths !== 'object') {
    issues.push({
      type: 'warning',
      message: 'Nenhum caminho ("paths") definido na especificação.',
      path: 'paths'
    });
  } else {
    const pathKeys = Object.keys(spec.paths);
    if (pathKeys.length === 0) {
      issues.push({
        type: 'warning',
        message: 'A especificação não possui endpoints em "paths".',
        path: 'paths'
      });
    }

    pathKeys.forEach(p => {
      if (!p.startsWith('/')) {
        issues.push({
          type: 'error',
          message: `O caminho "${p}" deve iniciar com uma barra "/".`,
          path: `paths.${p}`
        });
      }
    });
  }

  return issues;
}
