import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from '../lib/motionShim';
import { 
  MessageSquarePlus, Brain, Plus, X, Shield, 
  Loader2, ArrowRight, Check, Database, Sparkles, MessageSquare, Terminal, Sliders, Settings
} from 'lucide-react';
import { KnowledgeSource } from '../types';
import { FLAG_MAP } from '../constants';
import * as kbService from '../services/knowledgeService';
import { runAiRequest, getAiConfig, AiConfig } from '../../../services/aiConfig';
import { AiSettingsModal } from '../../../components/ui/AiSettingsModal';

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

const KnowledgeBaseModal: React.FC<{ onClose: () => void; onSave: (s: KnowledgeSource) => void }> = ({ onClose, onSave }) => {
    const [title, setTitle] = useState('');
    const [domain, setDomain] = useState('');
    const [content, setContent] = useState('');
    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-[#0f172a] text-slate-100 w-full max-w-lg rounded-[2.5rem] border border-slate-800 p-8 animate-modern shadow-2xl">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-black uppercase tracking-tight text-white flex items-center gap-2">
                      <Database className="w-5 h-5 text-indigo-500" /> Nova Fonte de Conhecimento
                    </h3>
                    <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full transition-colors"><X className="w-5 h-5 text-slate-400"/></button>
                </div>
                <div className="space-y-5">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Título Identificador</label>
                      <input placeholder="Ex: Manual WhatsApp Cloud API" value={title} onChange={e => setTitle(e.target.value)} className="w-full bg-slate-950 p-4 rounded-2xl border border-slate-800 text-sm text-white placeholder-slate-500 outline-none focus:border-indigo-500 transition-colors"/>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Domínio Técnico</label>
                      <input placeholder="Ex: api.meta.com" value={domain} onChange={e => setDomain(e.target.value)} className="w-full bg-slate-950 p-4 rounded-xl border border-slate-800 text-sm text-white placeholder-slate-500 outline-none focus:border-indigo-500 transition-colors"/>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Diretrizes / Conteúdo Oficial</label>
                      <textarea placeholder="Insira o texto técnico que servirá de âncora para o modo estrito de IA..." value={content} onChange={e => setContent(e.target.value)} className="w-full bg-slate-950 p-4 rounded-xl border border-slate-800 text-sm text-white placeholder-slate-500 h-32 resize-none outline-none focus:border-indigo-500 transition-colors custom-scrollbar"/>
                    </div>
                    <button 
                      onClick={() => { 
                        if (title && content) {
                          onSave({ id: Date.now().toString(), title, domain: domain || 'Geral', content }); 
                          onClose(); 
                        }
                      }} 
                      className="w-full py-4 bg-indigo-500 hover:bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-indigo-500/20"
                    >
                      Salvar Fonte Técnica
                    </button>
                </div>
            </div>
        </div>
    );
};

