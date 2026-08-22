import React, { useState, useMemo } from 'react';
import { Binary, Sparkles, AlertTriangle, Eye, HelpCircle } from 'lucide-react';
import { PageHeader, Card, Button, Input, Badge, Tabs } from '../../components/ui';

export default function RegexApp() {
    const [pattern, setPattern] = useState('(\\w+)\\s(\\w+)');
    const [flags, setFlags] = useState('g');
    const [testText, setTestText] = useState('Olá Mundo\nHello World\nReact Rocks');
    const [aiPrompt, setAiPrompt] = useState('validar formato de e-mail corporativo simples');

    const [aiResponse, setAiResponse] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [aiError, setAiError] = useState('');

    const [activeRightTab, setActiveRightTab] = useState<'matches' | 'explain' | 'generate'>('matches');

    // Analisa a Regex localmente em tempo real
    const regexAnalysis = useMemo(() => {
        if (!pattern) {
            return { matches: [], error: null };
        }
        try {
            const regex = new RegExp(pattern, flags.includes('g') ? flags : flags + 'g');
            const matches: any[] = [];
            let match;
            let iterations = 0;
            const maxIterations = 1000;

            regex.lastIndex = 0;

            while ((match = regex.exec(testText)) !== null) {
                iterations++;
                if (iterations > maxIterations) {
                    break;
                }

                matches.push({
                    text: match[0],
                    index: match.index,
                    length: match[0].length,
                    groups: match.slice(1)
                });

                if (match[0].length === 0) {
                    regex.lastIndex++;
                }
            }

            return { matches, error: null };
        } catch (e: any) {
            return { matches: [], error: e.message };
        }
    }, [pattern, flags, testText]);

    // Renders the highlighted text visualization
    const highlightedHtml = useMemo(() => {
        if (regexAnalysis.error || !pattern || regexAnalysis.matches.length === 0) {
            return testText;
        }

        let result: React.ReactNode[] = [];
        let lastIdx = 0;

        regexAnalysis.matches.forEach((m, i) => {
            if (m.index > lastIdx) {
                result.push(testText.substring(lastIdx, m.index));
            }
            result.push(
                <mark
                    key={`m-${i}`}
                    className="bg-amber-500/20 text-amber-500 border-b-2 border-amber-500 px-0.5 rounded-sm font-bold"
                >
                    {m.text}
                </mark>
            );
            lastIdx = m.index + m.length;
        });

        if (lastIdx < testText.length) {
            result.push(testText.substring(lastIdx));
        }

        return result;
    }, [testText, regexAnalysis]);

    const handleFlagToggle = (f: string) => {
        if (flags.includes(f)) {
            setFlags(flags.replace(f, ''));
        } else {
            setFlags(flags + f);
        }
    };

    const handleExplain = async () => {
        setIsLoading(true);
        setAiError('');
        setAiResponse('');
        try {
            const response = await fetch('http://localhost:3001/api/ai/process', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    text: `/${pattern}/${flags}`,
                    action: 'EXPLAIN_REGEX'
                })
            });
            if (!response.ok) {
                throw new Error('Falha ao obter resposta do servidor.');
            }
            const data = await response.json();
            setAiResponse(data.text);
        } catch (e: any) {
            setAiError(e.message || 'Erro ao conectar ao Gemini.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleGenerate = async () => {
        setIsLoading(true);
        setAiError('');
        setAiResponse('');
        try {
            const response = await fetch('http://localhost:3001/api/ai/process', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    text: aiPrompt,
                    action: 'GENERATE_REGEX'
                })
            });
            if (!response.ok) {
                throw new Error('Falha ao obter resposta do servidor.');
            }
            const data = await response.json();
            
            let cleanedRegex = data.text.trim();
            const codeBlockRegex = /```(?:regex|javascript)?\n([\s\S]*?)\n```/i;
            const match = codeBlockRegex.exec(cleanedRegex);
            if (match && match[1]) {
                cleanedRegex = match[1].trim();
            }
            if (cleanedRegex.startsWith('/') && cleanedRegex.endsWith('/')) {
                cleanedRegex = cleanedRegex.substring(1, cleanedRegex.length - 1);
            } else if (cleanedRegex.startsWith('/') && cleanedRegex.includes('/', 1)) {
                const lastSlashIdx = cleanedRegex.lastIndexOf('/');
                const parsedFlags = cleanedRegex.substring(lastSlashIdx + 1);
                cleanedRegex = cleanedRegex.substring(1, lastSlashIdx);
                if (parsedFlags) setFlags(parsedFlags);
            }

            setPattern(cleanedRegex);
            setAiResponse(`Gerei a expressão regular com sucesso: \n\n\`/${cleanedRegex}/\` \n\nEla já foi aplicada ao seu campo de padrão.`);
        } catch (e: any) {
            setAiError(e.message || 'Erro ao conectar ao Gemini.');
        } finally {
            setIsLoading(false);
        }
    };

    const rightTabs = [
        { id: 'matches', label: `Matches (${regexAnalysis.matches.length})` },
        { id: 'explain', label: 'Explicar (IA)' },
        { id: 'generate', label: 'Gerar (IA)' }
    ];

    return (
        <div className="ds-container flex flex-col h-full overflow-hidden flex-1">
            <PageHeader
                title="Regex Playground"
                description="Escreva e teste expressões regulares em tempo real com realce interativo e IA para explicar ou gerar padrões."
                icon={Binary}
                badge="Ferramentas Dev"
            />

            {/* Layout Grid */}
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-[1.6fr_1.4fr] gap-6 overflow-hidden min-h-0">
                {/* Left Side: Editor & Preview */}
                <div className="flex flex-col gap-6 overflow-y-auto pr-1 custom-scrollbar">
                    {/* Pattern Selector Card */}
                    <Card variant="glass" padding="md" className="flex flex-col gap-4">
                        <span className="text-xs font-black uppercase text-primary tracking-wider">Expressão Regular (Pattern)</span>
                        <div className="flex items-center bg-base/40 border border-base/80 rounded-2xl p-2.5">
                            <span className="text-lg font-black text-muted px-2 select-none">/</span>
                            <input
                                type="text"
                                value={pattern}
                                onChange={(e) => setPattern(e.target.value)}
                                placeholder="Insira sua regex aqui (ex: [a-z]+)"
                                className="flex-1 bg-transparent text-sm font-mono text-primary outline-none py-1"
                            />
                            <span className="text-lg font-black text-muted px-2 select-none">/</span>
                            <input
                                type="text"
                                value={flags}
                                onChange={(e) => setFlags(e.target.value)}
                                placeholder="flags"
                                className="w-16 bg-transparent text-sm font-mono text-indigo-500 font-bold outline-none text-center"
                            />
                        </div>

                        {/* Flags Toggles */}
                        <div className="flex items-center gap-2 flex-wrap text-xs border-t border-base/80 pt-3">
                            <span className="text-muted font-bold text-xs mr-2">Flags Rápidas:</span>
                            {[
                                { key: 'g', label: 'g (Global)' },
                                { key: 'i', label: 'i (Case insensitive)' },
                                { key: 'm', label: 'm (Multiline)' },
                                { key: 's', label: 's (DotAll)' }
                            ].map((f) => (
                                <button
                                    key={f.key}
                                    onClick={() => handleFlagToggle(f.key)}
                                    className={`px-2.5 py-1 rounded-lg border text-[10px] font-black transition-all cursor-pointer ${flags.includes(f.key) ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-500' : 'bg-transparent border-base/80 text-muted hover:text-primary'}`}
                                >
                                    {f.label}
                                </button>
                            ))}
                        </div>

                        {/* Regex compile error indicator */}
                        {regexAnalysis.error && (
                            <div className="flex items-start gap-2.5 p-3.5 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500">
                                <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
                                <div className="text-[11px] font-mono leading-relaxed">{regexAnalysis.error}</div>
                            </div>
                        )}
                    </Card>

                    {/* Test Area Card */}
                    <Card variant="glass" padding="md" className="flex flex-col gap-4 flex-1 min-h-[300px]">
                        <span className="text-xs font-black uppercase text-primary tracking-wider">Texto de Teste</span>
                        <textarea
                            value={testText}
                            onChange={(e) => setTestText(e.target.value)}
                            placeholder="Insira o texto que deseja testar contra a regex..."
                            className="w-full flex-1 bg-base/40 border border-base/80 rounded-2xl p-4 text-xs font-mono text-primary outline-none focus:ring-2 focus:ring-indigo-500/30 resize-none leading-relaxed custom-scrollbar"
                        />

                        {/* Highlight Preview */}
                        <span className="text-xs font-black uppercase text-primary tracking-wider mt-2 flex items-center gap-1.5">
                            <Eye size={14} className="text-indigo-500" /> Visualização de Correspondências
                        </span>
                        <div className="w-full h-32 bg-base/20 border border-base/80 rounded-2xl p-4 text-xs font-mono text-primary overflow-auto whitespace-pre-wrap leading-relaxed custom-scrollbar">
                            {highlightedHtml}
                        </div>
                    </Card>
                </div>

                {/* Right Side: Matches & AI Tools */}
                <Card variant="glass" padding="none" className="flex flex-col overflow-hidden shadow-sm h-full">
                    {/* Tabs Header */}
                    <div className="p-3 border-b border-base/80 bg-base/20">
                        <Tabs
                            tabs={rightTabs}
                            activeTab={activeRightTab}
                            onChange={(id) => { setActiveRightTab(id as any); setAiResponse(''); }}
                        />
                    </div>

                    {/* Tab Body */}
                    <div className="flex-1 p-5 overflow-y-auto custom-scrollbar">
                        {isLoading && (
                            <div className="flex flex-col items-center justify-center h-full gap-3 py-10">
                                <div className="flex gap-1.5 items-center">
                                    <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                    <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                    <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                </div>
                                <span className="text-[10px] font-bold text-muted uppercase tracking-widest">Processando com IA...</span>
                            </div>
                        )}

                        {!isLoading && activeRightTab === 'matches' && (
                            <div className="flex flex-col gap-3">
                                {regexAnalysis.matches.length === 0 ? (
                                    <div className="text-center py-10 text-muted font-medium text-xs">
                                        Nenhuma correspondência encontrada com as configurações atuais.
                                    </div>
                                ) : (
                                    regexAnalysis.matches.map((m, idx) => (
                                        <div key={idx} className="bg-base/30 border border-base/80 rounded-2xl p-4 flex flex-col gap-2">
                                            <div className="flex justify-between items-center text-[10px] font-bold text-muted">
                                                <span className="text-indigo-500">MATCH #{idx + 1}</span>
                                                <span>Index: {m.index} - {m.index + m.length}</span>
                                            </div>
                                            <div className="text-xs font-mono text-primary bg-base/60 border border-base/80 p-2.5 rounded-xl font-bold break-all">
                                                {m.text}
                                            </div>
                                            {m.groups.length > 0 && (
                                                <div className="flex flex-col gap-1.5 mt-1 pl-2 border-l-2 border-indigo-500/30">
                                                    <span className="text-[9px] font-black uppercase text-muted tracking-wider">Grupos de Captura:</span>
                                                    {m.groups.map((group: string, gIdx: number) => (
                                                        <div key={gIdx} className="text-[10px] font-mono text-muted leading-relaxed">
                                                            <strong className="text-primary font-bold">Grupo {gIdx + 1}:</strong> {group === undefined ? <span className="italic text-red-400">null</span> : `"${group}"`}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        )}

                        {!isLoading && activeRightTab === 'explain' && (
                            <div className="flex flex-col gap-4 h-full">
                                {aiResponse ? (
                                    <div className="prose prose-slate dark:prose-invert prose-sm max-w-none text-xs leading-relaxed text-primary whitespace-pre-wrap font-medium">
                                        {aiResponse}
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-full text-center p-6 text-muted font-medium gap-3">
                                        <HelpCircle className="opacity-20" size={28} />
                                        <p className="text-xs">Quer entender o que a expressão regular `/{pattern}/` faz passo a passo?</p>
                                        <Button
                                            onClick={handleExplain}
                                            disabled={!pattern || !!regexAnalysis.error}
                                            variant="primary"
                                            size="md"
                                            icon={Sparkles}
                                        >
                                            Explicar Regex com IA
                                        </Button>
                                    </div>
                                )}
                            </div>
                        )}

                        {!isLoading && activeRightTab === 'generate' && (
                            <div className="flex flex-col gap-4 h-full">
                                {aiResponse ? (
                                    <div className="flex flex-col gap-4">
                                        <div className="prose prose-slate dark:prose-invert prose-sm max-w-none text-xs leading-relaxed text-primary whitespace-pre-wrap font-medium">
                                            {aiResponse}
                                        </div>
                                        <Button
                                            onClick={() => setAiResponse('')}
                                            variant="secondary"
                                            size="md"
                                        >
                                            Gerar Outra Expressão
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="flex flex-col gap-4 justify-center h-full">
                                        <Input
                                            label="Descreva o que deseja capturar:"
                                            value={aiPrompt}
                                            onChange={(e) => setAiPrompt(e.target.value)}
                                            placeholder="ex: validar telefone brasileiro com DDD"
                                        />
                                        <Button
                                            onClick={handleGenerate}
                                            disabled={!aiPrompt}
                                            variant="primary"
                                            size="md"
                                            icon={Sparkles}
                                            className="w-full"
                                        >
                                            Gerar Regex com IA
                                        </Button>
                                    </div>
                                )}
                            </div>
                        )}

                        {aiError && (
                            <div className="mt-4 flex items-start gap-2.5 p-3.5 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500">
                                <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
                                <div className="text-[11px] font-mono leading-relaxed">{aiError}</div>
                            </div>
                        )}
                    </div>
                </Card>
            </div>
        </div>
    );
}
