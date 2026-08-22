import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, Code2, FileJson, Sparkles, 
  ArrowRight, Cpu, MessageSquare, Layers, Zap,
  Globe, Shield, Activity, BookOpen, Building2,
  Binary, Database, Send, Radio
} from 'lucide-react';
import { DEFAULT_CONTENT } from '../constants';
import { View, TextFormat } from '../types';
import { Badge, Button } from '../../../components/ui';

interface ToolCardProps {
  title: string;
  description: string;
  icon: React.ElementType;
  color: string;
  onClick: () => void;
  badge?: string;
}

const ToolCard: React.FC<ToolCardProps> = ({ title, description, icon: Icon, color, onClick, badge }) => (
  <button 
    onClick={onClick}
    className="group relative flex flex-col p-8 bg-white/70 dark:bg-zinc-900/60 backdrop-blur-md border border-zinc-200/80 dark:border-zinc-800/80 rounded-3xl transition-all duration-300 hover:shadow-[0_20px_50px_rgba(79,70,229,0.12)] dark:hover:shadow-[0_20px_50px_rgba(99,102,241,0.08)] hover:-translate-y-1.5 text-left overflow-hidden w-full cursor-pointer"
  >
    {/* Ambient Glow behind card on hover */}
    <div className="absolute -inset-px bg-gradient-to-br from-indigo-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl" />
    
    <div className={`w-14 h-14 rounded-2xl ${color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-md shadow-indigo-500/20`}>
      <Icon className="w-7 h-7 text-white" />
    </div>
    
    {badge && (
      <div className="absolute top-8 right-8">
        <Badge variant="primary">{badge}</Badge>
      </div>
    )}
    
    <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors duration-200 tracking-tight">{title}</h3>
    <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed mb-6 flex-grow">{description}</p>
    
    <div className="pt-4 border-t border-zinc-200/60 dark:border-zinc-800/80 flex items-center justify-between text-indigo-600 dark:text-indigo-400 text-xs font-black uppercase tracking-widest opacity-80 group-hover:opacity-100 transition-opacity">
      <span>Abrir Ferramenta</span>
      <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1.5 transition-transform duration-300" />
    </div>
  </button>
);

interface ToolItem {
  id: string;
  isStudioView: boolean;
  title: string;
  description: string;
  icon: React.ElementType;
  color: string;
  badge?: string;
  category: 'studio' | 'dev' | 'api';
  format?: TextFormat;
  content?: string;
}

