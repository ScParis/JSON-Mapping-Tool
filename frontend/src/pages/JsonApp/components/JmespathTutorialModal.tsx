import React, { useState, useMemo } from 'react';
import { BookOpen, Play, CheckCircle2, ChevronRight, Copy, Check, X, Sparkles, Code2, ArrowRight } from 'lucide-react';
import jmespath from 'jmespath';

interface JmespathTutorialModalProps {
    isOpen: boolean;
    onClose: () => void;
    onLoadExample?: (sourceJson: any, targetJson: any, mappings: Record<string, string>) => void;
}

interface TutorialModule {
    id: string;
    title: string;
    description: string;
    examples: {
        title: string;
        description: string;
        input: any;
        expression: string;
        explanation: string;
    }[];
}

const TUTORIAL_MODULES: TutorialModule[] = [
    {
        id: 'basics',
        title: '1. Propriedades e Índices',
        description: 'Aprenda a acessar campos aninhados e elementos de arrays',
        examples: [
            {
                title: 'Navegação por Ponto (.)',
                description: 'Acessar propriedades em objetos aninhados',
                input: {
                    user: {
                        name: "João Silva",
                        email: "joao@example.com",
                        address: { city: "São Paulo", state: "SP" }
                    }
                },
                expression: 'user.address.city',
                explanation: 'Use o operador ponto (.) para acessar níveis internos do objeto.'
            },
            {
                title: 'Índice de Array ([n])',
                description: 'Acessar elementos específicos em uma lista pelo índice',
                input: {
                    products: [
                        { name: "Laptop", price: 3500 },
                        { name: "Mouse", price: 150 },
                        { name: "Teclado", price: 300 }
                    ]
                },
                expression: 'products[0].name',
                explanation: 'Os índices começam em 0. Use [-1] para pegar o último elemento.'
            }
        ]
    },
    {
        id: 'filters',
        title: '2. Filtros e Condições',
        description: 'Filtre elementos de arrays usando expressões de comparação',
        examples: [
            {
                title: 'Filtro Booleano ([?condicao])',
                description: 'Filtrar itens que possuem um atributo verdadeiro',
                input: {
                    users: [
                        { name: "Ana", active: true, age: 25 },
                        { name: "Bruno", active: false, age: 32 },
                        { name: "Carla", active: true, age: 28 }
                    ]
                },
                expression: 'users[?active==`true`]',
                explanation: 'Use [?expressao] para filtrar elementos. Repare nas crases para literais booleanos.'
            },
            {
                title: 'Comparação Numérica',
                description: 'Filtrar usando operadores (>, <, >=, <=, ==, !=)',
                input: {
                    orders: [
                        { id: 101, total: 1200 },
                        { id: 102, total: 80 },
                        { id: 103, total: 450 }
                    ]
                },
                expression: 'orders[?total > `100`]',
                explanation: 'Filtra pedidos com valor estritamente maior que 100.'
            }
        ]
    },
    {
        id: 'projections',
        title: '3. Projeções e Mapeamento',
        description: 'Extraia e remapeie coleções com nova estrutura',
        examples: [
            {
                title: 'Projeção de Lista (*)',
                description: 'Extrair apenas um campo de todos os itens de uma lista',
                input: {
                    items: [
                        { sku: "A1", price: 10 },
                        { sku: "B2", price: 20 },
                        { sku: "C3", price: 30 }
                    ]
                },
                expression: 'items[*].sku',
                explanation: 'O wildcard * itera sobre todos os elementos e extrai a propriedade sku.'
            },
            {
                title: 'Criação de Novos Objetos ({})',
                description: 'Renomear campos e construir novo formato JSON',
                input: {
                    customers: [
                        { first_name: "Mariana", last_name: "Lima", score: 95 },
                        { first_name: "Pedro", last_name: "Souza", score: 88 }
                    ]
                },
                expression: "customers[*].{nome: first_name, pontos: score}",
                explanation: 'Cria um novo objeto com os atributos "nome" e "pontos" para cada cliente.'
            }
        ]
    },
    {
        id: 'functions',
        title: '4. Funções Integradas',
        description: 'Utilize funções de agregação, strings e ordenação',
        examples: [
            {
                title: 'Soma e Agregação (sum)',
                description: 'Calcular a soma dos valores de um array',
                input: {
                    payments: [
                        { amount: 150.50 },
                        { amount: 200.00 },
                        { amount: 49.90 }
                    ]
                },
                expression: 'sum(payments[*].amount)',
                explanation: 'A função sum() calcula a soma total dos números fornecidos.'
            },
            {
                title: 'Concatenação de Strings (join)',
                description: 'Juntar elementos em uma única string',
                input: {
                    person: { first_name: "Carlos", last_name: "Eduardo" }
                },
                expression: "join(' ', [person.first_name, person.last_name])",
                explanation: "Unifica o primeiro e segundo nome com um espaço ' ' como separador."
            }
        ]
    },
    {
        id: 'advanced',
        title: '5. Operadores Avançados e Pipes',
        description: 'Combine filtros, projeções e funções encadeadas com o pipe (|)',
        examples: [
            {
                title: 'Pipe Encadeado (|)',
                description: 'Passar o resultado de uma expressão como entrada da próxima',
                input: {
                    inventory: [
                        { name: "Monitor", qty: 5 },
                        { name: "Teclado", qty: 0 },
                        { name: "Cabo HDMI", qty: 12 }
                    ]
                },
                expression: 'inventory[?qty > `0`].name | sort(@)',
                explanation: 'Filtra itens em estoque, extrai seus nomes e ordena alfabeticamente com sort(@).'
            }
        ]
    }
];

