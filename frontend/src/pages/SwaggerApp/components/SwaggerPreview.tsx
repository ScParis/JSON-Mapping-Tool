import React, { useState, useMemo } from 'react';
import { Server, Search, Tag, Filter, Globe, BookOpen, AlertTriangle, Lock, Unlock } from 'lucide-react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { OpenApiSpec, HttpMethod, AuthState } from '../types';
import { EndpointItem } from './EndpointItem';
import { SchemaViewer } from './SchemaViewer';

interface SwaggerPreviewProps {
  spec: OpenApiSpec | null;
  error: string | null;
  baseUrl: string;
  onChangeBaseUrl: (url: string) => void;
  auth: AuthState;
  onSendToJsonMapper?: (data: any) => void;
  onOpenAuthModal?: () => void;
}

export const SwaggerPreview: React.FC<SwaggerPreviewProps> = ({
  spec,
  error,
  baseUrl,
  onChangeBaseUrl,
  auth,
  onSendToJsonMapper,
  onOpenAuthModal
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMethodFilter, setSelectedMethodFilter] = useState<string>('ALL');

  if (error || !spec) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-zinc-50 dark:bg-[#030711]/60">
        <div className="p-4 bg-rose-500/10 text-rose-500 rounded-2xl mb-4">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h3 className="text-base font-bold text-zinc-900 dark:text-white mb-1">
          Erro ao processar especificação OpenAPI
        </h3>
        <p className="text-xs text-zinc-500 dark:text-slate-400 max-w-md font-mono bg-zinc-100 dark:bg-slate-900 p-3 rounded-xl border border-zinc-200 dark:border-slate-800">
          {error || 'Nenhum dado válido carregado no editor.'}
        </p>
      </div>
    );
  }

  const info = spec.info || { title: 'OpenAPI Specification', version: '1.0.0' };
  const servers = spec.servers || [{ url: spec.host ? `https://${spec.host}${spec.basePath || ''}` : 'https://api.exemplo.com' }];

  const isAuthed = !!(auth.bearerToken || auth.apiKeyValue || auth.basicUsername);

  // Description markdown dynamic rendering
  const descriptionHtml = useMemo(() => {
    if (!info.description) return '';
    try {
      const rawHtml = marked.parse(info.description, { gfm: true, breaks: true }) as string;
      return DOMPurify.sanitize(rawHtml);
    } catch {
      return info.description;
    }
  }, [info.description]);

  // Extract endpoints grouped by tags
  const tagsMap: Record<string, { method: HttpMethod; path: string; operation: any }[]> = {};
  const defaultTag = 'Endpoints Gerais';

  const paths = spec.paths || {};
  const methods: HttpMethod[] = ['get', 'post', 'put', 'delete', 'patch', 'options', 'head'];

  Object.entries(paths).forEach(([path, pathItem]) => {
    methods.forEach(method => {
      const op = (pathItem as any)[method];
      if (op) {
        const opTags = op.tags && op.tags.length > 0 ? op.tags : [defaultTag];
        opTags.forEach((t: string) => {
          if (!tagsMap[t]) tagsMap[t] = [];
          tagsMap[t].push({ method, path, operation: op });
        });
      }
    });
  });

  const tagNames = Object.keys(tagsMap);

  // Filter endpoints
  const matchesFilter = (item: { method: HttpMethod; path: string; operation: any }) => {
    if (selectedMethodFilter !== 'ALL' && item.method.toUpperCase() !== selectedMethodFilter) {
      return false;
    }
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      item.path.toLowerCase().includes(query) ||
      (item.operation.summary && item.operation.summary.toLowerCase().includes(query)) ||
      (item.operation.description && item.operation.description.toLowerCase().includes(query))
    );
  };

  return (
    <div className="h-full overflow-y-auto custom-scrollbar p-6 md:p-8 space-y-8 bg-zinc-50/50 dark:bg-[#030711]/50">
      {/* API Header Info Card */}
      <div className="bg-white dark:bg-slate-900/80 rounded-2xl border border-zinc-200 dark:border-slate-800 p-6 shadow-sm space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
          <div className="space-y-2 flex-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-2xl md:text-3xl font-black text-zinc-900 dark:text-white tracking-tight">
                {info.title}
              </h1>
              <span className="px-2.5 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 text-xs font-mono font-bold rounded-lg shadow-2xs">
                {info.version || '1.0.0'}
              </span>
              <span className="px-2.5 py-0.5 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 text-xs font-mono font-bold rounded-lg uppercase">
                {spec.openapi ? `OAS ${spec.openapi}` : 'Swagger 2.0'}
              </span>
            </div>

            {/* Links & Contact */}
            <div className="flex items-center gap-4 text-xs text-zinc-500 dark:text-slate-400 flex-wrap pt-1">
              {info.contact?.email && (
                <span>Suporte: <a href={`mailto:${info.contact.email}`} className="text-indigo-600 dark:text-indigo-400 hover:underline">{info.contact.email}</a></span>
              )}
              {info.license && (
                <span>Licença: <a href={info.license.url || '#'} target="_blank" rel="noreferrer" className="text-indigo-600 dark:text-indigo-400 hover:underline">{info.license.name}</a></span>
              )}
              {info.termsOfService && (
                <a href={info.termsOfService} target="_blank" rel="noreferrer" className="text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1">
                  <BookOpen className="w-3.5 h-3.5" /> Termos de Serviço
                </a>
              )}
            </div>
          </div>

          {/* Server Selector & Authorize Button */}
          <div className="w-full lg:w-80 space-y-2 flex-shrink-0">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-400 dark:text-slate-400 flex items-center gap-1">
                <Server className="w-3.5 h-3.5 text-indigo-500" /> Servidor / Base URL:
              </label>
              {onOpenAuthModal && (
                <button
                  onClick={onOpenAuthModal}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                    isAuthed
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                      : 'bg-zinc-100 dark:bg-slate-800 text-zinc-700 dark:text-slate-300 border border-zinc-200 dark:border-slate-700 hover:border-indigo-500'
                  }`}
                  title="Configurar Autenticação"
                >
                  <Lock className="w-3 h-3 text-emerald-500" />
                  <span>Authorize</span>
                </button>
              )}
            </div>
            <select
              value={baseUrl}
              onChange={e => onChangeBaseUrl(e.target.value)}
              className="w-full bg-zinc-50 dark:bg-slate-950 border border-zinc-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-mono font-bold text-zinc-900 dark:text-slate-200 outline-none focus:border-indigo-500 transition-colors shadow-sm cursor-pointer"
            >
              {servers.map((s, idx) => (
                <option key={idx} value={s.url}>
                  {s.url} {s.description ? `(${s.description})` : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Dynamic Rich Description Formatting */}
        {descriptionHtml && (
          <div className="pt-4 border-t border-zinc-200/80 dark:border-slate-800/80">
            <div
              className="swagger-markdown"
              dangerouslySetInnerHTML={{ __html: descriptionHtml }}
            />
          </div>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-900/60 p-3 rounded-2xl border border-zinc-200 dark:border-slate-800">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Filtrar por rota, sumário ou tag..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-zinc-50 dark:bg-slate-950 border border-zinc-200 dark:border-slate-800 rounded-xl text-xs text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-slate-500 outline-none focus:border-indigo-500"
          />
        </div>

        {/* Method Filter Buttons */}
        <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 custom-scrollbar">
          {['ALL', 'GET', 'POST', 'PUT', 'DELETE', 'PATCH'].map(m => (
            <button
              key={m}
              onClick={() => setSelectedMethodFilter(m)}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all ${
                selectedMethodFilter === m
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-zinc-100 dark:bg-slate-800 text-zinc-600 dark:text-slate-300 hover:bg-zinc-200 dark:hover:bg-slate-700'
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* Tag Groups and Operations */}
      <div className="space-y-8">
        {tagNames.map(tag => {
          const filteredItems = tagsMap[tag].filter(matchesFilter);
          if (filteredItems.length === 0) return null;

          const tagInfo = spec.tags?.find(t => t.name === tag);

          return (
            <div key={tag} className="space-y-3">
              {/* Tag Header */}
              <div className="flex items-center justify-between border-b border-zinc-200 dark:border-slate-800 pb-2">
                <div className="flex items-center gap-2">
                  <Tag className="w-4 h-4 text-indigo-500" />
                  <h2 className="text-base font-extrabold text-zinc-900 dark:text-white tracking-tight">{tag}</h2>
                  {tagInfo?.description && (
                    <span className="text-xs text-zinc-400 hidden md:inline">— {tagInfo.description}</span>
                  )}
                </div>
                <span className="text-xs font-mono font-bold text-zinc-400 bg-zinc-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                  {filteredItems.length} {filteredItems.length === 1 ? 'rota' : 'rotas'}
                </span>
              </div>

              {/* Endpoints List */}
              <div className="space-y-3">
                {filteredItems.map((item, idx) => (
                  <EndpointItem
                    key={`${item.method}-${item.path}-${idx}`}
                    method={item.method}
                    path={item.path}
                    operation={item.operation}
                    spec={spec}
                    baseUrl={baseUrl}
                    auth={auth}
                    onSendToJsonMapper={onSendToJsonMapper}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Schemas / Components Section */}
      <SchemaViewer spec={spec} />
    </div>
  );
};
