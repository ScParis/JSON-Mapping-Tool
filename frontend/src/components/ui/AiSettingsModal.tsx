import React, { useState, useEffect } from 'react';
import { X, KeyRound, Sparkles, Check, Server, Eye, EyeOff } from 'lucide-react';
import { getAiConfig, saveAiConfig, AiConfig, AiProvider } from '../../services/aiConfig';

interface AiSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const AiSettingsModal: React.FC<AiSettingsModalProps> = ({ isOpen, onClose }) => {
    const [config, setConfig] = useState<AiConfig>(getAiConfig());
    const [showKey, setShowKey] = useState(false);
    const [savedSuccess, setSavedSuccess] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setConfig(getAiConfig());
            setSavedSuccess(false);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleSave = () => {
        saveAiConfig(config);
        setSavedSuccess(true);
        setTimeout(() => {
            setSavedSuccess(false);
            onClose();
        }, 800);
    };

    const handleProviderChange = (provider: AiProvider) => {
        let defaultModel = config.model;
        if (provider === 'gemini') defaultModel = 'gemini-3.6-flash';
        else if (provider === 'openai') defaultModel = 'gpt-4o-mini';
        else if (provider === 'grok') defaultModel = 'grok-2-latest';
        else if (provider === 'claude') defaultModel = 'claude-3-5-sonnet-20241022';
        else if (provider === 'custom') defaultModel = 'llama3';

        setConfig(prev => ({
            ...prev,
            provider,
            model: defaultModel
        }));
    };

    const suggestedModels: Record<AiProvider, string[]> = {
        gemini: ['gemini-3.6-flash', 'gemini-3.5-flash-lite', 'gemini-3.7-flash', 'gemini-3.1-pro-preview'],
        openai: ['gpt-4o-mini', 'gpt-4o', 'o3-mini'],
        grok: ['grok-2-latest', 'grok-beta'],
        claude: ['claude-3-5-sonnet-20241022', 'claude-3-5-haiku-20241022'],
        custom: ['llama3', 'mistral', 'qwen2.5-coder']
    };

    return (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-md flex items-center justify-center z-50 p-4 font-sans animate-in fade-in-0 duration-200">
            <div className="w-full max-w-lg bg-[#0d1222] border border-zinc-800 rounded-3xl p-6 shadow-2xl flex flex-col gap-6 text-zinc-100">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center">
                            <Sparkles size={20} />
                        </div>
                        <div>
                            <h3 className="text-base font-black text-white tracking-tight">Configurações de Inteligência Artificial</h3>
                            <p className="text-xs text-zinc-400">Integre sua API Key (Gemini, ChatGPT, Grok, Claude ou Local)</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Form Content */}
                <div className="space-y-5">
                    {/* Provider Select */}
                    <div className="space-y-2">
                        <label className="text-xs font-extrabold uppercase tracking-wider text-zinc-400">Provedor de IA</label>
                        <div className="grid grid-cols-3 gap-2">
                            {[
                                { id: 'gemini', label: 'Google Gemini' },
                                { id: 'openai', label: 'OpenAI (ChatGPT)' },
                                { id: 'grok', label: 'xAI (Grok)' },
                                { id: 'claude', label: 'Anthropic Claude' },
                                { id: 'custom', label: 'Custom / Local' },
                            ].map(p => (
                                <button
                                    key={p.id}
                                    type="button"
                                    onClick={() => handleProviderChange(p.id as AiProvider)}
                                    className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all border text-center truncate ${
                                        config.provider === p.id
                                            ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500/40 shadow-sm'
                                            : 'bg-zinc-900/60 text-zinc-400 border-zinc-800 hover:text-zinc-200 hover:bg-zinc-800/50'
                                    }`}
                                >
                                    {p.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* API Key */}
                    <div className="space-y-2">
                        <label className="text-xs font-extrabold uppercase tracking-wider text-zinc-400 flex items-center justify-between">
                            <span>API Key</span>
                            <span className="text-[10px] text-zinc-500 font-normal">Salva localmente no navegador</span>
                        </label>
                        <div className="relative flex items-center">
                            <input
                                type={showKey ? 'text' : 'password'}
                                placeholder={config.provider === 'custom' ? 'Opcional para local API' : 'Insira sua chave de API...'}
                                value={config.apiKey}
                                onChange={e => setConfig({ ...config, apiKey: e.target.value })}
                                className="w-full bg-zinc-900/90 border border-zinc-800 rounded-xl px-4 py-3 text-xs font-mono text-white placeholder-zinc-600 outline-none focus:border-indigo-500 transition-colors pr-10"
                            />
                            <button
                                type="button"
                                onClick={() => setShowKey(!showKey)}
                                className="absolute right-3 text-zinc-500 hover:text-zinc-300"
                            >
                                {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                        {config.provider === 'gemini' && (
                            <p className="text-[11px] text-zinc-400 leading-tight">
                                Suporta chaves do Google AI Studio tanto no formato novo (<code className="text-indigo-400 font-mono">AQ....</code>) quanto tradicional (<code className="text-indigo-400 font-mono">AIza...</code>).
                            </p>
                        )}
                    </div>

                    {/* Model Name */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <label className="text-xs font-extrabold uppercase tracking-wider text-zinc-400">Modelo da IA</label>
                            <span className="text-[10px] text-zinc-500">Clique para selecionar</span>
                        </div>
                        <input
                            type="text"
                            placeholder="ex: gemini-3.6-flash, gemini-3.5-flash-lite, gpt-4o..."
                            value={config.model || ''}
                            onChange={e => setConfig({ ...config, model: e.target.value })}
                            className="w-full bg-zinc-900/90 border border-zinc-800 rounded-xl px-4 py-3 text-xs font-mono text-white placeholder-zinc-600 outline-none focus:border-indigo-500 transition-colors"
                        />
                        {/* Quick model selection chips */}
                        {suggestedModels[config.provider] && (
                            <div className="flex flex-wrap gap-1.5 pt-1">
                                {suggestedModels[config.provider].map(m => (
                                    <button
                                        key={m}
                                        type="button"
                                        onClick={() => setConfig({ ...config, model: m })}
                                        className={`px-2.5 py-1 rounded-lg text-[11px] font-mono transition-all border ${
                                            config.model === m
                                                ? 'bg-indigo-600/30 text-indigo-300 border-indigo-500/50 font-bold'
                                                : 'bg-zinc-900/80 text-zinc-400 border-zinc-800 hover:text-white hover:border-zinc-700'
                                        }`}
                                    >
                                        {m}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Base URL (only for Custom) */}
                    {config.provider === 'custom' && (
                        <div className="space-y-2">
                            <label className="text-xs font-extrabold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                                <Server size={14} className="text-indigo-400" />
                                Base URL (Endpoint OpenAI-compatible)
                            </label>
                            <input
                                type="text"
                                placeholder="http://localhost:11434/v1"
                                value={config.baseUrl || ''}
                                onChange={e => setConfig({ ...config, baseUrl: e.target.value })}
                                className="w-full bg-zinc-900/90 border border-zinc-800 rounded-xl px-4 py-3 text-xs font-mono text-white placeholder-zinc-600 outline-none focus:border-indigo-500 transition-colors"
                            />
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between border-t border-zinc-800 pt-4 mt-2">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2.5 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        type="button"
                        onClick={handleSave}
                        className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-600/20 flex items-center gap-2"
                    >
                        {savedSuccess ? (
                            <>
                                <Check size={16} className="text-emerald-400" />
                                Salvo com sucesso!
                            </>
                        ) : (
                            'Salvar Configuração'
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};
