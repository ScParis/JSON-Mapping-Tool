import React, { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { Database, Sparkles, AlertCircle, Copy, Check, Wand2, Settings } from 'lucide-react';
import { PageHeader, Card, Button, Tabs, AiSettingsModal } from '../../components/ui';
import { runAiRequest, getAiConfig } from '../../services/aiConfig';

// Formata SQL Offline
const formatSqlOffline = (query: string): string => {
    if (!query) return '';
    const keywords = [
        'SELECT', 'FROM', 'WHERE', 'INNER JOIN', 'LEFT JOIN', 'RIGHT JOIN', 'CROSS JOIN',
        'JOIN', 'ON', 'GROUP BY', 'ORDER BY', 'HAVING', 'LIMIT', 'OFFSET',
        'INSERT INTO', 'VALUES', 'UPDATE', 'SET', 'DELETE FROM', 'DELETE',
        'CREATE TABLE', 'ALTER TABLE', 'DROP TABLE', 'PRIMARY KEY', 'FOREIGN KEY',
        'UNION ALL', 'UNION', 'AND', 'OR', 'ASC', 'DESC', 'AS', 'IN', 'IS NULL', 'IS NOT NULL'
    ];

    let formatted = query;
    keywords.forEach(kw => {
        const regex = new RegExp(`\\b${kw}\\b`, 'gi');
        formatted = formatted.replace(regex, kw);
    });

    const majorClauses = ['FROM', 'WHERE', 'INNER JOIN', 'LEFT JOIN', 'RIGHT JOIN', 'JOIN', 'GROUP BY', 'ORDER BY', 'HAVING', 'LIMIT', 'SET', 'VALUES'];
    majorClauses.forEach(clause => {
        const regex = new RegExp(`\\s+(${clause})\\b`, 'g');
        formatted = formatted.replace(regex, `\n$1`);
    });

    return formatted.trim();
};

// Diagnóstico Estático DBA Offline
const explainSqlOffline = (query: string): string => {
    let report = "### 📊 Relatório de Análise DBA (Modo Offline Estático)\n\n";
    const qUpper = query.toUpperCase();
    let issues = 0;

    if (qUpper.includes("SELECT *")) {
        report += "⚠️ **Atenção (SELECT *):** Evite selecionar todas as colunas. Especifique os campos necessários para otimizar o consumo de memória e I/O de rede.\n\n";
        issues++;
    }
    if ((qUpper.includes("UPDATE") || qUpper.includes("DELETE")) && !qUpper.includes("WHERE")) {
        report += "🚨 **Risco Crítico:** Execução de UPDATE ou DELETE sem cláusula WHERE altera/apaga todos os registros da tabela!\n\n";
        issues++;
    }
    if (qUpper.includes("LIKE '%")) {
        report += "⚠️ **Alerta de Performance:** Utilizar wildcards no início (`LIKE '%termo'`) impede a utilização de índices B-Tree, forçando um *Full Table Scan*.\n\n";
        issues++;
    }
    if (qUpper.includes("JOIN") && !qUpper.includes("ON")) {
        report += "⚠️ **Produto Cartesiano:** JOIN sem cláusula ON resulta em combinação cartesiana entre tabelas.\n\n";
        issues++;
    }

    if (issues === 0) {
        report += "✅ **Sintaxe e Estrutura Ok:** Nenhuma inconsistência crítica detectada nas regras estáticas de DBA.\n\n";
    }

    report += "💡 *Para análises avançadas com Inteligência Artificial, insira sua chave no botão 'Configurar IA'.*";
    return report;
};

// Gerador de Dados Fictícios Offline
const generateMockDataOffline = (prompt: string): string => {
    const colMatches = Array.from(prompt.matchAll(/([a-zA-Z0-9_]+)\s+(?:VARCHAR|INT|BIGINT|DATE|DATETIME|DECIMAL|BOOLEAN|TEXT)/gi));
    let columns = colMatches.map(m => m[1]);

    if (columns.length === 0) {
        columns = ['id', 'nome', 'email', 'status', 'data_registro'];
    }

    const mockRows = Array.from({ length: 5 }).map((_, idx) => {
        const row: Record<string, any> = {};
        columns.forEach(col => {
            const lower = col.toLowerCase();
            if (lower.includes('id')) row[col] = idx + 1;
            else if (lower.includes('nome')) row[col] = `Usuário ${idx + 1}`;
            else if (lower.includes('email')) row[col] = `user${idx + 1}@exemplo.com`;
            else if (lower.includes('data')) row[col] = new Date(Date.now() - idx * 86400000).toISOString().split('T')[0];
            else if (lower.includes('valor') || lower.includes('preco')) row[col] = Number((Math.random() * 100 + 10).toFixed(2));
            else if (lower.includes('status')) row[col] = idx % 2 === 0 ? 'ativo' : 'pendente';
            else row[col] = `Valor ${idx + 1}`;
        });
        return row;
    });

    return JSON.stringify(mockRows, null, 2);
};

export default function SqlApp() {
    const [theme, setTheme] = useState<'light' | 'dark' | 'midnight'>(() => {
        return (localStorage.getItem('portal-theme') as 'light' | 'dark' | 'midnight') || 'midnight';
    });
    const [sqlQuery, setSqlQuery] = useState(`-- Exemplo de query SQL\nSELECT u.id, u.nome, p.valor, p.data_criacao\nFROM usuarios u\nINNER JOIN pedidos p ON u.id = p.usuario_id\nWHERE p.status = 'pago'\nORDER BY p.valor DESC;`);
    const [mockPrompt, setMockPrompt] = useState('CREATE TABLE clientes (\n  id INT PRIMARY KEY,\n  nome VARCHAR(100),\n  email VARCHAR(100),\n  data_registro DATE\n);');

    const [activeTab, setActiveTab] = useState<'explain' | 'mock'>('explain');
    const [aiResponse, setAiResponse] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    
    // Feedback de cópia e Modal de IA
    const [copiedRaw, setCopiedRaw] = useState(false);
    const [isAiModalOpen, setIsAiModalOpen] = useState(false);

    useEffect(() => {
        const handleThemeChange = () => {
            const currentTheme = (localStorage.getItem('portal-theme') as 'light' | 'dark' | 'midnight') || 'midnight';
            setTheme(currentTheme);
        };
        window.addEventListener('theme-changed', handleThemeChange);
        return () => window.removeEventListener('theme-changed', handleThemeChange);
    }, []);

    // Formatar SQL (100% Offline e Instantâneo)
    const formatSql = () => {
        if (!sqlQuery.trim()) return;
        const formatted = formatSqlOffline(sqlQuery);
        setSqlQuery(formatted);
    };

    // Explicar Query (IA com Fallback Offline Estático)
    const explainQuery = async () => {
        if (!sqlQuery.trim()) return;
        setIsLoading(true);
        setError('');
        setAiResponse('');

        try {
            const prompt = `Atue como um DBA Sênior especialista em SQL e bancos de dados relacionais. Analise e explique a seguinte consulta SQL, pontuando melhorias de performance, índices e sintaxe:\n\n\`\`\`sql\n${sqlQuery}\n\`\`\``;
            const reply = await runAiRequest(prompt);
            setAiResponse(reply);
        } catch (e: any) {
            // Fallback offline estático se não houver chave
            setAiResponse(explainSqlOffline(sqlQuery));
        } finally {
            setIsLoading(false);
        }
    };

    // Gerar Dados Fictícios (IA com Fallback Offline Estático)
    const generateMockData = async () => {
        if (!mockPrompt.trim()) return;
        setIsLoading(true);
        setError('');
        setAiResponse('');

        try {
            const prompt = `Gere uma lista JSON contendo exatamente 5 registros fictícios realistas baseados na seguinte tabela SQL DDL/descrição. Retorne APENAS um array JSON válido sem marcações extras de markdown se possível:\n\n${mockPrompt}`;
            const reply = await runAiRequest(prompt);
            setAiResponse(reply);
        } catch (e: any) {
            // Fallback offline estático se não houver chave
            setAiResponse(generateMockDataOffline(mockPrompt));
        } finally {
            setIsLoading(false);
        }
    };

    // Interpreta resposta para exibição em tabela
    const parsedMockTable = React.useMemo(() => {
        if (activeTab !== 'mock' || !aiResponse) return null;
        try {
            let cleaned = aiResponse.trim();
            if (cleaned.startsWith('```json')) {
                cleaned = cleaned.substring(7, cleaned.length - 3).trim();
            } else if (cleaned.startsWith('```')) {
                cleaned = cleaned.substring(3, cleaned.length - 3).trim();
            }
            const parsed = JSON.parse(cleaned);
            if (Array.isArray(parsed) && parsed.length > 0) {
                const headers = Object.keys(parsed[0]);
                return { headers, rows: parsed, rawJson: cleaned };
            }
        } catch (e) {
            // Não é JSON válido em array
        }
        return null;
    }, [aiResponse, activeTab]);

    const copyToClipboard = (text: string, setCopied: (v: boolean) => void) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const tabs = [
        { id: 'explain', label: 'SQL Editor & Análise DBA' },
        { id: 'mock', label: 'Gerador de Mock Data' }
    ];

    return (
        <div className="ds-container flex flex-col h-full overflow-hidden flex-1">
            <PageHeader
                title="SQL Toolset & DBA Assistant"
                description="Escreva queries SQL, aplique formatação instantânea, realize análise DBA de performance e gere dados fictícios com ou sem IA."
                icon={Database}
                badge="Ferramentas Dev"
                actions={
                    <div className="flex items-center gap-3">
                        <Button
                            onClick={() => setIsAiModalOpen(true)}
                            variant="secondary"
                            size="sm"
                            icon={Sparkles}
                            className="text-indigo-400 border-indigo-500/30"
                        >
                            Configurar IA
                        </Button>
                        <Tabs
                            tabs={tabs}
                            activeTab={activeTab}
                            onChange={(id) => { setActiveTab(id as any); setAiResponse(''); setError(''); }}
                        />
                    </div>
                }
            />

            {/* Layout Grid */}
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-[1.5fr_1.5fr] gap-6 overflow-hidden min-h-0">
                {/* Left Side: Editor */}
                <div className="flex flex-col gap-6 overflow-hidden h-full">
                    {activeTab === 'explain' ? (
                        <Card variant="glass" padding="none" className="overflow-hidden flex flex-col shadow-sm flex-1 min-h-[300px]">
                            <div className="h-10 border-b border-base/80 px-6 flex items-center justify-between bg-base/20 select-none">
                                <span className="text-[10px] font-black uppercase text-muted tracking-widest">Query SQL</span>
                                <Button
                                    onClick={formatSql}
                                    variant="ghost"
                                    size="sm"
                                    icon={Wand2}
                                    className="text-indigo-400 font-bold"
                                >
                                    Formatar
                                </Button>
                            </div>
                            <div className="flex-1 relative">
                                <Editor
                                    height="100%"
                                    language="sql"
                                    value={sqlQuery}
                                    onChange={(val) => setSqlQuery(val || '')}
                                    theme={theme === 'light' ? 'vs' : 'vs-dark'}
                                    options={{
                                        minimap: { enabled: false },
                                        fontSize: 12,
                                        automaticLayout: true,
                                        fontFamily: 'JetBrains Mono, Fira Code, monospace',
                                        padding: { top: 12, bottom: 12 }
                                    }}
                                />
                            </div>
                        </Card>
                    ) : (
                        <Card variant="glass" padding="md" className="flex flex-col gap-4 shadow-sm flex-1 min-h-[300px]">
                            <span className="text-xs font-black uppercase text-primary tracking-wider">Descreva a Tabela ou Cole o DDL</span>
                            <textarea
                                value={mockPrompt}
                                onChange={(e) => setMockPrompt(e.target.value)}
                                placeholder="ex: CREATE TABLE clientes (id int, nome varchar, email varchar); ou descreva 'Tabela de pedidos com colunas valor, cupom, e data'"
                                className="w-full flex-1 bg-base/40 border border-base/80 rounded-2xl p-4 text-xs font-mono text-primary outline-none focus:ring-2 focus:ring-indigo-500/30 resize-none leading-relaxed custom-scrollbar"
                            />
                        </Card>
                    )}

                    {/* Action buttons under input */}
                    <div className="flex justify-end gap-3">
                        {activeTab === 'explain' ? (
                            <Button
                                onClick={explainQuery}
                                disabled={isLoading || !sqlQuery.trim()}
                                isLoading={isLoading}
                                variant="primary"
                                size="md"
                                icon={Sparkles}
                            >
                                Análise DBA (IA / Offline)
                            </Button>
                        ) : (
                            <Button
                                onClick={generateMockData}
                                disabled={isLoading || !mockPrompt.trim()}
                                isLoading={isLoading}
                                variant="primary"
                                size="md"
                                icon={Sparkles}
                            >
                                Gerar Mock Data (IA / Offline)
                            </Button>
                        )}
                    </div>
                </div>

                {/* Right Side: AI Console & Preview */}
                <Card variant="glass" padding="none" className="flex flex-col overflow-hidden shadow-sm h-full">
                    {/* Header Console */}
                    <div className="p-4 border-b border-base/80 bg-base/20 flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-indigo-500" />
                            <span className="text-xs font-black uppercase text-primary tracking-wider">
                                {activeTab === 'explain' ? 'Feedback do DBA Sênior' : 'Visualização de Dados'}
                            </span>
                        </div>

                        {parsedMockTable && (
                            <Button
                                onClick={() => copyToClipboard(parsedMockTable.rawJson, setCopiedRaw)}
                                variant="ghost"
                                size="sm"
                                icon={copiedRaw ? Check : Copy}
                                title="Copiar JSON Raw"
                            />
                        )}
                    </div>

                    {/* Console Body */}
                    <div className="flex-1 p-5 overflow-y-auto custom-scrollbar">
                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center h-full gap-3 py-10">
                                <div className="flex gap-1.5 items-center">
                                    <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                    <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                    <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                </div>
                                <span className="text-[10px] font-bold text-muted uppercase tracking-widest">Processando dados...</span>
                            </div>
                        ) : error ? (
                            <div className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500">
                                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                <div className="text-xs font-medium leading-relaxed">{error}</div>
                            </div>
                        ) : parsedMockTable ? (
                            <div className="flex flex-col gap-4">
                                <div className="overflow-x-auto border border-base/80 rounded-2xl">
                                    <table className="w-full text-[11px] text-left text-primary border-collapse">
                                        <thead>
                                            <tr className="bg-base/30 border-b border-base/80">
                                                {parsedMockTable.headers.map((h, i) => (
                                                    <th key={i} className="px-4 py-3 font-black text-muted uppercase tracking-wider">{h}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {parsedMockTable.rows.map((row: any, rIdx) => (
                                                <tr key={rIdx} className="border-b border-base/80 hover:bg-base/10 transition-all">
                                                    {parsedMockTable.headers.map((h, cIdx) => (
                                                        <td key={cIdx} className="px-4 py-3 font-mono font-medium">{String(row[h])}</td>
                                                    ))}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                <div className="border-t border-base/80 pt-4 flex flex-col gap-2">
                                    <span className="text-[10px] font-black uppercase text-muted tracking-wider">Raw JSON Output</span>
                                    <pre className="p-4 bg-base/30 border border-base/80 rounded-2xl text-[10px] font-mono text-primary overflow-x-auto max-h-40 leading-relaxed custom-scrollbar">
                                        {parsedMockTable.rawJson}
                                    </pre>
                                </div>
                            </div>
                        ) : aiResponse ? (
                            <div className="prose prose-slate dark:prose-invert prose-sm max-w-none text-xs leading-relaxed text-primary whitespace-pre-wrap font-medium">
                                {aiResponse}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-center p-6 text-muted font-medium gap-2">
                                <Database className="opacity-20" size={28} />
                                {activeTab === 'explain' ? (
                                    <p className="text-xs">Clique no botão <strong className="text-primary font-bold">Análise DBA</strong> para obter diagnósticos completos e dicas de otimização de performance para a query editada.</p>
                                ) : (
                                    <p className="text-xs">Insira a descrição da sua estrutura no editor e clique no botão <strong className="text-primary font-bold">Gerar Mock Data</strong> para receber registros fictícios formatados.</p>
                                )}
                            </div>
                        )}
                    </div>
                </Card>
            </div>

            <AiSettingsModal isOpen={isAiModalOpen} onClose={() => setIsAiModalOpen(false)} />
        </div>
    );
}
