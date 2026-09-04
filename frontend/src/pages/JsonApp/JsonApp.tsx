import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
    ArrowRightLeft, FileJson, Play, Settings2, Copy, Check, Info, Download, X,
    Search, BookOpen, History, Sparkles, Wand2, Minimize2, CheckCircle2,
    Upload, Shield, FileText, ExternalLink, Github
} from 'lucide-react';
import hljs from 'highlight.js';
import 'highlight.js/styles/atom-one-dark.css';
import jmespath from 'jmespath';
import { PageHeader, Card, Button, Select, Badge } from '../../components/ui';

import { JsonFinderModal } from './components/JsonFinderModal';
import { JmespathTutorialModal } from './components/JmespathTutorialModal';
import { JsonHistoryModal, HistoryEntry } from './components/JsonHistoryModal';
import { SAMPLE_DATASETS, SampleDataset } from './data/sampleData';

import { setNestedValue, generateKeysList } from './utils';


// Recursive helper to build JMESPath expression from mapping block
function buildJmespathExpression(mappingConfig: Record<string, string>, targetJson: any): string {
    const buildNode = (targetPathPrefix: string, targetObj: any, indent: number): string => {
        const ind = ' '.repeat(indent);
        const innerInd = ' '.repeat(indent + 2);

        if (Array.isArray(targetObj)) {
            if (targetObj.length === 0) return '`[]`';

            const arrayPrefix = targetPathPrefix ? targetPathPrefix + '[0]' : '[0]';
            const mappedKeys = Object.keys(mappingConfig).filter(k => k.startsWith(arrayPrefix + '.') && mappingConfig[k]);

            let sourceArrayPrefix = '';
            if (mappedKeys.length > 0) {
                for (const tk of mappedKeys) {
                    const sourcePathFull = mappingConfig[tk];
                    const sourceArrayMatch = sourcePathFull.match(/^(.*?)\[\*\]/);
                    if (sourceArrayMatch) {
                        sourceArrayPrefix = sourceArrayMatch[1] + '[*]';
                        break;
                    }
                }
            }

            if (sourceArrayPrefix) {
                return `${sourceArrayPrefix}.{\n${innerInd}` + buildHash(arrayPrefix, targetObj[0], indent + 2, sourceArrayPrefix + '.') + `\n${ind}}`;
            } else {
                const arrayItems = [];
                for (let i = 0; i < targetObj.length; i++) {
                    const itemPrefix = targetPathPrefix ? `${targetPathPrefix}[${i}]` : `[${i}]`;
                    arrayItems.push(buildNode(itemPrefix, targetObj[i], indent + 2));
                }
                return `[\n${innerInd}${arrayItems.join(`,\n${innerInd}`)}\n${ind}]`;
            }
        } else if (typeof targetObj === 'object' && targetObj !== null) {
            return `{\n${innerInd}` + buildHash(targetPathPrefix, targetObj, indent + 2, '') + `\n${ind}}`;
        }
        return 'null';
    }

    const buildHash = (targetPathPrefix: string, targetObj: any, indent: number, relativeSourceStrip: string): string => {
        const parts: string[] = [];
        for (const key in targetObj) {
            const currentTargetPath = targetPathPrefix ? `${targetPathPrefix}.${key}` : key;
            const mappedSource = mappingConfig[currentTargetPath];

            const keyNameStr = `"${key}"`;

            if (typeof targetObj[key] === 'object' && targetObj[key] !== null) {
                const val = buildNode(currentTargetPath, targetObj[key], indent);
                parts.push(`${keyNameStr}: ${val}`);
            } else {
                if (mappedSource) {
                    let sourceExpr = mappedSource;
                    if (relativeSourceStrip) {
                        sourceExpr = sourceExpr.split(relativeSourceStrip).join('');
                    }
                    parts.push(`${keyNameStr}: ${sourceExpr}`);
                } else {
                    const fallback = typeof targetObj[key] === 'number' ? '`0`' : '`""`';
                    parts.push(`${keyNameStr}: ${fallback}`);
                }
            }
        }
        return parts.join(`,\n${' '.repeat(indent)}`);
    }

    return buildNode('', targetJson, 0);
}

