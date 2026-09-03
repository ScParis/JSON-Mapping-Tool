import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Play, Lock, Copy, Check, ExternalLink, Loader2, ArrowUpRight } from 'lucide-react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { HttpMethod, OpenApiOperation, OpenApiSpec, AuthState, TryItOutState } from '../types';
import { ParameterTable } from './ParameterTable';
import { RequestBodyViewer } from './RequestBodyViewer';
import { ResponseViewer } from './ResponseViewer';
import { generateCurlCommand, generateFetchCode } from '../utils/codeGenerator';

interface EndpointItemProps {
  method: HttpMethod;
  path: string;
  operation: OpenApiOperation;
  spec: OpenApiSpec;
  baseUrl: string;
  auth: AuthState;
  onSendToJsonMapper?: (data: any) => void;
}

export const EndpointItem: React.FC<EndpointItemProps> = ({
  method,
  path,
  operation,
  spec,
  baseUrl,
  auth,
  onSendToJsonMapper
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isTryItOut, setIsTryItOut] = useState(false);
  const [copiedCurl, setCopiedCurl] = useState(false);

  const initialContentType = Object.keys(operation.requestBody?.content || {})[0] || 'application/json';
  const initialBodyExample = operation.requestBody?.content?.[initialContentType]?.example
    ? JSON.stringify(operation.requestBody.content[initialContentType].example, null, 2)
    : '{}';

  const [tryState, setTryState] = useState<TryItOutState>({
    parameters: {},
    requestBody: initialBodyExample,
    selectedContentType: initialContentType,
    loading: false
  });

  const getMethodBadgeStyle = (m: HttpMethod) => {
    switch (m) {
      case 'get':
        return {
          badge: 'bg-blue-600 text-white',
          border: 'border-blue-500/30 hover:border-blue-500/60',
          bg: 'bg-blue-500/5 dark:bg-blue-500/10'
        };
      case 'post':
        return {
          badge: 'bg-emerald-600 text-white',
          border: 'border-emerald-500/30 hover:border-emerald-500/60',
          bg: 'bg-emerald-500/5 dark:bg-emerald-500/10'
        };
      case 'put':
        return {
          badge: 'bg-amber-600 text-white',
          border: 'border-amber-500/30 hover:border-amber-500/60',
          bg: 'bg-amber-500/5 dark:bg-amber-500/10'
        };
      case 'delete':
        return {
          badge: 'bg-rose-600 text-white',
          border: 'border-rose-500/30 hover:border-rose-500/60',
          bg: 'bg-rose-500/5 dark:bg-rose-500/10'
        };
      case 'patch':
        return {
          badge: 'bg-purple-600 text-white',
          border: 'border-purple-500/30 hover:border-purple-500/60',
          bg: 'bg-purple-500/5 dark:bg-purple-500/10'
        };
      default:
        return {
          badge: 'bg-zinc-600 text-white',
          border: 'border-zinc-500/30 hover:border-zinc-500/60',
          bg: 'bg-zinc-500/5 dark:bg-zinc-500/10'
        };
    }
  };

  const style = getMethodBadgeStyle(method);
  const isSecured = !!(operation.security?.length || spec.security?.length);

  const handleExecute = async () => {
    setTryState(prev => ({ ...prev, loading: true, error: undefined, response: undefined }));
    const startTime = performance.now();

    // Resolve URL with path parameters
    let resolvedPath = path;
    if (operation.parameters) {
      operation.parameters
        .filter(p => p.in === 'path')
        .forEach(p => {
          const val = tryState.parameters[p.name] !== undefined && tryState.parameters[p.name] !== ''
            ? tryState.parameters[p.name]
            : (p.schema?.example || p.example || '1');
          resolvedPath = resolvedPath.replace(`{${p.name}}`, encodeURIComponent(String(val)));
        });
    }

    // Query parameters
    const queryParts: string[] = [];
    if (operation.parameters) {
      operation.parameters
        .filter(p => p.in === 'query')
        .forEach(p => {
          const val = tryState.parameters[p.name];
          if (val !== undefined && val !== '') {
            queryParts.push(`${encodeURIComponent(p.name)}=${encodeURIComponent(String(val))}`);
          }
        });
    }

    const cleanBase = baseUrl.replace(/\/+$/, '');
    const cleanPath = resolvedPath.replace(/^\/+/, '');
    let finalUrl = `${cleanBase}/${cleanPath}`;
    if (queryParts.length > 0) finalUrl += `?${queryParts.join('&')}`;

    const headers: Record<string, string> = {};

    // Custom Header Parameters
    if (operation.parameters) {
      operation.parameters
        .filter(p => p.in === 'header')
        .forEach(p => {
          const val = tryState.parameters[p.name];
          if (val !== undefined && val !== '') {
            headers[p.name] = String(val);
          }
        });
    }

    // Content Type
    if (tryState.requestBody && method !== 'get' && method !== 'head') {
      headers['Content-Type'] = tryState.selectedContentType;
    }

    // Auth Headers
    if (auth.type === 'bearer' && auth.bearerToken) {
      headers['Authorization'] = `Bearer ${auth.bearerToken}`;
    } else if (auth.type === 'apiKey' && auth.apiKeyName && auth.apiKeyValue) {
      if (auth.apiKeyIn === 'header') {
        headers[auth.apiKeyName] = auth.apiKeyValue;
      }
    } else if (auth.type === 'basic' && (auth.basicUsername || auth.basicPassword)) {
      headers['Authorization'] = `Basic ${btoa(`${auth.basicUsername}:${auth.basicPassword}`)}`;
    }

    const curl = generateCurlCommand(method, baseUrl, path, tryState.parameters, operation, tryState.requestBody, auth);

    try {
      const fetchOpts: RequestInit = {
        method: method.toUpperCase(),
        headers
      };

      if (tryState.requestBody && method !== 'get' && method !== 'head') {
        fetchOpts.body = tryState.requestBody;
      }

      const res = await fetch(finalUrl, fetchOpts);
      const timeMs = Math.round(performance.now() - startTime);

      const resHeaders: Record<string, string> = {};
      res.headers.forEach((v, k) => { resHeaders[k] = v; });

      const text = await res.text();
      let parsedBody: any;
      try {
        parsedBody = JSON.parse(text);
      } catch {
        parsedBody = text;
      }

      setTryState(prev => ({
        ...prev,
        loading: false,
        response: {
          status: res.status,
          statusText: res.statusText || 'OK',
          timeMs,
          headers: resHeaders,
          body: parsedBody,
          rawBody: text,
          curl
        }
      }));
    } catch (err: any) {
      const timeMs = Math.round(performance.now() - startTime);
      setTryState(prev => ({
        ...prev,
        loading: false,
        error: err.message || 'Falha ao executar requisição (Possível bloqueio de CORS ou servidor offline).',
        response: {
          status: 0,
          statusText: 'Network / CORS Error',
          timeMs,
          headers: {},
          body: null,
          rawBody: '',
          curl
        }
      }));
    }
  };

  const copyCurl = () => {
    const curl = generateCurlCommand(method, baseUrl, path, tryState.parameters, operation, tryState.requestBody, auth);
    navigator.clipboard.writeText(curl);
    setCopiedCurl(true);
    setTimeout(() => setCopiedCurl(false), 2000);
  };

  return (
    <div className={`border rounded-2xl overflow-hidden transition-all ${style.border} ${style.bg}`}>
      {/* Header Bar */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="px-4 py-3 cursor-pointer flex items-center justify-between select-none gap-3"
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <span className={`px-2.5 py-1 rounded-lg text-xs font-mono font-black uppercase tracking-wider ${style.badge}`}>
            {method}
          </span>
          <span className="font-mono text-xs md:text-sm font-bold text-zinc-900 dark:text-slate-100 truncate">
            {path}
          </span>
          {operation.summary && (
            <span className="text-xs text-zinc-500 dark:text-slate-400 truncate hidden sm:inline">
              — {operation.summary}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {isSecured && (
            <span title="Requer Autenticação" className="p-1 text-amber-500 bg-amber-500/10 rounded-md">
              <Lock className="w-3.5 h-3.5" />
            </span>
          )}
          {isExpanded ? <ChevronDown className="w-4 h-4 text-zinc-400" /> : <ChevronRight className="w-4 h-4 text-zinc-400" />}
        </div>
      </div>

      {/* Accordion Body */}
      {isExpanded && (
        <div className="p-4 md:p-6 border-t border-zinc-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900/90 space-y-6">
          {/* Summary / Description */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              {operation.summary && (
                <h3 className="text-sm font-extrabold text-zinc-900 dark:text-white">{operation.summary}</h3>
              )}
              {operation.description && (
                <div
                  className="swagger-markdown text-xs text-zinc-600 dark:text-slate-400 mt-1"
                  dangerouslySetInnerHTML={{
                    __html: DOMPurify.sanitize(marked.parse(operation.description, { gfm: true, breaks: true }) as string)
                  }}
                />
              )}
            </div>

            {/* Try It Out Button */}
            <button
              onClick={() => setIsTryItOut(!isTryItOut)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
                isTryItOut
                  ? 'bg-zinc-200 dark:bg-slate-800 text-zinc-800 dark:text-slate-200 hover:bg-zinc-300'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/20'
              }`}
            >
              {isTryItOut ? 'Cancelar Try It Out' : '⚡ Try it out'}
            </button>
          </div>

          {/* Parameters Table */}
          {operation.parameters && operation.parameters.length > 0 && (
            <ParameterTable
              parameters={operation.parameters}
              isTryItOut={isTryItOut}
              values={tryState.parameters}
              onChangeValue={(name, val) =>
                setTryState(prev => ({ ...prev, parameters: { ...prev.parameters, [name]: val } }))
              }
            />
          )}

          {/* Request Body */}
          {operation.requestBody && (
            <RequestBodyViewer
              requestBody={operation.requestBody}
              spec={spec}
              isTryItOut={isTryItOut}
              bodyValue={tryState.requestBody}
              onChangeBodyValue={val => setTryState(prev => ({ ...prev, requestBody: val }))}
              selectedContentType={tryState.selectedContentType}
              onChangeContentType={ct => setTryState(prev => ({ ...prev, selectedContentType: ct }))}
            />
          )}

          {/* Execute Action */}
          {isTryItOut && (
            <div className="pt-2 flex items-center gap-3">
              <button
                onClick={handleExecute}
                disabled={tryState.loading}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 flex items-center gap-2 transition-all"
              >
                {tryState.loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                <span>Executar Requisição</span>
              </button>
              <button
                onClick={copyCurl}
                className="px-4 py-2.5 bg-zinc-100 dark:bg-slate-800 hover:bg-zinc-200 dark:hover:bg-slate-700 text-zinc-700 dark:text-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
              >
                {copiedCurl ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCurl ? 'cURL Copiado!' : 'Copiar cURL'}</span>
              </button>
            </div>
          )}

          {/* Live Response Panel */}
          {tryState.response && (
            <div className="space-y-3 pt-4 border-t border-zinc-200 dark:border-slate-800 animate-fadeIn">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-zinc-500 dark:text-slate-400">
                    Resposta do Servidor:
                  </span>
                  <span
                    className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold ${
                      tryState.response.status >= 200 && tryState.response.status < 300
                        ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/30'
                        : 'bg-rose-500/10 text-rose-500 border border-rose-500/30'
                    }`}
                  >
                    {tryState.response.status} {tryState.response.statusText}
                  </span>
                  <span className="text-[11px] font-mono text-zinc-400 dark:text-slate-500">
                    {tryState.response.timeMs}ms
                  </span>
                </div>

                {onSendToJsonMapper && typeof tryState.response.body === 'object' && tryState.response.body !== null && (
                  <button
                    onClick={() => onSendToJsonMapper(tryState.response?.body)}
                    className="text-xs font-bold text-indigo-500 hover:text-indigo-400 flex items-center gap-1 transition-colors"
                  >
                    <span>Abrir no JSON Mapper</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* cURL Snippet */}
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Comando cURL:</span>
                <div className="bg-zinc-950 p-3 rounded-xl overflow-x-auto custom-scrollbar">
                  <pre className="text-xs font-mono text-zinc-300">
                    <code>{tryState.response.curl}</code>
                  </pre>
                </div>
              </div>

              {/* Response Body */}
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Response Body:</span>
                <div className="bg-zinc-950 p-3 rounded-xl max-h-72 overflow-auto custom-scrollbar">
                  <pre className="text-xs font-mono text-emerald-400">
                    <code>
                      {typeof tryState.response.body === 'object'
                        ? JSON.stringify(tryState.response.body, null, 2)
                        : tryState.response.rawBody || '<Corpo vazio>'}
                    </code>
                  </pre>
                </div>
              </div>
            </div>
          )}

          {/* Standard Responses Specs */}
          <ResponseViewer responses={operation.responses} spec={spec} />
        </div>
      )}
    </div>
  );
};
