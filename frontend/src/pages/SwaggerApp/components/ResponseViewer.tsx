import React, { useState } from 'react';
import { OpenApiResponses, OpenApiSpec } from '../types';

interface ResponseViewerProps {
  responses: OpenApiResponses;
  spec: OpenApiSpec;
}

export const ResponseViewer: React.FC<ResponseViewerProps> = ({ responses, spec }) => {
  const codes = Object.keys(responses || {});
  const [selectedCode, setSelectedCode] = useState<string>(codes[0] || '200');

  if (codes.length === 0) return null;

  const currentResponse = responses[selectedCode] || responses[codes[0]];
  const contentMap = currentResponse?.content || {};
  const mediaTypes = Object.keys(contentMap);
  const jsonMedia = contentMap['application/json'] || (mediaTypes.length > 0 ? contentMap[mediaTypes[0]] : null);

  const getStatusColor = (code: string) => {
    if (code.startsWith('2')) return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30';
    if (code.startsWith('3')) return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30';
    if (code.startsWith('4')) return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30';
    if (code.startsWith('5')) return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30';
    return 'bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-500/30';
  };

  return (
    <div className="space-y-2.5">
      <h4 className="text-[11px] font-extrabold uppercase tracking-wider text-zinc-500 dark:text-slate-400">
        Respostas ({codes.length})
      </h4>

      {/* Status Code Tabs */}
      <div className="flex flex-wrap gap-1.5">
        {codes.map(code => (
          <button
            key={code}
            onClick={() => setSelectedCode(code)}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold border transition-all ${getStatusColor(code)} ${
              selectedCode === code
                ? 'ring-2 ring-indigo-500 ring-offset-1 dark:ring-offset-slate-900 shadow-sm'
                : 'opacity-70 hover:opacity-100'
            }`}
          >
            {code}
          </button>
        ))}
      </div>

      {/* Selected Response Details */}
      <div className="border border-zinc-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white/50 dark:bg-slate-900/40 p-4 space-y-3">
        <div className="flex items-start justify-between">
          <div>
            <span className="text-xs font-bold text-zinc-900 dark:text-white">
              {currentResponse?.description || 'Resposta sem descrição.'}
            </span>
          </div>
          {mediaTypes.length > 0 && (
            <span className="text-[10px] font-mono text-zinc-400 dark:text-slate-500 bg-zinc-100 dark:bg-slate-800 px-2 py-0.5 rounded">
              {mediaTypes[0]}
            </span>
          )}
        </div>

        {/* Schema / Example Payload */}
        {jsonMedia?.schema && (
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
              Estrutura de Retorno (Schema):
            </span>
            <div className="bg-zinc-950 rounded-xl p-3 max-h-48 overflow-auto custom-scrollbar">
              <pre className="text-xs font-mono text-indigo-300">
                <code>{JSON.stringify(jsonMedia.schema, null, 2)}</code>
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
