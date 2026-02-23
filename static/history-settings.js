// ===== HISTORY & SETTINGS FUNCTIONALITY =====

class HistorySettingsManager {
    constructor(jsonMapper) {
        this.jsonMapper = jsonMapper;
        this.init();
    }

    init() {
        this.setupElements();
        this.setupEventListeners();
        this.loadSettings();
    }

    setupElements() {
        this.elements = {
            // History elements
            historySection: document.getElementById('historySection'),
            historyList: document.getElementById('historyList'),
            clearHistoryBtn: document.getElementById('clearHistoryBtn'),
            
            // Settings elements
            settingsSection: document.getElementById('settingsSection'),
            themeSelect: document.getElementById('themeSelect'),
            fontSizeSelect: document.getElementById('fontSizeSelect'),
            autoSaveCheck: document.getElementById('autoSaveCheck'),
            notificationsCheck: document.getElementById('notificationsCheck'),
            exportDataBtn: document.getElementById('exportDataBtn'),
            importDataBtn: document.getElementById('importDataBtn'),
            resetDataBtn: document.getElementById('resetDataBtn'),
            saveSettingsBtn: document.getElementById('saveSettingsBtn')
        };
    }

    setupEventListeners() {
        // History buttons
        this.elements.clearHistoryBtn?.addEventListener('click', () => this.clearHistory());
        
        // Settings buttons
        this.elements.saveSettingsBtn?.addEventListener('click', () => this.saveSettings());
        this.elements.exportDataBtn?.addEventListener('click', () => this.exportData());
        this.elements.importDataBtn?.addEventListener('click', () => this.importData());
        this.elements.resetDataBtn?.addEventListener('click', () => this.resetData());
    }

    // ===== NAVIGATION =====
    handleNavigation(view) {
        // Hide all sections
        this.elements.historySection.style.display = 'none';
        this.elements.settingsSection.style.display = 'none';
        
        // Show selected section
        switch(view) {
            case 'history':
                this.elements.historySection.style.display = 'block';
                this.loadHistory();
                break;
            case 'settings':
                this.elements.settingsSection.style.display = 'block';
                this.loadSettings();
                break;
        }
    }

