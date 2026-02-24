// ===== CHANGELOG FUNCTIONALITY =====

class ChangelogManager {
    constructor() {
        this.currentVersion = '2.2.0';
        this.changelogData = null;
        this.init();
    }

    init() {
        this.loadChangelog();
        this.setupEventListeners();
        this.displayCurrentVersion();
    }

    setupEventListeners() {
        // Event listeners will be set up when needed
    }

    displayCurrentVersion() {
        // Display current version in the UI if needed
        const versionElements = document.querySelectorAll('.current-version');
        versionElements.forEach(el => {
            el.textContent = this.currentVersion;
        });
    }

    async loadChangelog() {
        try {
            // In a real application, this could fetch from a remote API
            // For now, we'll use the local changelog data
            this.changelogData = this.getLocalChangelog();
        } catch (error) {
            console.error('Error loading changelog:', error);
            this.changelogData = this.getLocalChangelog();
        }
    }

    getLocalChangelog() {
        return {
            versions: [
                {
                    version: '2.2.0',
                    date: '2026-02-24',
                    type: 'minor',
                    changes: [
                        {
                            type: 'feature',
                            title: 'Tutorial JMESPath Completo',
                            description: '5 módulos progressivos do básico ao avançado com exemplos interativos e progress tracking.'
                        },
                        {
                            type: 'feature',
                            title: '10+ Exemplos Interativos',
                            description: 'Execute expressões JMESPath em tempo real com feedback instantâneo.'
                        },
                        {
                            type: 'feature',
                            title: 'Progress Tracking',
                            description: 'Acompanhamento do aprendizado com persistência local e indicadores visuais.'
                        },
                        {
                            type: 'improvement',
                            title: 'Layout Otimizado',
                            description: 'Interface ocupa 100% da largura do navegador com melhor aproveitamento de espaço.'
                        },
                        {
                            type: 'improvement',
                            title: 'Tema Unificado',
                            description: 'Controle de tema simplificado via botão único, removendo configurações redundantes.'
                        },
                        {
                            type: 'improvement',
                            title: 'Responsividade Aprimorada',
                            description: 'Design adaptativo otimizado para todos os dispositivos e tamanhos de tela.'
                        },
                        {
                            type: 'feature',
                            title: 'Links GitHub',
                            description: 'Acesso direto ao repositório no rodapé da aplicação.'
                        },
                        {
                            type: 'improvement',
                            title: 'Interface Limpa',
                            description: 'Remoção de botões e configurações redundantes para melhor experiência do usuário.'
                        }
                    ]
                },
                {
                    version: '2.1.0',
                    date: '2024-12-15',
                    type: 'minor',
                    changes: [
                        {
                            type: 'feature',
                            title: 'Novo Módulo Finder',
                            description: 'Explorador interativo de JSON para facilitar a localização de caminhos complexos.'
                        },
                        {
                            type: 'feature',
                            title: 'Caminhos Indexados',
                            description: 'Suporte nativo a índices em arrays (ex: itens[0]) no mapeador.'
                        },
                        {
                            type: 'feature',
                            title: 'Valores Unquoted',
                            description: 'Opção para exportar valores sem aspas no JSON mapeado (compatibilidade JMESPath).'
                        },
                        {
                            type: 'improvement',
                            title: 'Refinamento de Layout',
                            description: 'Header mais compacto e navegação via modais para Ajuda e Configs.'
                        }
                    ]
                },
                {
                    version: '2.0.0',
                    date: '2024-11-20',
                    type: 'major',
                    changes: [
                        {
                            type: 'feature',
                            title: 'Interface Redesenhada',
                            description: 'Interface totalmente redesenhada com Design System 2026.'
                        },
                        {
                            type: 'feature',
                            title: 'Tema Dark/Light',
                            description: 'Tema claro/escuro com persistência e transições suaves.'
                        },
                        {
                            type: 'feature',
                            title: 'File System Access API',
                            description: 'Suporte a manipulação de arquivos localmente com segurança.'
                        },
                        {
                            type: 'improvement',
                            title: 'Performance',
                            description: 'Melhoria significativa de performance no motor de mapeamento dinâmico.'
                        }
                    ]
                },
                {
                    version: '1.5.0',
                    date: '2024-10-10',
                    type: 'minor',
                    changes: [
                        {
                            type: 'feature',
                            title: 'Exportação Avançada',
                            description: 'Novas opções de exportação incluindo CSV e XML.'
                        },
                        {
                            type: 'improvement',
                            title: 'Validação Melhorada',
                            description: 'Feedback mais detalhado para erros de sintaxe JSON.'
                        }
                    ]
                },
                {
                    version: '1.0.0',
                    date: '2024-09-01',
                    type: 'major',
                    changes: [
                        {
                            type: 'feature',
                            title: 'Lançamento Inicial',
                            description: 'Versão inicial do JSON Mapper com funcionalidades básicas de mapeamento.'
                        },
                        {
                            type: 'feature',
                            title: 'JMESPath Integration',
                            description: 'Integração completa com JMESPath para transformações de dados.'
                        }
                    ]
                }
            ]
        };
    }

