import React, { useRef, useState } from 'react';
import {
  FileCode2,
  FolderOpen,
  Download,
  Sparkles,
  Lock,
  Unlock,
  Columns2,
  Code2,
  Eye,
  RefreshCw,
  FileJson,
  Check,
  Share2,
  Send,
  Sliders,
  ChevronDown
} from 'lucide-react';
import { TEMPLATES } from '../constants';
import { AuthState } from '../types';

interface SwaggerToolbarProps {
  language: 'yaml' | 'json';
  onFormat: () => void;
  onConvertToYaml: () => void;
  onConvertToJson: () => void;
  onLoadTemplate: (templateId: string) => void;
  onOpenFile: (content: string, filename: string) => void;
  onDownloadYaml: () => void;
  onDownloadJson: () => void;
  onExportPostman: () => void;
  onOpenAuthModal: () => void;
  onOpenTsModal: () => void;
  onOpenAiModal: () => void;
  auth: AuthState;
  viewMode: 'split' | 'editor' | 'preview';
  onChangeViewMode: (mode: 'split' | 'editor' | 'preview') => void;
}

export const SwaggerToolbar: React.FC<SwaggerToolbarProps> = ({
  language,
  onFormat,
  onConvertToYaml,
  onConvertToJson,
  onLoadTemplate,
  onOpenFile,
  onDownloadYaml,
  onDownloadJson,
  onExportPostman,
  onOpenAuthModal,
  onOpenTsModal,
  onOpenAiModal,
  auth,
  viewMode,
  onChangeViewMode
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showFileMenu, setShowFileMenu] = useState(false);
  const [showTemplateMenu, setShowTemplateMenu] = useState(false);

  const isAuthorized = !!(
    (auth.type === 'bearer' && auth.bearerToken) ||
    (auth.type === 'apiKey' && auth.apiKeyValue) ||
    (auth.type === 'basic' && (auth.basicUsername || auth.basicPassword))
  );

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = event => {
        const text = event.target?.result as string;
        onOpenFile(text, file.name);
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="h-14 bg-white dark:bg-slate-900 border-b border-zinc-200 dark:border-slate-800 px-4 flex items-center justify-between gap-3 shrink-0 select-none z-30">
      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept=".yaml,.yml,.json"
        className="hidden"
      />

      {/* Left: Branding & Main Menus */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 pr-3 border-r border-zinc-200 dark:border-slate-800">
          <div className="p-1.5 bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-xl shadow-sm">
            <FileCode2 className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-sm font-black text-zinc-900 dark:text-white leading-tight">Swagger Studio</h1>
            <span className="text-[10px] font-mono font-bold text-emerald-500 uppercase tracking-widest block">OpenAPI 3.0 / 3.1</span>
          </div>
        </div>

        {/* File Dropdown Menu */}
        <div className="relative">
          <button
            onClick={() => { setShowFileMenu(!showFileMenu); setShowTemplateMenu(false); }}
            className="px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-zinc-700 dark:text-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
          >
            <FolderOpen className="w-3.5 h-3.5 text-zinc-500 dark:text-slate-400" />
            <span>Arquivo</span>
            <ChevronDown className="w-3 h-3 text-zinc-400" />
          </button>

          {showFileMenu && (
            <div className="absolute left-0 top-full mt-1.5 w-56 bg-white dark:bg-slate-900 border border-zinc-200 dark:border-slate-800 rounded-2xl shadow-2xl py-2 z-50 animate-fadeIn">
              <button
                onClick={() => { fileInputRef.current?.click(); setShowFileMenu(false); }}
                className="w-full px-4 py-2 text-left text-xs font-medium text-zinc-700 dark:text-slate-300 hover:bg-zinc-100 dark:hover:bg-slate-800 flex items-center gap-2"
              >
                <FolderOpen className="w-3.5 h-3.5 text-indigo-500" />
                <span>Abrir Arquivo (.yaml / .json)</span>
              </button>
              <div className="h-px bg-zinc-200 dark:bg-slate-800 my-1.5" />
              <button
                onClick={() => { onDownloadYaml(); setShowFileMenu(false); }}
                className="w-full px-4 py-2 text-left text-xs font-medium text-zinc-700 dark:text-slate-300 hover:bg-zinc-100 dark:hover:bg-slate-800 flex items-center gap-2"
              >
                <Download className="w-3.5 h-3.5 text-emerald-500" />
                <span>Baixar como YAML</span>
              </button>
              <button
                onClick={() => { onDownloadJson(); setShowFileMenu(false); }}
                className="w-full px-4 py-2 text-left text-xs font-medium text-zinc-700 dark:text-slate-300 hover:bg-zinc-100 dark:hover:bg-slate-800 flex items-center gap-2"
              >
                <FileJson className="w-3.5 h-3.5 text-blue-500" />
                <span>Baixar como JSON</span>
              </button>
              <button
                onClick={() => { onExportPostman(); setShowFileMenu(false); }}
                className="w-full px-4 py-2 text-left text-xs font-medium text-zinc-700 dark:text-slate-300 hover:bg-zinc-100 dark:hover:bg-slate-800 flex items-center gap-2"
              >
                <Share2 className="w-3.5 h-3.5 text-amber-500" />
                <span>Exportar Postman Collection</span>
              </button>
            </div>
          )}
        </div>

        {/* Templates Dropdown Menu */}
        <div className="relative">
          <button
            onClick={() => { setShowTemplateMenu(!showTemplateMenu); setShowFileMenu(false); }}
            className="px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-zinc-700 dark:text-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
          >
            <Sliders className="w-3.5 h-3.5 text-zinc-500 dark:text-slate-400" />
            <span>Modelos</span>
            <ChevronDown className="w-3 h-3 text-zinc-400" />
          </button>

          {showTemplateMenu && (
            <div className="absolute left-0 top-full mt-1.5 w-72 bg-white dark:bg-slate-900 border border-zinc-200 dark:border-slate-800 rounded-2xl shadow-2xl py-2 z-50 animate-fadeIn">
              <span className="px-4 py-1 text-[10px] font-extrabold uppercase tracking-wider text-zinc-400 block">
                Escolha um modelo de API:
              </span>
              {TEMPLATES.map(t => (
                <button
                  key={t.id}
                  onClick={() => { onLoadTemplate(t.id); setShowTemplateMenu(false); }}
                  className="w-full px-4 py-2.5 text-left hover:bg-zinc-100 dark:hover:bg-slate-800 transition-colors flex flex-col"
                >
                  <span className="text-xs font-bold text-zinc-900 dark:text-white">{t.name}</span>
                  <span className="text-[10px] text-zinc-400 leading-tight">{t.desc}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Format Conversions */}
        <div className="hidden lg:flex items-center gap-1 pl-2 border-l border-zinc-200 dark:border-slate-800">
          <button
            onClick={onConvertToYaml}
            disabled={language === 'yaml'}
            className="px-2.5 py-1 text-[11px] font-mono font-bold rounded-lg text-zinc-600 dark:text-slate-300 hover:bg-zinc-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
          >
            ➔ YAML
          </button>
          <button
            onClick={onConvertToJson}
            disabled={language === 'json'}
            className="px-2.5 py-1 text-[11px] font-mono font-bold rounded-lg text-zinc-600 dark:text-slate-300 hover:bg-zinc-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
          >
            ➔ JSON
          </button>
          <button
            onClick={onFormat}
            className="px-2.5 py-1 text-[11px] font-bold rounded-lg text-zinc-600 dark:text-slate-300 hover:bg-zinc-100 dark:hover:bg-slate-800 transition-colors"
            title="Formatar documento"
          >
            Formatar
          </button>
        </div>
      </div>

      {/* Right: Tools & Actions */}
      <div className="flex items-center gap-2">
        {/* TypeScript Generator */}
        <button
          onClick={onOpenTsModal}
          className="px-3 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/20 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
        >
          <Code2 className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">TypeScript DTOs</span>
        </button>

        {/* AI Copilot Button */}
        <button
          onClick={onOpenAiModal}
          className="px-3.5 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20 flex items-center gap-1.5 transition-all"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>IA Copilot</span>
        </button>

        {/* Authorize Button */}
        <button
          onClick={onOpenAuthModal}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-all ${
            isAuthorized
              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
              : 'bg-zinc-100 dark:bg-slate-800 text-zinc-700 dark:text-slate-300 border-zinc-200 dark:border-slate-700 hover:bg-zinc-200'
          }`}
        >
          {isAuthorized ? <Lock className="w-3.5 h-3.5 text-emerald-500" /> : <Unlock className="w-3.5 h-3.5 text-zinc-400" />}
          <span>Authorize</span>
        </button>

        {/* View Mode Toggle */}
        <div className="flex items-center bg-zinc-100 dark:bg-slate-800 p-1 rounded-xl border border-zinc-200 dark:border-slate-700">
          <button
            onClick={() => onChangeViewMode('editor')}
            title="Apenas Editor"
            className={`p-1.5 rounded-lg transition-colors ${
              viewMode === 'editor'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onChangeViewMode('split')}
            title="Divisão 50/50"
            className={`p-1.5 rounded-lg transition-colors ${
              viewMode === 'split'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            <Columns2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onChangeViewMode('preview')}
            title="Apenas Documentação"
            className={`p-1.5 rounded-lg transition-colors ${
              viewMode === 'preview'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