interface LandingPageProps {
  onNavigate?: (view: View, format?: TextFormat, initialContent?: string) => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onNavigate }) => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');

  const categories = [
    { id: 'all', label: 'Todas as Ferramentas' },
    { id: 'studio', label: 'Studio Pro & IA' },
    { id: 'dev', label: 'Ferramentas Dev' },
    { id: 'api', label: 'APIs & Webhooks' },
  ];

  const tools: ToolItem[] = [
    // --- Studio Pro ---
    {
      id: 'editor',
      isStudioView: true,
      title: 'Universal Studio Pro',
      description: 'Ambiente completo de edição de documentos, templates e contratos com suporte a variáveis dinâmicas e preview em tempo real.',
      icon: Sparkles,
      color: 'bg-gradient-to-br from-indigo-500 to-indigo-600',
      badge: 'Workspace Principal',
      category: 'studio',
      format: TextFormat.MARKDOWN,
      content: DEFAULT_CONTENT
    },
    {
      id: 'hsm-studio',
      isStudioView: true,
      title: 'HSM Studio AI',
      description: 'Crie e simule templates oficiais de WhatsApp (HSM Meta) com validação em tempo real contra regras estritas.',
      icon: Zap,
      color: 'bg-gradient-to-br from-amber-500 to-amber-600',
      badge: 'WhatsApp Meta',
      category: 'studio'
    },
    {
      id: 'nexus-ai',
      isStudioView: true,
      title: 'Nexus AI Chat',
      description: 'Assistente técnico especializado com modos de análise avançada e suporte à base de conhecimento local IndexedDB.',
      icon: MessageSquare,
      color: 'bg-gradient-to-br from-purple-500 to-purple-600',
      badge: 'IA Chat',
      category: 'studio'
    },
    {
      id: 'dictionary',
      isStudioView: true,
      title: 'Dicionário PipeRun CRM',
      description: 'Navegação e injeção rápida de variáveis nativas e atributos dinâmicos do CRM PipeRun diretamente no seu documento.',
      icon: BookOpen,
      color: 'bg-gradient-to-br from-emerald-500 to-emerald-600',
      category: 'studio'
    },
    {
      id: 'whatsapp-builder',
      isStudioView: true,
      title: 'Gerador WhatsApp Link',
      description: 'Construa links diretos de WhatsApp com mensagens codificadas e validação instantânea.',
      icon: Globe,
      color: 'bg-gradient-to-br from-teal-500 to-teal-600',
      category: 'studio'
    },
    {
      id: 'ai-lab',
      isStudioView: true,
      title: 'Laboratório IA (Gemini)',
      description: 'Audite, resuma, estenda ou otimize o código e o texto dos seus templates em tempo real.',
      icon: Cpu,
      color: 'bg-gradient-to-br from-pink-500 to-pink-600',
      badge: 'Pesquisa',
      category: 'studio'
    },

    // --- Ferramentas Dev ---
    {
      id: '/json',
      isStudioView: false,
      title: 'JSON Mapping Tool',
      description: 'Transformador visual de estruturas JSON utilizando expressões JMESPath com pré-visualização instantânea.',
      icon: FileJson,
      color: 'bg-gradient-to-br from-emerald-500 to-teal-500',
      category: 'dev'
    },
    {
      id: '/diff',
      isStudioView: false,
      title: 'Diff Viewer',
      description: 'Compare códigos ou textos lado a lado com realce de sintaxe e análise de alterações suportada por IA.',
      icon: Layers,
      color: 'bg-gradient-to-br from-orange-500 to-amber-500',
      category: 'dev'
    },
    {
      id: '/jwt',
      isStudioView: false,
      title: 'JWT & Codes',
      description: 'Decodifique tokens JWT, verifique assinaturas e converta formatos (Base64, URL Encoding, Crypto Hashes).',
      icon: Shield,
      color: 'bg-gradient-to-br from-rose-500 to-pink-500',
      category: 'dev'
    },
    {
      id: '/regex',
      isStudioView: false,
      title: 'Regex Playground',
      description: 'Teste expressões regulares em tempo real com realce de correspondências e explicações passo a passo.',
      icon: Binary,
      color: 'bg-gradient-to-br from-violet-500 to-fuchsia-500',
      category: 'dev'
    },
    {
      id: '/sql',
      isStudioView: false,
      title: 'SQL Toolset',
      description: 'Formatador de queries SQL, relatórios de otimização DBA via IA e gerador de dados mock tabulares.',
      icon: Database,
      color: 'bg-gradient-to-br from-sky-500 to-blue-500',
      category: 'dev'
    },

    // --- APIs & Webhooks ---
    {
      id: '/cnpj',
      isStudioView: false,
      title: 'Consulta CNPJ & CEP',
      description: 'Busca rápida de empresas via ReceitaWS e validação de endereços via BrasilAPI com preenchimento automático.',
      icon: Building2,
      color: 'bg-gradient-to-br from-blue-500 to-cyan-500',
      category: 'api'
    },
    {
      id: '/api',
      isStudioView: false,
      title: 'API Tester',
      description: 'Cliente HTTP REST completo com suporte a headers, parâmetros e corpo, livre de restrições CORS.',
      icon: Send,
      color: 'bg-gradient-to-br from-red-500 to-orange-500',
      category: 'api'
    },
    {
      id: '/mock',
      isStudioView: false,
      title: 'Mock API Server',
      description: 'Simulação de webhooks e endpoints REST com registro de logs em tempo real (SSE) e respostas dinâmicas.',
      icon: Radio,
      color: 'bg-gradient-to-br from-pink-600 to-purple-600',
      category: 'api'
    }
  ];

  const handleToolClick = (tool: ToolItem) => {
    if (tool.isStudioView) {
      if (onNavigate) {
        onNavigate(tool.id as View, tool.format, tool.content);
      } else {
        navigate(`/studio?view=${tool.id}`);
      }
    } else {
      navigate(tool.id);
    }
  };

  const filteredTools = tools.filter(tool => {
    const matchesSearch = tool.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          tool.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === 'all' || tool.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="w-full min-h-full bg-zinc-50 dark:bg-[#030711] text-zinc-950 dark:text-zinc-50 selection:bg-indigo-500/30 custom-scrollbar relative overflow-y-auto overflow-x-hidden transition-colors duration-300">
      
      {/* Background Decorative Grid and Glowing Spheres */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-30 pointer-events-none" />
      <div className="absolute top-[-10%] left-[50%] -translate-x-[50%] w-[600px] h-[600px] bg-gradient-to-tr from-indigo-500/10 via-purple-500/5 to-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[20%] right-[-10%] w-[400px] h-[400px] bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Hero Section */}
      <section className="pt-16 pb-12 px-6 md:px-16 relative">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-xs font-black uppercase tracking-widest mb-8 shadow-sm">
            <Zap className="w-3.5 h-3.5 animate-pulse" /> Plataforma Unificada Dev-Studio Pro
          </div>
          
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter mb-6 leading-[0.95] text-zinc-900 dark:text-white">
            Engenharia de Software & <br className="hidden md:block"/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-500">Ferramentas de Desenvolvimento</span>
          </h1>
          
          <p className="text-lg md:text-xl text-zinc-500 dark:text-zinc-400 max-w-3xl mx-auto mb-10 leading-relaxed font-normal">
            Ecossistema unificado para edição de documentos, automação de templates HSM, teste de APIs, consultas de dados e utilitários de desenvolvimento.
          </p>

          {/* Search Bar Container */}
          <div className="max-w-3xl mx-auto relative group">
            <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
              <Search className="w-6 h-6 text-zinc-400 group-focus-within:text-indigo-500 transition-colors" />
            </div>
            <input 
              type="text"
              placeholder="Pesquise por ferramentas, HSM, JSON, JWT, SQL..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-16 pl-16 pr-6 bg-white dark:bg-zinc-900/80 border-2 border-zinc-200 dark:border-zinc-800 rounded-3xl text-lg focus:border-indigo-500 focus:ring-8 focus:ring-indigo-500/10 duration-200 transition-all outline-none shadow-2xl shadow-zinc-200/50 dark:shadow-none"
            />
          </div>
        </div>
      </section>

      {/* Categories & Filter Grid */}
      <section className="py-8 px-6 md:px-16">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 border-b border-zinc-200/80 dark:border-zinc-800/80 pb-6">
            <h2 className="text-2xl font-black tracking-tight uppercase flex items-center gap-2 text-zinc-900 dark:text-white">
              <Layers className="w-5 h-5 text-indigo-500" /> Ferramentas Disponíveis
            </h2>
            <div className="flex flex-wrap gap-2.5">
              {categories.map(cat => (
                <button 
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`px-5 py-2.5 text-xs font-extrabold uppercase tracking-widest rounded-xl border transition-all duration-200 cursor-pointer ${
                    activeCategory === cat.id 
                    ? 'text-white bg-indigo-600 border-indigo-600 shadow-lg shadow-indigo-600/20' 
                    : 'text-zinc-500 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-900'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredTools.map(tool => (
              <ToolCard 
                key={tool.title}
                {...tool}
                onClick={() => handleToolClick(tool)}
              />
            ))}
            
            {filteredTools.length === 0 && (
              <div className="col-span-full py-20 text-center border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-[2.5rem] bg-white/10 dark:bg-zinc-900/10 backdrop-blur-sm">
                <Search className="w-16 h-16 text-zinc-300 dark:text-zinc-700 mx-auto mb-6 animate-pulse" />
                <h3 className="text-xl font-bold text-zinc-400 mb-2">Nenhum utilitário foi localizado</h3>
                <p className="text-sm text-zinc-500 mb-6">Não encontramos resultados para "{searchQuery}". Tente outros termos.</p>
                <Button onClick={() => setSearchQuery('')} variant="primary" size="md">
                  Limpar Filtro
                </Button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Visual Platform Stats / Features */}
      <section className="py-16 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-100/50 dark:bg-zinc-950/20 relative">
        <div className="max-w-6xl mx-auto px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center md:text-left">
            <div className="flex flex-col items-center md:items-start p-6 bg-white dark:bg-zinc-900/50 border border-zinc-200/60 dark:border-zinc-800/60 rounded-3xl">
              <Shield className="w-10 h-10 text-indigo-500 mb-4" />
              <h4 className="text-lg font-black mb-1 uppercase tracking-tight text-zinc-900 dark:text-white">Conformidade & Validação</h4>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">Verificação automática de sintaxe, diretrizes anti-spam e regras estruturais.</p>
            </div>
            <div className="flex flex-col items-center md:items-start p-6 bg-white dark:bg-zinc-900/50 border border-zinc-200/60 dark:border-zinc-800/60 rounded-3xl">
              <Globe className="w-10 h-10 text-purple-500 mb-4" />
              <h4 className="text-lg font-black mb-1 uppercase tracking-tight text-zinc-900 dark:text-white">Sincronização & CRM</h4>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">Integração nativa com variáveis dinâmicas do PipeRun CRM e geradores de API.</p>
            </div>
            <div className="flex flex-col items-center md:items-start p-6 bg-white dark:bg-zinc-900/50 border border-zinc-200/60 dark:border-zinc-800/60 rounded-3xl">
              <Activity className="w-10 h-10 text-emerald-500 mb-4" />
              <h4 className="text-lg font-black mb-1 uppercase tracking-tight text-zinc-900 dark:text-white">Alta Performance Local</h4>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">Execução instantânea sem dependências externas pesadas e persistência via IndexedDB.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#030711] transition-colors duration-300">
        <div className="max-w-6xl mx-auto px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6 pb-6 border-b border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-2xl bg-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <Cpu className="w-5 h-5 text-white" />
              </div>
              <span className="font-black text-xl uppercase tracking-tighter">Dev-Studio Pro</span>
            </div>
            <p className="text-xs text-zinc-500">© 2026 Dev-Studio Pro. Todos os utilitários integrados em um único ecossistema.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