export default function JsonApp() {
    const [sourceJsonStr, setSourceJsonStr] = useState('{\n  "user": {\n    "name": "João Silva",\n    "age": 30,\n    "contacts": {\n      "email": "joao@example.com"\n    }\n  }\n}');
    const [targetJsonStr, setTargetJsonStr] = useState('{\n  "fullName": "",\n  "contactEmail": ""\n}');

    const [mappedJsonStr, setMappedJsonStr] = useState('');
    const [transformedJsonStr, setTransformedJsonStr] = useState('');
    const [resultTab, setResultTab] = useState<'transformed' | 'expression'>('transformed');
    const [validationError, setValidationError] = useState('');

    const [sourceJson, setSourceJson] = useState<any>(null);
    const [targetJson, setTargetJson] = useState<any>(null);

    const [sourceError, setSourceError] = useState('');
    const [targetError, setTargetError] = useState('');

    const [mappingConfig, setMappingConfig] = useState<Record<string, string>>({});
    const [copied, setCopied] = useState(false);
    const [toastMessage, setToastMessage] = useState<string | null>(null);

    // File input refs for uploads
    const sourceFileInputRef = useRef<HTMLInputElement>(null);
    const targetFileInputRef = useRef<HTMLInputElement>(null);

    // Modals state
    const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
    const [isFinderModalOpen, setIsFinderModalOpen] = useState(false);
    const [isTutorialModalOpen, setIsTutorialModalOpen] = useState(false);
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

    // Selected sample dataset
    const [selectedDatasetId, setSelectedDatasetId] = useState<string>('');

    const showToast = (msg: string) => {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(null), 3000);
    };

    // Parse JSONs on change
// Helper para processar JSON Molde com sintaxe relaxada (aceitando expressões de caminho sem aspas)
const parseRelaxedMoldJson = (rawStr: string): { parsed: any; error: string } => {
    if (!rawStr || !rawStr.trim()) return { parsed: null, error: 'JSON de Destino vazio' };
    
    // Tenta primeiro o JSON.parse nativo
    try {
        const direct = JSON.parse(rawStr);
        return { parsed: direct, error: '' };
    } catch (e) {
        // Fallback: tratar valores não aspeados (ex: "fullName": user.name)
    }

    try {
        // Substituir identificadores/caminhos sem aspas após dois pontos por strings aspeadas
        const sanitized = rawStr.replace(/:\s*([a-zA-Z_$][a-zA-Z0-9_$.*\[\]]*)(?=\s*[,}\n\r])/g, (match, path) => {
            const trimmed = path.trim();
            if (['true', 'false', 'null'].includes(trimmed) || !isNaN(Number(trimmed))) {
                return match;
            }
            return `: "${trimmed}"`;
        });

        const parsed = JSON.parse(sanitized);
        return { parsed, error: '' };
    } catch (e: any) {
        return { parsed: null, error: 'Estrutura JSON de Destino inválida' };
    }
};

