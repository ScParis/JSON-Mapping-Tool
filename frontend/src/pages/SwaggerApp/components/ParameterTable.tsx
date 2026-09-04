import React from 'react';
import { OpenApiParameter } from '../types';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { HelpCircle, CornerDownRight } from 'lucide-react';

interface ParameterTableProps {
  parameters: OpenApiParameter[];
  isTryItOut?: boolean;
  values: Record<string, any>;
  onChangeValue: (name: string, value: any) => void;
}

export const ParameterTable: React.FC<ParameterTableProps> = ({
  parameters,
  values,
  onChangeValue
}) => {
  if (!parameters || parameters.length === 0) return null;

  const getLocationBadge = (loc: string) => {
    switch (loc) {
      case 'path':
        return 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20';
      case 'query':
        return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20';
      case 'header':
        return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
      default:
        return 'bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-500/20';
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-[11px] font-extrabold uppercase tracking-wider text-zinc-500 dark:text-slate-400 flex items-center gap-1.5">
          <span>Parâmetros</span>
          <span className="px-1.5 py-0.2 bg-zinc-100 dark:bg-slate-800 rounded-md font-mono text-[10px] text-zinc-600 dark:text-slate-300">
            {parameters.length}
          </span>
        </h4>
        <span className="text-[10px] text-zinc-400 dark:text-slate-500">
          Preencha os valores para testar o endpoint ou gerar o cURL live
        </span>
      </div>

      <div className="border border-zinc-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-white/70 dark:bg-slate-900/50 divide-y divide-zinc-200/80 dark:divide-slate-800/80 shadow-2xs">
        {parameters.map((param, idx) => {
          const isRequired = param.required || param.in === 'path';
          const type = param.schema?.type || (param as any).type || 'string';
          const format = param.schema?.format || (param as any).format;
          const example = param.example ?? param.schema?.example ?? param.schema?.default;
          const enumValues = param.schema?.enum || (param as any).enum;
          const currentValue = values[param.name];

          const descriptionHtml = param.description
            ? DOMPurify.sanitize(marked.parse(param.description, { breaks: true, gfm: true }) as string)
            : '';

          return (
            <div
              key={`${param.in}-${param.name}-${idx}`}
              className="p-3.5 sm:p-4 hover:bg-zinc-50/70 dark:hover:bg-slate-800/30 transition-colors flex flex-col md:flex-row md:items-start justify-between gap-3 sm:gap-4"
            >
              {/* Left Column: Name, Badges & Description */}
              <div className="flex-1 space-y-1.5 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-xs md:text-sm font-bold text-zinc-900 dark:text-white select-all">
                    {param.name}
                  </span>

                  {/* Required / Optional badge */}
                  {isRequired ? (
                    <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-md bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 uppercase tracking-wider">
                      obrigatório
                    </span>
                  ) : (
                    <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-md bg-zinc-100 dark:bg-slate-800 text-zinc-500 dark:text-slate-400 border border-zinc-200/60 dark:border-slate-700/60">
                      opcional
                    </span>
                  )}

                  {/* Location badge */}
                  <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md border uppercase ${getLocationBadge(param.in)}`}>
                    {param.in}
                  </span>

                  {/* Type badge */}
                  <span className="text-[10px] font-mono text-indigo-600 dark:text-indigo-400 font-semibold bg-indigo-50/50 dark:bg-indigo-950/30 px-1.5 py-0.5 rounded border border-indigo-200/50 dark:border-indigo-800/50">
                    {type}{format ? ` (${format})` : ''}
                  </span>
                </div>

                {/* Description */}
                {descriptionHtml ? (
                  <div
                    className="swagger-markdown text-xs text-zinc-600 dark:text-slate-300 leading-relaxed max-w-2xl"
                    dangerouslySetInnerHTML={{ __html: descriptionHtml }}
                  />
                ) : (
                  <p className="text-xs italic text-zinc-400 dark:text-slate-500">Sem descrição cadastrada.</p>
                )}

                {/* Example / Default hint */}
                {example !== undefined && (
                  <div className="flex items-center gap-1.5 text-[11px] text-zinc-400 dark:text-slate-500 font-mono pt-0.5">
                    <CornerDownRight className="w-3 h-3 text-zinc-400" />
                    <span>exemplo / padrão:</span>
                    <button
                      type="button"
                      onClick={() => onChangeValue(param.name, String(example))}
                      className="text-indigo-600 dark:text-indigo-400 hover:underline font-bold bg-indigo-50/80 dark:bg-indigo-950/50 px-1.5 py-0.5 rounded text-[10px]"
                      title="Clique para preencher com este valor"
                    >
                      {String(example)}
                    </button>
                  </div>
                )}
              </div>

              {/* Right Column: Always Enabled Input Field */}
              <div className="w-full md:w-64 lg:w-72 shrink-0">
                {enumValues && Array.isArray(enumValues) && enumValues.length > 0 ? (
                  <select
                    value={currentValue ?? ''}
                    onChange={e => onChangeValue(param.name, e.target.value)}
                    className="w-full bg-zinc-50 dark:bg-slate-950 border border-zinc-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-zinc-900 dark:text-slate-100 outline-none focus:border-indigo-500 transition-colors shadow-2xs cursor-pointer"
                  >
                    <option value="">Selecione um valor...</option>
                    {enumValues.map((opt: any, oIdx: number) => (
                      <option key={oIdx} value={String(opt)}>
                        {String(opt)}
                      </option>
                    ))}
                  </select>
                ) : type === 'boolean' ? (
                  <select
                    value={currentValue !== undefined ? String(currentValue) : ''}
                    onChange={e => {
                      const val = e.target.value;
                      onChangeValue(param.name, val === '' ? undefined : val === 'true');
                    }}
                    className="w-full bg-zinc-50 dark:bg-slate-950 border border-zinc-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-zinc-900 dark:text-slate-100 outline-none focus:border-indigo-500 transition-colors shadow-2xs cursor-pointer"
                  >
                    <option value="">(Não enviado)</option>
                    <option value="true">true</option>
                    <option value="false">false</option>
                  </select>
                ) : (
                  <div className="relative">
                    <input
                      type={type === 'integer' || type === 'number' ? 'number' : 'text'}
                      placeholder={example !== undefined ? `ex: ${example}` : `Digite ${param.name}...`}
                      value={currentValue !== undefined ? String(currentValue) : ''}
                      onChange={e => {
                        const raw = e.target.value;
                        if (type === 'integer' || type === 'number') {
                          onChangeValue(param.name, raw === '' ? '' : Number(raw));
                        } else {
                          onChangeValue(param.name, raw);
                        }
                      }}
                      className="w-full bg-zinc-50 dark:bg-slate-950 border border-zinc-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-slate-500 outline-none focus:border-indigo-500 transition-colors shadow-2xs"
                    />
                    {currentValue !== undefined && currentValue !== '' && (
                      <button
                        type="button"
                        onClick={() => onChangeValue(param.name, undefined)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-slate-200 text-xs px-1"
                        title="Limpar campo"
                      >
                        ×
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
