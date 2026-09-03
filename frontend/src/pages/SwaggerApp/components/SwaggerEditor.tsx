import React from 'react';
import Editor from '@monaco-editor/react';
import { ParseError } from '../types';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

interface SwaggerEditorProps {
  value: string;
  onChange: (val: string) => void;
  language: 'yaml' | 'json';
  error: ParseError | null;
  theme?: string;
}

export const SwaggerEditor: React.FC<SwaggerEditorProps> = ({
  value,
  onChange,
  language,
  error,
  theme = 'vs-dark'
}) => {
  return (
    <div className="h-full flex flex-col bg-zinc-950 overflow-hidden relative">
      {/* Monaco Editor Canvas */}
      <div className="flex-1 w-full h-full">
        <Editor
          height="100%"
          language={language}
          value={value}
          onChange={val => onChange(val || '')}
          theme={theme}
          options={{
            fontSize: 13,
            fontFamily: "'Fira Code', 'Cascadia Code', 'JetBrains Mono', monospace",
            minimap: { enabled: true, scale: 0.75 },
            scrollBeyondLastLine: false,
            wordWrap: 'on',
            lineNumbers: 'on',
            renderWhitespace: 'selection',
            tabSize: 2,
            automaticLayout: true,
            padding: { top: 12, bottom: 12 }
          }}
        />
      </div>

      {/* Status Bar */}
      <div className="h-8 bg-zinc-900 border-t border-zinc-800 px-4 flex items-center justify-between text-[11px] font-mono shrink-0 select-none">
        <div className="flex items-center gap-2">
          {error ? (
            <div className="flex items-center gap-1.5 text-rose-400 font-bold truncate max-w-md">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">
                {error.line ? `Linha ${error.line}: ` : ''}{error.message}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Sintaxe {language.toUpperCase()} válida</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 text-zinc-400">
          <span>{language.toUpperCase()}</span>
          <span>UTF-8</span>
          <span>{value.split('\n').length} linhas</span>
        </div>
      </div>
    </div>
  );
};