// Extrai valores texto de propriedades do molde de destino
const extractTargetFieldValues = (obj: any, prefix = ''): Record<string, string> => {
    let result: Record<string, string> = {};
    if (!obj || typeof obj !== 'object') return result;

    for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            const currentPath = prefix ? `${prefix}.${key}` : key;
            const val = obj[key];
            if (typeof val === 'string' && val.trim() !== '') {
                result[currentPath] = val.trim();
            } else if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
                result = { ...result, ...extractTargetFieldValues(val, currentPath) };
            }
        }
    }
    return result;
};

    // Importa dados enviados por outros módulos (ex.: "Abrir no JSON Mapper" do OpenAPI Studio)
    useEffect(() => {
        try {
            const imported = sessionStorage.getItem('nexora_json_import');
            if (imported) {
                sessionStorage.removeItem('nexora_json_import');
                const parsed = JSON.parse(imported);
                setSourceJsonStr(JSON.stringify(parsed, null, 2));
                showToast('JSON importado com sucesso!');
            }
        } catch (e) {
            console.error('Falha ao importar JSON de outro módulo:', e);
        }
    }, []);

    useEffect(() => {
        try {
            const parsed = JSON.parse(sourceJsonStr);
            setSourceJson(parsed);
            setSourceError('');
        } catch (e) {
            setSourceError('JSON de Origem inválido');
            setSourceJson(null);
        }
    }, [sourceJsonStr]);

    useEffect(() => {
        const { parsed, error } = parseRelaxedMoldJson(targetJsonStr);
        setTargetJson(parsed);
        setTargetError(error);
    }, [targetJsonStr]);

    // Derived arrays of available paths
    const sourcePaths = useMemo(() => sourceJson ? generateKeysList(sourceJson, '', true) : [], [sourceJson]);
    const targetPaths = useMemo(() => targetJson ? generateKeysList(targetJson, '', false) : [], [targetJson]);

    // Auto-init mapping config when target paths or target mold values change
    useEffect(() => {
        const initialConfig: Record<string, string> = {};
        const extractedValues = targetJson ? extractTargetFieldValues(targetJson) : {};

        targetPaths.forEach(path => {
            const moldVal = extractedValues[path];
            // Se o valor inserido no molde for um caminho de origem ou uma expressão (ex: user.name), usa ele como mapeamento
            if (moldVal && (sourcePaths.includes(moldVal) || /^[a-zA-Z_$][a-zA-Z0-9_$.*\[\]]*$/.test(moldVal))) {
                initialConfig[path] = moldVal;
            } else if (mappingConfig[path] !== undefined) {
                initialConfig[path] = mappingConfig[path];
            } else {
                initialConfig[path] = '';
            }
        });
        setMappingConfig(initialConfig);
    }, [targetPaths, targetJsonStr]);

    const handleCopyMapped = () => {
        const contentToCopy = resultTab === 'expression' ? mappedJsonStr : transformedJsonStr;
        if (!contentToCopy) return;
        navigator.clipboard.writeText(contentToCopy);
        setCopied(true);
        showToast(resultTab === 'expression' ? 'Expressão JMESPath copiada!' : 'JSON Transformado copiado!');
        setTimeout(() => setCopied(false), 2000);
    };

    const handleMappingChange = (targetPath: string, sourcePath: string) => {
        setMappingConfig(prev => ({
            ...prev,
            [targetPath]: sourcePath
        }));
    };

    const executeMapping = (notify = true) => {
        if (!sourceJson || !targetJson) return;

        const jmespathRule = buildJmespathExpression(mappingConfig, targetJson);
        setMappedJsonStr(jmespathRule);

        try {
            const result = jmespath.search(sourceJson, jmespathRule);
            setTransformedJsonStr(JSON.stringify(result, null, 2));
            setValidationError('');
            if (notify) showToast('Mapeamento executado com sucesso!');
        } catch (e: any) {
            setValidationError('Expressão JMESPath inválida: ' + e.message);
            setTransformedJsonStr('');
        }
    };

    // Auto-executa o mapeamento sempre que origem, destino ou regras atualizarem
    useEffect(() => {
        if (sourceJson && targetJson) {
            executeMapping(false);
        }
    }, [sourceJson, targetJson, mappingConfig]);

    const handleDownloadMapped = () => {
        const content = resultTab === 'expression' ? mappedJsonStr : transformedJsonStr;
        if (!content) return;
        const blob = new Blob([content], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = resultTab === 'expression' ? 'jmespath_expression.json' : 'mapped_output.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = (e: React.DragEvent, type: 'source' | 'target') => {
        e.preventDefault();
        e.stopPropagation();
        const file = e.dataTransfer.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const content = event.target?.result as string;
            if (content) {
                if (type === 'source') {
                    setSourceJsonStr(content);
                } else {
                    setTargetJsonStr(content);
                }
                showToast(`Arquivo "${file.name}" carregado via arraste!`);
            }
        };
        reader.readAsText(file);
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'source' | 'target') => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const content = event.target?.result as string;
            if (content) {
                if (type === 'source') {
                    setSourceJsonStr(content);
                } else {
                    setTargetJsonStr(content);
                }
                showToast(`Arquivo "${file.name}" carregado!`);
            }
        };
        reader.readAsText(file);
    };

    // Load Dataset Example
    const handleSelectDataset = (datasetId: string) => {
        setSelectedDatasetId(datasetId);
        const ds = SAMPLE_DATASETS.find(d => d.id === datasetId);
        if (ds) {
            setSourceJsonStr(JSON.stringify(ds.sourceJson, null, 2));
            setTargetJsonStr(JSON.stringify(ds.targetJson, null, 2));
            setMappingConfig(ds.defaultMappings);
            showToast(`Dataset "${ds.name}" carregado!`);
        }
    };

    // Auto formatters
    const formatJson = (type: 'source' | 'target') => {
        try {
            if (type === 'source' && sourceJson) {
                setSourceJsonStr(JSON.stringify(sourceJson, null, 2));
            } else if (type === 'target' && targetJson) {
                setTargetJsonStr(JSON.stringify(targetJson, null, 2));
            }
            showToast('JSON formatado!');
        } catch (e) {}
    };

    const minifyJson = (type: 'source' | 'target') => {
        try {
            if (type === 'source' && sourceJson) {
                setSourceJsonStr(JSON.stringify(sourceJson));
            } else if (type === 'target' && targetJson) {
                setTargetJsonStr(JSON.stringify(targetJson));
            }
            showToast('JSON minificado!');
        } catch (e) {}
    };

    // Restore from History
    const handleRestoreHistory = (entry: HistoryEntry) => {
        setSourceJsonStr(entry.sourceJsonStr);
        setTargetJsonStr(entry.targetJsonStr);
        setMappingConfig(entry.mappingRules);
        showToast(`Mapeamento "${entry.title}" restaurado!`);
    };

    // Load example from Tutorial
    const handleLoadTutorialExample = (src: any, tgt: any, maps: Record<string, string>) => {
        setSourceJsonStr(JSON.stringify(src, null, 2));
        setTargetJsonStr(JSON.stringify(tgt, null, 2));
        setMappingConfig(maps);
        showToast('Exemplo do tutorial carregado no editor!');
    };

    return (
        <div className="ds-container flex flex-col min-h-[calc(100vh-80px)] relative">
            {/* Hidden File Inputs */}
            <input
                type="file"
                ref={sourceFileInputRef}
                accept=".json,application/json"
                className="hidden"
                onChange={(e) => handleFileUpload(e, 'source')}
            />
            <input
                type="file"
                ref={targetFileInputRef}
                accept=".json,application/json"
                className="hidden"
                onChange={(e) => handleFileUpload(e, 'target')}
            />

            {/* Toast Notification */}
            {toastMessage && (
                <div className="fixed bottom-6 right-6 z-50 bg-emerald-600 text-white text-xs font-semibold px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2 animate-slideUp">
                    <CheckCircle2 size={16} />
                    {toastMessage}
                </div>
            )}

            <PageHeader
                title="JSON Mapper & Studio Pro"
                description="Ferramenta moderna para navegação na árvore JSON, transformação de dados e geração interativa de expressões JMESPath."
                icon={ArrowRightLeft}
                badge="JMESPath v2.2"
            />

            {/* Quick Action Toolbar */}
            <div className="mb-6 p-3 bg-zinc-100/90 dark:bg-[#0d1222]/80 border border-zinc-200 dark:border-zinc-800/80 rounded-2xl backdrop-blur-xl flex flex-wrap items-center justify-between gap-3 shadow-sm dark:shadow-lg">
                {/* Left Action Buttons */}
                <div className="flex flex-wrap items-center gap-2">
                    <button
                        onClick={() => setIsFinderModalOpen(true)}
                        className="px-3.5 py-2 bg-indigo-50 dark:bg-indigo-600/20 hover:bg-indigo-100 dark:hover:bg-indigo-600/30 text-indigo-600 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shadow-sm cursor-pointer"
                    >
                        <Search size={14} className="text-indigo-500 dark:text-indigo-400" />
                        JSON Finder 🔍
                    </button>

                    <button
                        onClick={() => setIsTutorialModalOpen(true)}
                        className="px-3.5 py-2 bg-emerald-50 dark:bg-emerald-600/20 hover:bg-emerald-100 dark:hover:bg-emerald-600/30 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shadow-sm cursor-pointer"
                    >
                        <BookOpen size={14} className="text-emerald-600 dark:text-emerald-400" />
                        Tutorial JMESPath 🎓
                    </button>

                    <button
                        onClick={() => setIsHistoryModalOpen(true)}
                        className="px-3.5 py-2 bg-amber-50 dark:bg-amber-600/20 hover:bg-amber-100 dark:hover:bg-amber-600/30 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shadow-sm cursor-pointer"
                    >
                        <History size={14} className="text-amber-600 dark:text-amber-400" />
                        Histórico 📜
                    </button>
                </div>

                {/* Right Dataset Selector */}
                <div className="flex items-center gap-2">
                    <span className="text-xs text-zinc-500 dark:text-zinc-400 font-semibold hidden sm:inline">Exemplos Práticos:</span>
                    <select
                        value={selectedDatasetId}
                        onChange={(e) => handleSelectDataset(e.target.value)}
                        className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 text-xs font-semibold rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500 transition-all cursor-pointer"
                    >
                        <option value="">-- Carregar Exemplo --</option>
                        {SAMPLE_DATASETS.map((ds) => (
                            <option key={ds.id} value={ds.id}>
                                {ds.name}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* 3 Columns Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1">
                {/* Col 1: Source */}
                <Card variant="glass" padding="none" className="flex flex-col h-[65vh] min-h-[450px]">
                    <div className="p-3.5 border-b border-base/80 bg-base/20 flex justify-between items-center">
                        <h2 className="text-xs font-bold text-primary flex items-center gap-2">
                            <FileJson className="text-emerald-500" size={15} />
                            JSON de Origem (Source)
                        </h2>
                        <div className="flex items-center gap-1.5">
                            <button
                                onClick={() => sourceFileInputRef.current?.click()}
                                className="p-1 text-zinc-400 hover:text-white"
                                title="Carregar Arquivo JSON"
                            >
                                <Upload size={13} />
                            </button>
                            <button
                                onClick={() => formatJson('source')}
                                className="p-1 text-zinc-400 hover:text-white"
                                title="Formatar"
                            >
                                <Wand2 size={13} />
                            </button>
                            <button
                                onClick={() => minifyJson('source')}
                                className="p-1 text-zinc-400 hover:text-white"
                                title="Minificar"
                            >
                                <Minimize2 size={13} />
                            </button>
                            {sourceError ? (
                                <Badge variant="error" size="sm">{sourceError}</Badge>
                            ) : (
                                <Badge variant="success" size="sm">Válido</Badge>
                            )}
                        </div>
                    </div>
                    <div className="flex-1 w-full p-2 relative" onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, 'source')}>
                        <textarea
                            className="w-full h-full p-3 bg-transparent text-xs font-mono text-primary placeholder-muted focus:outline-none resize-none outline-none overflow-auto custom-scrollbar"
                            value={sourceJsonStr}
                            onChange={e => setSourceJsonStr(e.target.value)}
                            spellCheck={false}
                            placeholder="Cole ou arraste um arquivo JSON de origem aqui..."
                        />
                    </div>
                </Card>

                {/* Col 2: Target */}
                <Card variant="glass" padding="none" className="flex flex-col h-[65vh] min-h-[450px]">
                    <div className="p-3.5 border-b border-base/80 bg-base/20 flex justify-between items-center">
                        <h2 className="text-xs font-bold text-primary flex items-center gap-2">
                            <FileJson className="text-indigo-500" size={15} />
                            JSON de Destino (Molde)
                        </h2>
                        <div className="flex items-center gap-1.5">
                            <button
                                onClick={() => targetFileInputRef.current?.click()}
                                className="p-1 text-zinc-400 hover:text-white"
                                title="Carregar Arquivo JSON"
                            >
                                <Upload size={13} />
                            </button>
                            <button
                                onClick={() => formatJson('target')}
                                className="p-1 text-zinc-400 hover:text-white"
                                title="Formatar"
                            >
                                <Wand2 size={13} />
                            </button>
                            <button
                                onClick={() => minifyJson('target')}
                                className="p-1 text-zinc-400 hover:text-white"
                                title="Minificar"
                            >
                                <Minimize2 size={13} />
                            </button>
                            {targetError ? (
                                <Badge variant="error" size="sm">{targetError}</Badge>
                            ) : (
                                <Badge variant="success" size="sm">Estrutura Válida</Badge>
                            )}
                        </div>
                    </div>
                    <div className="flex-1 w-full p-2 relative" onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, 'target')}>
                        <textarea
                            className="w-full h-full p-3 bg-transparent text-xs font-mono text-primary placeholder-muted focus:outline-none resize-none outline-none overflow-auto custom-scrollbar"
                            value={targetJsonStr}
                            onChange={e => setTargetJsonStr(e.target.value)}
                            spellCheck={false}
                            placeholder="Cole ou arraste a estrutura do JSON de saída esperado aqui..."
                        />
                    </div>
                </Card>

                {/* Col 3: Result */}
                <Card variant="glass" padding="none" className="flex flex-col h-[65vh] min-h-[450px]">
                    <div className="p-3.5 border-b border-base/80 bg-indigo-500/10 flex flex-wrap justify-between items-center gap-2">
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setResultTab('transformed')}
                                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                                    resultTab === 'transformed'
                                        ? 'bg-indigo-600 text-white shadow-sm'
                                        : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
                                }`}
                            >
                                JSON Mapeado 📦
                            </button>
                            <button
                                onClick={() => setResultTab('expression')}
                                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                                    resultTab === 'expression'
                                        ? 'bg-indigo-600 text-white shadow-sm'
                                        : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
                                }`}
                            >
                                Expressão JMESPath 📝
                            </button>
                            {validationError ? (
                                <Badge variant="error" size="sm">Erro</Badge>
                            ) : mappedJsonStr ? (
                                <Badge variant="success" size="sm">Ok</Badge>
                            ) : null}
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleDownloadMapped}
                                disabled={resultTab === 'expression' ? !mappedJsonStr : !transformedJsonStr}
                                className="p-1.5 rounded-xl text-muted hover:text-indigo-400 disabled:opacity-40 transition-all cursor-pointer"
                                title={resultTab === 'expression' ? 'Baixar Expressão' : 'Baixar JSON Mapeado'}
                            >
                                <Download size={15} />
                            </button>
                            <button
                                onClick={handleCopyMapped}
                                disabled={resultTab === 'expression' ? !mappedJsonStr : !transformedJsonStr}
                                className="p-1.5 rounded-xl text-muted hover:text-indigo-400 disabled:opacity-40 transition-all cursor-pointer"
                                title={resultTab === 'expression' ? 'Copiar Expressão' : 'Copiar JSON Mapeado'}
                            >
                                {copied ? <Check size={15} className="text-emerald-500" /> : <Copy size={15} />}
                            </button>
                        </div>
                    </div>
                    {validationError && (
                        <div className="bg-red-500/10 border-b border-red-500/20 p-3 text-xs font-semibold text-red-500 break-all flex items-center gap-2">
                            <Info size={14} className="shrink-0" />
                            {validationError}
                        </div>
                    )}
                    <div className="flex-1 w-full p-4 overflow-auto custom-scrollbar bg-base/20">
                        {resultTab === 'transformed' ? (
                            transformedJsonStr ? (
                                <pre className="text-xs font-mono h-full m-0 select-all">
                                    <code
                                        className="language-json h-full block"
                                        dangerouslySetInnerHTML={{
                                            __html: hljs.highlight(transformedJsonStr, { language: 'json' }).value
                                        }}
                                    />
                                </pre>
                            ) : (
                                <div className="text-muted text-xs font-mono p-2 flex flex-col items-center justify-center h-full text-center">
                                    <Sparkles className="opacity-20 mb-3" size={32} />
                                    O resultado do JSON transformado aparecerá aqui após clicar em "Executar Mapeamento".
                                </div>
                            )
                        ) : (
                            mappedJsonStr ? (
                                <pre className="text-xs font-mono h-full m-0 select-all">
                                    <code
                                        className="language-json h-full block"
                                        dangerouslySetInnerHTML={{
                                            __html: hljs.highlight(mappedJsonStr, { language: 'json' }).value
                                        }}
                                    />
                                </pre>
                            ) : (
                                <div className="text-muted text-xs font-mono p-2 flex flex-col items-center justify-center h-full text-center">
                                    <Settings2 className="opacity-20 mb-3" size={32} />
                                    A expressão JMESPath mapeada aparecerá aqui após a execução.
                                </div>
                            )
                        )}
                    </div>
                </Card>
            </div>

            {/* Bottom Action Bar */}
            <div className="mt-6 flex justify-center items-center gap-4 flex-shrink-0">
                <Button
                    onClick={() => setIsConfigModalOpen(true)}
                    disabled={!!sourceError || !!targetError || !sourceJson || !targetJson}
                    variant="secondary"
                    size="lg"
                    icon={Settings2}
                >
                    Configurar Mapeamento
                </Button>
                <Button
                    onClick={() => executeMapping()}
                    disabled={!!sourceError || !!targetError || !sourceJson || !targetJson || Object.keys(mappingConfig).length === 0}
                    variant="primary"
                    size="lg"
                    icon={Play}
                >
                    Executar Mapeamento
                </Button>
            </div>

            {/* Footer with Netlify / GitHub info */}
            <footer className="mt-12 py-4 border-t border-zinc-800/60 flex flex-wrap items-center justify-between text-xs text-zinc-500 gap-4">
                <div className="flex items-center gap-2">
                    <span>Desenvolvido por <strong className="text-zinc-300">ScParis</strong></span>
                    <span>•</span>
                    <span>Nexora Devkit</span>
                </div>
                <div className="flex items-center gap-4">
                    <a
                        href="https://github.com/ScParis/nexora-devkit"
                        target="_blank"
                        rel="noreferrer"
                        className="hover:text-zinc-200 flex items-center gap-1 transition-colors"
                    >
                        <Github size={13} />
                        GitHub Repo
                    </a>
                    <a
                        href="https://json-formater.netlify.app/"
                        target="_blank"
                        rel="noreferrer"
                        className="hover:text-zinc-200 flex items-center gap-1 transition-colors"
                    >
                        <ExternalLink size={13} />
                        Netlify Live App
                    </a>
                </div>
            </footer>

            {/* Modal: Configurar Mapeamento */}
            {isConfigModalOpen && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4">
                    <Card variant="glass" padding="none" className="w-full max-w-4xl flex flex-col max-h-[85vh] shadow-2xl">
                        {/* Modal Header */}
                        <div className="p-5 border-b border-base/80 flex justify-between items-center">
                            <h2 className="text-sm font-bold text-primary flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
                                    <Settings2 size={16} />
                                </div>
                                Formular Regras de Mapeamento
                            </h2>
                            <button
                                onClick={() => setIsConfigModalOpen(false)}
                                className="p-1.5 rounded-xl text-muted hover:text-primary hover:bg-base/60 transition-colors cursor-pointer"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 flex-1 overflow-y-auto custom-scrollbar space-y-4">
                            {targetPaths.length === 0 ? (
                                <div className="text-center py-12 text-muted">
                                    <Info size={40} className="mx-auto mb-3 opacity-30" />
                                    <p className="text-base font-semibold">Preencha um JSON de Destino válido para mapear.</p>
                                </div>
                            ) : (
                                targetPaths.map(targetPath => (
                                    <div key={targetPath} className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 bg-panel border border-base/80 rounded-2xl shadow-sm hover:border-indigo-500/30 transition-all">
                                        <div className="flex-1 overflow-hidden">
                                            <label className="text-[10px] font-extrabold text-muted uppercase tracking-wider mb-1 block">Destino (Target)</label>
                                            <span className="font-mono text-xs text-primary font-bold truncate block">{targetPath}</span>
                                        </div>
                                        <div className="hidden sm:block text-muted">
                                            <ArrowRightLeft size={16} />
                                        </div>
                                        <div className="flex-1">
                                            <Select
                                                label="Origem (Source)"
                                                value={mappingConfig[targetPath] || ''}
                                                onChange={e => handleMappingChange(targetPath, e.target.value)}
                                                options={[
                                                    { label: '-- Não mapear --', value: '' },
                                                    ...sourcePaths.map(sp => ({ label: sp, value: sp }))
                                                ]}
                                            />
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div className="p-4 border-t border-base/80 bg-base/20 rounded-b-3xl flex justify-end">
                            <Button
                                onClick={() => setIsConfigModalOpen(false)}
                                variant="primary"
                                size="md"
                            >
                                Salvar & Fechar
                            </Button>
                        </div>
                    </Card>
                </div>
            )}

            {/* Modals from nexora-devkit */}
            <JsonFinderModal
                isOpen={isFinderModalOpen}
                onClose={() => setIsFinderModalOpen(false)}
                initialJson={sourceJson}
                onSelectPath={(path) => {
                    setIsConfigModalOpen(true);
                    showToast(`Caminho "${path}" pronto para mapear!`);
                }}
            />

            <JmespathTutorialModal
                isOpen={isTutorialModalOpen}
                onClose={() => setIsTutorialModalOpen(false)}
                onLoadExample={handleLoadTutorialExample}
            />

            <JsonHistoryModal
                isOpen={isHistoryModalOpen}
                onClose={() => setIsHistoryModalOpen(false)}
                onRestore={handleRestoreHistory}
                currentSource={sourceJsonStr}
                currentTarget={targetJsonStr}
                currentRules={mappingConfig}
            />
        </div>
    );
}
