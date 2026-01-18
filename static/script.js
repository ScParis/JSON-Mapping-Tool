/* ===== MODERN JAVASCRIPT 2026 ===== */

class JSONMapper {
    constructor() {
        this.sourceJson = null;
        this.targetJson = null;
        this.mappedJson = null;
        this.keysList = [];
        this.mappingConfig = {};
        
        this.init();
    }

    init() {
        this.setupElements();
        this.setupEventListeners();
        this.setupTheme();
        this.loadExamples();
    }

    setupElements() {
        // Main elements
        this.elements = {
            // JSON editors
            sourceJson: document.getElementById('sourceJson'),
            targetJson: document.getElementById('targetJson'),
            mappedJson: document.getElementById('mappedJson'),
            
            // Status indicators
            sourceStatus: document.getElementById('sourceStatus'),
            targetStatus: document.getElementById('targetStatus'),
            mappedStatus: document.getElementById('mappedStatus'),
            
            // Info displays
            mappedCount: document.getElementById('mappedCount'),
            mappingStatus: document.getElementById('mappingStatus'),
            lastAction: document.getElementById('lastAction'),
            
            // Buttons
            newMappingBtn: document.getElementById('newMappingBtn'),
            loadExamplesBtn: document.getElementById('loadExamplesBtn'),
            clearAllBtn: document.getElementById('clearAllBtn'),
            generateMappingBtn: document.getElementById('generateMappingBtn'),
            executeMappingBtn: document.getElementById('executeMappingBtn'),
            
            // Toolbar buttons
            validateJsonBtn: document.getElementById('validateJsonBtn'),
            formatJsonBtn: document.getElementById('formatJsonBtn'),
            minifyJsonBtn: document.getElementById('minifyJsonBtn'),
            importFileBtn: document.getElementById('importFileBtn'),
            exportBtn: document.getElementById('exportBtn'),
            
            // Panel buttons
            clearSourceBtn: document.getElementById('clearSourceBtn'),
            pasteSourceBtn: document.getElementById('pasteSourceBtn'),
            uploadSourceBtn: document.getElementById('uploadSourceBtn'),
            clearTargetBtn: document.getElementById('clearTargetBtn'),
            pasteTargetBtn: document.getElementById('pasteTargetBtn'),
            uploadTargetBtn: document.getElementById('uploadTargetBtn'),
            copyMappedBtn: document.getElementById('copyMappedBtn'),
            downloadMappedBtn: document.getElementById('downloadMappedBtn'),
            
            // Modal elements
            mappingModal: document.getElementById('mappingModal'),
            mappingForm: document.getElementById('mappingForm'),
            closeModalBtn: document.getElementById('closeModalBtn'),
            cancelMappingBtn: document.getElementById('cancelMappingBtn'),
            saveMappingBtn: document.getElementById('saveMappingBtn'),
            
            // Theme and UI
            themeToggle: document.getElementById('themeToggle'),
            helpBtn: document.getElementById('helpBtn'),
            fullscreenBtn: document.getElementById('fullscreenBtn'),
            
            // Loading and notifications
            loadingOverlay: document.getElementById('loadingOverlay'),
            toastContainer: document.getElementById('toastContainer')
        };
    }

