import React, { useState } from 'react';
import { Upload, X, FileSpreadsheet, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '../../../components/ui';
import { parseFileToSchema } from '../services/schemaParser';
import { ColumnDefinition } from '../types';

interface SchemaImporterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (columns: ColumnDefinition[]) => void;
}

export const SchemaImporterModal: React.FC<SchemaImporterModalProps> = ({
  isOpen,
  onClose,
  onImport,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFile = async (file: File) => {
    setIsParsing(true);
    setError(null);
    try {
      const res = await parseFileToSchema(file);
      onImport(res.columns);
      onClose();
    } catch (e: any) {
      setError(e.message || 'Erro ao importar arquivo de modelo');
    } finally {
      setIsParsing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFile(e.target.files[0]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl w-full max-w-lg overflow-hidden shadow-2xl">
        <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-indigo-400" />
            <h3 className="text-lg font-semibold text-white">Importar Modelo de Arquivo</h3>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          <p className="text-sm text-zinc-400 mb-4">
            Envie um arquivo de exemplo (<code className="text-indigo-400">.json</code>, <code className="text-indigo-400">.csv</code>, <code className="text-indigo-400">.xlsx</code>, <code className="text-indigo-400">.doc</code> ou <code className="text-indigo-400">.txt</code>) para inferir automaticamente os nomes de colunas e os tipos de dados correspondentes.
          </p>

          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl p-8 text-center transition flex flex-col items-center justify-center cursor-pointer ${
              isDragging ? 'border-indigo-500 bg-indigo-500/10' : 'border-zinc-700 bg-zinc-950/50 hover:border-zinc-500'
            }`}
          >
            <input
              type="file"
              id="schema-file-input"
              accept=".json,.csv,.tsv,.txt,.xlsx,.xls,.doc,.docx"
              className="hidden"
              onChange={handleFileInput}
            />

            {isParsing ? (
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="w-10 h-10 text-indigo-400 animate-spin" />
                <span className="text-sm text-zinc-300">Analisando modelo e colunas...</span>
              </div>
            ) : (
              <label htmlFor="schema-file-input" className="cursor-pointer flex flex-col items-center">
                <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-full mb-3">
                  <Upload className="w-8 h-8" />
                </div>
                <span className="text-sm font-medium text-zinc-200">Arraste seu arquivo aqui ou clique para buscar</span>
                <span className="text-xs text-zinc-500 mt-1">Formatos suportados: JSON, CSV, TSV, XLSX, DOC, TXT</span>
              </label>
            )}
          </div>

          {error && (
            <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-2 text-sm text-red-400">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-zinc-800 bg-zinc-950/50 flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
        </div>
      </div>
    </div>
  );
};
