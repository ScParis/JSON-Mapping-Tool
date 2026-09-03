import React, { useState } from 'react';
import { X, Sparkles, Loader2, ArrowRight, Check, AlertCircle, RefreshCw } from 'lucide-react';
import { runAiRequest } from '../../../services/aiConfig';

interface AiSwaggerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSpec: string;
  onApplySpec: (newSpec: string) => void;
}

export const AiSwaggerModal: React.FC<AiSwaggerModalProps> = ({
  isOpen,
  onClose,
  currentSpec,
  onApplySpec
}) => {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [generatedSpec, setGeneratedSpec] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGenerate = async (customPrompt?: string) => {
    const textPrompt = customPrompt || prompt;
    if (!textPrompt.trim() || loading) return;

    setLoading(true);
    setError(null);

    const systemPrompt = `Você é um Arquiteto de Software e Engenheiro de APIs especialista em OpenAPI 3.0 / 3.1 e Swagger.
Sua missão é gerar, estender, documentar ou refatorar especificações OpenAPI em formato YAML válido.
Regras estritas:
1. Responda APENAS com o código OpenAPI em YAML puro (sem blocos de texto explicativo no início ou fim).
2. Não inclua crases triplas (\`\`\`yaml) na resposta se puder evitar, ou garanta que seja YAML puro parseável.
3. Mantenha os endpoints existentes e adicione o que foi solicitado mantendo consistência de schemas e tags.`;

    const userPrompt = `Especificação OpenAPI atual:
\`\`\`yaml
${currentSpec}
\`\`\`

Solicitação do Usuário:
${textPrompt}`;

    try {
      const response = await runAiRequest(userPrompt, { systemPrompt });
      // Clean possible markdown code fences
      const cleaned = response.replace(/^```(yaml|json)?\n?/i, '').replace(/\n?```$/i, '').trim();
      setGeneratedSpec(cleaned);
    } catch (err: any) {
      setError(err.message || 'Erro ao consultar o assistente de IA.');
    } finally {
      setLoading(false);
    }
  };

  const handleApply = () => {
    if (generatedSpec) {
      onApplySpec(generatedSpec);
      onClose();
    }
  };

  const PRESETS = [
    { label: '📦 CRUD Completo de Produtos', prompt: 'Adicione um CRUD completo de Produtos (GET /products, GET /products/{id}, POST /products, PUT /products/{id}, DELETE /products/{id}) com paginação e schema Product.' },
    { label: '🔐 Adicionar Auth JWT', prompt: 'Adicione esquema de segurança Bearer JWT em securitySchemes e crie endpoints /auth/login e /auth/refresh.' },
    { label: '⚡ Webhook de Notificação', prompt: 'Adicione endpoint de recebimento de Webhook POST /webhooks/notifications com validação de assinatura HMAC no header.' },
    { label: '✨ Documentar & Padronizar', prompt: 'Melhore as descrições de todos os endpoints e adicione respostas padrão de erro 400, 401 e 500 no formato RFC 7807.' }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 border border-zinc-200 dark:border-slate-800 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-200 dark:border-slate-800 flex items-center justify-between bg-zinc-50 dark:bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-500 text-white rounded-xl shadow-md shadow-indigo-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-900 dark:text-white">Copilot de IA para OpenAPI</h3>
              <p className="text-xs text-zinc-500 dark:text-slate-400">Gere endpoints, documentações e schemas inteligentes com Gemini 3.6 Flash</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-white rounded-lg hover:bg-zinc-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          {/* Preset Prompts */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-400 dark:text-slate-400">
              Sugestões Rápidas:
            </span>
            <div className="flex flex-wrap gap-2">
              {PRESETS.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setPrompt(p.prompt);
                    handleGenerate(p.prompt);
                  }}
                  disabled={loading}
                  className="px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-zinc-700 dark:text-slate-200 rounded-xl text-xs font-semibold transition-colors disabled:opacity-50"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Prompt Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-extrabold uppercase tracking-wider text-zinc-500 dark:text-slate-400">
              O que você gostaria de criar ou modificar na API?
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Ex: Adicione um endpoint de upload de arquivos com suporte a multipart/form-data..."
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleGenerate(); }}
                disabled={loading}
                className="flex-1 bg-zinc-50 dark:bg-slate-950 border border-zinc-200 dark:border-slate-800 rounded-xl px-4 py-3 text-xs text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-slate-600 outline-none focus:border-indigo-500 transition-colors"
              />
              <button
                onClick={() => handleGenerate()}
                disabled={loading || !prompt.trim()}
                className="px-5 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20 flex items-center gap-1.5 transition-all"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                <span>Gerar</span>
              </button>
            </div>
          </div>

          {/* Error display */}
          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center gap-2 text-xs text-rose-500 dark:text-rose-400">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Generated Result Preview */}
          {generatedSpec && (
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                  <Check className="w-4 h-4" /> Especificação Gerada com Sucesso:
                </span>
                <span className="text-[10px] text-zinc-400 font-mono">
                  {generatedSpec.split('\n').length} linhas
                </span>
              </div>
              <div className="bg-zinc-950 rounded-xl border border-zinc-800 max-h-60 overflow-auto p-4 custom-scrollbar">
                <pre className="text-xs font-mono text-emerald-300 leading-relaxed">
                  <code>{generatedSpec}</code>
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-zinc-200 dark:border-slate-800 bg-zinc-50 dark:bg-slate-950/60 flex items-center justify-between">
          <span className="text-[11px] text-zinc-500 dark:text-slate-400">
            Alimentado por Nexora AI Engine
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-zinc-600 dark:text-slate-400 hover:bg-zinc-200 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleApply}
              disabled={!generatedSpec || loading}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 flex items-center gap-1.5 transition-all"
            >
              <Check className="w-3.5 h-3.5" /> Aplicar na Especificação
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