const NexusAI: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'chat' | 'flags' | 'kb'>('chat');
    const [isStrictMode, setIsStrictMode] = useState(true);
    const [flagInput, setFlagInput] = useState('11');
    const [showKbModal, setShowKbModal] = useState(false);
    const [isAiModalOpen, setIsAiModalOpen] = useState(false);
    const [sources, setSources] = useState<KnowledgeSource[]>([]);
    const [currentAiConfig, setCurrentAiConfig] = useState<AiConfig>(getAiConfig());
    
    // Chat implementation states
    const [messages, setMessages] = useState<Message[]>([
      {
        id: 'init',
        sender: 'assistant',
        text: 'Olá! Sou seu assistente de conformidade Nexus AI. Como posso te apoiar na análise de políticas do WhatsApp Cloud API ou no sequenciamento de Feature Flags do sistema hoje?',
        timestamp: 'Agora'
      }
    ]);
    const [inputQuestion, setInputQuestion] = useState('');
    const [loadingMessage, setLoadingMessage] = useState(false);

    useEffect(() => {
        kbService.getKnowledgeBase().then(setSources);
        const handleConfigChanged = () => {
            setCurrentAiConfig(getAiConfig());
        };
        window.addEventListener('ai-config-changed', handleConfigChanged);
        return () => window.removeEventListener('ai-config-changed', handleConfigChanged);
    }, []);

    const decodedFlags = useMemo(() => {
        const val = parseInt(flagInput);
        if (isNaN(val)) return [];
        return Object.entries(FLAG_MAP)
            .filter(([bit]) => (val & parseInt(bit)) > 0)
            .map(([_, name]) => name);
    }, [flagInput]);

    const handleSendMessage = async () => {
      if (!inputQuestion.trim() || loadingMessage) return;

      const userMsg: Message = {
        id: Date.now().toString(),
        sender: 'user',
        text: inputQuestion.trim(),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, userMsg]);
      setInputQuestion('');
      setLoadingMessage(true);

      try {
        let systemPrompt = 'Você é o assistente Nexus AI, especialista em conformidade e diretrizes oficiais do WhatsApp Cloud API (regras de templates HSM antispam e entrega) e arquitetura de Feature Flags. Forneça respostas claras, profissionais, organizadas e úteis em português.';
        
        if (isStrictMode && sources.length > 0) {
          systemPrompt += `\n\n[MODO ESTRITO ATIVADO]: Baseie-se prioritariamente nestas diretrizes técnicas oficiais da sua base de conhecimento:\n${sources.map(s => `• [${s.title} (${s.domain})]: ${s.content}`).join('\n\n')}\n\nCaso a dúvida não conste na base, alerte o usuário com transparência.`;
        }

        const reply = await runAiRequest(userMsg.text, { systemPrompt });

        const aiMsg: Message = {
          id: (Date.now() + 1).toString(),
          sender: 'assistant',
          text: reply || 'Não recebi uma resposta válida do modelo. Por favor, tente novamente.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages(prev => [...prev, aiMsg]);
      } catch (e: any) {
        console.error('Erro na chamada da IA:', e);
        const errorMsg: Message = {
          id: (Date.now() + 1).toString(),
          sender: 'assistant',
          text: `⚠️ Erro ao consultar o provedor de IA:\n\n${e?.message || 'Falha de comunicação'}\n\nVerifique sua chave de API e modelo clicando no botão "Configurar IA" no menu lateral.`,
          timestamp: 'Erro'
        };
        setMessages(prev => [...prev, errorMsg]);
      } finally {
        setLoadingMessage(false);
      }
    };

    const handleClearHistory = () => {
      setMessages([
        {
          id: 'init',
          sender: 'assistant',
          text: 'Olá! Sou seu assistente de conformidade Nexus AI. Como posso te apoiar na análise de políticas do WhatsApp Cloud API ou no sequenciamento de Feature Flags do sistema hoje?',
          timestamp: 'Agora'
        }
      ]);
    };

    const loadPredefinedPrompt = (prompt: string) => {
      setInputQuestion(prompt);
    };

    return (
        <div className="flex-1 flex flex-col md:flex-row h-full overflow-hidden bg-zinc-50 dark:bg-[#030711] transition-all animate-modern font-sans">
            
            {/* Sidebar Controls for Nexus AI */}
            <aside className="w-full md:w-80 border-b md:border-b-0 md:border-r border-zinc-200 dark:border-zinc-800 flex flex-col p-6 bg-white dark:bg-[#030711] shrink-0 justify-between">
                <div className="space-y-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-500 via-indigo-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-purple-500/10">
                        <Brain className="w-5.5 h-5.5 text-white" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-black text-zinc-900 dark:text-white uppercase tracking-tight">Cérebro Nexus</span>
                        <span className="text-[9px] text-purple-500 font-extrabold tracking-widest uppercase">AI Consulting Co.</span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <button 
                        onClick={handleClearHistory}
                        className="flex items-center justify-center gap-2.5 w-full py-3.5 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:opacity-95 transition-opacity duration-150 shadow-lg shadow-purple-500/15"
                      >
                          <MessageSquarePlus className="w-4 h-4" /> Resetar Sessão
                      </button>

                      <button 
                        onClick={() => setIsAiModalOpen(true)}
                        className="flex items-center justify-between w-full py-2.5 px-3 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-200 rounded-xl font-bold text-xs hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors"
                      >
                          <span className="flex items-center gap-2">
                            <Settings className="w-3.5 h-3.5 text-indigo-500" /> Configurar IA
                          </span>
                          <span className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400 bg-zinc-200/80 dark:bg-zinc-800 px-2 py-0.5 rounded-md truncate max-w-[110px]">
                            {currentAiConfig.provider === 'gemini' ? (currentAiConfig.model || 'gemini-3.6-flash') : currentAiConfig.provider}
                          </span>
                      </button>
                    </div>

                    <div className="w-full h-px bg-zinc-200 dark:bg-zinc-800/80 my-2" />

                    <div className="flex flex-col gap-2">
                        <span className="text-[10px] font-black uppercase text-zinc-400 tracking-widest mb-1 px-1">Navegação Módulos</span>
                        <button 
                          onClick={() => setActiveTab('chat')} 
                          className={`flex items-center gap-2.5 p-3.5 rounded-xl text-xs font-bold transition-all text-left ${activeTab === 'chat' ? 'bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 font-extrabold border border-indigo-500/30' : 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-900'}`}
                        >
                          <MessageSquare className="w-4.5 h-4.5" /> Assistente Nexus AI
                        </button>
                        <button 
                          onClick={() => setActiveTab('flags')} 
                          className={`flex items-center gap-2.5 p-3.5 rounded-xl text-xs font-bold transition-all text-left ${activeTab === 'flags' ? 'bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 font-extrabold border border-indigo-500/30' : 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-900'}`}
                        >
                          <Sliders className="w-4.5 h-4.5" /> Feature Flags
                        </button>
                        <button 
                          onClick={() => setActiveTab('kb')} 
                          className={`flex items-center gap-2.5 p-3.5 rounded-xl text-xs font-bold transition-all text-left ${activeTab === 'kb' ? 'bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 font-extrabold border border-indigo-500/30' : 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-900'}`}
                        >
                          <Database className="w-4.5 h-4.5" /> Repositório de Conteúdo
                        </button>
                    </div>
                </div>

                <div className="p-4 bg-zinc-50 dark:bg-zinc-950 rounded-2xl border border-zinc-200/60 dark:border-zinc-800/65 text-xs text-zinc-600 dark:text-zinc-400 mt-6 space-y-2">
                  <div className="flex items-center gap-1.5 text-zinc-700 dark:text-zinc-300 font-extrabold"><Shield className="w-3.5 h-3.5 text-indigo-500" /> Criptografia Ponta a Ponta</div>
                  <p className="leading-normal">Dados indexados e persistidos localmente no banco IndexedDB.</p>
                </div>
            </aside>

            {/* Active module display container */}
            <main className="flex-1 flex flex-col min-w-0 bg-white dark:bg-[#030711] md:bg-transparent dark:md:bg-transparent">
                {activeTab === 'chat' && (
                    <div className="flex-1 flex flex-col h-full overflow-hidden">
                        {/* Upper Control Bar */}
                        <div className="h-16 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between px-8 bg-white/40 dark:bg-[#030711]/40 backdrop-blur-md shrink-0">
                            <div className="flex items-center gap-2">
                              <h2 className="text-sm font-black text-zinc-900 dark:text-zinc-50 uppercase tracking-tight">Nexus AI Workspace</h2>
                              <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                            </div>
                            
                            <button 
                              onClick={() => setIsStrictMode(!isStrictMode)} 
                              className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border transition-colors ${isStrictMode ? 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20' : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'}`}
                            >
                                {isStrictMode ? 'Modo Estrito (Sua Base)' : 'Modo Geral (Estendido)'}
                            </button>
                        </div>

                        {/* Speech Bubbles Scroll View */}
                        <div className="flex-1 p-6 md:p-10 overflow-y-auto custom-scrollbar space-y-6">
                            <div className="w-full max-w-4xl mx-auto space-y-6">
                                
                                <AnimatePresence initial={false}>
                                  {messages.map(msg => (
                                    <motion.div 
                                      key={msg.id}
                                      initial={{ opacity: 0, y: 15 }}
                                      animate={{ opacity: 1, y: 0 }}
                                      className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                                    >
                                      <div className={`max-w-2xl rounded-[1.75rem] p-5.5 border transition-all ${
                                        msg.sender === 'user' 
                                        ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white border-indigo-500/40 shadow-lg shadow-indigo-600/15 rounded-br-none' 
                                        : 'bg-white dark:bg-[#0e1626] text-zinc-900 dark:text-slate-100 border-zinc-200/80 dark:border-slate-800 rounded-bl-none shadow-sm shadow-black/5'
                                      }`}>
                                        {msg.sender === 'assistant' && (
                                          <div className="flex items-center gap-1.5 mb-2.5 pb-2 border-b border-zinc-100 dark:border-slate-800/80">
                                            <div className="w-5 h-5 rounded-lg bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                                              <Brain className="w-3 h-3" />
                                            </div>
                                            <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                                              Nexus AI Assistant
                                            </span>
                                            {msg.timestamp === 'Erro' && (
                                              <span className="text-[9px] font-bold uppercase tracking-wider text-rose-400 bg-rose-500/10 border border-rose-500/20 px-1.5 py-0.5 rounded ml-auto">
                                                Falha
                                              </span>
                                            )}
                                          </div>
                                        )}
                                        <p className={`text-xs leading-relaxed whitespace-pre-wrap ${
                                          msg.sender === 'user' 
                                            ? 'text-white font-medium' 
                                            : msg.timestamp === 'Erro'
                                              ? 'text-rose-600 dark:text-rose-300 font-medium'
                                              : 'text-zinc-800 dark:text-slate-100 font-normal'
                                        }`}>
                                          {msg.text}
                                        </p>
                                        {msg.timestamp === 'Erro' && (
                                          <div className="mt-3 pt-2.5 border-t border-zinc-100 dark:border-slate-800/80 flex justify-end">
                                            <button
                                              onClick={() => setIsAiModalOpen(true)}
                                              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold rounded-xl transition-colors flex items-center gap-1.5 shadow-sm"
                                            >
                                              <Settings className="w-3.5 h-3.5" /> Abrir Configurações de IA
                                            </button>
                                          </div>
                                        )}
                                        <span className={`text-[9px] font-bold uppercase tracking-widest mt-2 block text-right ${
                                          msg.sender === 'user' 
                                            ? 'text-indigo-200' 
                                            : 'text-zinc-400 dark:text-slate-500'
                                        }`}>
                                          {msg.timestamp}
                                        </span>
                                      </div>
                                    </motion.div>
                                  ))}
                                </AnimatePresence>

                                {loadingMessage && (
                                  <div className="flex justify-start">
                                    <div className="bg-white dark:bg-[#0e1626] border border-zinc-200/80 dark:border-slate-800 rounded-[1.75rem] rounded-bl-none p-4 flex items-center gap-3 shadow-sm">
                                      <Loader2 className="w-4 h-4 text-indigo-500 animate-spin" />
                                      <span className="text-xs text-zinc-600 dark:text-slate-300 font-medium italic">
                                        Processando resposta com {currentAiConfig.provider === 'gemini' ? (currentAiConfig.model || 'gemini-3.6-flash') : currentAiConfig.provider}...
                                      </span>
                                    </div>
                                  </div>
                                )}
                            </div>
                        </div>

                        {/* Interactive prompt-helpers and messaging inputs */}
                        <div className="p-6 border-t border-zinc-200 dark:border-zinc-800 bg-white/60 dark:bg-[#030711]/70 backdrop-blur-md shrink-0">
                            <div className="w-full max-w-4xl mx-auto space-y-4">
                                <div className="flex flex-wrap items-center gap-2 select-none">
                                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-500 dark:text-slate-400 flex items-center gap-1.5">
                                    <Sparkles className="w-3.5 h-3.5 text-indigo-500"/> Sugestões de Prompt:
                                  </span>
                                  <button 
                                    onClick={() => loadPredefinedPrompt("Quais são as melhores práticas para evitar bloqueios de HSM no WhatsApp?")} 
                                    className="px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-slate-900/90 hover:dark:bg-slate-800 text-zinc-700 dark:text-slate-300 hover:dark:text-white border border-zinc-200/80 dark:border-slate-800 rounded-xl text-[11px] font-semibold transition-all duration-150 text-left truncate max-w-[240px]"
                                  >
                                    💡 Práticas Antispam HSM
                                  </button>
                                  <button 
                                    onClick={() => loadPredefinedPrompt("Como funciona o processo de decodificação bivalente de Feature Flags?")} 
                                    className="px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-slate-900/90 hover:dark:bg-slate-800 text-zinc-700 dark:text-slate-300 hover:dark:text-white border border-zinc-200/80 dark:border-slate-800 rounded-xl text-[11px] font-semibold transition-all duration-150 text-left truncate max-w-[240px]"
                                  >
                                    💡 Decodificar Bivalente Flags
                                  </button>
                                </div>

                                <div className="relative flex items-center justify-between">
                                    <input 
                                      type="text" 
                                      placeholder="Pergunte sobre políticas do WhatsApp, regras HSM ou use os prompts assistentes..." 
                                      value={inputQuestion}
                                      onChange={e => setInputQuestion(e.target.value)}
                                      onKeyDown={e => { if (e.key === 'Enter') handleSendMessage(); }}
                                      className="w-full h-16 pl-6 pr-18 bg-white dark:bg-slate-900/90 border border-zinc-200 dark:border-slate-800 rounded-3xl text-sm text-zinc-900 dark:text-slate-100 placeholder-zinc-400 dark:placeholder-slate-500 focus:border-indigo-500 dark:focus:border-indigo-500 duration-150 outline-none font-sans shadow-sm"
                                    />
                                    <button 
                                      onClick={handleSendMessage}
                                      disabled={loadingMessage || !inputQuestion.trim()}
                                      className="absolute right-3.5 p-3.5 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md shadow-indigo-600/20"
                                      title="Enviar mensagem"
                                    >
                                      <ArrowRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'flags' && (
                    <div className="flex-1 overflow-y-auto p-12 custom-scrollbar space-y-8">
                        <div className="max-w-3xl mx-auto space-y-8">
                            <header className="space-y-2">
                                <h1 className="text-3xl font-black text-zinc-900 dark:text-white tracking-tight flex items-center gap-2">
                                  <Sliders className="w-8 h-8 text-indigo-500" /> Decodificador de Feature Flags
                                </h1>
                                <p className="text-sm text-zinc-500 dark:text-zinc-400">Insira valores numéricos decimais para analisar a ativação binária das flags de sistema.</p>
                            </header>

                            <div className="bg-white dark:bg-zinc-900/60 backdrop-blur-md rounded-[2.5rem] border border-zinc-200 dark:border-zinc-800 p-8 space-y-6">
                              <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Decimal Feature Mask</label>
                                <input 
                                  type="number" 
                                  placeholder="Inserir valor decimal..." 
                                  value={flagInput} 
                                  onChange={e => setFlagInput(e.target.value)} 
                                  className="w-full bg-zinc-50 dark:bg-zinc-950 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-600 text-lg font-mono outline-none focus:border-indigo-500 transition-all font-bold" 
                                />
                              </div>

                              <div className="space-y-4 pt-4 border-t border-zinc-150 dark:border-zinc-800">
                                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 block mb-2">Flags Ativas Encontradas:</span>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  {decodedFlags.map(f => (
                                    <div key={f} className="p-4 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400 font-mono text-xs rounded-xl border border-emerald-500/10 flex items-center gap-2 font-bold animate-modern">
                                      <Check className="w-4 h-4 shrink-0 text-emerald-500" />
                                      <span>{f}</span>
                                    </div>
                                  ))}
                                  {decodedFlags.length === 0 && (
                                    <div className="col-span-full py-10 text-center text-xs text-zinc-400 italic">Insira um decimal válido que possua bits congruentes ou compatíveis.</div>
                                  )}
                                </div>
                              </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'kb' && (
                    <div className="flex-1 overflow-y-auto p-12 custom-scrollbar space-y-8">
                        <div className="max-w-4xl mx-auto space-y-8">
                            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-6">
                                <div className="space-y-1">
                                    <h1 className="text-3xl font-black text-zinc-900 dark:text-white tracking-tight flex items-center gap-2">
                                      <Database className="w-8 h-8 text-indigo-500" /> Base de Conhecimento
                                    </h1>
                                    <p className="text-sm text-zinc-400">Repositório de regras corporativas que alimentam o modo de IA estrito.</p>
                                </div>
                                <button 
                                  onClick={() => setShowKbModal(true)} 
                                  className="px-5 py-3 bg-indigo-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-600 transition-colors flex items-center gap-1.5 shadow-lg shadow-indigo-500/10"
                                >
                                  <Plus className="w-5 h-5"/> Adicionar Fonte
                                </button>
                            </header>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              {sources.map(s => (
                                <div key={s.id} className="bg-white dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800/80 rounded-[2rem] p-6 hover:border-indigo-500/20 transition-all shadow-sm flex flex-col justify-between hover:shadow-lg hover:shadow-indigo-500/5 animate-modern">
                                  <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                      <span className="text-[10px] font-black uppercase text-indigo-500 tracking-widest">{s.domain}</span>
                                      <span className="text-[10px] font-black uppercase text-zinc-400">ID: {s.id}</span>
                                    </div>
                                    <h4 className="text-base font-bold text-zinc-900 dark:text-white leading-snug">{s.title}</h4>
                                    <p className="text-xs text-zinc-500 leading-relaxed line-clamp-3">{s.content}</p>
                                  </div>
                                  
                                  <div className="pt-4 border-t border-zinc-150 dark:border-zinc-800 mt-4 flex justify-between items-center text-[10px] font-black uppercase text-zinc-400 tracking-wider">
                                    <span>Tamanho: {s.content.length} caracteres</span>
                                    <button 
                                      onClick={async () => {
                                        await kbService.deleteKnowledgeSource(s.id);
                                        setSources(sources.filter(item => item.id !== s.id));
                                      }}
                                      className="text-red-500 hover:text-red-600 flex items-center gap-1 font-bold shadow-none"
                                    >
                                      Deletar
                                    </button>
                                  </div>
                                </div>
                              ))}

                              {sources.length === 0 && (
                                <div className="col-span-full py-20 text-center border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-[2.5rem]">
                                  <Terminal className="w-12 h-12 text-zinc-300 dark:text-zinc-700 mx-auto mb-4" />
                                  <p className="text-sm text-zinc-400 font-bold mb-1">Repositório vazio no momento</p>
                                  <p className="text-xs text-zinc-500 mb-6 text-center">Nenhuma regra técnica foi salva para o modo de validação estrito.</p>
                                  <button onClick={() => setShowKbModal(true)} className="px-5 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-black uppercase tracking-widest rounded-xl">Cadastrar Primeira Regra</button>
                                </div>
                              )}
                            </div>
                        </div>
                    </div>
                )}
            </main>
            {showKbModal && <KnowledgeBaseModal onClose={() => setShowKbModal(false)} onSave={async (s) => { await kbService.saveKnowledgeSource(s); setSources([...sources, s]); }} />}
            <AiSettingsModal isOpen={isAiModalOpen} onClose={() => setIsAiModalOpen(false)} />
        </div>
    );
};

export default NexusAI;