    renderChangelog() {
        if (!this.changelogData) {
            return '<div class="loading-spinner"><i class="fas fa-spinner"></i> Carregando changelog...</div>';
        }

        const container = document.createElement('div');
        container.className = 'changelog-content';

        this.changelogData.versions.forEach(version => {
            const versionSection = this.createVersionSection(version);
            container.appendChild(versionSection);
        });

        return container.outerHTML;
    }

    createVersionSection(version) {
        const section = document.createElement('div');
        section.className = 'version-section';

        const header = document.createElement('div');
        header.className = 'version-header';

        const versionNumber = document.createElement('div');
        versionNumber.className = 'version-number';
        versionNumber.innerHTML = `
            <i class="fas fa-code-branch"></i>
            v${version.version}
        `;

        const versionMeta = document.createElement('div');
        versionMeta.style.display = 'flex';
        versionMeta.style.alignItems = 'center';
        versionMeta.style.gap = '1rem';

        const versionDate = document.createElement('div');
        versionDate.className = 'version-date';
        versionDate.textContent = this.formatDate(version.date);

        const versionType = document.createElement('div');
        versionType.className = `version-type ${version.type}`;
        versionType.textContent = this.getVersionTypeLabel(version.type);

        versionMeta.appendChild(versionDate);
        versionMeta.appendChild(versionType);

        header.appendChild(versionNumber);
        header.appendChild(versionMeta);

        const changesList = document.createElement('ul');
        changesList.className = 'changes-list';

        version.changes.forEach(change => {
            const changeItem = this.createChangeItem(change);
            changesList.appendChild(changeItem);
        });

        section.appendChild(header);
        section.appendChild(changesList);

        return section;
    }

    createChangeItem(change) {
        const item = document.createElement('li');
        item.className = 'change-item';

        const icon = document.createElement('div');
        icon.className = `change-icon ${change.type}`;
        icon.innerHTML = this.getChangeIcon(change.type);

        const content = document.createElement('div');
        content.className = 'change-content';

        const title = document.createElement('div');
        title.className = 'change-title';
        title.textContent = change.title;

        const description = document.createElement('div');
        description.className = 'change-description';
        description.textContent = change.description;

        content.appendChild(title);
        content.appendChild(description);

        item.appendChild(icon);
        item.appendChild(content);

        return item;
    }

    getChangeIcon(type) {
        const icons = {
            feature: '<i class="fas fa-plus"></i>',
            fix: '<i class="fas fa-bug"></i>',
            improvement: '<i class="fas fa-arrow-up"></i>',
            breaking: '<i class="fas fa-exclamation-triangle"></i>'
        };
        return icons[type] || '<i class="fas fa-circle"></i>';
    }

    getVersionTypeLabel(type) {
        const labels = {
            major: 'Major',
            minor: 'Minor',
            patch: 'Patch'
        };
        return labels[type] || 'Release';
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    showChangelog() {
        const container = document.getElementById('changelogSection');
        if (!container) return;

        container.innerHTML = `
            <div class="changelog-header">
                <h1><i class="fas fa-history"></i> Histórico de Alterações</h1>
                <p>Veja todas as atualizações e melhorias do JSON Mapper</p>
                <div class="version-info">
                    <div class="version-badge">Versão Atual: v${this.currentVersion}</div>
                    <div class="version-badge">Total de Versões: ${this.changelogData?.versions.length || 0}</div>
                </div>
            </div>
            ${this.renderChangelog()}
        `;

        container.classList.add('active');
    }

    hideChangelog() {
        const container = document.getElementById('changelogSection');
        if (container) {
            container.classList.remove('active');
        }
    }

    checkForUpdates() {
        // In a real application, this would check against a remote API
        // For now, we'll just return the current version
        return Promise.resolve({
            current: this.currentVersion,
            latest: this.currentVersion,
            hasUpdate: false
        });
    }
}

// Initialize changelog manager when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.changelogManager = new ChangelogManager();
});
