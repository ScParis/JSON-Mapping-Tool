import React from 'react';
import { OpenApiParameter } from '../types';

interface ParameterTableProps {
  parameters: OpenApiParameter[];
  isTryItOut: boolean;
  values: Record<string, any>;
  onChangeValue: (name: string, value: any) => void;
}

export const ParameterTable: React.FC<ParameterTableProps> = ({
  parameters,
  isTryItOut,
  values,
  onChangeValue
}) => {
  if (!parameters || parameters.length === 0) return null;

  return (
    <div className="space-y-2">
      <h4 className="text-[11px] font-extrabold uppercase tracking-wider text-zinc-500 dark:text-slate-400">
        Parâmetros ({parameters.length})
      </h4>
      <div className="overflow-x-auto border border-zinc-200 dark:border-slate-800 rounded-xl bg-white/50 dark:bg-slate-900/40">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-zinc-200 dark:border-slate-800 bg-zinc-50 dark:bg-slate-950/60 text-zinc-500 dark:text-slate-400 font-bold">
              <th className="py-2.5 px-3">Nome</th>
              <th className="py-2.5 px-3">Tipo & Local</th>
              <th className="py-2.5 px-3">Descrição</th>
              {isTryItOut && <th className="py-2.5 px-3 w-48">Valor</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-slate-800 font-sans">
            {parameters.map((param, idx) => {
              const isRequired = param.required || param.in === 'path';
              const type = param.schema?.type || 'string';
              const example = param.example || param.schema?.example || param.schema?.default;

              return (
                <tr key={idx} className="hover:bg-zinc-50/80 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="py-2.5 px-3 align-top">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-mono font-bold text-zinc-900 dark:text-slate-100">{param.name}</span>
                      {isRequired && (
                        <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-600 dark:text-rose-400">
                          required
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-2.5 px-3 align-top">
                    <div className="flex flex-col gap-0.5">
                      <span className="font-mono text-indigo-600 dark:text-indigo-400 font-bold text-[11px]">{type}</span>
                      <span className="text-[10px] text-zinc-400 dark:text-slate-500">in: {param.in}</span>
                    </div>
                  </td>
                  <td className="py-2.5 px-3 align-top text-zinc-600 dark:text-slate-300 leading-relaxed">
                    <div>{param.description || <span className="italic text-zinc-400">Sem descrição</span>}</div>
                    {example !== undefined && (
                      <div className="mt-1 text-[10px] text-zinc-400 dark:text-slate-500 font-mono">
                        exemplo: <span className="text-zinc-600 dark:text-slate-300 font-bold">{String(example)}</span>
                      </div>
                    )}
                  </td>
                  {isTryItOut && (
                    <td className="py-2.5 px-3 align-top">
                      {param.schema?.enum ? (
                        <select
                          value={values[param.name] ?? example ?? ''}
                          onChange={e => onChangeValue(param.name, e.target.value)}
                          className="w-full bg-white dark:bg-slate-950 border border-zinc-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-900 dark:text-white font-mono outline-none focus:border-indigo-500"
                        >
                          <option value="">Selecione...</option>
                          {param.schema.enum.map((opt, oIdx) => (
                            <option key={oIdx} value={opt}>{opt}</option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type={type === 'integer' || type === 'number' ? 'number' : 'text'}
                          placeholder={example !== undefined ? String(example) : `Valor ${param.name}`}
                          value={values[param.name] ?? ''}
                          onChange={e => onChangeValue(param.name, e.target.value)}
                          className="w-full bg-white dark:bg-slate-950 border border-zinc-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-900 dark:text-white font-mono outline-none focus:border-indigo-500 transition-colors"
                        />
                      )}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
