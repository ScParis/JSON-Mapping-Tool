import React, { useState, useRef, useEffect } from 'react';
import { 
  X, Sparkles, Copy, Check, 
  RotateCcw, FileText, AlertTriangle, Loader2, RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from '../lib/motionShim';
import { convertImageToMarkdown } from '../services/geminiService';

interface ImageToMarkdownModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertContent: (markdown: string, mode: 'append' | 'replace') => void;
}

export const ImageToMarkdownModal: React.FC<ImageToMarkdownModalProps> = ({ 
  isOpen, 
  onClose, 
  onInsertContent 
}) => {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [base64Data, setBase64Data] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string>('');
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileSize, setFileSize] = useState<number | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultMarkdown, setResultMarkdown] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Helper to format file sizes
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = 1;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  // Handle file selection and conversion to base64
  const processFile = (file: File) => {
    const isImage = file.type.startsWith('image/');
    const isPdf = file.type === 'application/pdf' || file.name.endsWith('.pdf');

    if (!isImage && !isPdf) {
      setError('Por favor, selecione um arquivo válido (PDF ou imagem PNG, JPEG, WEBP).');
      return;
    }
    
    setError(null);
    setFileName(file.name);
    setFileSize(file.size);

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      if (isPdf) {
        // For PDF we just need the base64, we don't preview PDF directly as an image
        setImagePreview('pdf');
        setBase64Data(result.split(',')[1]);
        setMimeType('application/pdf');
      } else {
        setImagePreview(result);
        setBase64Data(result.split(',')[1]);
        setMimeType(file.type);
      }
    };
    reader.onerror = () => {
      setError('Erro ao ler o arquivo selecionado.');
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  // Drag and Drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  // Paste from clipboard support (images only)
  useEffect(() => {
    const handlePaste = (e: Event) => {
      if (!isOpen) return;
      const clipboardEvent = e as ClipboardEvent;
      const items = clipboardEvent.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            processFile(file);
            break;
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [isOpen]);

  const handleConvert = async () => {
    if (!base64Data || !mimeType) return;
    setIsProcessing(true);
    setError(null);

    try {
      const markdown = await convertImageToMarkdown(base64Data, mimeType);
      setResultMarkdown(markdown);
    } catch (err: any) {
      console.error(err);
      setError('Ocorreu um erro ao processar o arquivo com a Inteligência Artificial. Verifique sua conexão e chave de API.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCopy = () => {
    if (!resultMarkdown) return;
    navigator.clipboard.writeText(resultMarkdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReset = () => {
    setImagePreview(null);
    setBase64Data(null);
    setMimeType('');
    setFileName(null);
    setFileSize(null);
    setResultMarkdown(null);
    setError(null);
  };

  if (!isOpen) return null;

  const isPdf = mimeType === 'application/pdf';

  return (
    <div id="image-to-md-overlay" className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <AnimatePresence>
        <motion.div 
          id="image-to-md-modal"
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="bg-panel border border-base rounded-[2.5rem] w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl relative"
        >
          {/* Header */}
          <div className="h-16 border-b border-base px-8 flex items-center justify-between bg-app/30 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-accent to-purple-500 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-black text-primary uppercase tracking-wider">Conversor de Imagem e PDF para Markdown</h3>
                <p className="text-[10px] text-muted font-bold uppercase tracking-tight">Extração inteligente de textos, tabelas e estruturas por IA</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-2 rounded-xl text-muted hover:text-primary hover:bg-white/5 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
            {error && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-500 text-xs font-semibold animate-modern">
                <AlertTriangle className="w-5 h-5 shrink-0 text-red-500" />
                <span>{error}</span>
              </div>
            )}

            {/* Flow Control */}
            {!imagePreview ? (
              /* STAGE 1: Drag and Drop Upload */
              <div 
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-[2rem] p-16 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-300 min-h-[350px] ${
                  isDragging 
                    ? 'border-accent bg-accent/5 scale-[0.99] shadow-inner' 
                    : 'border-base hover:border-accent/40 bg-app/20 hover:bg-app/40'
                }`}
              >
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  accept="image/*,application/pdf" 
                  className="hidden" 
                />
                <div className="w-16 h-16 rounded-2xl bg-accent/5 border border-accent/10 flex items-center justify-center text-accent mb-6 shadow-sm">
                  <FileText className="w-8 h-8" />
                </div>
                <h4 className="text-sm font-black uppercase tracking-wider text-primary mb-2">Arraste e solte uma imagem ou PDF aqui</h4>
                <p className="text-xs text-muted max-w-sm leading-relaxed mb-1">
                  Suporta PDFs ou imagens PNG, JPEG, WEBP. Você também pode clicar para selecionar ou <span className="text-accent font-bold">colar imagens (Ctrl+V)</span> diretamente.
                </p>
              </div>
            ) : (
              /* STAGE 2 & 3 & 4: Previewing, Processing, Showing results */
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 h-full">
                {/* Left Column: Image or PDF Preview */}
                <div className="flex flex-col gap-4">
                  <span className="text-[10px] font-black uppercase text-muted tracking-widest px-1">Arquivo de Origem</span>
                  <div className="flex-1 bg-app border border-base rounded-2xl overflow-hidden flex flex-col items-center justify-center p-6 relative min-h-[250px] max-h-[450px]">
                    {isPdf ? (
                      /* PDF Render */
                      <div className="flex flex-col items-center text-center p-6 max-w-sm bg-panel border border-base rounded-2xl shadow-sm">
                        <div className="w-20 h-20 bg-red-500/10 border border-red-500/20 text-red-500 rounded-3xl flex items-center justify-center mb-6 relative">
                          <FileText className="w-10 h-10" />
                          <span className="absolute -bottom-1 -right-1 bg-red-500 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-lg shadow-sm">PDF</span>
                        </div>
                        <h5 className="text-xs font-black text-primary truncate max-w-full px-4 mb-2">{fileName}</h5>
                        <span className="text-[10px] font-bold text-muted uppercase tracking-widest bg-app px-3 py-1 rounded-lg border border-base">
                          {fileSize ? formatFileSize(fileSize) : 'Tamanho Desconhecido'}
                        </span>
                      </div>
                    ) : (
                      /* Image Render */
                      <img 
                        src={imagePreview} 
                        alt="Preview" 
                        className="max-w-full max-h-[380px] object-contain rounded-lg shadow-md"
                      />
                    )}
                    
                    {!resultMarkdown && !isProcessing && (
                      <button 
                        onClick={handleReset}
                        className="absolute top-4 right-4 p-2 bg-black/60 hover:bg-black/80 backdrop-blur-md rounded-xl text-white transition-all shadow-md"
                        title="Escolher outro arquivo"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Right Column: AI Processing OR Results */}
                <div className="flex flex-col gap-4 h-full min-h-[300px]">
                  {isProcessing ? (
                    /* Loading State */
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-app/20 border border-base rounded-2xl min-h-[250px]">
                      <div className="relative mb-6">
                        <Loader2 className="w-12 h-12 animate-spin text-accent" />
                        <div className="absolute inset-0 bg-accent/15 blur-xl animate-pulse" />
                      </div>
                      <h4 className="text-sm font-black uppercase tracking-widest text-primary mb-2">
                        {isPdf ? 'Transcrevendo PDF...' : 'Transcrevendo Imagem...'}
                      </h4>
                      <p className="text-[11px] text-muted font-bold uppercase tracking-tight italic max-w-xs leading-normal">
                        A Inteligência Artificial está analisando os elementos textuais, de layout e tabelas do seu {isPdf ? 'documento' : 'arquivo'} para gerar o Markdown correspondente.
                      </p>
                    </div>
                  ) : resultMarkdown ? (
                    /* Stage 4: Result display */
                    <div className="flex flex-col gap-4 flex-1">
                      <div className="flex items-center justify-between px-1">
                        <span className="text-[10px] font-black uppercase text-accent tracking-widest">Resultado em Markdown</span>
                        <button 
                          onClick={handleCopy}
                          className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-bold uppercase transition-all ${
                            copied ? 'bg-emerald-500 text-white' : 'text-muted hover:text-primary hover:bg-white/5'
                          }`}
                        >
                          {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                          {copied ? 'Copiado!' : 'Copiar'}
                        </button>
                      </div>

                      <div className="flex-1 relative">
                        <textarea
                          value={resultMarkdown}
                          onChange={(e) => setResultMarkdown(e.target.value)}
                          className="w-full h-[280px] md:h-[320px] p-4 bg-app border border-base rounded-2xl text-xs font-mono text-primary focus:outline-none focus:border-accent/55 custom-scrollbar resize-none"
                        />
                      </div>
                    </div>
                  ) : (
                    /* Stage 2: Ready to convert */
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-app/20 border border-base rounded-2xl min-h-[250px]">
                      <div className="w-12 h-12 rounded-xl bg-accent/5 border border-accent/10 flex items-center justify-center text-accent mb-6 shadow-sm">
                        <Sparkles className="w-6 h-6 animate-pulse" />
                      </div>
                      <h4 className="text-sm font-black uppercase tracking-wider text-primary mb-1">Pronto para conversão</h4>
                      <p className="text-xs text-muted max-w-xs leading-relaxed mb-6">
                        Clique no botão abaixo para iniciar o processamento inteligente do seu {isPdf ? 'PDF' : 'arquivo'} e extrair as informações estruturadas.
                      </p>
                      <button 
                        onClick={handleConvert}
                        className="flex items-center gap-2.5 px-6 py-3 bg-accent text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-accent-hover hover:scale-105 active:scale-95 transition-all shadow-xl shadow-accent/20"
                      >
                        <Sparkles className="w-4 h-4" />
                        Extrair com IA
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Footer actions for results */}
          {resultMarkdown && !isProcessing && (
            <div className="h-20 border-t border-base px-8 flex items-center justify-between bg-app/30 shrink-0">
              <button 
                onClick={handleReset}
                className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-muted hover:text-primary transition-all hover:bg-white/5 rounded-xl"
              >
                <RefreshCw className="w-4 h-4" />
                Novo Arquivo
              </button>
              
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => {
                    onInsertContent(resultMarkdown, 'append');
                    onClose();
                  }}
                  className="flex items-center gap-2 px-4 py-2 text-[11px] font-black uppercase tracking-widest text-muted border border-base rounded-xl hover:text-primary hover:bg-white/5 transition-all"
                >
                  <FileText className="w-4 h-4" />
                  Anexar ao Fim
                </button>
                
                <button 
                  onClick={() => {
                    onInsertContent(resultMarkdown, 'replace');
                    onClose();
                  }}
                  className="flex items-center gap-2 px-5 py-2.5 text-[11px] font-black uppercase tracking-widest bg-accent text-white rounded-xl hover:bg-accent-hover hover:scale-105 active:scale-95 transition-all shadow-lg shadow-accent/10"
                >
                  <Sparkles className="w-4 h-4" />
                  Substituir Editor
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
