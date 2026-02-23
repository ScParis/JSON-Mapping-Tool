class JSONFinder {
    constructor(mapper) {
        this.mapper = mapper;
        this.data = null;
        this.selectedPath = '';
        this.expandedNodes = new Set();

        this.init();
    }

    init() {
        this.setupElements();
        this.setupEventListeners();
    }

    setupElements() {
        this.elements = {
            input: document.getElementById('finderInput'),
            treeView: document.getElementById('finderTreeView'),
            status: document.getElementById('finderStatus'),
            pathResult: document.getElementById('selectedPathResult'),
            copyBtn: document.getElementById('copyPathBtn'),
            clearBtn: document.getElementById('clearFinderBtn'),
            pasteBtn: document.getElementById('pasteFinderBtn'),
            expandAllBtn: document.getElementById('expandAllBtn'),
            collapseAllBtn: document.getElementById('collapseAllBtn'),

            // Playground elements
            queryInput: document.getElementById('jmespathQueryInput'),
            resultOutput: document.getElementById('jmespathResultOutput'),
            clearPlaygroundBtn: document.getElementById('clearPlaygroundBtn'),
            copyPlaygroundBtn: document.getElementById('copyPlaygroundBtn')
        };
    }

    setupEventListeners() {
        this.elements.input?.addEventListener('input', () => this.handleInput());
        this.elements.copyBtn?.addEventListener('click', () => this.copyPath());
        this.elements.clearBtn?.addEventListener('click', () => this.clear());
        this.elements.pasteBtn?.addEventListener('click', () => this.paste());
        this.elements.expandAllBtn?.addEventListener('click', () => this.expandAll());
        this.elements.collapseAllBtn?.addEventListener('click', () => this.collapseAll());

        // Playground events
        this.elements.queryInput?.addEventListener('input', () => this.handleQueryInput());
        this.elements.clearPlaygroundBtn?.addEventListener('click', () => this.clearPlayground());
        this.elements.copyPlaygroundBtn?.addEventListener('click', () => this.copyPlaygroundResult());
    }

    handleInput() {
        const val = this.elements.input.value.trim();
        if (!val) {
            this.clear();
            return;
        }

        try {
            this.data = JSON.parse(val);
            this.updateStatus('success', 'JSON carregado com sucesso');
            this.renderTree();
        } catch (e) {
            this.updateStatus('error', 'JSON inválido: ' + e.message);
            this.elements.treeView.innerHTML = `
                <div class="tree-placeholder error">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>JSON inválido. Corrija o erro para explorar.</p>
                </div>
            `;
        }
    }

    updateStatus(type, message) {
        const icon = type === 'success' ? 'check-circle' : (type === 'error' ? 'exclamation-circle' : 'info-circle');
        const color = type === 'success' ? '#22c55e' : (type === 'error' ? '#ef4444' : '#3b82f6');

        this.elements.status.innerHTML = `
            <i class="fas fa-${icon}" style="color: ${color}"></i>
            <span>${message}</span>
        `;

        // If JSON is valid, we might want to re-evaluate the query
        if (type === 'success' && this.elements.queryInput.value) {
            this.handleQueryInput();
        }
    }

    renderTree() {
        this.elements.treeView.innerHTML = '';
        const root = this.createNode('root', this.data, '');
        this.elements.treeView.appendChild(root);

        // Auto-expand root
        const rootToggle = root.querySelector('.tree-toggle');
        if (rootToggle) this.toggleNode(rootToggle);
    }

    createNode(key, value, path) {
        const container = document.createElement('div');
        container.className = 'tree-node';

        const isObject = typeof value === 'object' && value !== null;
        const currentPath = path ? (Array.isArray(value) ? path : path) : ''; // Path logic simplified for root

        const content = document.createElement('div');
        content.className = 'tree-node-content';
        content.dataset.path = path;

        // Toggle icon
        if (isObject && Object.keys(value).length > 0) {
            const toggle = document.createElement('div');
            toggle.className = 'tree-toggle collapsed';
            toggle.innerHTML = '<i class="fas fa-caret-down"></i>';
            toggle.onclick = (e) => {
                e.stopPropagation();
                this.toggleNode(toggle);
            };
            content.appendChild(toggle);
        } else {
            const spacer = document.createElement('div');
            spacer.style.width = '1rem';
            content.appendChild(spacer);
        }

        // Key/Index
        const keySpan = document.createElement('span');
        keySpan.className = 'tree-key';
        keySpan.textContent = key === 'root' ? (Array.isArray(value) ? '[]' : '{}') : key;
        content.appendChild(keySpan);

        if (!isObject) {
            const colon = document.createElement('span');
            colon.textContent = ': ';
            content.appendChild(colon);

            const valueSpan = document.createElement('span');
            valueSpan.className = `tree-value ${typeof value === 'string' ? 'string' : (typeof value === 'number' ? 'number' : (value === null ? 'null' : 'boolean'))}`;
            valueSpan.textContent = value === null ? 'null' : (typeof value === 'string' ? `"${value}"` : value);
            content.appendChild(valueSpan);
        }

        content.onclick = () => this.selectPath(path);
        container.appendChild(content);

        // Children
        if (isObject) {
            const childrenContainer = document.createElement('div');
            childrenContainer.className = 'tree-children';
            childrenContainer.style.display = 'none';

            for (const k in value) {
                const childPath = path ? (Array.isArray(value) ? `${path}[${k}]` : `${path}.${k}`) : k;
                childrenContainer.appendChild(this.createNode(k, value[k], childPath));
            }
            container.appendChild(childrenContainer);
        }

        return container;
    }

    toggleNode(toggleBtn) {
        const node = toggleBtn.closest('.tree-node');
        const children = node.querySelector('.tree-children');
        if (children) {
            const isCollapsed = toggleBtn.classList.contains('collapsed');
            if (isCollapsed) {
                toggleBtn.classList.remove('collapsed');
                children.style.display = 'block';
            } else {
                toggleBtn.classList.add('collapsed');
                children.style.display = 'none';
            }
        }
    }

    selectPath(path) {
        this.selectedPath = path;
        this.elements.pathResult.textContent = path || 'root';

        // Highlight selection
        document.querySelectorAll('.tree-node-content.selected').forEach(el => el.classList.remove('selected'));
        const selectedEl = document.querySelector(`.tree-node-content[data-path="${path}"]`);
        if (selectedEl) selectedEl.classList.add('selected');
    }

    async copyPath() {
        if (!this.selectedPath) return;
        try {
            await navigator.clipboard.writeText(this.selectedPath);
            this.mapper.showToast('success', 'Copiado', 'Caminho copiado para a área de transferência');
        } catch (e) {
            this.mapper.showToast('error', 'Erro', 'Não foi possível copiar');
        }
    }

    clear() {
        this.elements.input.value = '';
        this.elements.treeView.innerHTML = `
            <div class="tree-placeholder">
                <i class="fas fa-long-arrow-alt-left"></i>
                <p>Cole um JSON à esquerda para visualizar a estrutura</p>
            </div>
        `;
        this.elements.pathResult.textContent = '...';
        this.selectedPath = '';
        this.updateStatus('info', 'Aguardando entrada');
    }

    async paste() {
        try {
            const text = await navigator.clipboard.readText();
            this.elements.input.value = text;
            this.handleInput();
        } catch (e) {
            this.mapper.showToast('error', 'Erro', 'Não foi possível colar');
        }
    }

    expandAll() {
        document.querySelectorAll('.tree-toggle.collapsed').forEach(btn => this.toggleNode(btn));
    }

    collapseAll() {
        document.querySelectorAll('.tree-toggle:not(.collapsed)').forEach(btn => this.toggleNode(btn));
    }

    handleQueryInput() {
        const query = this.elements.queryInput.value.trim();
        if (!query) {
            this.elements.resultOutput.value = '';
            return;
        }

        if (!this.data) {
            this.elements.resultOutput.value = 'Aguardando JSON válido...';
            return;
        }

        try {
            // jmespath should be available globally
            const result = jmespath.search(this.data, query);
            this.elements.resultOutput.value = JSON.stringify(result, null, 2);
        } catch (e) {
            this.elements.resultOutput.value = `Erro na expressão: ${e.message}`;
        }
    }

    clearPlayground() {
        this.elements.queryInput.value = '';
        this.elements.resultOutput.value = '';
    }

    async copyPlaygroundResult() {
        const result = this.elements.resultOutput.value;
        if (!result) return;
        try {
            await navigator.clipboard.writeText(result);
            this.mapper.showToast('success', 'Copiado', 'Resultado copiado para a área de transferência');
        } catch (e) {
            this.mapper.showToast('error', 'Erro', 'Não foi possível copiar');
        }
    }
}

// Injected into script.js load sequence
window.JSONFinder = JSONFinder;
