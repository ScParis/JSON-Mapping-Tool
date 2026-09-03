import { OpenApiSpec, HttpMethod } from '../types';

export function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function openApiToPostmanCollection(spec: OpenApiSpec): any {
  const info = spec.info || { title: 'OpenAPI Collection', version: '1.0.0' };
  const baseUrl = spec.servers?.[0]?.url || 'https://api.example.com';

  const items: any[] = [];
  const paths = spec.paths || {};

  Object.entries(paths).forEach(([path, pathItem]) => {
    const methods: HttpMethod[] = ['get', 'post', 'put', 'delete', 'patch', 'options', 'head'];

    methods.forEach(method => {
      const op = (pathItem as any)[method];
      if (op) {
        const item: {
          name: string;
          request: {
            method: string;
            header: any[];
            url: {
              raw: string;
              host: string[];
              path: string[];
            };
            description: string;
            body?: any;
          };
          response: any[];
        } = {
          name: op.summary || `${method.toUpperCase()} ${path}`,
          request: {
            method: method.toUpperCase(),
            header: [] as any[],
            url: {
              raw: `${baseUrl}${path}`,
              host: [baseUrl.replace(/^https?:\/\//, '').split('/')[0]],
              path: path.split('/').filter(Boolean)
            },
            description: op.description || op.summary || ''
          },
          response: []
        };

        if (op.parameters) {
          op.parameters.forEach((param: any) => {
            if (param.in === 'header') {
              item.request.header.push({
                key: param.name,
                value: param.example || '',
                description: param.description || ''
              });
            }
          });
        }

        if (op.requestBody?.content?.['application/json']?.schema) {
          item.request.header.push({
            key: 'Content-Type',
            value: 'application/json'
          });
          item.request.body = {
            mode: 'raw',
            raw: JSON.stringify(op.requestBody.content['application/json'].example || {}, null, 2)
          };
        }

        items.push(item);
      }
    });
  });

  return {
    info: {
      name: info.title,
      description: info.description || '',
      schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json'
    },
    item: items
  };
}
