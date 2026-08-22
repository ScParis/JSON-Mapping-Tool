
import React, { useState, useEffect } from 'react';
// Added Activity to the lucide-react imports
import { ChevronRight, ChevronDown, Copy, Check, Braces, Brackets, Activity } from 'lucide-react';

interface JsonViewerProps {
  content: string;
}

interface JsonNodeProps {
  name: string | null;
  value: any;
  path: string;
  depth: number;
  onSelect: (path: string, value: any) => void;
  isLast: boolean;
}

const formatPath = (parentPath: string, key: string | number): string => {
  if (parentPath === '') return 'x';
  if (typeof key === 'number') return `${parentPath}[${key}]`;
  if (/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key)) return `${parentPath}.${key}`;
  return `${parentPath}["${key}"]`;
};

const getTypeColor = (value: any): string => {
  if (value === null) return 'text-slate-500 italic opacity-60';
  switch (typeof value) {
    case 'string': return 'text-emerald-600 dark:text-emerald-400';
    case 'number': return 'text-blue-600 dark:text-blue-400 font-bold';
    case 'boolean': return 'text-purple-600 dark:text-purple-400 font-black';
    default: return 'text-primary';
  }
};

const JsonNode: React.FC<JsonNodeProps> = ({ name, value, path, depth, onSelect, isLast }) => {
  const [expanded, setExpanded] = useState<boolean>(depth < 2);
  const isObject = value !== null && typeof value === 'object';
  const isArray = Array.isArray(value);
  const keys = isObject ? Object.keys(value) : [];
  const isEmpty = keys.length === 0;

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setExpanded(!expanded);
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(path, value);
  };

  if (!isObject) {
    return (
      <div 
        className="font-mono text-[13px] hover:bg-accent/5 cursor-pointer rounded-lg px-2 py-1 flex items-start transition-all"
        style={{ marginLeft: `${depth * 16}px` }}
        onClick={handleClick}
      >
        <span className="text-muted mr-3 opacity-20 select-none">·</span>
        {name !== null && <span className="text-slate-700 dark:text-slate-300 mr-2 font-bold">{name}:</span>}
        <span className={`${getTypeColor(value)} break-all`}>
          {value === null ? 'null' : typeof value === 'string' ? `"${value}"` : String(value)}
        </span>
        {!isLast && <span className="text-muted ml-0.5">,</span>}
      </div>
    );
  }

  const bracketOpen = isArray ? '[' : '{';
  const bracketClose = isArray ? ']' : '}';

  return (
    <div className="font-mono text-[13px]">
      <div 
        className="hover:bg-accent/5 cursor-pointer rounded-lg px-2 py-1 flex items-center transition-all group"
        style={{ marginLeft: `${depth * 16}px` }}
        onClick={handleClick}
      >
        <button 
          onClick={handleToggle}
          className={`mr-1 p-0.5 rounded-md hover:bg-accent/20 transition-colors ${isEmpty ? 'opacity-0 cursor-default' : 'opacity-100'}`}
          disabled={isEmpty}
        >
          {expanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
        </button>
        
        {name !== null && <span className="text-purple-600 dark:text-purple-400 mr-2 font-black tracking-tight">{name}:</span>}
        
        <span className="text-muted flex items-center gap-1 font-bold">
          {bracketOpen}
          {!expanded && !isEmpty && <span className="text-[10px] bg-accent/10 text-accent px-1.5 rounded-md mx-1">{keys.length} items</span>}
          {!expanded && <span>{bracketClose}</span>}
          {!expanded && !isLast && <span>,</span>}
        </span>
      </div>

      {expanded && !isEmpty && (
        <div className="border-l border-base ml-4">
          {keys.map((key, index) => (
            <JsonNode
              key={key}
              name={isArray ? null : key}
              value={value[key]}
              path={formatPath(path, isArray ? parseInt(key) : key)}
              depth={depth + 1}
              onSelect={onSelect}
              isLast={index === keys.length - 1}
            />
          ))}
          <div style={{ marginLeft: `${depth * 16}px` }} className="px-2 py-1 text-muted font-bold">
            {bracketClose}{!isLast && ','}
          </div>
        </div>
      )}
      
      {expanded && isEmpty && (
        <div style={{ marginLeft: `${depth * 16}px` }} className="px-2 py-1 text-muted font-bold">
           {bracketClose}{!isLast && ','}
        </div>
      )}
    </div>
  );
};

const JsonViewer: React.FC<JsonViewerProps> = ({ content }) => {
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedPath, setSelectedPath] = useState<string>('x');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    try {
      if (!content || !content.trim()) return;
      setData(JSON.parse(content));
      setError(null);
    } catch (e) {
      setError((e as Error).message);
      setData(null);
    }
  }, [content]);

  const handleSelect = (path: string) => setSelectedPath(path);

  if (error) return (
    <div className="p-10 text-center">
      <div className="bg-red-500/10 text-red-500 border border-red-500/20 p-6 rounded-3xl inline-block mb-6">
        <Activity className="w-8 h-8 mb-4 mx-auto" />
        <h3 className="text-sm font-black uppercase tracking-widest">Syntax Error</h3>
      </div>
      <p className="font-mono text-xs opacity-60 max-w-xs mx-auto leading-relaxed">{error}</p>
    </div>
  );

  if (!data) return null;

  return (
    <div className="flex flex-col h-full bg-panel/30 rounded-[2rem] overflow-hidden border border-base">
      <div className="p-6 bg-app/40 border-b border-base">
        <div className="flex flex-col gap-3">
          <span className="text-[10px] font-black uppercase text-muted tracking-widest">Access Path Generator</span>
          <div className="flex items-center gap-3">
            <div className="flex-1 bg-panel border border-base rounded-2xl py-3 px-5 font-mono text-sm text-accent font-black shadow-inner">
              {selectedPath}
            </div>
            <button 
              onClick={() => { navigator.clipboard.writeText(selectedPath); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
              className={`p-3.5 rounded-2xl transition-all shadow-lg ${copied ? 'bg-emerald-500 text-white' : 'bg-accent text-white hover:bg-accent-hover'}`}
            >
              {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 p-8 overflow-auto custom-scrollbar">
        <JsonNode name={null} value={data} path="x" depth={0} onSelect={handleSelect} isLast={true} />
      </div>
    </div>
  );
};

export default JsonViewer;
