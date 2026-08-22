import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from '../lib/motionShim';
import { 
  Smartphone, Settings, Zap, CheckCircle, AlertTriangle, 
  Sparkles, FileText, RefreshCcw, Image, Video, Link, Plus, Trash2, Shield
} from 'lucide-react';
import { auditHsmTemplate } from '../services/geminiService';

interface HsmButton {
  type: 'QUICK_REPLY' | 'PHONE_NUMBER' | 'URL';
  text: string;
  value?: string;
}

const HsmStudio: React.FC = () => {
  // Main states matching the specified enterprise layout
  const [apiMode, setApiMode] = useState<'CLOUD_API' | 'MM_LITE'>('CLOUD_API');
  const [headerType, setHeaderType] = useState<'NONE' | 'TEXT' | 'MEDIA'>('NONE');
  const [headerText, setHeaderText] = useState('');
  const [headerMediaUrl, setHeaderMediaUrl] = useState('');
  const [bodyText, setBodyText] = useState('Olá {{1}}, seu pedido {{2}} já foi despachado rumbando para o destino!');
  const [footerText, setFooterText] = useState('Não deseja receber mais mensagens? Digite Sair.');
  const [buttons, setButtons] = useState<HsmButton[]>([
    { type: 'QUICK_REPLY', text: 'Rastrear Encomenda' },
    { type: 'URL', text: 'Ir para o site', value: 'https://piperun.com' }
  ]);
  
  // Variables map: {{1}} -> value
  const [variables, setVariables] = useState<Record<string, string>>({
    '1': 'João',
    '2': '#892716'
  });

  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Scan bodyText for template variables {{n}}
  const detectedVariables = useMemo(() => {
    const regex = /\{\{(\d+)\}\}/g;
    const matches: string[] = [];
    let match;
    while ((match = regex.exec(bodyText)) !== null) {
      if (!matches.includes(match[1])) {
        matches.push(match[1]);
      }
    }
    return matches.sort((a, b) => parseInt(a) - parseInt(b));
  }, [bodyText]);

  // Sync state variables keeping user-defined keys
  useEffect(() => {
    const updatedVars = { ...variables };
    let changed = false;
    detectedVariables.forEach(v => {
      if (updatedVars[v] === undefined) {
        updatedVars[v] = `[Variável ${v}]`;
        changed = true;
      }
    });
    if (changed) {
      setVariables(updatedVars);
    }
  }, [detectedVariables]);

  const runAudit = async () => {
    setLoading(true);
    try {
      const templatePayload = {
        apiMode,
        headerType,
        headerText: headerType === 'TEXT' ? headerText : undefined,
        headerMedia: headerType === 'MEDIA' ? headerMediaUrl : undefined,
        body: bodyText,
        footer: footerText || undefined,
        buttons,
        variables
      };
      
      const audit = await auditHsmTemplate(templatePayload);
      setResult(audit);
    } catch (e) {
      console.error(e);
      setResult({
        qualityScore: 45,
        grammarIssues: ["Erro de conexão ou timeout do gateway de análise."],
        policyWarnings: ["Modo offline fallback ativado."],
        improvedVersion: bodyText
      });
    } finally {
      setLoading(false);
    }
  };

  // Safe WhatsApp Standard Markdown parser
  const renderFormattedBody = (rawText: string) => {
    let text = rawText;
    
    // Inject Dynamic Variable Values or Fallbacks
    detectedVariables.forEach(v => {
      const val = variables[v] || `[Variável ${v}]`;
      text = text.replace(new RegExp(`\\{\\{${v}\\}\\}`, 'g'), `<span class="bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold px-1.5 py-0.5 rounded-md text-xs border border-indigo-200 dark:border-indigo-800">${val}</span>`);
    });

    // Formatting rules (*bold*, _italic_, ~strikeout~)
    text = text.replace(/\*(.*?)\*/g, '<strong>$1</strong>');
    text = text.replace(/_(.*?)_/g, '<em>$1</em>');
    text = text.replace(/~(.*?)~/g, '<del>$1</del>');

    return { __html: text };
  };

  const applyOtimizacao = () => {
    if (result?.improvedVersion) {
      setBodyText(result.improvedVersion);
    }
  };

  const handleAddButton = () => {
    if (buttons.length < 5) {
      setButtons([...buttons, { type: 'QUICK_REPLY', text: 'Novo Botão' }]);
    }
  };

  const handleRemoveButton = (index: number) => {
    setButtons(buttons.filter((_, i) => i !== index));
  };

  return (
    <div className="flex-1 overflow-y-auto bg-zinc-50 dark:bg-[#030711] p-6 lg:p-12 custom-scrollbar animate-modern font-sans">
      <div className="max-w-7xl mx-auto space-y-10">
        
        {/* Modern Header Banner */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-gradient-to-r from-indigo-500/10 via-purple-500/5 to-cyan-500/10 p-8 rounded-[2rem] border border-indigo-500/10 backdrop-blur-3xl relative overflow-hidden">
          <div className="absolute top-[-50%] right-[-10%] w-72 h-72 bg-indigo-500/10 rounded-full blur-[80px] pointer-events-none" />
          <div className="space-y-2">
            <h1 className="text-3xl font-black tracking-tight flex items-center gap-2">
              <Zap className="w-8 h-8 text-indigo-500" /> HSM Studio AI
            </h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-2xl leading-relaxed">
              Desenvolva, otimize e audite seus templates altamente estruturados (Highly Structured Messages) com conformidade direta das políticas mundiais da Meta.
            </p>
          </div>
          <div className="flex items-center gap-2.5 p-1.5 bg-white dark:bg-zinc-950/80 rounded-2xl border border-zinc-200 dark:border-zinc-800 self-start shadow-sm shadow-black/5">
            <button 
              onClick={() => setApiMode('CLOUD_API')}
              className={`px-4 py-2 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${apiMode === 'CLOUD_API' ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/15' : 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-900'}`}
            >
              Cloud API (Meta)
            </button>
            <button 
              onClick={() => setApiMode('MM_LITE')}
              className={`px-4 py-2 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${apiMode === 'MM_LITE' ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/15' : 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-900'}`}
            >
              MM Lite
            </button>
          </div>
        </header>

        {/* Workspace Columns */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
          
          {/* Main Template Editor Configuration */}
          <div className="xl:col-span-7 space-y-8">
            <div className="bg-white dark:bg-zinc-900/60 backdrop-blur-md rounded-[2.5rem] border border-zinc-200 dark:border-zinc-800 p-8 space-y-8">
              <h2 className="text-lg font-black uppercase tracking-widest text-zinc-400 flex items-center gap-2">
                <Settings className="w-5 h-5 text-indigo-500" /> Parâmetros do Template
              </h2>

              {/* Header Selector Switch */}
              <div className="space-y-4">
                <label className="text-xs font-black uppercase tracking-wider text-zinc-400">Tipo de Cabeçalho (Header)</label>
                <div className="grid grid-cols-3 gap-2.5">
                  {(['NONE', 'TEXT', 'MEDIA'] as const).map(type => (
                    <button 
                      key={type}
                      onClick={() => setHeaderType(type)}
                      className={`py-3 rounded-2xl border text-xs font-bold uppercase transition-all duration-200 ${headerType === type ? 'bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 border-indigo-500/30 font-extrabold shadow-sm' : 'border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-900'}`}
                    >
                      {type === 'NONE' ? 'Sem Cabeçalho' : type === 'TEXT' ? 'Texto Livre' : 'Mídia Integrada'}
                    </button>
                  ))}
                </div>

                {/* Conditional fields based on selection */}
                <AnimatePresence mode="popLayout">
                  {headerType === 'TEXT' && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-2 mt-2"
                    >
                      <input 
                        type="text"
                        placeholder="Insira o texto do cabeçalho (Máx 60 caracteres)..."
                        maxLength={60}
                        value={headerText}
                        onChange={e => setHeaderText(e.target.value)}
                        className="w-full bg-zinc-50 dark:bg-zinc-950 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 text-sm outline-none focus:border-indigo-500 duration-150"
                      />
                      <span className="text-[10px] text-zinc-400 block text-right font-semibold">{headerText.length}/60 Caracteres</span>
                    </motion.div>
                  )}

                  {headerType === 'MEDIA' && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-3 mt-2"
                    >
                      <input 
                        type="text"
                        placeholder="URL pública da Imagem/Vídeo/Documento..."
                        value={headerMediaUrl}
                        onChange={e => setHeaderMediaUrl(e.target.value)}
                        className="w-full bg-zinc-50 dark:bg-zinc-950 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 text-sm outline-none focus:border-indigo-500 duration-150"
                      />
                      <div className="flex items-center gap-4 text-xs text-zinc-400 px-1">
                        <span className="flex items-center gap-1"><Image className="w-3.5 h-3.5" /> JPEG/PNG</span>
                        <span className="flex items-center gap-1"><Video className="w-3.5 h-3.5" /> MP4 H.264</span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Template Body */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black uppercase tracking-wider text-zinc-400">Texto Principal do Corpo (Body)</label>
                  <span className="text-[10px] text-zinc-400 font-semibold">{bodyText.length}/1024</span>
                </div>
                <textarea 
                  value={bodyText}
                  onChange={e => setBodyText(e.target.value)}
                  maxLength={1024}
                  placeholder="Olá {{1}}, bem-vindo à nossa plataforma..."
                  className="w-full h-44 bg-zinc-50 dark:bg-zinc-950 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 text-sm outline-none focus:border-indigo-500 duration-200 font-sans leading-relaxed resize-none custom-scrollbar"
                />
                <span className="text-[10px] text-zinc-400 block leading-normal">
                  Dica: Use <code className="bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 font-mono px-1 py-0.5 rounded">*texto*</code> para negrito, <code className="bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 font-mono px-1 py-0.5 rounded">_texto_</code> para itálico e <code className="bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 font-mono px-1 py-0.5 rounded">{"{{n}}"}</code> para variados campos de injeção dinâmica.
                </span>
              </div>

              {/* Dynamic Variables Mapping UI */}
              <AnimatePresence mode="popLayout">
                {detectedVariables.length > 0 && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-4 border-t border-zinc-200/80 pt-6 overflow-hidden"
                  >
                    <label className="text-xs font-black uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                      <Plus className="w-4 h-4 text-emerald-500" /> Inputs de Teste da Simulação
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {detectedVariables.map(v => (
                        <div key={v} className="flex items-center gap-3 bg-zinc-50 dark:bg-zinc-950/80 p-3.5 rounded-2xl border border-zinc-200/60 dark:border-zinc-800/60 hover:border-indigo-500/20 duration-150">
                          <span className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 text-xs font-black flex items-center justify-center border border-indigo-500/20">{"{{" + v + "}}"}</span>
                          <input 
                            type="text"
                            placeholder="Valor simulado..."
                            value={variables[v] || ''}
                            onChange={e => setVariables({ ...variables, [v]: e.target.value })}
                            className="flex-1 bg-transparent text-xs font-semibold outline-none text-zinc-700 dark:text-zinc-300"
                          />
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Footer text settings */}
              <div className="space-y-3 border-t border-zinc-200/80 pt-6">
                <label className="text-xs font-black uppercase tracking-wider text-zinc-400">Rodapé do Card (Footer)</label>
                <input 
                  type="text"
                  maxLength={60}
                  placeholder="Ex: Não deseja receber mais avisos? Envie PARAR."
                  value={footerText}
                  onChange={e => setFooterText(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-950 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 text-sm outline-none focus:border-indigo-500 duration-150 font-sans"
                />
              </div>

              {/* Action Buttons list settings */}
              <div className="space-y-4 border-t border-zinc-200/80 pt-6">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black uppercase tracking-wider text-zinc-400">Botões de Ação (Máx 5)</label>
                  {buttons.length < 5 && (
                    <button 
                      onClick={handleAddButton}
                      className="px-3 py-1.5 bg-zinc-100 dark:bg-zinc-950 text-zinc-600 dark:text-zinc-300 rounded-xl hover:bg-indigo-500 hover:text-white transition-all text-[10px] font-black uppercase tracking-widest flex items-center gap-1 border border-zinc-200 dark:border-zinc-800"
                    >
                      <Plus className="w-3 h-3" /> Adicionar Botão
                    </button>
                  )}
                </div>

                <div className="space-y-3">
                  {buttons.map((btn, index) => (
                    <div key={index} className="flex flex-col md:flex-row gap-3 bg-zinc-50 dark:bg-zinc-950/40 p-4 rounded-2xl border border-zinc-200/60 dark:border-zinc-800/60 relative group-button animate-modern">
                      <select 
                        value={btn.type}
                        onChange={e => {
                          const updated = [...buttons];
                          updated[index].type = e.target.value as any;
                          setButtons(updated);
                        }}
                        className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs py-2 px-3 focus:border-indigo-500 outline-none font-bold"
                      >
                        <option value="QUICK_REPLY">Resposta Rápida (Quick Reply)</option>
                        <option value="URL">Abrir Link (Call-To-Action)</option>
                        <option value="PHONE_NUMBER">Ligar para Número</option>
                      </select>

                      <input 
                        type="text"
                        placeholder="Texto visível no botão..."
                        value={btn.text}
                        onChange={e => {
                          const updated = [...buttons];
                          updated[index].text = e.target.value;
                          setButtons(updated);
                        }}
                        className="flex-1 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs py-2 px-3 focus:border-indigo-500 outline-none font-semibold"
                      />

                      {(btn.type === 'URL' || btn.type === 'PHONE_NUMBER') && (
                        <input 
                          type="text"
                          placeholder={btn.type === 'URL' ? 'https://exemplo.com' : '+5511999999999'}
                          value={btn.value || ''}
                          onChange={e => {
                            const updated = [...buttons];
                            updated[index].value = e.target.value;
                            setButtons(updated);
                          }}
                          className="flex-1 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs py-2 px-3 focus:border-indigo-500 outline-none font-mono"
                        />
                      )}

                      <button 
                        onClick={() => handleRemoveButton(index)}
                        className="p-2 bg-red-500/10 text-red-500 hover:bg-red-500 rounded-xl hover:text-white transition-colors self-center"
                        title="Deletar este botão"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Request Validation Trigger */}
              <div className="pt-6 border-t border-zinc-200/80">
                <button 
                  onClick={runAudit}
                  disabled={loading}
                  className="w-full py-4 bg-indigo-500 text-white rounded-3xl font-black uppercase text-xs tracking-widest hover:bg-indigo-600 disabled:opacity-50 hover:scale-[1.01] duration-150 flex items-center justify-center gap-2.5 shadow-xl shadow-indigo-500/20"
                >
                  {loading ? (
                    <>
                      <RefreshCcw className="w-4 h-4 animate-spin" />
                      <span>Analisando Metadados com IA...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Acionar Central de Auditoria</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* AI Diagnostics Panel */}
            {result && (
              <motion.div 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-zinc-900/60 backdrop-blur-md rounded-[2.5rem] border border-zinc-200 dark:border-zinc-800 p-8 space-y-8"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-extrabold tracking-tight text-zinc-950 dark:text-zinc-50">Diagnóstico da Central Pro: AI Compliance</h2>
                    <p className="text-xs text-zinc-400 mt-1">Auditado sob a ótica de conformidade geral Meta API.</p>
                  </div>
                  <div className="flex items-center gap-3 bg-zinc-50 dark:bg-zinc-950 px-5 py-3 rounded-2xl border border-zinc-150 dark:border-zinc-800/80">
                    <span className="text-[10px] uppercase font-black tracking-widest text-zinc-400">Score de Qualidade</span>
                    <span className={`text-2xl font-black ${result.qualityScore >= 80 ? 'text-emerald-500' : result.qualityScore >= 50 ? 'text-amber-500' : 'text-red-500'}`}>
                      {result.qualityScore}%
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Grammar Issues */}
                  <div className="p-6 bg-amber-500/5 rounded-2xl border border-amber-500/10 space-y-4">
                    <span className="text-xs font-black uppercase text-amber-600 dark:text-amber-400 tracking-widest flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4" /> Desvios Léxicos / Gramaticais ({result.grammarIssues?.length || 0})
                    </span>
                    <ul className="space-y-2.5">
                      {result.grammarIssues?.map((issue: string, i: number) => (
                        <li key={i} className="text-xs text-amber-700 dark:text-amber-300 font-semibold leading-relaxed flex gap-2">
                          <span className="text-amber-400/80">•</span>
                          <span>{issue}</span>
                        </li>
                      ))}
                      {(!result.grammarIssues || result.grammarIssues.length === 0) && (
                        <li className="text-xs text-zinc-400 italic">Nenhum desvio gramatical detectado nesta versão.</li>
                      )}
                    </ul>
                  </div>

                  {/* Policy Warnings */}
                  <div className="p-6 bg-red-500/5 rounded-2xl border border-red-500/10 space-y-4">
                    <span className="text-xs font-black uppercase text-red-600 dark:text-red-400 tracking-widest flex items-center gap-1.5">
                      <Shield className="w-4 h-4" /> Alertas de Política da Meta WhatsApp ({result.policyWarnings?.length || 0})
                    </span>
                    <ul className="space-y-2.5">
                      {result.policyWarnings?.map((warning: string, i: number) => (
                        <li key={i} className="text-xs text-red-700 dark:text-red-300 font-semibold leading-relaxed flex gap-2">
                          <span className="text-red-400/80">•</span>
                          <span>{warning}</span>
                        </li>
                      ))}
                      {(!result.policyWarnings || result.policyWarnings.length === 0) && (
                        <li className="text-xs text-zinc-400 italic flex items-center gap-1.5 text-emerald-600">
                          <CheckCircle className="w-3.5 h-3.5" /> 100% em conformidade com as diretivas.
                        </li>
                      )}
                    </ul>
                  </div>
                </div>

                {/* Overwrite improved suggestion body */}
                {result.improvedVersion && result.improvedVersion !== bodyText && (
                  <div className="bg-indigo-500/5 rounded-3xl border border-indigo-500/10 p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black uppercase text-indigo-500 dark:text-indigo-400 tracking-widest flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4" /> Texto Melhorado Recomendado pela IA
                      </span>
                      <button 
                        onClick={applyOtimizacao}
                        className="px-4 py-1.5 bg-indigo-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-md shadow-indigo-500/10"
                      >
                        Aplicar Otimização
                      </button>
                    </div>
                    <p className="text-xs bg-zinc-50 dark:bg-zinc-950 p-4 rounded-xl border border-zinc-150 dark:border-zinc-800 font-medium text-zinc-700 dark:text-zinc-300 leading-relaxed italic">
                      {result.improvedVersion}
                    </p>
                  </div>
                )}
              </motion.div>
            )}
          </div>

          {/* Premium iOS Standard simulated WhatsApp interface phone mockup */}
          <div className="xl:col-span-5 h-fit sticky top-28">
            <div className="bg-white dark:bg-zinc-900/60 backdrop-blur-md rounded-[2.5rem] border border-zinc-200 dark:border-zinc-800 p-8 space-y-6">
              <h2 className="text-lg font-black uppercase tracking-widest text-zinc-400 flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-indigo-500" /> Simulador de Conversa
              </h2>

              {/* iPhone Container Box */}
              <div className="w-full max-w-[340px] mx-auto bg-slate-900 dark:bg-black rounded-[2.75rem] p-3.5 border-4 border-slate-950 shadow-2xl relative overflow-hidden flex flex-col min-h-[580px]">
                
                {/* iPhone Camera Notch and layout detail */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-slate-950 rounded-b-xl z-20 flex items-center justify-center">
                  <div className="w-3 h-3 bg-zinc-800 rounded-full mr-2" />
                  <div className="w-8 h-1 bg-zinc-800 rounded-full" />
                </div>

                {/* WhatsApp Screen Banner */}
                <div className="bg-emerald-800/90 text-white pt-6 pb-2.5 px-3 rounded-t-[1.75rem] flex items-center gap-2 border-b border-emerald-900 shadow-sm relative z-10">
                  <div className="w-8 h-8 rounded-full bg-emerald-600/80 border border-white/20 flex items-center justify-center text-xs font-black text-white">
                    WA
                  </div>
                  <div className="flex-1 flex flex-col justify-center select-none">
                    <span className="text-[11px] font-bold leading-none tracking-tight">Enterprise Delivery</span>
                    <span className="text-[8px] text-emerald-250 font-medium">Business Account</span>
                  </div>
                </div>

                {/* Phone Background Simulation */}
                <div className="flex-1 bg-zinc-100 dark:bg-zinc-950 p-3 flex flex-col justify-end space-y-4 custom-scrollbar select-none relative" style={{ backgroundImage: `radial-gradient(rgba(30, 41, 59, 0.04) 0.5px, transparent 0.5px)`, backgroundSize: '12px 12px' }}>
                  
                  {/* WhatsApp Standard Bubble */}
                  <div className="w-full max-w-[280px] bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-zinc-200/50 dark:border-zinc-800/50 flex flex-col overflow-hidden text-zinc-900 dark:text-zinc-50 align-self-start self-start">
                    
                    {/* Header Image/Video URL Previews inside bubble */}
                    {headerType === 'MEDIA' && headerMediaUrl && (
                      <div className="w-full h-32 bg-zinc-200 dark:bg-zinc-950 flex items-center justify-center overflow-hidden border-b border-zinc-150 dark:border-zinc-800 relative">
                        <img 
                          src={headerMediaUrl} 
                          onError={(e) => {
                            // File preview fallback if broken url is inputted
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                          className="w-full h-full object-cover" 
                          alt="Media header preview" 
                        />
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/50 to-transparent p-2">
                          <span className="text-[9px] font-bold text-white uppercase tracking-widest flex items-center gap-1"><FileText className="w-3 h-3" /> Header Mídia ativo</span>
                        </div>
                      </div>
                    )}

                    {/* Header Text option */}
                    {headerType === 'TEXT' && headerText && (
                      <div className="px-3.5 pt-3 border-b border-zinc-100 dark:border-zinc-800 pb-1.5 flex items-center gap-1.5">
                        <span className="text-[11px] font-black uppercase text-zinc-400 dark:text-zinc-500 tracking-wider font-mono">{headerText}</span>
                      </div>
                    )}

                    {/* WhatsApp Body Area */}
                    <div className="p-3.5 space-y-2">
                      <p className="text-xs text-zinc-800 dark:text-zinc-200 whitespace-pre-wrap leading-relaxed" dangerouslySetInnerHTML={renderFormattedBody(bodyText)} />
                    </div>

                    {/* WhatsApp Footer Text area */}
                    {footerText && (
                      <div className="px-3.5 pb-2.5 pt-0.5">
                        <p className="text-[9px] text-zinc-400 font-semibold uppercase tracking-wider">{footerText}</p>
                      </div>
                    )}

                    {/* Action buttons embedded list */}
                    {buttons.map((btn, index) => (
                      <div key={index} className="border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-center py-2.5 px-3 hover:bg-zinc-50 dark:hover:bg-zinc-950 duration-150 cursor-pointer text-center">
                        {btn.type === 'URL' && <Link className="w-3 h-3 text-indigo-500 mr-1.5 shrink-0" />}
                        {btn.type === 'PHONE_NUMBER' && <Smartphone className="w-3 h-3 text-emerald-500 mr-1.5 shrink-0" />}
                        <span className="text-[11px] font-bold truncate text-indigo-500 dark:text-indigo-400">{btn.text || 'Botão sem texto'}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* iPhone Bottom indicator line detail */}
                <div className="h-5 flex items-center justify-center relative z-10">
                  <div className="w-24 h-1 bg-zinc-600 rounded-full" />
                </div>
              </div>
              
              <div className="p-4 bg-zinc-50 dark:bg-zinc-950/80 rounded-2xl border border-zinc-150 dark:border-zinc-800">
                <span className="text-[10px] uppercase font-black tracking-widest text-zinc-400 block mb-1">Informações do Canal</span>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-normal">
                  Este simulador renderiza de acordo com o padrão de marcação oficial da Meta Inc, incluindo decodificadores dinâmicos para markdown de textos.
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default HsmStudio;
