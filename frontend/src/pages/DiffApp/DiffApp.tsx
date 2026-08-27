import React, { useState, useEffect } from 'react';
import { DiffEditor } from '@monaco-editor/react';
import { Trash2, Sparkles, AlertCircle, GitCompare } from 'lucide-react';
import { PageHeader, Card, Button, Select } from '../../components/ui';
import { BACKEND_URL } from '../../config';

const LANGUAGES = [
    { value: 'plaintext', label: 'Texto Simples' },
    { value: 'javascript', label: 'JavaScript' },
    { value: 'typescript', label: 'TypeScript' },
    { value: 'json', label: 'JSON' },
    { value: 'html', label: 'HTML' },
    { value: 'css', label: 'CSS' },
    { value: 'sql', label: 'SQL' },
    { value: 'markdown', label: 'Markdown' }
];

export default function DiffApp() {
    const [theme, setTheme] = useState<'light' | 'dark' | 'midnight'>(() => {
        return (localStorage.getItem('portal-theme') as 'light' | 'dark' | 'midnight') || 'midnight';
    });
    const [language, setLanguage] = useState('javascript');
    const [original, setOriginal] = useState('// Insira o código original aqui\nfunction somar(a, b) {\n    return a + b;\n}');
    const [modified, setModified] = useState('// Insira o código modificado aqui\nfunction somar(a, b) {\n    if (typeof a !== "number" || typeof b !== "number") {\n        throw new Error("Parâmetros devem ser números");\n    }\n    return a + b;\n}');
    const [aiAnalysis, setAiAnalysis] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const handleThemeChange = () => {
            const currentTheme = (localStorage.getItem('portal-theme') as 'light' | 'dark' | 'midnight') || 'midnight';
            setTheme(currentTheme);
        };
        window.addEventListener('theme-changed', handleThemeChange);
        return () => window.removeEventListener('theme-changed', handleThemeChange);
    }, []);

    const handleEditorMount = (editor: any) => {
        const originalEditor = editor.getOriginalEditor();
        const modifiedEditor = editor.getModifiedEditor();

        originalEditor.onDidChangeModelContent(() => {
            setOriginal(originalEditor.getValue());
        });
        modifiedEditor.onDidChangeModelContent(() => {
            setModified(modifiedEditor.getValue());
        });
    };

    const handleClear = () => {
        setOriginal('');
        setModified('');
        setAiAnalysis('');
    };

    const runAiAnalysis = async () => {
        setIsLoading(true);
        setError('');
        setAiAnalysis('');

        try {
            const promptText = `Por favor, realize uma análise de Diff/Diferenças técnicas entre as duas versões abaixo:\n\n=== ORIGINAL ===\n${original}\n\n=== MODIFICADO ===\n${modified}\n\nCompare o que mudou, explique as melhorias aplicadas (como segurança, legibilidade, etc) e se há algum risco potencial. Mantenha em português e responda de forma estruturada.`;
            const response = await fetch(`${BACKEND_URL}/api/ai/process`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    text: promptText,
                    action: 'EXPLAIN'
                })
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || 'Erro na chamada de IA.');
            }

            const data = await response.json();
            setAiAnalysis(data.text);
        } catch (e: any) {
            console.error(e);
            setError(e.message || 'Falha ao analisar com IA.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="ds-container flex flex-col h-full overflow-hidden flex-1">
            <PageHeader
                title="Diff Viewer"
                description="Compare códigos ou textos lado a lado e peça análises de impacto com inteligência artificial."
                icon={GitCompare}
                badge="Ferramentas Dev"
                actions={
                    <div className="flex items-center gap-3">
                        <div className="w-48">
                            <Select
                                value={language}
                                onChange={(e) => setLanguage(e.target.value)}
                                options={LANGUAGES}
                            />
                        </div>
                        <Button
                            onClick={handleClear}
                            variant="secondary"
                            size="md"
                            icon={Trash2}
                            title="Limpar Editores"
                        />
                        <Button
                            onClick={runAiAnalysis}
                            isLoading={isLoading}
                            disabled={!original || !modified}
                            variant="primary"
                            size="md"
                            icon={Sparkles}
                        >
                            Análise IA
                        </Button>
                    </div>
                }
            />

            {/* Main Area */}
            <div className="flex-1 grid grid-rows-[3fr_2fr] lg:grid-rows-1 lg:grid-cols-[3fr_1.2fr] gap-6 min-h-[450px] overflow-hidden">
                {/* Editor Container */}
                <Card variant="glass" padding="none" className="flex flex-col overflow-hidden">
                    <div className="h-10 border-b border-base/80 px-6 flex items-center justify-between bg-base/20 select-none">
                        <span className="text-[10px] font-extrabold uppercase text-muted tracking-widest">Original (Esquerda) vs Modificado (Direita)</span>
                        <div className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-red-500/40"></span>
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/40"></span>
                        </div>
                    </div>
                    <div className="flex-1 relative">
                        <DiffEditor
                            original={original}
                            modified={modified}
                            language={language}
                            theme={theme === 'light' ? 'vs' : 'vs-dark'}
                            onMount={handleEditorMount}
                            options={{
                                renderSideBySide: true,
                                minimap: { enabled: false },
                                fontSize: 12,
                                automaticLayout: true,
                                scrollBeyondLastLine: false,
                                originalEditable: true,
                                fontFamily: 'JetBrains Mono, Fira Code, monospace',
                                padding: { top: 12, bottom: 12 }
                            }}
                        />
                    </div>
                </Card>

                {/* AI Review Panel */}
                <Card variant="glass" padding="none" className="flex flex-col overflow-hidden">
                    <div className="p-4 border-b border-base/80 flex items-center justify-between bg-base/20">
                        <div className="flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-indigo-500" />
                            <span className="text-xs font-black uppercase text-primary tracking-wider">Revisão por IA</span>
                        </div>
                    </div>

                    <div className="flex-1 p-5 overflow-auto custom-scrollbar">
                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center h-full gap-3 py-10">
                                <div className="flex gap-1.5 items-center">
                                    <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                    <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                    <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                </div>
                                <span className="text-[10px] font-bold text-muted uppercase tracking-widest">Analisando alterações...</span>
                            </div>
                        ) : error ? (
                            <div className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500">
                                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                <div className="text-xs font-medium leading-relaxed">{error}</div>
                            </div>
                        ) : aiAnalysis ? (
                            <div className="prose prose-slate dark:prose-invert prose-sm max-w-none text-xs leading-relaxed text-primary">
                                <div className="whitespace-pre-line font-medium">{aiAnalysis}</div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-center p-6 text-muted font-medium">
                                <Sparkles className="opacity-20 mb-3" size={28} />
                                <p className="text-xs">Cole as duas versões do código e clique em <strong className="text-primary font-bold">Análise IA</strong> para gerar uma revisão técnica de performance e segurança.</p>
                            </div>
                        )}
                    </div>
                </Card>
            </div>
        </div>
    );
}
