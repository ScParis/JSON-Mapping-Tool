// ===== SETTINGS & HELP FUNCTIONALITY =====

class SettingsManager {
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
            // Help elements
            helpSection: document.getElementById('helpSection'),

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
        // Settings buttons
        this.elements.saveSettingsBtn?.addEventListener('click', () => this.saveSettings());
        this.elements.exportDataBtn?.addEventListener('click', () => this.exportData());
        this.elements.importDataBtn?.addEventListener('click', () => this.importData());
        this.elements.resetDataBtn?.addEventListener('click', () => this.resetData());
    }

    // ===== NAVIGATION =====
    handleNavigation(view) {
        // Hide all sections
        this.elements.helpSection.style.display = 'none';
        this.elements.settingsSection.style.display = 'none';

        // Show selected section
        switch (view) {
            case 'help':
                this.elements.helpSection.style.display = 'block';
                break;
            case 'settings':
                this.elements.settingsSection.style.display = 'block';
                this.loadSettings();
                break;
        }
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
            exportDate: new Date().toISOString()
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `json-mapper-settings-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);

        this.jsonMapper.showToast('success', 'Dados', 'Configurações exportadas com sucesso!');
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

                        this.loadSettings();
                        this.jsonMapper.showToast('success', 'Dados', 'Configurações importadas com sucesso!');
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
        if (confirm('Tem certeza que deseja restaurar as configurações padrão?')) {
            localStorage.removeItem('appSettings');
            this.loadSettings();
            this.jsonMapper.showToast('info', 'Configurações', 'Configurações restauradas com sucesso!');
        }
    }
}

// Global variable for access
let settingsManager;

document.addEventListener('DOMContentLoaded', () => {
    // Wait for the main app to initialize, then attach settings manager
    setTimeout(() => {
        if (window.app) {
            window.settingsManager = new SettingsManager(window.app);
        }
    }, 100);
});