export const JmespathTutorialModal: React.FC<JmespathTutorialModalProps> = ({ isOpen, onClose, onLoadExample }) => {
    const [activeModuleId, setActiveModuleId] = useState<string>('basics');
    const [selectedExampleIndex, setSelectedExampleIndex] = useState<number>(0);
    const [customExpression, setCustomExpression] = useState<string>('');
    const [copied, setCopied] = useState<boolean>(false);

    const activeModule = useMemo(() => {
        return TUTORIAL_MODULES.find(m => m.id === activeModuleId) || TUTORIAL_MODULES[0];
    }, [activeModuleId]);

    const activeExample = useMemo(() => {
        return activeModule.examples[selectedExampleIndex] || activeModule.examples[0];
    }, [activeModule, selectedExampleIndex]);

    // Update custom expression when active example changes
    React.useEffect(() => {
        if (activeExample) {
            setCustomExpression(activeExample.expression);
        }
    }, [activeExample]);

    const evaluatedResult = useMemo(() => {
        if (!activeExample || !customExpression) return null;
        try {
            return jmespath.search(activeExample.input, customExpression);
        } catch (e: any) {
            return { __error: e.message };
        }
    }, [activeExample, customExpression]);

    if (!isOpen) return null;

    const handleCopy = () => {
        navigator.clipboard.writeText(customExpression);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleLoadIntoEditor = () => {
        if (onLoadExample && activeExample) {
            const targetJson = { result: "" };
            const mappings = { "result": customExpression };
            onLoadExample(activeExample.input, targetJson, mappings);
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
            <div className="w-full max-w-5xl h-[85vh] bg-[#0c101d] border border-zinc-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
                {/* Modal Header */}
                <div className="px-6 py-4 border-b border-zinc-800/80 flex items-center justify-between bg-zinc-900/50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
                            <BookOpen size={18} />
                        </div>
                        <div>
                            <h2 className="text-sm font-bold text-white tracking-wide">Tutorial e Guia de Referência JMESPath</h2>
                            <p className="text-xs text-zinc-400">Aprenda a transformar dados JSON do básico ao avançado com exemplos executáveis</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-all"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Main Body */}
                <div className="flex-1 grid grid-cols-1 md:grid-cols-12 overflow-hidden">
                    {/* Left Sidebar Modules (3 cols) */}
                    <div className="md:col-span-3 border-r border-zinc-800/80 p-3 bg-[#090c16] flex flex-col gap-1.5 overflow-y-auto">
                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider px-2 my-1">
                            Módulos de Aprendizado
                        </span>
                        {TUTORIAL_MODULES.map((mod) => {
                            const isActive = mod.id === activeModuleId;
                            return (
                                <button
                                    key={mod.id}
                                    onClick={() => {
                                        setActiveModuleId(mod.id);
                                        setSelectedExampleIndex(0);
                                    }}
                                    className={`w-full text-left p-2.5 rounded-xl transition-all ${
                                        isActive
                                            ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                                            : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
                                    }`}
                                >
                                    <div className="text-xs font-bold">{mod.title}</div>
                                    <div className="text-[11px] text-zinc-500 truncate mt-0.5">{mod.description}</div>
                                </button>
                            );
                        })}
                    </div>

                    {/* Right Interactive Playground (9 cols) */}
                    <div className="md:col-span-9 p-5 flex flex-col gap-4 bg-[#0d1120] overflow-y-auto custom-scrollbar">
                        {/* Examples Tabs */}
                        <div className="flex items-center gap-2 border-b border-zinc-800/80 pb-2">
                            {activeModule.examples.map((ex, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setSelectedExampleIndex(idx)}
                                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                                        selectedExampleIndex === idx
                                            ? 'bg-zinc-800 text-white border border-zinc-700'
                                            : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
                                    }`}
                                >
                                    {ex.title}
                                </button>
                            ))}
                        </div>

                        {/* Explanation Header */}
                        <div className="p-3.5 bg-indigo-950/30 border border-indigo-500/20 rounded-xl">
                            <h4 className="text-xs font-bold text-indigo-300 mb-1">{activeExample.title}</h4>
                            <p className="text-xs text-zinc-300 mb-2">{activeExample.description}</p>
                            <div className="text-[11px] text-indigo-200/80 bg-indigo-900/40 px-2.5 py-1 rounded border border-indigo-500/30">
                                💡 {activeExample.explanation}
                            </div>
                        </div>

                        {/* Interactive Editor Panels Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
                            {/* Input JSON */}
                            <div className="flex flex-col border border-zinc-800 rounded-xl p-3 bg-zinc-950/60">
                                <span className="text-[11px] font-semibold text-zinc-400 uppercase mb-2">
                                    Entrada (JSON de Origem)
                                </span>
                                <pre className="flex-1 overflow-y-auto font-mono text-xs text-sky-300 bg-zinc-900/80 p-2.5 rounded-lg custom-scrollbar">
                                    {JSON.stringify(activeExample.input, null, 2)}
                                </pre>
                            </div>

                            {/* Expression & Live Output */}
                            <div className="flex flex-col gap-3">
                                {/* Expression Input */}
                                <div className="border border-zinc-800 rounded-xl p-3 bg-zinc-950/60">
                                    <div className="flex items-center justify-between mb-1.5">
                                        <span className="text-[11px] font-semibold text-zinc-400 uppercase">
                                            Expressão JMESPath
                                        </span>
                                        <button
                                            onClick={handleCopy}
                                            className="text-[10px] text-zinc-400 hover:text-white flex items-center gap-1"
                                        >
                                            {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                                            {copied ? 'Copiado' : 'Copiar'}
                                        </button>
                                    </div>
                                    <input
                                        type="text"
                                        value={customExpression}
                                        onChange={(e) => setCustomExpression(e.target.value)}
                                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs font-mono text-emerald-400 focus:outline-none focus:border-indigo-500"
                                    />
                                </div>

                                {/* Evaluated Result */}
                                <div className="flex-1 flex flex-col border border-zinc-800 rounded-xl p-3 bg-zinc-950/60 overflow-hidden">
                                    <span className="text-[11px] font-semibold text-zinc-400 uppercase mb-2">
                                        Resultado da Transformação
                                    </span>
                                    <div className="flex-1 overflow-y-auto bg-zinc-900/80 p-2.5 rounded-lg font-mono text-xs text-amber-300 custom-scrollbar">
                                        {evaluatedResult !== null ? (
                                            evaluatedResult?.__error ? (
                                                <span className="text-rose-400">{evaluatedResult.__error}</span>
                                            ) : (
                                                <pre>{JSON.stringify(evaluatedResult, null, 2)}</pre>
                                            )
                                        ) : (
                                            <span className="text-zinc-600 italic">Digite uma expressão válida...</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer Buttons */}
                        <div className="flex items-center justify-end gap-3 pt-2 border-t border-zinc-800/80">
                            <button
                                onClick={onClose}
                                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold rounded-xl transition-all"
                            >
                                Fechar
                            </button>
                            {onLoadExample && (
                                <button
                                    onClick={handleLoadIntoEditor}
                                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-all shadow-lg shadow-emerald-600/20"
                                >
                                    <Play size={14} />
                                    Carregar este Exemplo no Editor
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
