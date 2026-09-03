import React, { useState } from 'react';
import { OpenApiRequestBody, OpenApiSpec } from '../types';

interface RequestBodyViewerProps {
  requestBody: OpenApiRequestBody;
  spec: OpenApiSpec;
  isTryItOut: boolean;
  bodyValue: string;
  onChangeBodyValue: (val: string) => void;
  selectedContentType: string;
  onChangeContentType: (type: string) => void;
}

export const RequestBodyViewer: React.FC<RequestBodyViewerProps> = ({
  requestBody,
  spec,
  isTryItOut,
  bodyValue,
  onChangeBodyValue,
  selectedContentType,
  onChangeContentType
}) => {
  const [activeTab, setActiveTab] = useState<'example' | 'schema'>('example');
  const contentTypes = Object.keys(requestBody.content || {});
  if (contentTypes.length === 0) return null;

  const currentMedia = requestBody.content[selectedContentType] || requestBody.content[contentTypes[0]];

  // Resolve schema example or schema properties
  const schema = currentMedia?.schema;
  const exampleData = currentMedia?.example || schema?.example || generateMockFromSchema(schema, spec);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h4 className="text-[11px] font-extrabold uppercase tracking-wider text-zinc-500 dark:text-slate-400">
            Request Body
          </h4>
          {requestBody.required && (
            <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-600 dark:text-rose-400">
              required
            </span>
          )}
        </div>

        {/* Content Type Selector */}
        {contentTypes.length > 1 && (
          <select
            value={selectedContentType}
            onChange={e => onChangeContentType(e.target.value)}
            className="bg-zinc-100 dark:bg-slate-900 border border-zinc-200 dark:border-slate-800 rounded-lg px-2 py-1 text-[11px] font-bold text-zinc-700 dark:text-slate-300 outline-none"
          >
            {contentTypes.map(ct => (
              <option key={ct} value={ct}>{ct}</option>
            ))}
          </select>
        )}
      </div>

      {requestBody.description && (
        <p className="text-xs text-zinc-600 dark:text-slate-400">{requestBody.description}</p>
      )}

      {isTryItOut ? (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[11px] text-zinc-400">
            <span>Editor de Payload ({selectedContentType})</span>
            <button
              onClick={() => onChangeBodyValue(JSON.stringify(exampleData, null, 2))}
              className="text-indigo-500 hover:text-indigo-400 font-bold transition-colors"
            >
              Restaurar Exemplo
            </button>
          </div>
          <textarea
            value={bodyValue}
            onChange={e => onChangeBodyValue(e.target.value)}
            rows={7}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs font-mono text-emerald-400 placeholder-zinc-600 outline-none focus:border-indigo-500 custom-scrollbar resize-y"
          />
        </div>
      ) : (
        <div className="border border-zinc-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white/50 dark:bg-slate-900/40">
          <div className="flex border-b border-zinc-200 dark:border-slate-800 bg-zinc-50 dark:bg-slate-950/60 px-3 py-1.5 gap-2">
            <button
              onClick={() => setActiveTab('example')}
              className={`text-[11px] font-bold px-2 py-1 rounded-lg transition-colors ${
                activeTab === 'example'
                  ? 'bg-zinc-200 dark:bg-slate-800 text-zinc-900 dark:text-white'
                  : 'text-zinc-500 dark:text-slate-400 hover:text-zinc-700 dark:hover:text-slate-200'
              }`}
            >
              Exemplo
            </button>
            <button
              onClick={() => setActiveTab('schema')}
              className={`text-[11px] font-bold px-2 py-1 rounded-lg transition-colors ${
                activeTab === 'schema'
                  ? 'bg-zinc-200 dark:bg-slate-800 text-zinc-900 dark:text-white'
                  : 'text-zinc-500 dark:text-slate-400 hover:text-zinc-700 dark:hover:text-slate-200'
              }`}
            >
              Schema
            </button>
          </div>

          <div className="p-3 bg-zinc-950">
            {activeTab === 'example' ? (
              <pre className="text-xs font-mono text-emerald-400 overflow-x-auto custom-scrollbar">
                <code>{JSON.stringify(exampleData, null, 2)}</code>
              </pre>
            ) : (
              <pre className="text-xs font-mono text-indigo-300 overflow-x-auto custom-scrollbar">
                <code>{JSON.stringify(schema || {}, null, 2)}</code>
              </pre>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

function generateMockFromSchema(schema: any, spec: OpenApiSpec): any {
  if (!schema) return {};

  if (schema.$ref) {
    const refName = schema.$ref.replace('#/components/schemas/', '').replace('#/definitions/', '');
    const resolved = spec.components?.schemas?.[refName] || spec.definitions?.[refName];
    if (resolved) return generateMockFromSchema(resolved, spec);
  }

  if (schema.example !== undefined) return schema.example;

  if (schema.type === 'object' || schema.properties) {
    const obj: any = {};
    const props = schema.properties || {};
    Object.keys(props).forEach(key => {
      obj[key] = generateMockFromSchema(props[key], spec);
    });
    return obj;
  }

  if (schema.type === 'array') {
    return [generateMockFromSchema(schema.items || { type: 'string' }, spec)];
  }

  switch (schema.type) {
    case 'string':
      if (schema.format === 'email') return 'user@example.com';
      if (schema.format === 'date-time') return new Date().toISOString();
      return schema.enum ? schema.enum[0] : 'string';
    case 'number':
    case 'integer':
      return 1;
    case 'boolean':
      return true;
    default:
      return 'valor';
  }
}
