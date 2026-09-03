import React, { useState } from 'react';
import { X, Key, ShieldCheck, Lock, Unlock, Check } from 'lucide-react';
import { AuthState } from '../types';

interface AuthorizeModalProps {
  isOpen: boolean;
  onClose: () => void;
  auth: AuthState;
  onSave: (auth: AuthState) => void;
}

export const AuthorizeModal: React.FC<AuthorizeModalProps> = ({
  isOpen,
  onClose,
  auth,
  onSave
}) => {
  const [localAuth, setLocalAuth] = useState<AuthState>({ ...auth });
  const [activeTab, setActiveTab] = useState<'bearer' | 'apiKey' | 'basic'>('bearer');

  if (!isOpen) return null;

  const handleSave = () => {
    onSave(localAuth);
    onClose();
  };

  const handleClear = () => {
    const cleared: AuthState = {
      type: 'bearer',
      bearerToken: '',
      apiKeyName: '',
      apiKeyValue: '',
      apiKeyIn: 'header',
      basicUsername: '',
      basicPassword: '',
      customHeaders: {}
    };
    setLocalAuth(cleared);
    onSave(cleared);
  };

  const isAuthorized = !!(
    (localAuth.type === 'bearer' && localAuth.bearerToken) ||
    (localAuth.type === 'apiKey' && localAuth.apiKeyValue) ||
    (localAuth.type === 'basic' && (localAuth.basicUsername || localAuth.basicPassword))
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 border border-zinc-200 dark:border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-200 dark:border-slate-800 flex items-center justify-between bg-zinc-50 dark:bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-500/10 text-indigo-500 rounded-xl">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-900 dark:text-white">Configurar Autorização (Auth)</h3>
              <p className="text-xs text-zinc-500 dark:text-slate-400">Credenciais para execução de requisições "Try It Out"</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-white rounded-lg hover:bg-zinc-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-zinc-200 dark:border-slate-800 bg-zinc-100/50 dark:bg-slate-950/30 px-6 pt-3 gap-2">
          <button
            onClick={() => { setActiveTab('bearer'); setLocalAuth(prev => ({ ...prev, type: 'bearer' })); }}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all ${
              activeTab === 'bearer'
                ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-zinc-500 hover:text-zinc-700 dark:hover:text-slate-300'
            }`}
          >
            Bearer Token (JWT)
          </button>
          <button
            onClick={() => { setActiveTab('apiKey'); setLocalAuth(prev => ({ ...prev, type: 'apiKey' })); }}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all ${
              activeTab === 'apiKey'
                ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-zinc-500 hover:text-zinc-700 dark:hover:text-slate-300'
            }`}
          >
            API Key
          </button>
          <button
            onClick={() => { setActiveTab('basic'); setLocalAuth(prev => ({ ...prev, type: 'basic' })); }}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all ${
              activeTab === 'basic'
                ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-zinc-500 hover:text-zinc-700 dark:hover:text-slate-300'
            }`}
          >
            Basic Auth
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-4 overflow-y-auto">
          {activeTab === 'bearer' && (
            <div className="space-y-3">
              <label className="text-xs font-extrabold uppercase tracking-wider text-zinc-500 dark:text-slate-400">
                Bearer Token / JWT
              </label>
              <textarea
                placeholder="Insira seu token (ex: eyJhbGciOiJIUzI1NiIsIn...)"
                value={localAuth.bearerToken}
                onChange={e => setLocalAuth({ ...localAuth, bearerToken: e.target.value })}
                rows={4}
                className="w-full bg-zinc-50 dark:bg-slate-950 border border-zinc-200 dark:border-slate-800 rounded-xl p-3 text-xs font-mono text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-slate-600 outline-none focus:border-indigo-500 transition-colors"
              />
              <p className="text-[11px] text-zinc-400 dark:text-slate-500">
                Será enviado no cabeçalho <code className="text-indigo-500 font-mono">Authorization: Bearer &lt;token&gt;</code>
              </p>
            </div>
          )}

          {activeTab === 'apiKey' && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-extrabold uppercase tracking-wider text-zinc-500 dark:text-slate-400 block mb-1">
                    Nome do Parâmetro
                  </label>
                  <input
                    type="text"
                    placeholder="ex: x-api-key, api_key"
                    value={localAuth.apiKeyName}
                    onChange={e => setLocalAuth({ ...localAuth, apiKeyName: e.target.value })}
                    className="w-full bg-zinc-50 dark:bg-slate-950 border border-zinc-200 dark:border-slate-800 rounded-xl p-3 text-xs font-mono text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-slate-600 outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-extrabold uppercase tracking-wider text-zinc-500 dark:text-slate-400 block mb-1">
                    Localização (In)
                  </label>
                  <select
                    value={localAuth.apiKeyIn}
                    onChange={e => setLocalAuth({ ...localAuth, apiKeyIn: e.target.value as any })}
                    className="w-full bg-zinc-50 dark:bg-slate-950 border border-zinc-200 dark:border-slate-800 rounded-xl p-3 text-xs font-bold text-zinc-900 dark:text-white outline-none focus:border-indigo-500"
                  >
                    <option value="header">Header HTTP</option>
                    <option value="query">Query Parameter</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-extrabold uppercase tracking-wider text-zinc-500 dark:text-slate-400 block mb-1">
                  Valor da Chave (Key Value)
                </label>
                <input
                  type="password"
                  placeholder="Insira a chave secreta de API..."
                  value={localAuth.apiKeyValue}
                  onChange={e => setLocalAuth({ ...localAuth, apiKeyValue: e.target.value })}
                  className="w-full bg-zinc-50 dark:bg-slate-950 border border-zinc-200 dark:border-slate-800 rounded-xl p-3 text-xs font-mono text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-slate-600 outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          )}

          {activeTab === 'basic' && (
            <div className="space-y-3">
              <div>
                <label className="text-xs font-extrabold uppercase tracking-wider text-zinc-500 dark:text-slate-400 block mb-1">
                  Usuário
                </label>
                <input
                  type="text"
                  placeholder="Username"
                  value={localAuth.basicUsername}
                  onChange={e => setLocalAuth({ ...localAuth, basicUsername: e.target.value })}
                  className="w-full bg-zinc-50 dark:bg-slate-950 border border-zinc-200 dark:border-slate-800 rounded-xl p-3 text-xs text-zinc-900 dark:text-white outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="text-xs font-extrabold uppercase tracking-wider text-zinc-500 dark:text-slate-400 block mb-1">
                  Senha
                </label>
                <input
                  type="password"
                  placeholder="Password"
                  value={localAuth.basicPassword}
                  onChange={e => setLocalAuth({ ...localAuth, basicPassword: e.target.value })}
                  className="w-full bg-zinc-50 dark:bg-slate-950 border border-zinc-200 dark:border-slate-800 rounded-xl p-3 text-xs text-zinc-900 dark:text-white outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-zinc-200 dark:border-slate-800 bg-zinc-50 dark:bg-slate-950/60 flex items-center justify-between">
          <button
            onClick={handleClear}
            className="text-xs font-bold text-rose-500 hover:text-rose-600 dark:hover:text-rose-400 flex items-center gap-1 transition-colors"
          >
            <Unlock className="w-3.5 h-3.5" /> Limpar Autorização
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-zinc-600 dark:text-slate-400 hover:bg-zinc-200 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20 flex items-center gap-1.5 transition-all"
            >
              <Lock className="w-3.5 h-3.5" /> Salvar & Autorizar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