    setupEventListeners() {
        // Main action buttons
        this.elements.newMappingBtn?.addEventListener('click', () => this.newMapping());
        this.elements.loadExamplesBtn?.addEventListener('click', () => this.loadExamples());
        this.elements.clearAllBtn?.addEventListener('click', () => this.clearAll());
        this.elements.generateMappingBtn?.addEventListener('click', () => this.generateMapping());
        this.elements.executeMappingBtn?.addEventListener('click', () => this.executeMapping());
        
        // Toolbar buttons
        this.elements.validateJsonBtn?.addEventListener('click', () => this.validateJson());
        this.elements.formatJsonBtn?.addEventListener('click', () => this.formatJson());
        this.elements.minifyJsonBtn?.addEventListener('click', () => this.minifyJson());
        this.elements.importFileBtn?.addEventListener('click', () => this.importFile());
        this.elements.exportBtn?.addEventListener('click', () => this.exportMapping());
        
        // Panel buttons
        this.elements.clearSourceBtn?.addEventListener('click', () => this.clearEditor('source'));
        this.elements.pasteSourceBtn?.addEventListener('click', () => this.pasteFromClipboard('source'));
        this.elements.uploadSourceBtn?.addEventListener('click', () => this.uploadFile('source'));
        this.elements.clearTargetBtn?.addEventListener('click', () => this.clearEditor('target'));
        this.elements.pasteTargetBtn?.addEventListener('click', () => this.pasteFromClipboard('target'));
        this.elements.uploadTargetBtn?.addEventListener('click', () => this.uploadFile('target'));
        this.elements.copyMappedBtn?.addEventListener('click', () => this.copyToClipboard('mapped'));
        this.elements.downloadMappedBtn?.addEventListener('click', () => this.downloadMapped());
        
        // Modal buttons
        this.elements.closeModalBtn?.addEventListener('click', () => this.closeModal());
        this.elements.cancelMappingBtn?.addEventListener('click', () => this.closeModal());
        this.elements.saveMappingBtn?.addEventListener('click', () => this.saveMapping());
        
        // UI controls
        this.elements.themeToggle?.addEventListener('change', (e) => this.toggleTheme(e.target.checked));
        this.elements.helpBtn?.addEventListener('click', () => this.showHelp());
        this.elements.fullscreenBtn?.addEventListener('click', () => this.toggleFullscreen());
        
        // JSON editor events
        this.elements.sourceJson?.addEventListener('input', () => this.validateSourceJson());
        this.elements.targetJson?.addEventListener('input', () => this.validateTargetJson());
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyboard(e));
        
        // Navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.handleNavigation(e));
        });
    }

    setupTheme() {
        const savedTheme = localStorage.getItem('theme');
        const isDark = savedTheme === 'dark';
        
        if (isDark) {
            document.body.classList.add('dark-theme');
            this.elements.themeToggle.checked = false;
        }
    }

    // ===== JSON OPERATIONS =====
    
    validateJson(jsonString) {
        try {
            JSON.parse(jsonString);
            return { isValid: true, error: null };
        } catch (error) {
            return { 
                isValid: false, 
                error: {
                    message: error.message,
                    position: error.message.match(/(\d+)$/)?.[1] || 'desconhecida'
                }
            };
        }
    }

    validateSourceJson() {
        const jsonText = this.elements.sourceJson.value;
        const validation = this.validateJson(jsonText);
        
        if (validation.isValid) {
            this.updateStatus('source', 'valid', 'Válido');
            this.sourceJson = JSON.parse(jsonText);
        } else {
            this.updateStatus('source', 'error', `Erro: ${validation.error.message}`);
            this.sourceJson = null;
        }
        
        return validation.isValid;
    }

    validateTargetJson() {
        const jsonText = this.elements.targetJson.value;
        const validation = this.validateJson(jsonText);
        
        if (validation.isValid) {
            this.updateStatus('target', 'valid', 'Válido');
            this.targetJson = JSON.parse(jsonText);
        } else {
            this.updateStatus('target', 'error', `Erro: ${validation.error.message}`);
            this.targetJson = null;
        }
        
        return validation.isValid;
    }

    formatJson() {
        ['source', 'target'].forEach(type => {
            const editor = this.elements[`${type}Json`];
            if (editor.value) {
                try {
                    const parsed = JSON.parse(editor.value);
                    editor.value = JSON.stringify(parsed, null, 2);
                    this.showToast('success', 'JSON Formatado', 'JSON formatado com sucesso');
                } catch (error) {
                    this.showToast('error', 'Erro', 'JSON inválido, não foi possível formatar');
                }
            }
        });
    }

    minifyJson() {
        ['source', 'target'].forEach(type => {
            const editor = this.elements[`${type}Json`];
            if (editor.value) {
                try {
                    const parsed = JSON.parse(editor.value);
                    editor.value = JSON.stringify(parsed);
                    this.showToast('success', 'JSON Minificado', 'JSON minificado com sucesso');
                } catch (error) {
                    this.showToast('error', 'Erro', 'JSON inválido, não foi possível minificar');
                }
            }
        });
    }

    // ===== MAPPING OPERATIONS =====
    
    generateKeysList(json, prefix = '') {
        let keys = [];
        
        for (const key in json) {
            if (json.hasOwnProperty(key)) {
                const fullKey = prefix ? `${prefix}.${key}` : key;
                
                if (typeof json[key] === 'object' && json[key] !== null && !Array.isArray(json[key])) {
                    keys = keys.concat(this.generateKeysList(json[key], fullKey));
                } else {
                    keys.push(fullKey);
                }
            }
        }
        
        return keys;
    }

    generateMapping() {
        if (!this.validateSourceJson() || !this.validateTargetJson()) {
            this.showToast('error', 'Erro de Validação', 'Verifique se ambos os JSONs são válidos');
            return;
        }

        this.showLoading(true, 'Gerando mapeamento...');
        
        try {
            // Extract keys from source JSON
            this.keysList = this.generateKeysList(this.sourceJson);
            
            // Generate mapping form
            this.generateMappingForm();
            
            // Show modal
            this.openModal();
            
            this.updateLastAction('Mapeamento gerado');
            this.showToast('success', 'Mapeamento Gerado', 'Configure o mapeamento dos campos');
            
        } catch (error) {
            this.showToast('error', 'Erro', 'Não foi possível gerar o mapeamento');
            console.error('Error generating mapping:', error);
        } finally {
            this.showLoading(false);
        }
    }

    generateMappingForm() {
        this.elements.mappingForm.innerHTML = '';
        
        const form = this.createMappingFields(this.targetJson, this.keysList);
        this.elements.mappingForm.appendChild(form);
    }

    createMappingFields(json, availablePaths, depth = 0, parentKeyPath = '') {
        const fragment = document.createDocumentFragment();
        
        for (const key in json) {
            if (json.hasOwnProperty(key)) {
                const value = json[key];
                const keyPath = parentKeyPath ? `${parentKeyPath}.${key}` : key;
                
                const fieldContainer = document.createElement('div');
                fieldContainer.className = 'mapping-field';
                fieldContainer.style.marginLeft = `${depth * 20}px`;
                
                // Field label
                const label = document.createElement('div');
                label.className = 'mapping-field-label';
                label.innerHTML = `
                    <i class="fas fa-${this.getFieldIcon(key)}"></i>
                    ${this.formatFieldName(key)}
                    <span class="field-path">${keyPath}</span>
                `;
                fieldContainer.appendChild(label);
                
                // Field type info
                const typeInfo = document.createElement('div');
                typeInfo.className = 'field-type-info';
                typeInfo.style.fontSize = '0.75rem';
                typeInfo.style.color = '#6b7280';
                typeInfo.style.marginBottom = '8px';
                
                if (Array.isArray(value)) {
                    typeInfo.textContent = `Array[${value.length}]`;
                    if (value.length > 0 && typeof value[0] === 'object') {
                        // Process array items
                        value.forEach((item, index) => {
                            const arrayItemContainer = document.createElement('div');
                            arrayItemContainer.style.marginLeft = '20px';
                            arrayItemContainer.style.marginTop = '8px';
                            arrayItemContainer.style.padding = '8px';
                            arrayItemContainer.style.backgroundColor = '#f3f4f6';
                            arrayItemContainer.style.borderRadius = '6px';
                            
                            const arrayHeader = document.createElement('div');
                            arrayHeader.style.fontWeight = '600';
                            arrayHeader.style.marginBottom = '8px';
                            arrayHeader.textContent = `Item [${index}]`;
                            arrayItemContainer.appendChild(arrayHeader);
                            
                            const childFields = this.createMappingFields(item, availablePaths, depth + 1, `${keyPath}[${index}]`);
                            if (childFields) {
                                arrayItemContainer.appendChild(childFields);
                            }
                            
                            fieldContainer.appendChild(arrayItemContainer);
                        });
                    } else {
                        // Create select for array
                        const select = this.createSelectField(keyPath, availablePaths, key);
                        fieldContainer.appendChild(select);
                    }
                } else if (typeof value === 'object' && value !== null) {
                    typeInfo.textContent = `Objeto com ${Object.keys(value).length} propriedades`;
                    fieldContainer.appendChild(typeInfo);
                    
                    // Process nested object
                    const childFields = this.createMappingFields(value, availablePaths, depth + 1, keyPath);
                    if (childFields) {
                        fieldContainer.appendChild(childFields);
                    }
                } else {
                    typeInfo.textContent = `Tipo: ${typeof value}`;
                    fieldContainer.appendChild(typeInfo);
                    
                    // Create select for primitive value
                    const select = this.createSelectField(keyPath, availablePaths, key);
                    fieldContainer.appendChild(select);
                }
                
                fragment.appendChild(fieldContainer);
            }
        }
        
        return fragment;
    }

    createSelectField(keyPath, availablePaths, fieldName) {
        const selectContainer = document.createElement('div');
        selectContainer.style.marginTop = '8px';
        
        const select = document.createElement('select');
        select.id = keyPath.replace(/\./g, '_').replace(/\[/g, '_').replace(/\]/g, '');
        select.name = keyPath;
        select.className = 'mapping-field-select';
        
        // Default option
        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.textContent = `-- Selecione origem para ${fieldName} --`;
        select.appendChild(defaultOption);
        
        // Add available paths
        if (availablePaths && availablePaths.length > 0) {
            // Group paths by category
            const groupedPaths = this.groupPathsByCategory(availablePaths);
            
            for (const [category, paths] of Object.entries(groupedPaths)) {
                if (category !== 'root') {
                    const optgroup = document.createElement('optgroup');
                    optgroup.label = this.formatCategoryName(category);
                    
                    paths.forEach(path => {
                        const option = document.createElement('option');
                        option.value = path;
                        option.textContent = path;
                        optgroup.appendChild(option);
                    });
                    
                    select.appendChild(optgroup);
                } else {
                    paths.forEach(path => {
                        const option = document.createElement('option');
                        option.value = path;
                        option.textContent = path;
                        select.appendChild(option);
                    });
                }
            }
        }
        
        selectContainer.appendChild(select);
        return selectContainer;
    }

    executeMapping() {
        if (!this.sourceJson || !this.targetJson) {
            this.showToast('error', 'Erro', 'Carregue os JSONs de origem e destino');
            return;
        }

        this.showLoading(true, 'Executando mapeamento...');
        
        try {
            // Get mapping configuration from form
            const selects = this.elements.mappingForm.querySelectorAll('select');
            this.mappingConfig = {};
            
            selects.forEach(select => {
                if (select.value) {
                    this.mappingConfig[select.name] = select.value;
                }
            });
            
            // Execute mapping
            this.mappedJson = this.performMapping();
            
            // Display result
            this.elements.mappedJson.value = JSON.stringify(this.mappedJson, null, 2);
            this.updateStatus('mapped', 'success', 'Mapeamento concluído');
            
            // Update info
            this.elements.mappedCount.textContent = Object.keys(this.mappingConfig).length;
            this.elements.mappingStatus.textContent = 'Concluído';
            this.elements.mappingStatus.className = 'info-value status success';
            
            this.updateLastAction('Mapeamento executado');
            this.showToast('success', 'Mapeamento Concluído', `${Object.keys(this.mappingConfig).length} campos mapeados`);
            
            this.closeModal();
            
        } catch (error) {
            this.showToast('error', 'Erro', 'Não foi possível executar o mapeamento');
            console.error('Error executing mapping:', error);
        } finally {
            this.showLoading(false);
        }
    }

    performMapping() {
        const result = {};
        
        for (const [targetPath, sourcePath] of Object.entries(this.mappingConfig)) {
            const sourceValue = this.getNestedValue(this.sourceJson, sourcePath);
            this.setNestedValue(result, targetPath, sourceValue);
        }
        
        return result;
    }

    getNestedValue(obj, path) {
        return path.split('.').reduce((current, key) => {
            if (key.includes('[') && key.includes(']')) {
                const [arrayKey, indexStr] = key.split('[');
                const index = parseInt(indexStr.replace(']', ''));
                return current[arrayKey]?.[index];
            }
            return current?.[key];
        }, obj);
    }

    setNestedValue(obj, path, value) {
        const keys = path.split('.');
        let current = obj;
        
        for (let i = 0; i < keys.length - 1; i++) {
            const key = keys[i];
            
            if (key.includes('[') && key.includes(']')) {
                const [arrayKey, indexStr] = key.split('[');
                const index = parseInt(indexStr.replace(']', ''));
                
                if (!current[arrayKey]) current[arrayKey] = [];
                if (!current[arrayKey][index]) current[arrayKey][index] = {};
                
                current = current[arrayKey][index];
            } else {
                if (!current[key]) current[key] = {};
                current = current[key];
            }
        }
        
        const lastKey = keys[keys.length - 1];
        if (lastKey.includes('[') && lastKey.includes(']')) {
            const [arrayKey, indexStr] = lastKey.split('[');
            const index = parseInt(indexStr.replace(']', ''));
            
            if (!current[arrayKey]) current[arrayKey] = [];
            current[arrayKey][index] = value;
        } else {
            current[lastKey] = value;
        }
    }

    // ===== UTILITY METHODS =====
    
    getFieldIcon(fieldName) {
        const iconMap = {
            'id': 'hashtag',
            'nome': 'user',
            'name': 'user',
            'email': 'envelope',
            'telefone': 'phone',
            'phone': 'phone',
            'endereco': 'map-marker-alt',
            'address': 'map-marker-alt',
            'data': 'calendar',
            'date': 'calendar',
            'valor': 'dollar-sign',
            'value': 'dollar-sign',
            'codigo': 'barcode',
            'code': 'barcode',
            'tipo': 'tag',
            'type': 'tag',
            'status': 'info-circle',
            'descricao': 'align-left',
            'description': 'align-left',
            'pedido': 'shopping-cart',
            'order': 'shopping-cart',
            'cliente': 'user',
            'customer': 'user',
            'produto': 'box',
            'product': 'box',
            'item': 'cube',
            'entrega': 'truck',
            'delivery': 'truck',
            'pagamento': 'credit-card',
            'payment': 'credit-card'
        };
        
        return iconMap[fieldName.toLowerCase()] || 'chevron-right';
    }

    formatFieldName(fieldName) {
        return fieldName.charAt(0).toUpperCase() + fieldName.slice(1).replace(/([A-Z])/g, ' $1');
    }

    groupPathsByCategory(paths) {
        const grouped = { root: [] };
        
        paths.forEach(path => {
            const parts = path.split('.');
            if (parts.length === 1) {
                grouped.root.push(path);
            } else {
                const category = parts[0];
                if (!grouped[category]) {
                    grouped[category] = [];
                }
                grouped[category].push(path);
            }
        });
        
        return grouped;
    }

    formatCategoryName(category) {
        const categoryMap = {
            'pedido': '📋 Pedido',
            'cliente': '👤 Cliente',
            'produto': '📦 Produto',
            'endereco': '📍 Endereço',
            'pagamento': '💳 Pagamento',
            'entrega': '🚚 Entrega'
        };
        
        return categoryMap[category.toLowerCase()] || `📁 ${category.charAt(0).toUpperCase() + category.slice(1)}`;
    }

    // ===== UI OPERATIONS =====
    
    updateStatus(type, status, message) {
        const statusElement = this.elements[`${type}Status`];
        if (!statusElement) return;
        
        const iconMap = {
            valid: 'check-circle',
            error: 'exclamation-circle',
            success: 'check-circle',
            warning: 'exclamation-triangle',
            info: 'info-circle'
        };
        
        const colorMap = {
            valid: '#22c55e',
            error: '#ef4444',
            success: '#22c55e',
            warning: '#f59e0b',
            info: '#3b82f6'
        };
        
        statusElement.innerHTML = `
            <i class="fas fa-${iconMap[status]}" style="color: ${colorMap[status]}"></i>
            <span>${message}</span>
        `;
    }

    updateLastAction(action) {
        if (this.elements.lastAction) {
            this.elements.lastAction.textContent = action;
        }
    }

    openModal() {
        this.elements.mappingModal?.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    closeModal() {
        this.elements.mappingModal?.classList.remove('active');
        document.body.style.overflow = '';
    }

    saveMapping() {
        // Save mapping configuration
        localStorage.setItem('mappingConfig', JSON.stringify(this.mappingConfig));
        this.showToast('success', 'Mapeamento Salvo', 'Configuração salva com sucesso');
        this.closeModal();
    }

    // ===== FILE OPERATIONS =====
    
    async importFile() {
        try {
            const [fileHandle] = await window.showOpenFilePicker({
                types: [{
                    description: 'JSON files',
                    accept: { 'application/json': ['.json'] }
                }]
            });
            
            const file = await fileHandle.getFile();
            const content = await file.text();
            
            // Determine if it's source or target based on user choice
            // For now, let's put it in source
            this.elements.sourceJson.value = content;
            this.validateSourceJson();
            
            this.showToast('success', 'Arquivo Importado', 'JSON importado com sucesso');
        } catch (error) {
            if (error.name !== 'AbortError') {
                this.showToast('error', 'Erro', 'Não foi possível importar o arquivo');
            }
        }
    }

    exportMapping() {
        if (!this.mappedJson) {
            this.showToast('warning', 'Aviso', 'Nenhum mapeamento para exportar');
            return;
        }

        const dataStr = JSON.stringify(this.mappedJson, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        
        const exportFileDefaultName = 'mapped-json.json';
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
        
        this.showToast('success', 'Exportado', 'JSON mapeado exportado com sucesso');
    }

    async uploadFile(type) {
        try {
            const [fileHandle] = await window.showOpenFilePicker({
                types: [{
                    description: 'JSON files',
                    accept: { 'application/json': ['.json'] }
                }]
            });
            
            const file = await fileHandle.getFile();
            const content = await file.text();
            
            this.elements[`${type}Json`].value = content;
            this[`validate${type.charAt(0).toUpperCase() + type.slice(1)}Json`]();
            
            this.showToast('success', 'Arquivo Carregado', `JSON de ${type} carregado com sucesso`);
        } catch (error) {
            if (error.name !== 'AbortError') {
                this.showToast('error', 'Erro', 'Não foi possível carregar o arquivo');
            }
        }
    }

    async pasteFromClipboard(type) {
        try {
            const text = await navigator.clipboard.readText();
            this.elements[`${type}Json`].value = text;
            this[`validate${type.charAt(0).toUpperCase() + type.slice(1)}Json`]();
            
            this.showToast('success', 'Colado', 'JSON colado com sucesso');
        } catch (error) {
            this.showToast('error', 'Erro', 'Não foi possível colar da área de transferência');
        }
    }

    async copyToClipboard(type) {
        try {
            const text = this.elements[`${type}Json`].value;
            await navigator.clipboard.writeText(text);
            
            this.showToast('success', 'Copiado', 'JSON copiado para a área de transferência');
        } catch (error) {
            this.showToast('error', 'Erro', 'Não foi possível copiar para a área de transferência');
        }
    }

    downloadMapped() {
        if (!this.mappedJson) {
            this.showToast('warning', 'Aviso', 'Nenhum mapeamento para baixar');
            return;
        }

        const dataStr = JSON.stringify(this.mappedJson, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        
        const exportFileDefaultName = `mapped-json-${new Date().toISOString().slice(0,10)}.json`;
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
        
        this.showToast('success', 'Baixado', 'JSON mapeado baixado com sucesso');
    }

    // ===== ACTIONS =====
    
    newMapping() {
        this.clearAll();
        this.showToast('info', 'Novo Mapeamento', 'Comece um novo mapeamento');
    }

    clearAll() {
        this.elements.sourceJson.value = '';
        this.elements.targetJson.value = '';
        this.elements.mappedJson.value = '';
        
        this.sourceJson = null;
        this.targetJson = null;
        this.mappedJson = null;
        this.keysList = [];
        this.mappingConfig = {};
        
        this.updateStatus('source', 'info', 'Vazio');
        this.updateStatus('target', 'info', 'Vazio');
        this.updateStatus('mapped', 'info', 'Aguardando');
        
        this.elements.mappedCount.textContent = '0';
        this.elements.mappingStatus.textContent = 'Pronto';
        this.elements.mappingStatus.className = 'info-value status';
        
        this.updateLastAction('Campos limpos');
        this.showToast('info', 'Limpo', 'Todos os campos foram limpos');
    }

    clearEditor(type) {
        this.elements[`${type}Json`].value = '';
        this[`${type}Json`] = null;
        this.updateStatus(type, 'info', 'Vazio');
        this.updateLastAction(`${type} limpo`);
    }

    loadExamples() {
        const exampleSource = {
            "pedido": {
                "id": 1,
                "vendedor": "João Silva",
                "data": "2023-09-16",
                "entrega": {
                    "tipo": "Expressa",
                    "preco": 25.90
                },
                "itens": [
                    {
                        "id": 101,
                        "nome": "Notebook",
                        "quantidade": 2,
                        "preco": 3500.00
                    },
                    {
                        "id": 205,
                        "nome": "Mouse Sem Fio",
                        "quantidade": 1,
                        "preco": 120.00
                    }
                ]
            },
            "cliente": {
                "id": 42,
                "nome": "Maria Oliveira",
                "email": "maria@exemplo.com"
            }
        };

        const exampleTarget = {
            "order": {
                "number": "",
                "date": "",
                "items": [
                    {
                        "code": "",
                        "description": "",
                        "quantity": 0,
                        "unitPrice": 0.0,
                        "totalPrice": 0.0
                    }
                ],
                "delivery": {
                    "type": "",
                    "cost": 0.0
                }
            },
            "customer": {
                "id": "",
                "name": "",
                "contact": ""
            }
        };

        this.elements.sourceJson.value = JSON.stringify(exampleSource, null, 2);
        this.elements.targetJson.value = JSON.stringify(exampleTarget, null, 2);
        
        this.validateSourceJson();
        this.validateTargetJson();
        
        this.updateLastAction('Exemplos carregados');
        this.showToast('success', 'Exemplos Carregados', 'JSONs de exemplo foram carregados');
    }

    // ===== THEME AND UI =====
    
    toggleTheme(isDark) {
        if (isDark) {
            document.body.classList.remove('dark-theme');
            localStorage.setItem('theme', 'light');
        } else {
            document.body.classList.add('dark-theme');
            localStorage.setItem('theme', 'dark');
        }
    }

    showHelp() {
        this.showToast('info', 'Ajuda', 'Use os botões para carregar exemplos e gerar mapeamentos');
    }

    toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
            this.elements.fullscreenBtn.innerHTML = '<i class="fas fa-compress"></i>';
        } else {
            document.exitFullscreen();
            this.elements.fullscreenBtn.innerHTML = '<i class="fas fa-expand"></i>';
        }
    }

    handleNavigation(e) {
        const btn = e.currentTarget;
        const view = btn.dataset.view;
        
        // Remove active class from all buttons
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        // Handle view changes (placeholder for future views)
        this.showToast('info', 'Navegação', `Visualização: ${view}`);
    }

    handleKeyboard(e) {
        // Ctrl/Cmd + S: Save mapping
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            if (this.mappedJson) {
                this.exportMapping();
            }
        }
        
        // Ctrl/Cmd + N: New mapping
        if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
            e.preventDefault();
            this.newMapping();
        }
        
        // Ctrl/Cmd + O: Open file
        if ((e.ctrlKey || e.metaKey) && e.key === 'o') {
            e.preventDefault();
            this.importFile();
        }
        
        // Escape: Close modal
        if (e.key === 'Escape') {
            this.closeModal();
        }
        
        // F11: Fullscreen
        if (e.key === 'F11') {
            e.preventDefault();
            this.toggleFullscreen();
        }
    }

    // ===== NOTIFICATIONS =====
    
    showLoading(show = true, message = 'Processando...') {
        if (show) {
            this.elements.loadingOverlay?.classList.add('active');
            const loadingText = this.elements.loadingOverlay?.querySelector('p');
            if (loadingText) loadingText.textContent = message;
        } else {
            this.elements.loadingOverlay?.classList.remove('active');
        }
    }

    showToast(type, title, message) {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const iconMap = {
            success: 'check-circle',
            error: 'exclamation-circle',
            warning: 'exclamation-triangle',
            info: 'info-circle'
        };
        
        toast.innerHTML = `
            <div class="toast-icon">
                <i class="fas fa-${iconMap[type]}"></i>
            </div>
            <div class="toast-content">
                <div class="toast-title">${title}</div>
                <div class="toast-message">${message}</div>
            </div>
            <button class="toast-close">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        this.elements.toastContainer.appendChild(toast);
        
        // Add close functionality
        const closeBtn = toast.querySelector('.toast-close');
        closeBtn.addEventListener('click', () => this.removeToast(toast));
        
        // Auto remove after 5 seconds
        setTimeout(() => this.removeToast(toast), 5000);
        
        // Trigger animation
        requestAnimationFrame(() => toast.classList.add('show'));
    }

    removeToast(toast) {
        toast.classList.remove('show');
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }
}

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', () => {
    new JSONMapper();
});
