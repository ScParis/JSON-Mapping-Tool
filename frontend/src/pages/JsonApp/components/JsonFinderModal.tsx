import React, { useState, useMemo } from 'react';
import { Search, ChevronDown, ChevronRight, Copy, Check, X, Sparkles, CornerDownRight, Play } from 'lucide-react';
import jmespath from 'jmespath';

interface JsonFinderModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialJson: any;
    onSelectPath?: (path: string) => void;
}

interface TreeNodeProps {
    keyName: string;
    value: any;
    path: string;
    searchTerm: string;
    onSelect: (path: string) => void;
    selectedPath: string;
}

const TreeNode: React.FC<TreeNodeProps> = ({ keyName, value, path, searchTerm, onSelect, selectedPath }) => {
    const isObject = typeof value === 'object' && value !== null;
    const [isExpanded, setIsExpanded] = useState<boolean>(true);

    const matchesSearch = useMemo(() => {
        if (!searchTerm) return true;
        const term = searchTerm.toLowerCase();
        const keyMatch = keyName.toLowerCase().includes(term);
        const pathMatch = path.toLowerCase().includes(term);
        const valueMatch = !isObject && String(value).toLowerCase().includes(term);
        return keyMatch || pathMatch || valueMatch;
    }, [keyName, path, value, isObject, searchTerm]);

    if (!matchesSearch && searchTerm) return null;

    const isSelected = selectedPath === path;

    const renderValue = () => {
        if (value === null) return <span className="text-zinc-500 font-mono italic">null</span>;
        if (typeof value === 'boolean') return <span className="text-amber-400 font-mono">{String(value)}</span>;
        if (typeof value === 'number') return <span className="text-emerald-400 font-mono">{value}</span>;
        if (typeof value === 'string') return <span className="text-sky-300 font-mono">"{value}"</span>;
        return null;
    };

    return (
        <div className="ml-3 my-0.5 font-mono text-xs">
            <div
                onClick={() => onSelect(path)}
                className={`group flex items-center gap-1.5 py-1 px-2 rounded-lg cursor-pointer transition-all ${
                    isSelected
                        ? 'bg-indigo-600/30 text-indigo-200 border border-indigo-500/40'
                        : 'hover:bg-zinc-800/70 text-zinc-300'
                }`}
            >
                {isObject ? (
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsExpanded(!isExpanded);
                        }}
                        className="p-0.5 hover:bg-zinc-700/50 rounded text-zinc-400"
                    >
                        {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    </button>
                ) : (
                    <span className="w-3.5" />
                )}

                <span className="font-semibold text-zinc-200">{keyName}:</span>

                {isObject ? (
                    <span className="text-zinc-500 text-[11px]">
                        {Array.isArray(value) ? `Array[${value.length}]` : `Object{${Object.keys(value).length}}`}
                    </span>
                ) : (
                    <span className="truncate max-w-md">{renderValue()}</span>
                )}

                {path && (
                    <span className="ml-auto opacity-0 group-hover:opacity-100 text-[10px] text-zinc-500 bg-zinc-900/80 px-1.5 py-0.5 rounded border border-zinc-800">
                        {path}
                    </span>
                )}
            </div>

            {isObject && isExpanded && (
                <div className="border-l border-zinc-800 ml-2.5 pl-1">
                    {Object.entries(value).map(([childKey, childValue]) => {
                        const childPath = path
                            ? Array.isArray(value)
                                ? `${path}[${childKey}]`
                                : `${path}.${childKey}`
                            : childKey;
                        return (
                            <TreeNode
                                key={childKey}
                                keyName={childKey}
                                value={childValue}
                                path={childPath}
                                searchTerm={searchTerm}
                                onSelect={onSelect}
                                selectedPath={selectedPath}
                            />
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export const JsonFinderModal: React.FC<JsonFinderModalProps> = ({ isOpen, onClose, initialJson, onSelectPath }) => {
    const [selectedPath, setSelectedPath] = useState<string>('');
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [query, setQuery] = useState<string>('');
    const [copied, setCopied] = useState<boolean>(false);

    const queryResult = useMemo(() => {
        if (!query.trim() || !initialJson) return null;
        try {
            return jmespath.search(initialJson, query.trim());
        } catch (e: any) {
            return { __error: e.message };
        }
    }, [initialJson, query]);

    if (!isOpen) return null;

    const handleCopy = () => {
        if (selectedPath) {
            navigator.clipboard.writeText(selectedPath);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleApply = () => {
        if (selectedPath && onSelectPath) {
            onSelectPath(selectedPath);
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
            <div className="w-full max-w-5xl h-[85vh] bg-[#0c101d] border border-zinc-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
                {/* Header */}
                <div className="px-6 py-4 border-b border-zinc-800/80 flex items-center justify-between bg-zinc-900/50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20">
                            <Search size={18} />
                        </div>
                        <div>
                            <h2 className="text-sm font-bold text-white tracking-wide">JSON Finder & Path Explorer</h2>
                            <p className="text-xs text-zinc-400">Navegue na estrutura, localize caminhos e teste expressões JMESPath</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-all"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Main Content Grid */}
                <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-0 overflow-hidden">
                    {/* Tree View (Left - 7 cols) */}
                    <div className="md:col-span-7 border-r border-zinc-800/80 p-4 flex flex-col overflow-hidden bg-[#0a0d18]">
                        <div className="mb-3 relative">
                            <Search size={14} className="absolute left-3 top-3 text-zinc-500" />
                            <input
                                type="text"
                                placeholder="Filtrar chaves ou valores na árvore..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-9 pr-3 py-2 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-indigo-500 transition-all"
                            />
                        </div>

                        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar border border-zinc-800/60 rounded-xl p-3 bg-zinc-950/40">
                            {initialJson ? (
                                <TreeNode
                                    keyName="root"
                                    value={initialJson}
                                    path=""
                                    searchTerm={searchTerm}
                                    onSelect={(p) => {
                                        setSelectedPath(p);
                                        if (p) setQuery(p);
                                    }}
                                    selectedPath={selectedPath}
                                />
                            ) : (
                                <div className="text-center py-12 text-zinc-500 text-xs">
                                    Nenhum JSON carregado no editor de origem.
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Path & JMESPath Playground (Right - 5 cols) */}
                    <div className="md:col-span-5 p-4 flex flex-col gap-4 bg-[#0d1120]">
                        {/* Selected Path Box */}
                        <div className="p-3 bg-zinc-900/80 border border-zinc-800 rounded-xl">
                            <label className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block mb-1.5">
                                Caminho Selecionado (JMESPath)
                            </label>
                            <div className="flex items-center gap-2">
                                <input
                                    type="text"
                                    readOnly
                                    value={selectedPath || '(Clique em qualquer nó da árvore)'}
                                    className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs font-mono text-indigo-300 focus:outline-none"
                                />
                                <button
                                    onClick={handleCopy}
                                    disabled={!selectedPath}
                                    className="p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg disabled:opacity-40 transition-all"
                                    title="Copiar Caminho"
                                >
                                    {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                                </button>
                            </div>
                        </div>

                        {/* JMESPath Live Query Tester */}
                        <div className="flex-1 flex flex-col border border-zinc-800 rounded-xl p-3 bg-zinc-950/60 overflow-hidden">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                                    <Sparkles size={13} className="text-amber-400" />
                                    Testar Expressão JMESPath
                                </span>
                            </div>
                            <input
                                type="text"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="ex: items[?price > 50].name"
                                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs font-mono text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-indigo-500 mb-2"
                            />
                            <div className="flex-1 overflow-y-auto bg-zinc-900/90 border border-zinc-800/80 rounded-lg p-2.5 font-mono text-xs text-emerald-400 custom-scrollbar">
                                {queryResult !== null ? (
                                    queryResult?.__error ? (
                                        <span className="text-rose-400">{queryResult.__error}</span>
                                    ) : (
                                        <pre>{JSON.stringify(queryResult, null, 2)}</pre>
                                    )
                                ) : (
                                    <span className="text-zinc-600 italic">Digite uma expressão para ver o resultado...</span>
                                )}
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800/80">
                            <button
                                onClick={onClose}
                                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold rounded-xl transition-all"
                            >
                                Fechar
                            </button>
                            {onSelectPath && (
                                <button
                                    onClick={handleApply}
                                    disabled={!selectedPath}
                                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-all shadow-lg shadow-indigo-600/20"
                                >
                                    <CornerDownRight size={14} />
                                    Usar no Mapeamento
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
