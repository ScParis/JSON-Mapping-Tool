import React, { useState, useEffect } from 'react';
import { History, Trash2, RotateCcw, Save, X, Clock, FileJson } from 'lucide-react';

export interface HistoryEntry {
    id: string;
    title: string;
    timestamp: string;
    sourceJsonStr: string;
    targetJsonStr: string;
    mappingRules: Record<string, string>;
}

interface JsonHistoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    onRestore: (entry: HistoryEntry) => void;
    currentSource: string;
    currentTarget: string;
    currentRules: Record<string, string>;
}

const STORAGE_KEY = 'devstudio_json_mapping_history';

export const JsonHistoryModal: React.FC<JsonHistoryModalProps> = ({
    isOpen,
    onClose,
    onRestore,
    currentSource,
    currentTarget,
    currentRules
}) => {
    const [history, setHistory] = useState<HistoryEntry[]>([]);
    const [newTitle, setNewTitle] = useState<string>('');

    useEffect(() => {
        if (isOpen) {
            loadHistory();
        }
    }, [isOpen]);

    const loadHistory = () => {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (raw) {
                setHistory(JSON.parse(raw));
            }
        } catch (e) {
            console.error('Error loading history:', e);
        }
    };

    const saveHistoryToStorage = (entries: HistoryEntry[]) => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
            setHistory(entries);
        } catch (e) {
            console.error('Error saving history:', e);
        }
    };

    const handleSaveCurrent = () => {
        const title = newTitle.trim() || `Mapeamento ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`;
        const newEntry: HistoryEntry = {
            id: Date.now().toString(),
            title,
            timestamp: new Date().toLocaleString(),
            sourceJsonStr: currentSource,
            targetJsonStr: currentTarget,
            mappingRules: currentRules
        };

        const updated = [newEntry, ...history].slice(0, 20); // Keep max 20 entries
        saveHistoryToStorage(updated);
        setNewTitle('');
    };

    const handleDelete = (id: string) => {
        const updated = history.filter(h => h.id !== id);
        saveHistoryToStorage(updated);
    };

    const handleClearAll = () => {
        saveHistoryToStorage([]);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
            <div className="w-full max-w-2xl bg-[#0c101d] border border-zinc-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
                {/* Header */}
                <div className="px-6 py-4 border-b border-zinc-800/80 flex items-center justify-between bg-zinc-900/50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
                            <History size={18} />
                        </div>
                        <div>
                            <h2 className="text-sm font-bold text-white tracking-wide">Histórico e Mapeamentos Salvos</h2>
                            <p className="text-xs text-zinc-400">Gerencie e restaure configurações anteriores de mapeamento</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-all"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Save Current Banner */}
                <div className="p-4 bg-zinc-900/80 border-b border-zinc-800/80 flex items-center gap-3">
                    <input
                        type="text"
                        placeholder="Nome para salvar o mapeamento atual..."
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
                    />
                    <button
                        onClick={handleSaveCurrent}
                        className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-all shadow-lg shadow-amber-600/20"
                    >
                        <Save size={14} />
                        Salvar Mapeamento
                    </button>
                </div>

                {/* List of Entries */}
                <div className="max-h-[50vh] overflow-y-auto p-4 space-y-2.5 custom-scrollbar">
                    {history.length > 0 ? (
                        history.map((entry) => (
                            <div
                                key={entry.id}
                                className="p-3.5 bg-zinc-900/60 hover:bg-zinc-800/50 border border-zinc-800/80 rounded-xl flex items-center justify-between transition-all group"
                            >
                                <div className="flex flex-col gap-1">
                                    <div className="text-xs font-bold text-zinc-200 flex items-center gap-2">
                                        <FileJson size={14} className="text-indigo-400" />
                                        {entry.title}
                                    </div>
                                    <div className="text-[10px] text-zinc-500 flex items-center gap-1.5">
                                        <Clock size={11} />
                                        {entry.timestamp} • {Object.keys(entry.mappingRules || {}).length} regras salvas
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => {
                                            onRestore(entry);
                                            onClose();
                                        }}
                                        className="px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 border border-indigo-500/30 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all"
                                    >
                                        <RotateCcw size={13} />
                                        Restaurar
                                    </button>
                                    <button
                                        onClick={() => handleDelete(entry.id)}
                                        className="p-1.5 text-zinc-500 hover:text-rose-400 hover:bg-zinc-800 rounded-lg transition-all"
                                        title="Excluir"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-10 text-zinc-500 text-xs">
                            Nenhum mapeamento salvo no histórico.
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-3 border-t border-zinc-800/80 flex items-center justify-between bg-zinc-900/50">
                    {history.length > 0 ? (
                        <button
                            onClick={handleClearAll}
                            className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 transition-all"
                        >
                            <Trash2 size={13} />
                            Limpar Histórico Completo
                        </button>
                    ) : (
                        <span />
                    )}
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold rounded-xl transition-all"
                    >
                        Fechar
                    </button>
                </div>
            </div>
        </div>
    );
};
