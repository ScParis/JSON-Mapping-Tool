import React, { useEffect, useState, useRef } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import {
    Code, Home, Moon, Sun, Palette, Brackets, GitCompare, KeyRound, Binary,
    Database, Send, Radio, Building2, Sparkles, Code2, Zap, BrainCircuit,
    Activity, Link as LinkIcon, ChevronRight, X, LayoutGrid
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface NavItem {
    id: string;
    label: string;
    icon: React.ElementType;
    path?: string;
    children?: NavItem[];
}

// ─── Navigation Definition ────────────────────────────────────────────────────

const NAV_GROUPS: { items: NavItem[] }[] = [
    {
        items: [
            { id: 'home', label: 'Início', icon: Home, path: '/' },
        ]
    },
    {
        items: [
            {
                id: 'studio', label: 'Universal Studio Pro', icon: Sparkles, path: '/studio',
                children: [
                    { id: 'editor', label: 'Workspace', icon: Code2, path: '/studio?view=editor' },
                    { id: 'hsm-studio', label: 'HSM Studio', icon: Zap, path: '/studio?view=hsm-studio' },
                    { id: 'nexus-ai', label: 'Nexus AI', icon: BrainCircuit, path: '/studio?view=nexus-ai' },
                    { id: 'whatsapp-builder', label: 'Link Builder', icon: LinkIcon, path: '/studio?view=whatsapp-builder' },
                ]
            },
        ]
    },
    {
        items: [
            { id: 'json', label: 'JSON Mapper', icon: Brackets, path: '/json' },
            { id: 'generate-data', label: 'Generate Data', icon: Database, path: '/generate-data' },
            { id: 'diff', label: 'Diff Viewer', icon: GitCompare, path: '/diff' },
            { id: 'jwt', label: 'JWT & Codes', icon: KeyRound, path: '/jwt' },
            { id: 'regex', label: 'Regex Playground', icon: Binary, path: '/regex' },
            { id: 'sql', label: 'SQL Toolset', icon: Database, path: '/sql' },
        ]
    },
    {
        items: [
            { id: 'cnpj', label: 'Consulta CNPJ', icon: Building2, path: '/cnpj' },
            { id: 'api', label: 'API Tester', icon: Send, path: '/api' },
            { id: 'mock', label: 'Mock API Server', icon: Radio, path: '/mock' },
        ]
    },
];

// ─── Sub-nav Panel ────────────────────────────────────────────────────────────

interface SubNavPanelProps {
    item: NavItem;
    isOpen: boolean;
    onClose: () => void;
    activeSubPath: string;
}

const SubNavPanel: React.FC<SubNavPanelProps> = ({ item, isOpen, onClose, activeSubPath }) => {
    const navigate = useNavigate();

    if (!item.children) return null;

    return (
        <>
            {/* Backdrop */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-30"
                    onClick={onClose}
                />
            )}
            {/* Panel */}
            <div
                className={`absolute left-16 top-0 bottom-0 z-40 w-56 flex flex-col border-r border-zinc-800/80 bg-[#0a0e1a]/95 backdrop-blur-xl transition-all duration-300 ease-out ${
                    isOpen ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2 pointer-events-none'
                }`}
            >
                {/* Panel Header */}
                <div className="h-14 flex items-center justify-between px-4 border-b border-zinc-800/60">
                    <div className="flex items-center gap-2.5">
                        <item.icon size={15} className="text-indigo-400 flex-shrink-0" />
                        <span className="text-xs font-black text-white tracking-tight truncate">{item.label}</span>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1 rounded-lg text-zinc-500 hover:text-white hover:bg-zinc-800 transition-all"
                    >
                        <X size={13} />
                    </button>
                </div>

                {/* Sub-items */}
                <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
                    {item.children.map(child => {
                        const isActive = activeSubPath.includes(child.id ?? '');
                        return (
                            <button
                                key={child.id}
                                onClick={() => { navigate(child.path!); onClose(); }}
                                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all text-left ${
                                    isActive
                                        ? 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/20'
                                        : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
                                }`}
                            >
                                <child.icon size={14} className={isActive ? 'text-indigo-400' : 'opacity-70'} />
                                <span>{child.label}</span>
                                {isActive && <ChevronRight size={12} className="ml-auto text-indigo-400 opacity-60" />}
                            </button>
                        );
                    })}
                </nav>
            </div>
        </>
    );
};

// ─── Tooltip ──────────────────────────────────────────────────────────────────

interface TooltipProps {
    label: string;
    children: React.ReactNode;
}

const Tooltip: React.FC<TooltipProps> = ({ label, children }) => {
    const [show, setShow] = useState(false);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const handleEnter = () => {
        timerRef.current = setTimeout(() => setShow(true), 400);
    };
    const handleLeave = () => {
        if (timerRef.current) clearTimeout(timerRef.current);
        setShow(false);
    };

    return (
        <div
            className="relative"
            onMouseEnter={handleEnter}
            onMouseLeave={handleLeave}
        >
            {children}
            {show && (
                <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 z-50 pointer-events-none animate-in fade-in-0 slide-in-from-left-1 duration-150">
                    <div className="bg-zinc-900 border border-zinc-700/80 text-white text-xs font-semibold px-3 py-1.5 rounded-xl whitespace-nowrap shadow-2xl">
                        {label}
                        <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-zinc-700/80" />
                    </div>
                </div>
            )}
        </div>
    );
};

// ─── Sidebar Nav Item Button ──────────────────────────────────────────────────

interface SidebarItemProps {
    item: NavItem;
    isActive: boolean;
    onClick: () => void;
}

const SidebarItem: React.FC<SidebarItemProps> = ({ item, isActive, onClick }) => {
    const Icon = item.icon;

    return (
        <Tooltip label={item.label}>
            <button
                onClick={onClick}
                className={`relative w-10 h-10 flex items-center justify-center rounded-xl transition-all duration-200 group ${
                    isActive
                        ? 'bg-indigo-500/15 text-indigo-400'
                        : 'text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/60'
                }`}
            >
                {isActive && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r-full bg-indigo-500" />
                )}
                <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
            </button>
        </Tooltip>
    );
};

// ─── Main Layout ──────────────────────────────────────────────────────────────

export const Layout = () => {
    const location = useLocation();
    const navigate = useNavigate();

    const [theme, setTheme] = useState<'light' | 'dark' | 'midnight'>(() =>
        (localStorage.getItem('portal-theme') as any) ||
        (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'midnight' : 'light')
    );
    const [openSubPanel, setOpenSubPanel] = useState<NavItem | null>(null);

    // ── Theme effect ──────────────────────────────────────────────────────────
    useEffect(() => {
        const handleThemeChange = () => {
            setTheme((localStorage.getItem('portal-theme') as any) || 'midnight');
        };
        window.addEventListener('theme-changed', handleThemeChange);
        return () => window.removeEventListener('theme-changed', handleThemeChange);
    }, []);

    useEffect(() => {
        if (theme === 'light') {
            document.documentElement.classList.remove('dark');
            document.documentElement.setAttribute('data-theme', 'light');
        } else {
            document.documentElement.classList.add('dark');
            document.documentElement.setAttribute('data-theme', theme);
        }
        localStorage.setItem('portal-theme', theme);
        window.dispatchEvent(new Event('theme-changed'));
    }, [theme]);

    const cycleTheme = () => {
        setTheme(t => t === 'light' ? 'dark' : t === 'dark' ? 'midnight' : 'light');
    };

    // ── Active detection ──────────────────────────────────────────────────────
    const currentPath = location.pathname;
    const currentSearch = location.search;
    const fullLocation = currentPath + currentSearch;

    const isItemActive = (item: NavItem): boolean => {
        if (item.path === '/') return currentPath === '/';
        return currentPath.startsWith(item.path?.split('?')[0] ?? '___');
    };

    // ── Item click handler ────────────────────────────────────────────────────
    const handleItemClick = (item: NavItem) => {
        if (item.children) {
            // Toggle sub-panel
            setOpenSubPanel(prev => prev?.id === item.id ? null : item);
        } else {
            setOpenSubPanel(null);
            navigate(item.path!);
        }
    };

    // Close sub-panel on route change
    useEffect(() => {
        setOpenSubPanel(null);
    }, [location.pathname]);

    // ── Dynamic Document Title ────────────────────────────────────────────────
    useEffect(() => {
        const path = location.pathname;
        const searchParams = new URLSearchParams(location.search);
        const viewParam = searchParams.get('view');

        let title = 'Dev Studio Pro';

        if (path === '/') {
            title = 'Dev Studio | Início & Dashboard';
        } else if (path.startsWith('/json')) {
            title = 'Dev Studio | JSON Mapper & JMESPath';
        } else if (path.startsWith('/diff')) {
            title = 'Dev Studio | Diff Viewer & Comparador';
        } else if (path.startsWith('/jwt')) {
            title = 'Dev Studio | JWT & Criptografia';
        } else if (path.startsWith('/regex')) {
            title = 'Dev Studio | Regex Playground';
        } else if (path.startsWith('/sql')) {
            title = 'Dev Studio | SQL Toolset & Conversor';
        } else if (path.startsWith('/cnpj')) {
            title = 'Dev Studio | Consulta CNPJ & CEP';
        } else if (path.startsWith('/api')) {
            title = 'Dev Studio | API Client & Rest Tester';
        } else if (path.startsWith('/mock')) {
            title = 'Dev Studio | Mock API Server';
        } else if (path.startsWith('/studio')) {
            if (viewParam === 'hsm-studio') {
                title = 'Dev Studio | HSM Studio (WhatsApp Meta)';
            } else if (viewParam === 'nexus-ai') {
                title = 'Dev Studio | Nexus AI Chat';
            } else if (viewParam === 'dictionary') {
                title = 'Dev Studio | Dicionário de Variáveis';
            } else if (viewParam === 'whatsapp-builder') {
                title = 'Dev Studio | Gerador de Link WhatsApp';
            } else if (viewParam === 'ai-lab') {
                title = 'Dev Studio | Laboratório IA (Gemini)';
            } else {
                title = 'Dev Studio | Universal Studio Pro Workspace';
            }
        }

        document.title = title;
    }, [location.pathname, location.search]);

    // ── Theme icon ────────────────────────────────────────────────────────────
    const ThemeIcon = theme === 'light' ? Sun : theme === 'dark' ? Moon : Palette;
    const themeLabel = theme === 'light' ? 'Tema Claro' : theme === 'dark' ? 'Tema Escuro' : 'Midnight';

    return (
        <div className="flex h-screen w-screen bg-app bg-grid-pattern text-primary font-sans overflow-hidden relative">

            {/* ── Icon Sidebar ─────────────────────────────────────────────── */}
            <aside className="relative z-50 w-16 flex-shrink-0 flex flex-col items-center py-3 gap-1 border-r border-zinc-800/60 bg-[#070b14]/80 backdrop-blur-xl">

                {/* Logo */}
                <Link to="/" className="w-10 h-10 mb-2 flex items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 shadow-lg shadow-indigo-500/25 hover:scale-105 transition-transform flex-shrink-0">
                    <Code size={18} className="text-white" strokeWidth={2.5} />
                </Link>

                <div className="w-6 h-px bg-zinc-800/80 my-1" />

                {/* Nav Groups */}
                <nav className="flex-1 flex flex-col items-center gap-1 w-full px-3">
                    {NAV_GROUPS.map((group, gIdx) => (
                        <React.Fragment key={gIdx}>
                            {gIdx > 0 && <div className="w-5 h-px bg-zinc-800/60 my-1.5" />}
                            {group.items.map(item => (
                                <SidebarItem
                                    key={item.id}
                                    item={item}
                                    isActive={isItemActive(item) || openSubPanel?.id === item.id}
                                    onClick={() => handleItemClick(item)}
                                />
                            ))}
                        </React.Fragment>
                    ))}
                </nav>

                {/* Bottom Controls */}
                <div className="flex flex-col items-center gap-1 px-3">
                    <Tooltip label={themeLabel}>
                        <button
                            onClick={cycleTheme}
                            className="w-10 h-10 flex items-center justify-center rounded-xl text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/60 transition-all"
                        >
                            <ThemeIcon size={16} />
                        </button>
                    </Tooltip>
                </div>
            </aside>

            {/* ── Sub-panel ─────────────────────────────────────────────────── */}
            {NAV_GROUPS.flatMap(g => g.items).map(item =>
                item.children ? (
                    <SubNavPanel
                        key={item.id}
                        item={item}
                        isOpen={openSubPanel?.id === item.id}
                        onClose={() => setOpenSubPanel(null)}
                        activeSubPath={fullLocation}
                    />
                ) : null
            )}

            {/* ── Main content ──────────────────────────────────────────────── */}
            <main className="flex-1 h-full w-full relative flex flex-col bg-app overflow-hidden">
                <div className="flex-1 overflow-y-auto overflow-x-hidden">
                    <Outlet />
                </div>

                {/* ── Status Bar ────────────────────────────────────────────── */}
                <div className="h-7 flex-shrink-0 flex items-center justify-between px-4 border-t border-zinc-800/60 bg-[#070b14]/60 backdrop-blur-sm">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_6px_#10B981]" />
                            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Dev Studio Pro</span>
                        </div>
                        <span className="text-[10px] text-zinc-600 font-mono hidden sm:inline">
                            {currentPath === '/' ? 'Home' : currentPath.replace('/', '').toUpperCase()}
                        </span>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest hidden md:inline">
                            {theme}
                        </span>
                        <span className="text-[10px] text-zinc-700">v3.0</span>
                    </div>
                </div>
            </main>
        </div>
    );
};
