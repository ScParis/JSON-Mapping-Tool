import React, { useState, useEffect, useRef, useCallback, useDeferredValue, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Cpu, Code2, Download, Copy, Check, Sun, Moon, Palette, 
  Sparkles, Trash2, BrainCircuit, ChevronRight, Terminal, 
  Loader2, Save, RotateCcw, RotateCw, AlignLeft, 
  FileText, Activity, Home, Link as LinkIcon, Zap
} from 'lucide-react';
import Editor from '@monaco-editor/react';
import { detectFormat, renderPreview, DEFAULT_CONTENT, CRM_ENTITIES, isVariableValid } from './lib/markdown';
import { convertDocxToContent, exportToPDF, exportToDocx } from './lib/converter';
import { processTextWithAI as runAi } from './services/geminiService';
import { AIAction, TextFormat, View } from './types';
import JsonViewer from './components/JsonViewer';
import LandingPage from './components/LandingPage';
import WhatsappBuilder from './components/WhatsappBuilder';
import NexusAI from './components/NexusAI';
import HsmStudio from './components/HsmStudio';
import { ImageToMarkdownModal } from './components/ImageToMarkdownModal';

type Theme = 'light' | 'dark' | 'midnight';

const App: React.FC = () => {
  const [content, setContent] = useState<string>(() => localStorage.getItem('studio_content_v2') || DEFAULT_CONTENT);
  const deferredContent = useDeferredValue(content);
  const [searchParams, setSearchParams] = useSearchParams();
  const activeView = (searchParams.get('view') as View) || 'editor';
  const setActiveView = (view: View) => {
    setSearchParams({ view });
  };
  const [forcedFormat, setForcedFormat] = useState<TextFormat | null>(null);
  const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem('portal-theme') as Theme) || 'midnight');
  const [activeTab, setActiveTab] = useState<'preview' | 'validator'>('preview');
  const [history, setHistory] = useState<string[]>([localStorage.getItem('studio_content_v2') || DEFAULT_CONTENT]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [leftWidth, setLeftWidth] = useState(48);
  const [isDragging, setIsDragging] = useState(false);
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [isImageToMdOpen, setIsImageToMdOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const format = useMemo(() => forcedFormat || detectFormat(deferredContent), [deferredContent, forcedFormat]);
  const renderedHtml = useMemo(() => renderPreview(deferredContent, format), [deferredContent, format]);

  const stats = useMemo(() => {
    const text = typeof deferredContent === 'string' ? deferredContent : '';
    const matches = Array.from(text.matchAll(/\{\{\s*([\w.]+)(?:[^}]*?)\}\}/g));
    const usedVariables = Array.from(new Set(matches.map(m => m[1])));
    return {
      valid: usedVariables.filter(v => isVariableValid(v)),
      invalid: usedVariables.filter(v => !isVariableValid(v)),
      total: usedVariables.length
    };
  }, [deferredContent]);

  useEffect(() => {
    const handleThemeChange = () => {
      const currentTheme = (localStorage.getItem('portal-theme') as Theme) || 'midnight';
      setTheme(currentTheme);
    };
    window.addEventListener('theme-changed', handleThemeChange);
    return () => window.removeEventListener('theme-changed', handleThemeChange);
  }, []);

  useEffect(() => {
    localStorage.setItem('portal-theme', theme);
    window.dispatchEvent(new Event('theme-changed'));
    if (theme === 'light') {
      document.documentElement.classList.remove('dark');
      document.documentElement.setAttribute('data-theme', 'light');
    } else {
      document.documentElement.classList.add('dark');
      document.documentElement.setAttribute('data-theme', theme);
    }
  }, [theme]);

  const handleResize = useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    const percentage = (e.clientX / window.innerWidth) * 100;
    if (percentage > 15 && percentage < 85) setLeftWidth(percentage);
  }, [isDragging]);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleResize);
      window.addEventListener('mouseup', () => setIsDragging(false));
    }
    return () => window.removeEventListener('mousemove', handleResize);
  }, [isDragging, handleResize]);

  useEffect(() => {
    const handleHomeNav = () => setActiveView('home');
    window.addEventListener('navigate-home', handleHomeNav);
    return () => window.removeEventListener('navigate-home', handleHomeNav);
  }, []);

  const handleSave = () => {
    localStorage.setItem('studio_content_v2', content);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const pushToHistory = useCallback((newContent: string) => {
    if (history[historyIndex] === newContent) return;
    const newHistory = [...history.slice(0, historyIndex + 1), newContent].slice(-50);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [history, historyIndex]);

  const handleInsertImageMarkdown = (markdown: string, mode: 'append' | 'replace') => {
    if (mode === 'replace') {
      setContent(markdown);
      pushToHistory(markdown);
    } else {
      setContent(prev => {
        const spacing = prev.trim() ? '\n\n' : '';
        const newContent = prev + spacing + markdown;
        pushToHistory(newContent);
        return newContent;
      });
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      if (file.name.endsWith('.docx')) {
        const content = await convertDocxToContent(file);
        setContent(content);
        pushToHistory(content);
      } else {
        const text = await file.text();
        setContent(text);
        pushToHistory(text);
      }
    } catch (err) {
      console.error("Erro ao importar o arquivo:", err);
    }
  };

  const handleExport = async (formatStr: string) => {
    setShowExportMenu(false);
    if (formatStr === 'PDF') {
      await exportToPDF(renderedHtml);
    } else if (formatStr === 'Docx') {
      await exportToDocx(renderedHtml);
    } else if (formatStr === 'HTML') {
      const fullHtml = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <title>Documento Exportado</title>
    <style>body { font-family: sans-serif; line-height: 1.6; max-width: 800px; margin: 40px auto; padding: 0 24px; }</style>
</head>
<body>${renderedHtml}</body>
</html>`;
      const blob = new Blob([fullHtml], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'documento.html';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(url), 100);
    } else if (formatStr === 'Markdown') {
      const blob = new Blob([content], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'documento.md';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(url), 100);
    }
  };

  const handleAiRefine = async () => {
    if (!content.trim()) return;
    setIsAiProcessing(true);
    try {
      const result = await runAi(content, AIAction.REFINE);
      setContent(result);
      pushToHistory(result);
    } catch (e) {
      console.error(e);
    } finally {
      setIsAiProcessing(false);
    }
  };

  const handleNavigate = (view: View, formatVal?: TextFormat, initialContent?: string) => {
    setActiveView(view);
    if (formatVal) setForcedFormat(formatVal);
    else setForcedFormat(null);
    
    if (initialContent !== undefined) {
      setContent(initialContent);
      pushToHistory(initialContent);
    }
  };

  if (activeView === 'home') {
    return <LandingPage onNavigate={handleNavigate} />;
  }


  return (
    <div className={`flex-1 flex flex-col h-full w-full bg-[#0f0f11] text-gray-100 font-sans overflow-hidden ${isDragging ? 'select-none cursor-col-resize' : ''}`}>
      {/* Inline toolbar — only visible on editor view */}
      {activeView === 'editor' && (
        <div className="h-11 bg-white/5 dark:bg-zinc-900/40 border-b border-zinc-800/60 flex items-center gap-2 px-4 flex-shrink-0">
          <span className="text-[10px] bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded-md font-bold border border-blue-500/20 uppercase flex-shrink-0">
            {format}
          </span>
          <div className="flex items-center gap-1 ml-auto">
            <button
              onClick={() => { navigator.clipboard.writeText(content); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[10px] font-bold transition-all ${
                copied ? 'bg-emerald-500/15 text-emerald-400' : 'text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/60'
              }`}
            >
              {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              <span className="hidden sm:inline">{copied ? 'Copiado' : 'Copiar'}</span>
            </button>
            <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".docx,.doc,.md,.txt,.json,.csv" className="hidden" />
            <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[10px] font-bold text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/60 transition-all">
              <FileText className="w-3 h-3" />
              <span className="hidden sm:inline">Importar</span>
            </button>
            <button onClick={() => setIsImageToMdOpen(true)} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[10px] font-bold text-blue-400 hover:bg-blue-500/10 border border-blue-500/15 transition-all">
              <Sparkles className="w-3 h-3 animate-pulse" />
              <span className="hidden sm:inline">IA Imagem</span>
            </button>
            <div className="relative flex items-center">
              <button onClick={() => setShowExportMenu(!showExportMenu)} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[10px] font-bold text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/60 transition-all">
                <Download className="w-3 h-3" />
                <span className="hidden sm:inline">Exportar</span>
              </button>
              {showExportMenu && (
                <div className="absolute top-full right-0 mt-2 w-40 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl z-50 p-1.5">
                  {['Markdown', 'HTML', 'PDF', 'Docx'].map(ext => (
                    <button key={ext} onClick={(e) => { e.stopPropagation(); handleExport(ext); }} className="w-full text-left px-3 py-2 text-xs font-semibold hover:bg-blue-500 hover:text-white rounded-xl transition-all text-zinc-400">{ext}</button>
                  ))}
                </div>
              )}
            </div>
            <button
              onClick={handleAiRefine}
              disabled={isAiProcessing}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all disabled:opacity-50 shadow-md shadow-indigo-600/25"
            >
              {isAiProcessing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
              <span className="hidden sm:inline">Magic AI</span>
            </button>
          </div>
        </div>
      )}

        <div className="flex-1 flex overflow-hidden">
          {activeView === 'editor' && (
            <>
              <div className="flex flex-col bg-[#1e1e24] dark:bg-[#18181c] h-full border-r border-gray-200 dark:border-gray-850" style={{ width: `${leftWidth}%` }}>
                <div className="h-12 border-b border-gray-200 dark:border-gray-800 px-6 flex items-center justify-between bg-gray-50/50 dark:bg-gray-900/30">
                  <div className="flex items-center gap-2 text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest"><Terminal className="w-3.5 h-3.5" /> Source Code</div>
                  <div className="flex items-center gap-3">
                    <button onClick={() => setContent('')} className="text-gray-400 hover:text-red-500 transition-colors" title="Clear Buffer"><Trash2 className="w-3.5 h-3.5" /></button>
                    {isSaved && <span className="text-[9px] font-black text-emerald-500 uppercase animate-pulse tracking-widest">Synced</span>}
                  </div>
                </div>
                <div className="flex-1 relative">
                  <Editor
                    height="100%"
                    language={format === TextFormat.JSON ? 'json' : format === TextFormat.HTML ? 'html' : 'markdown'}
                    theme={theme === 'light' ? 'vs' : 'vs-dark'}
                    value={content}
                    onChange={(val) => { if (val !== undefined) setContent(val); }}
                    options={{ minimap: { enabled: false }, fontSize: 13, lineNumbers: 'on', wordWrap: 'on', scrollBeyondLastLine: false, automaticLayout: true, padding: { top: 16, bottom: 64 }, fontFamily: 'JetBrains Mono, Fira Code, Menlo, Monaco, Consolas, monospace' }}
                  />
                  <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-1.5 p-1.5 bg-white/90 dark:bg-gray-900/80 backdrop-blur shadow-2xl border border-gray-200 dark:border-gray-800 rounded-2xl z-20">
                    <button onClick={handleSave} className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-gray-500 hover:text-blue-500 dark:text-gray-400 dark:hover:text-blue-400 hover:bg-blue-500/5 transition-all"><Save className="w-4 h-4" /> <span className="text-[10px] font-bold uppercase">Save</span></button>
                    <div className="w-px h-4 bg-gray-200 dark:bg-gray-800 mx-1" />
                    <button disabled={historyIndex === 0} onClick={() => { setContent(history[historyIndex-1]); setHistoryIndex(historyIndex-1); }} className="p-2 rounded-xl text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 transition-all disabled:opacity-20"><RotateCcw className="w-4 h-4" /></button>
                    <button disabled={historyIndex >= history.length - 1} onClick={() => { setContent(history[historyIndex+1]); setHistoryIndex(historyIndex+1); }} className="p-2 rounded-xl text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 transition-all disabled:opacity-20"><RotateCw className="w-4 h-4" /></button>
                    <div className="w-px h-4 bg-gray-200 dark:bg-gray-800 mx-1" />
                    <button onClick={handleAiRefine} className="p-2 rounded-xl text-gray-500 hover:text-blue-500 dark:text-gray-400 dark:hover:text-blue-400 transition-all"><AlignLeft className="w-4 h-4" /></button>
                  </div>
                </div>
              </div>
              <div className={`w-1 hover:bg-blue-500/50 cursor-col-resize z-40 transition-colors ${isDragging ? 'bg-blue-500' : ''}`} onMouseDown={() => setIsDragging(true)} />
              <div className="flex-1 flex flex-col bg-white dark:bg-[#111115] h-full">
                <div className="h-12 border-b border-gray-200 dark:border-gray-800 flex items-center px-4 bg-gray-50/50 dark:bg-gray-900/30">
                  <div className="flex gap-1">
                    <button onClick={() => setActiveTab('preview')} className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'preview' ? 'bg-blue-500 text-white' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'}`}>Preview</button>
                    <button onClick={() => setActiveTab('validator')} className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'validator' ? 'bg-blue-500 text-white' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'}`}>Validation {stats.invalid.length > 0 && '⚠️'}</button>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto p-12 custom-scrollbar bg-white dark:bg-[#111115] animate-modern">
                  {activeTab === 'preview' ? (format === TextFormat.JSON ? <JsonViewer content={deferredContent} /> : <div className="prose prose-slate dark:prose-invert prose-sm max-w-none text-gray-900 dark:text-gray-100" dangerouslySetInnerHTML={{ __html: renderedHtml }} />) : (
                    <div className="max-w-3xl mx-auto space-y-12">
                      <div className="grid grid-cols-2 gap-6">
                        <div className="p-8 bg-emerald-550/5 border border-emerald-500/10 rounded-[2rem] flex flex-col"><span className="text-[10px] font-black uppercase text-emerald-550 tracking-widest mb-2">Valid Tokens</span><span className="text-6xl font-black text-emerald-500">{stats.valid.length}</span></div>
                        <div className="p-8 bg-red-500/5 border border-red-500/10 rounded-[2rem] flex flex-col"><span className="text-[10px] font-black uppercase text-red-500 tracking-widest mb-2">Unknown Tags</span><span className="text-6xl font-black text-red-500">{stats.invalid.length}</span></div>
                      </div>
                      {stats.invalid.length > 0 && (
                        <div className="space-y-3">
                          <h4 className="text-xs font-black uppercase tracking-widest text-gray-500 px-2">Action Required</h4>
                          {stats.invalid.map(v => (
                            <div key={v} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 border border-red-500/10 rounded-2xl hover:border-red-500/30 transition-all"><code className="text-xs font-bold text-red-500">{`{{ ${v} }}`}</code><span className="text-[9px] font-black bg-red-500 text-white px-2 py-1 rounded-lg uppercase tracking-widest">Mismatch</span></div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {activeView === 'whatsapp-builder' && <WhatsappBuilder />}
          {activeView === 'nexus-ai' && <NexusAI />}
          {activeView === 'hsm-studio' && <HsmStudio />}
        </div>

      {isAiProcessing && (
        <div className="fixed bottom-10 right-6 bg-zinc-900/95 backdrop-blur text-white px-5 py-3 rounded-2xl shadow-2xl z-50 border border-zinc-800 flex items-center gap-4">
          <div className="relative"><Loader2 className="w-5 h-5 animate-spin text-indigo-400" /></div>
          <div className="flex flex-col"><span className="text-xs font-black uppercase tracking-widest text-indigo-400">AI Processing</span><span className="text-[10px] text-zinc-400 font-medium">Otimizando conteúdo...</span></div>
        </div>
      )}

      <ImageToMarkdownModal isOpen={isImageToMdOpen} onClose={() => setIsImageToMdOpen(false)} onInsertContent={handleInsertImageMarkdown} />
    </div>
  );
};

export default App;