    // ===== HISTORY METHODS =====
    loadHistory() {
        const history = JSON.parse(localStorage.getItem('mappingHistory') || '[]');
        this.elements.historyList.innerHTML = '';
        
        if (history.length === 0) {
            this.elements.historyList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-history"></i>
                    <p>Nenhum mapeamento no histórico.</p>
                </div>
            `;
            return;
        }
        
        history.forEach((item, index) => {
            const historyItem = this.createHistoryItem(item, index);
            this.elements.historyList.appendChild(historyItem);
        });
    }
    
    createHistoryItem(item, index) {
        const div = document.createElement('div');
        div.className = 'history-item';
        
        const date = new Date(item.timestamp);
        const formattedDate = date.toLocaleString('pt-BR');
        
        div.innerHTML = `
            <div class="history-item-header">
                <div class="history-item-title">Mapeamento #${index + 1}</div>
                <div class="history-item-date">${formattedDate}</div>
            </div>
            <div class="history-item-content">
                <div class="history-item-preview">
                    <strong>Origem:</strong> ${this.truncateJson(item.sourceJson)}
                </div>
                <div class="history-item-preview">
                    <strong>Destino:</strong> ${this.truncateJson(item.targetJson)}
                </div>
            </div>
            <div class="history-item-actions">
                <button class="btn btn-sm btn-primary" onclick="historyManager.loadHistoryItem(${index})">
                    <i class="fas fa-redo"></i> Carregar
                </button>
                <button class="btn btn-sm btn-outline" onclick="historyManager.deleteHistoryItem(${index})">
                    <i class="fas fa-trash"></i> Excluir
                </button>
            </div>
        `;
        
        return div;
    }
    
    truncateJson(jsonString) {
        if (!jsonString) return 'Vazio';
        try {
            const parsed = JSON.parse(jsonString);
            const str = JSON.stringify(parsed);
            return str.length > 100 ? str.substring(0, 100) + '...' : str;
        } catch {
            return jsonString.length > 100 ? jsonString.substring(0, 100) + '...' : jsonString;
        }
    }
    
    loadHistoryItem(index) {
        const history = JSON.parse(localStorage.getItem('mappingHistory') || '[]');
        const item = history[index];
        
        if (item) {
            this.jsonMapper.elements.sourceJson.value = item.sourceJson;
            this.jsonMapper.elements.targetJson.value = item.targetJson;
            this.jsonMapper.elements.mappedJson.value = item.mappedJson || '';
            this.jsonMapper.mappingConfig = item.mappingConfig || {};
            
            // Switch to mapper view
            document.querySelector('.nav-btn[data-view="mapper"]').click();
            
            this.jsonMapper.showToast('success', 'Histórico', 'Mapeamento carregado com sucesso!');
        }
    }
    
    deleteHistoryItem(index) {
        const history = JSON.parse(localStorage.getItem('mappingHistory') || '[]');
        history.splice(index, 1);
        localStorage.setItem('mappingHistory', JSON.stringify(history));
        this.loadHistory();
        this.jsonMapper.showToast('info', 'Histórico', 'Item excluído do histórico.');
    }
    
    clearHistory() {
        if (confirm('Tem certeza que deseja limpar todo o histórico?')) {
            localStorage.removeItem('mappingHistory');
            this.loadHistory();
            this.jsonMapper.showToast('info', 'Histórico', 'Histórico limpo com sucesso.');
        }
    }
    
    addToHistory() {
        if (!this.jsonMapper.sourceJson || !this.jsonMapper.targetJson) return;
        
        const history = JSON.parse(localStorage.getItem('mappingHistory') || '[]');
        const newItem = {
            sourceJson: this.jsonMapper.elements.sourceJson.value,
            targetJson: this.jsonMapper.elements.targetJson.value,
            mappedJson: this.jsonMapper.elements.mappedJson.value,
            mappingConfig: this.jsonMapper.mappingConfig,
            timestamp: new Date().toISOString()
        };
        
        history.unshift(newItem);
        if (history.length > 50) history.pop();
        
        localStorage.setItem('mappingHistory', JSON.stringify(history));
    }

    // ===== SETTINGS METHODS =====
    loadSettings() {
        const settings = JSON.parse(localStorage.getItem('appSettings') || '{}');
        
        this.elements.themeSelect.value = settings.theme || 'system';
        this.elements.fontSizeSelect.value = settings.fontSize || 'medium';
        this.elements.autoSaveCheck.checked = settings.autoSave !== false;
        this.elements.notificationsCheck.checked = settings.notifications !== false;
        
        this.applySettings(settings);
    }
    
    saveSettings() {
        const settings = {
            theme: this.elements.themeSelect.value,
            fontSize: this.elements.fontSizeSelect.value,
            autoSave: this.elements.autoSaveCheck.checked,
            notifications: this.elements.notificationsCheck.checked
        };
        
        localStorage.setItem('appSettings', JSON.stringify(settings));
        this.applySettings(settings);
        this.jsonMapper.showToast('success', 'Configurações', 'Configurações salvas com sucesso!');
    }
    
    applySettings(settings) {
        // Apply theme
        if (settings.theme === 'dark') {
            document.body.classList.add('dark-theme');
        } else if (settings.theme === 'light') {
            document.body.classList.remove('dark-theme');
        }
        
        // Apply font size
        const root = document.documentElement;
        root.style.fontSize = {
            small: '14px',
            medium: '16px',
            large: '18px'
        }[settings.fontSize] || '16px';
    }
    
    exportData() {
        const data = {
            settings: JSON.parse(localStorage.getItem('appSettings') || '{}'),
            history: JSON.parse(localStorage.getItem('mappingHistory') || '[]'),
            exportDate: new Date().toISOString()
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `json-mapper-backup-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        
        this.jsonMapper.showToast('success', 'Dados', 'Dados exportados com sucesso!');
    }
    
    importData() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    try {
                        const data = JSON.parse(e.target.result);
                        
                        if (data.settings) {
                            localStorage.setItem('appSettings', JSON.stringify(data.settings));
                        }
                        
                        if (data.history) {
                            localStorage.setItem('mappingHistory', JSON.stringify(data.history));
                        }
                        
                        this.loadSettings();
                        this.loadHistory();
                        this.jsonMapper.showToast('success', 'Dados', 'Dados importados com sucesso!');
                    } catch (error) {
                        this.jsonMapper.showToast('error', 'Dados', 'Erro ao importar dados!');
                    }
                };
                reader.readAsText(file);
            }
        };
        input.click();
    }
    
    resetData() {
        if (confirm('Tem certeza que deseja restaurar as configurações padrão? Isso irá limpar todo o histórico e configurações.')) {
            localStorage.removeItem('appSettings');
            localStorage.removeItem('mappingHistory');
            this.loadSettings();
            this.loadHistory();
            this.jsonMapper.showToast('info', 'Configurações', 'Configurações restauradas com sucesso!');
        }
    }
}

// Global variable for access
let historyManager;
