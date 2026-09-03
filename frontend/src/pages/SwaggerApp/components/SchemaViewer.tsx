import React, { useState } from 'react';
import { ChevronRight, ChevronDown, Layers, Box } from 'lucide-react';
import { OpenApiSchema, OpenApiSpec } from '../types';

interface SchemaViewerProps {
  spec: OpenApiSpec;
}

export const SchemaViewer: React.FC<SchemaViewerProps> = ({ spec }) => {
  const schemas = spec.components?.schemas || spec.definitions || {};
  const schemaNames = Object.keys(schemas);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  if (schemaNames.length === 0) return null;

  const toggleSchema = (name: string) => {
    setExpanded(prev => ({ ...prev, [name]: !prev[name] }));
  };

  return (
    <div className="mt-8 border-t border-zinc-200 dark:border-slate-800 pt-6 space-y-4">
      <div className="flex items-center gap-2">
        <Layers className="w-5 h-5 text-indigo-500" />
        <h3 className="text-sm font-extrabold uppercase tracking-wider text-zinc-900 dark:text-white">
          Schemas & Modelos de Dados ({schemaNames.length})
        </h3>
      </div>

      <div className="space-y-2">
        {schemaNames.map(name => {
          const schema = schemas[name];
          const isExp = !!expanded[name];
          const properties = schema.properties || {};
          const required = schema.required || [];

          return (
            <div
              key={name}
              className="border border-zinc-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900/60 overflow-hidden transition-all"
            >
              {/* Header */}
              <button
                onClick={() => toggleSchema(name)}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-slate-800/40 text-left transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <Box className="w-4 h-4 text-indigo-400" />
                  <span className="text-xs font-mono font-bold text-zinc-900 dark:text-slate-100">{name}</span>
                  <span className="text-[10px] text-zinc-400 font-mono bg-zinc-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                    {schema.type || 'object'}
                  </span>
                </div>
                {isExp ? <ChevronDown className="w-4 h-4 text-zinc-400" /> : <ChevronRight className="w-4 h-4 text-zinc-400" />}
              </button>

              {/* Body */}
              {isExp && (
                <div className="p-4 border-t border-zinc-200 dark:border-slate-800 bg-zinc-50/50 dark:bg-slate-950/40 space-y-3">
                  {schema.description && (
                    <p className="text-xs text-zinc-600 dark:text-slate-400 italic">{schema.description}</p>
                  )}

                  <div className="space-y-1.5">
                    {Object.entries(properties).map(([propName, propSchema]) => {
                      const isReq = required.includes(propName);
                      const type = propSchema.type || (propSchema.$ref ? propSchema.$ref.split('/').pop() : 'any');

                      return (
                        <div
                          key={propName}
                          className="flex items-start justify-between py-1.5 border-b border-zinc-200/60 dark:border-slate-800/60 last:border-none text-xs"
                        >
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1.5 font-mono">
                              <span className="font-bold text-zinc-800 dark:text-slate-200">{propName}</span>
                              {isReq && (
                                <span className="text-[9px] text-rose-500 font-bold uppercase">required</span>
                              )}
                            </div>
                            {propSchema.description && (
                              <p className="text-[11px] text-zinc-500 dark:text-slate-400">{propSchema.description}</p>
                            )}
                          </div>
                          <div className="text-right">
                            <span className="font-mono text-[11px] text-indigo-500 font-semibold">{type}</span>
                            {propSchema.example !== undefined && (
                              <div className="text-[10px] text-zinc-400 font-mono">
                                ex: {String(propSchema.example)}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}

                    {Object.keys(properties).length === 0 && (
                      <pre className="text-xs font-mono text-zinc-400 bg-zinc-950 p-3 rounded-lg overflow-x-auto">
                        {JSON.stringify(schema, null, 2)}
                      </pre>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
