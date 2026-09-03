import React, { useState } from 'react';
import { X, Copy, Download, Check, FileCode2 } from 'lucide-react';
import { OpenApiSpec } from '../types';
import { generateTypeScriptTypes } from '../utils/codeGenerator';
import { downloadFile } from '../utils/exporter';

interface TypeScriptGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  spec: OpenApiSpec | null;
}

export const TypeScriptGeneratorModal: React.FC<TypeScriptGeneratorModalProps> = ({
  isOpen,
  onClose,
  spec
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const code = spec ? generateTypeScriptTypes(spec) : '// Nenhuma especificação carregada.';

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const filename = `${(spec?.info?.title || 'api').toLowerCase().replace(/[^a-z0-9]/g, '-')}-types.d.ts`;
    downloadFile(code, filename, 'text/typescript');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 border border-zinc-200 dark:border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-200 dark:border-slate-800 flex items-center justify-between bg-zinc-50 dark:bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-500/10 text-blue-500 rounded-xl">
              <FileCode2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-900 dark:text-white">Gerador de Tipos TypeScript (DTOs)</h3>
              <p className="text-xs text-zinc-500 dark:text-slate-400">Interfaces e tipos gerados a partir de components.schemas</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-white rounded-lg hover:bg-zinc-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Code Content */}
        <div className="p-4 flex-1 overflow-hidden flex flex-col bg-zinc-950">
          <pre className="flex-1 overflow-auto p-4 text-xs font-mono text-emerald-400 custom-scrollbar leading-relaxed">
            <code>{code}</code>
          </pre>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-3.5 border-t border-zinc-200 dark:border-slate-800 bg-zinc-50 dark:bg-slate-950/60 flex items-center justify-between">
          <span className="text-[11px] text-zinc-500 dark:text-slate-400">
            Exportação 100% compatível com TypeScript 4.x / 5.x
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="px-4 py-2 bg-zinc-200 hover:bg-zinc-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-zinc-800 dark:text-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copiado!' : 'Copiar Código'}
            </button>
            <button
              onClick={handleDownload}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/20 flex items-center gap-1.5 transition-all"
            >
              <Download className="w-3.5 h-3.5" /> Baixar (.d.ts)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
