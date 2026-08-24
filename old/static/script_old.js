let sourceJson;
const keysList = [];

// Exemplo de JSON de origem
const exampleSourceJson = {
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

// Exemplo de JSON de saída
const exampleOutputJson = {
    "pedido": {
        "numero": "",
        "data": "",
        "itens": [
            {
                "codigo": "",
                "descricao": "",
                "quantidade": 0,
                "valorUnitario": 0.0,
                "valorTotal": 0.0
            }
        ],
        "entrega": {
            "tipo": "",
            "valor": 0.0
        }
    },
    "cliente": {
        "codigo": "",
        "nome": "",
        "contato": ""
    }
};

document.addEventListener('DOMContentLoaded', function () {
    const sourceJsonTextarea = document.getElementById('sourceJsonTextarea');
    const outputJsonTextarea = document.getElementById('outputJsonTextarea');
    const formContainer = document.getElementById('formContainer');
    const keysListbox = document.getElementById('keysListbox');
    const generateOutputJsonButton = document.getElementById('generateOutputJson');
    const outputJsonContainer = document.getElementById('outputJsonContainer');
    
    // Função para carregar exemplos
    function loadExamples() {
        document.getElementById('sourceJsonTextarea').value = JSON.stringify(exampleSourceJson, null, 2);
        document.getElementById('outputJsonTextarea').value = JSON.stringify(exampleOutputJson, null, 2);
        
        // Atualiza os highlights iniciais
        updateHighlight('sourceJsonTextarea', 'sourceJsonHighlight');
        updateHighlight('outputJsonTextarea', 'outputJsonHighlight');
        
        // Mostra mensagem de sucesso
        showMessage('Exemplos carregados com sucesso!', 'success');
    }
    
    // Função para limpar os campos
    function clearFields() {
        const elements = ['sourceJsonTextarea', 'outputJsonTextarea', 'outputJsonContainer'];
        elements.forEach(id => {
            const element = document.getElementById(id);
            if (element) element.value = '';
        });
        
        const containers = ['formContainer', 'keysListbox', 'previewJson'];
        containers.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                while (element.firstChild) {
                    element.removeChild(element.firstChild);
                }
            }
        });
        
        // Atualiza os highlights
        updateHighlight('sourceJsonTextarea', 'sourceJsonHighlight');
        updateHighlight('outputJsonTextarea', 'outputJsonHighlight');
        updateOutputHighlight('');
        
        // Mostra mensagem de sucesso
        showMessage('Campos limpos com sucesso!', 'success');
    }
    
    // Função para exibir mensagens para o usuário
    function showMessage(message, type = 'info') {
        // Remove mensagens existentes
        const existingMessages = document.querySelectorAll('.message');
        existingMessages.forEach(msg => msg.remove());
        
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}`;
        messageDiv.textContent = message;
        
        // Adiciona a mensagem antes do primeiro filho do body
        document.body.insertBefore(messageDiv, document.body.firstChild);
        
        // Remove a mensagem após 5 segundos
        setTimeout(() => {
            messageDiv.classList.add('fade-out');
            setTimeout(() => messageDiv.remove(), 500);
        }, 5000);
    }
    
    // Função para mostrar/ocultar o indicador de carregamento
    function showLoading(show = true, message = 'Processando...') {
        let loading = document.getElementById('loading-overlay');
        
        if (!loading && show) {
            loading = document.createElement('div');
            loading.id = 'loading-overlay';
            
            const spinner = document.createElement('div');
            spinner.className = 'loading-spinner';
            
            const messageEl = document.createElement('div');
            messageEl.className = 'loading-message';
            messageEl.textContent = message;
            
            loading.appendChild(spinner);
            loading.appendChild(messageEl);
            document.body.appendChild(loading);
        } else if (loading && !show) {
            loading.classList.add('fade-out');
            setTimeout(() => loading.remove(), 300);
        } else if (loading && show) {
            const messageElement = loading.querySelector('.loading-message');
            if (messageElement) messageElement.textContent = message;
        }
    }
    
    // Função para validar JSON
    function validateJson(jsonString) {
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

    // Função para lidar com o carregamento de arquivos
    function handleFileSelect(event, targetTextarea) {
        event.preventDefault();
        event.stopPropagation();
        
        const files = event.dataTransfer ? event.dataTransfer.files : event.target.files;
        if (!files || files.length === 0) return;
        
        const file = files[0];
        if (file.type !== 'application/json' && !file.name.endsWith('.json')) {
            showMessage('Por favor, selecione um arquivo JSON válido.', 'error');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const content = e.target.result;
                JSON.parse(content); // Valida se é um JSON válido
                targetTextarea.value = JSON.stringify(JSON.parse(content), null, 2);
                updateHighlight(targetTextarea.id, targetTextarea.id + 'Highlight');
                showMessage('Arquivo carregado com sucesso!', 'success');
            } catch (error) {
                showMessage('Erro ao processar o arquivo JSON: ' + error.message, 'error');
            }
        };
        reader.onerror = function() {
            showMessage('Erro ao ler o arquivo.', 'error');
        };
        reader.readAsText(file);
    }
    
    // Função para configurar a área de drop
    function setupDropZone(element, targetTextarea) {
        const dropZone = element.closest('.code-container');
        
        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.stopPropagation();
            dropZone.classList.add('dragover');
        });
        
        dropZone.addEventListener('dragleave', (e) => {
            e.preventDefault();
            e.stopPropagation();
            dropZone.classList.remove('dragover');
        });
        
        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            e.stopPropagation();
            dropZone.classList.remove('dragover');
            handleFileSelect(e, targetTextarea);
        });
        
        // Adiciona o input de arquivo estilizado
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = '.json,application/json';
        fileInput.style.display = 'none';
        fileInput.addEventListener('change', (e) => handleFileSelect(e, targetTextarea));
        
        const uploadButton = document.createElement('button');
        uploadButton.className = 'btn-upload';
        
        const uploadIcon = document.createElement('i');
        uploadIcon.className = 'fas fa-upload';
        uploadButton.appendChild(uploadIcon);
        
        const uploadText = document.createTextNode(' Arraste um arquivo JSON ou clique para selecionar');
        uploadButton.appendChild(uploadText);
        
        uploadButton.onclick = () => fileInput.click();
        
        const dropZoneOverlay = document.createElement('div');
        dropZoneOverlay.className = 'drop-zone-overlay';
        dropZoneOverlay.appendChild(uploadButton);
        dropZoneOverlay.appendChild(fileInput);
        
        dropZone.appendChild(dropZoneOverlay);
    }
    
    // Função para parsear JSON
    function parseJson(jsonString) {
        try {
            return JSON.parse(jsonString);
        } catch (error) {
            return null;
        }
    }

    // Função que contém o código do evento "Criar lista de dados"
    function createListButtonAction() {
        const sourceJsonText = sourceJsonTextarea.value;
        try {
            sourceJson = JSON.parse(sourceJsonText);
            // Gera a lista de chaves a partir do JSON de origem
            const newKeysList = generateKeysList(sourceJson);
            // Limpa e preenche a lista global
            keysList.length = 0;
            keysList.push(...newKeysList);
        } catch (error) {
            console.error('Erro ao fazer o parse do JSON de origem:', error);
        }

        // Limpa o JSON de saída exibido
        outputJsonContainer.value = '';
        updateOutputHighlight('');

        // Lista de chaves já foi gerada acima
        const keysListString = keysList.join('\n');
        keysListbox.value = keysListString;
    }

    // Função para validar formulário
    function validateForm() {
        if (!sourceJsonTextarea.value.trim()) {
            showMessage('Por favor, forneça o JSON de origem.', 'error');
            sourceJsonTextarea.focus();
            return false;
        }

        if (!outputJsonTextarea.value.trim()) {
            showMessage('Por favor, forneça o JSON de saída.', 'error');
            outputJsonTextarea.focus();
            return false;
        }

        const sourceValidation = validateJson(sourceJsonTextarea.value);
        const outputValidation = validateJson(outputJsonTextarea.value);

        if (!sourceValidation.isValid) {
            showMessage(`JSON de origem inválido (posição ${sourceValidation.error.position}): ${sourceValidation.error.message}`, 'error');
            sourceJsonTextarea.focus();
            return false;
        }

        if (!outputValidation.isValid) {
            showMessage(`JSON de saída inválido (posição ${outputValidation.error.position}): ${outputValidation.error.message}`, 'error');
            outputJsonTextarea.focus();
            return false;
        }

        return true;
    }

    // Função para gerar lista de chaves hierarquizadas
    function generateKeysList(json, prefix = '') {
        let keys = [];
        
        for (const key in json) {
            if (json.hasOwnProperty(key)) {
                const fullKey = prefix ? `${prefix}.${key}` : key;
                
                if (typeof json[key] === 'object' && json[key] !== null && !Array.isArray(json[key])) {
                    keys = keys.concat(generateKeysList(json[key], fullKey));
                } else {
                    keys.push(fullKey);
                }
            }
        }
        
        return keys;
    }

    // Função de mapeamento JMESPath
    function performJMESPathMapping(keysList, outputJson) {
        const mappedJson = {};
        keysList.forEach(keyPath => {
            const keys = keyPath.split('.');
            let currentLevel = mappedJson;

            for (let i = 0; i < keys.length; i++) {
                const key = keys[i];

                if (!currentLevel[key]) {
                    if (i === keys.length - 1) {
                        currentLevel[key] = '';
                    } else {
                        currentLevel[key] = {};
                    }
                }

                currentLevel = currentLevel[key];
            }
        });

        return mappedJson;
    }

    function generateIndentedInputFields(json, availablePaths, depth = 0, parentKeyPath = '') {
        if (!json || typeof json !== 'object') {
            return null;
        }

        const fragment = document.createDocumentFragment();
        
        for (const key in json) {
            if (json.hasOwnProperty(key)) {
                const value = json[key];
                const keyPath = parentKeyPath ? `${parentKeyPath}.${key}` : key;
                
                // Criar container para este campo com indentação baseada na profundidade
                const fieldContainer = document.createElement('div');
                fieldContainer.className = 'field-container';
                fieldContainer.style.marginLeft = `${depth * 25}px`;
                fieldContainer.style.marginTop = '8px';
                fieldContainer.style.padding = '12px';
                fieldContainer.style.borderLeft = depth > 0 ? '3px solid #667eea' : 'none';
                fieldContainer.style.backgroundColor = depth > 0 ? '#f8f9fa' : 'white';
                fieldContainer.style.borderRadius = '8px';
                fieldContainer.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.05)';
                
                // Adicionar informação do caminho completo para contexto
                const pathInfo = document.createElement('div');
                pathInfo.className = 'path-info';
                pathInfo.style.fontSize = '11px';
                pathInfo.style.color = '#6c757d';
                pathInfo.style.marginBottom = '5px';
                pathInfo.style.fontFamily = 'monospace';
                pathInfo.textContent = keyPath;
                fieldContainer.appendChild(pathInfo);
                
                // Adicionar rótulo com ícone
                const labelContainer = document.createElement('div');
                labelContainer.style.display = 'flex';
                labelContainer.style.alignItems = 'center';
                labelContainer.style.marginBottom = '8px';
                
                const icon = document.createElement('i');
                icon.className = getFieldIcon(key);
                icon.style.marginRight = '8px';
                icon.style.color = '#667eea';
                
                const label = document.createElement('label');
                label.className = 'field-label';
                label.textContent = formatFieldTitle(key);
                label.style.fontWeight = '600';
                label.style.color = '#2c3e50';
                label.style.cursor = 'pointer';
                
                labelContainer.appendChild(icon);
                labelContainer.appendChild(label);
                fieldContainer.appendChild(labelContainer);
                
                // Adicionar tipo de dado para informação
                const typeInfo = document.createElement('div');
                typeInfo.className = 'type-info';
                typeInfo.style.fontSize = '12px';
                typeInfo.style.color = '#6c757d';
                typeInfo.style.marginBottom = '8px';
                typeInfo.style.fontStyle = 'italic';
                
                if (Array.isArray(value)) {
                    typeInfo.textContent = `Array[${value.length}] ${value.length > 0 && typeof value[0] === 'object' ? 'de objetos' : 'de valores'}`;
                    fieldContainer.appendChild(typeInfo);
                    
                    if (value.length > 0 && typeof value[0] === 'object' && value[0] !== null) {
                        // Array de objetos - processar cada item mantendo a estrutura
                        value.forEach((item, index) => {
                            const arrayHeader = document.createElement('div');
                            arrayHeader.className = 'array-header';
                            arrayHeader.style.marginTop = '12px';
                            arrayHeader.style.padding = '8px 12px';
                            arrayHeader.style.backgroundColor = '#667eea';
                            arrayHeader.style.color = 'white';
                            arrayHeader.style.borderRadius = '6px';
                            arrayHeader.style.fontWeight = '600';
                            arrayHeader.style.fontSize = '14px';
                            arrayHeader.textContent = `[${index}]`;
                            fieldContainer.appendChild(arrayHeader);
                            
                            // Processar campos do item do array recursivamente
                            const childFields = generateIndentedInputFields(item, availablePaths, depth + 1, `${keyPath}[${index}]`);
                            if (childFields) {
                                fieldContainer.appendChild(childFields);
                            }
                        });
                    } else {
                        // Array de valores primitivos - criar select para o array
                        const select = createSelectField(keyPath, availablePaths, key, 'array');
                        fieldContainer.appendChild(select);
                    }
                } else if (typeof value === 'object' && value !== null) {
                    // Objeto aninhado
                    typeInfo.textContent = `Objeto com ${Object.keys(value).length} propriedades`;
                    fieldContainer.appendChild(typeInfo);
                    
                    // Adicionar indicador de objeto
                    const objectIndicator = document.createElement('div');
                    objectIndicator.style.marginTop = '8px';
                    objectIndicator.style.padding = '6px 10px';
                    objectIndicator.style.backgroundColor = '#e9ecef';
                    objectIndicator.style.borderRadius = '4px';
                    objectIndicator.style.fontSize = '12px';
                    objectIndicator.style.color = '#495057';
                    objectIndicator.textContent = '{ }';
                    fieldContainer.appendChild(objectIndicator);
                    
                    // Processar campos do objeto recursivamente
                    const childFields = generateIndentedInputFields(value, availablePaths, depth + 1, keyPath);
                    if (childFields) {
                        fieldContainer.appendChild(childFields);
                    }
                } else {
                    // Valor primitivo
                    typeInfo.textContent = `Tipo: ${typeof value} ${value !== null ? `(${value})` : '(null)'}`;
                    fieldContainer.appendChild(typeInfo);
                    
                    const select = createSelectField(keyPath, availablePaths, key, 'primitive');
                    fieldContainer.appendChild(select);
                }
                
                fragment.appendChild(fieldContainer);
            }
        }
        
        return fragment;
    }
    
    function createSelectField(keyPath, availablePaths, fieldName, fieldType) {
        const selectContainer = document.createElement('div');
        selectContainer.style.marginTop = '8px';
        
        const select = document.createElement('select');
        select.id = keyPath + '_select';
        select.name = keyPath + '_select';
        select.style.width = '100%';
        select.style.padding = '10px 12px';
        select.style.border = '2px solid #e1e8ed';
        select.style.borderRadius = '8px';
        select.style.fontSize = '14px';
        select.style.backgroundColor = 'white';
        select.style.cursor = 'pointer';
        select.style.transition = 'all 0.3s ease';
        
        // Adicionar seta customizada
        select.style.appearance = 'none';
        select.style.backgroundImage = "url(\"data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23667eea' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6,9 12,15 18,9'%3e%3c/polyline%3e%3c/svg%3e\")";
        select.style.backgroundRepeat = 'no-repeat';
        select.style.backgroundPosition = 'right 10px center';
        select.style.backgroundSize = '16px';
        select.style.paddingRight = '35px';
        
        // Eventos de focus
        select.addEventListener('focus', () => {
            select.style.borderColor = '#667eea';
            select.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
        });
        
        select.addEventListener('blur', () => {
            select.style.borderColor = '#e1e8ed';
            select.style.boxShadow = 'none';
        });
        
        // Opção padrão
        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.textContent = `-- Selecione origem para ${fieldName} --`;
        select.appendChild(defaultOption);
        
        // Adicionar opções disponíveis
        if (availablePaths && availablePaths.length > 0) {
            // Agrupar opções por categoria para melhor organização
            const groupedPaths = groupPathsByCategory(availablePaths);
            
            for (const [category, paths] of Object.entries(groupedPaths)) {
                if (category !== 'root') {
                    const optgroup = document.createElement('optgroup');
                    optgroup.label = formatCategoryName(category);
                    optgroup.style.fontStyle = 'italic';
                    
                    paths.forEach(path => {
                        const option = document.createElement('option');
                        option.value = path;
                        option.textContent = path;
                        optgroup.appendChild(option);
                    });
                    
                    select.appendChild(optgroup);
                } else {
                    // Paths raiz
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
    
    function groupPathsByCategory(paths) {
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
    
    function formatCategoryName(category) {
        const categoryMap = {
            'pedido': '📋 Pedido',
            'cliente': '👤 Cliente',
            'entrega': '🚚 Entrega',
            'itens': '📦 Itens',
            'endereco': '📍 Endereço',
            'vendedor': '👔 Vendedor'
        };
        
        return categoryMap[category.toLowerCase()] || `📁 ${category.charAt(0).toUpperCase() + category.slice(1)}`;
    }
    
    function getFieldIcon(fieldName) {
        const iconMap = {
            'token': 'fas fa-key',
            'dados': 'fas fa-database',
            'parceiro': 'fas fa-handshake',
            'cliente': 'fas fa-user',
            'responsavelFinanceiro': 'fas fa-credit-card',
            'cobranca': 'fas fa-money-bill-wave',
            'contrato': 'fas fa-file-contract',
            'endereco': 'fas fa-map-marker-alt',
            'contato': 'fas fa-phone',
            'email': 'fas fa-envelope',
            'nome': 'fas fa-user-tag',
            'codigo': 'fas fa-barcode',
            'tipo': 'fas fa-tag',
            'valor': 'fas fa-dollar-sign',
            'data': 'fas fa-calendar',
            'itens': 'fas fa-list',
            'pedido': 'fas fa-shopping-cart',
            'entrega': 'fas fa-truck',
            'vendedor': 'fas fa-user-tie'
        };
        
        return iconMap[fieldName.toLowerCase()] || 'fas fa-cog';
    }
    
    function formatFieldTitle(fieldName) {
        const titleMap = {
            'token': 'Token de Acesso',
            'dados': 'Dados Principais',
            'parceiro': 'Dados do Parceiro',
            'cliente': 'Dados do Cliente',
            'responsavelFinanceiro': 'Responsável Financeiro',
            'cobranca': 'Informações de Cobrança',
            'contrato': 'Dados do Contrato',
            'endereco': 'Endereço',
            'contato': 'Informações de Contato',
            'email': 'E-mail',
            'nome': 'Nome Completo',
            'codigo': 'Código',
            'tipo': 'Tipo',
            'valor': 'Valor',
            'data': 'Data',
            'itens': 'Itens',
            'pedido': 'Dados do Pedido',
            'entrega': 'Informações de Entrega',
            'vendedor': 'Vendedor'
        };
        
        return titleMap[fieldName] || fieldName.charAt(0).toUpperCase() + fieldName.slice(1);
    }
    
    function formatFieldName(fieldName) {
        return formatFieldTitle(fieldName) + ':';
    }

    // Função para popular JSON de saída a partir do formulário
    function populateOutputJsonFromForm(formInputs, outputJsonData) {
        formInputs.forEach(input => {
            const key = input.name;
            let value = input.type === 'select-one' ? input.value : input.value;
            const cleanKey = key.replace(/_select$/, '');
            const keys = cleanKey.split('.');
            let currentLevel = outputJsonData;

            // Remove aspas do valor se for uma expressão JMESPath
            if (typeof value === 'string' && value.includes('.')) {
                if (value.startsWith('"') && value.endsWith('"')) {
                    value = value.slice(1, -1);
                }
            }

            // Navega até o nível correto no JSON
            for (let i = 0; i < keys.length - 1; i++) {
                const key = keys[i];
                if (!currentLevel[key]) {
                    currentLevel[key] = {};
                }
                currentLevel = currentLevel[key];
            }

            // Define o valor no nível final
            const finalKey = keys[keys.length - 1];
            if (value) {
                currentLevel[finalKey] = value;
            }
        });
    }

    // Adiciona botões de controle
    const controlsDiv = document.createElement('div');
    controlsDiv.className = 'controls';
    
    const themeToggleBtn = document.createElement('button');
    themeToggleBtn.id = 'themeToggleBtn';
    themeToggleBtn.className = 'btn-theme';
    themeToggleBtn.setAttribute('data-tooltip', 'Alternar tema claro/escuro');
    
    const themeIcon = document.createElement('i');
    themeIcon.id = 'themeIcon';
    themeIcon.className = 'fas fa-moon';
    
    themeToggleBtn.appendChild(themeIcon);
    controlsDiv.appendChild(themeToggleBtn);

    // Função para alternar tema
    function toggleTheme() {
        const body = document.body;
        const isLight = body.classList.contains('light-theme');
        
        if (isLight) {
            body.classList.remove('light-theme');
            const themeIcon = document.getElementById('themeIcon');
            if (themeIcon) {
                themeIcon.className = 'fas fa-moon';
            }
        } else {
            body.classList.add('light-theme');
            const themeIcon = document.getElementById('themeIcon');
            if (themeIcon) {
                themeIcon.className = 'fas fa-sun';
            }
        }
        
        // Salva preferência do tema
        localStorage.setItem('theme', isLight ? 'dark' : 'light');
    }

    // Função para aplicar tema salvo
    function applySavedTheme() {
        const savedTheme = localStorage.getItem('theme');
        const body = document.body;
        
        if (savedTheme === 'light') {
            body.classList.add('light-theme');
            const themeIcon = document.getElementById('themeIcon');
            if (themeIcon) {
                themeIcon.className = 'fas fa-sun';
            }
        }
    }

    // Adiciona evento para o botão de alternar tema
    themeToggleBtn.addEventListener('click', toggleTheme);
    
    // Aplica o tema salvo
    applySavedTheme();
    
    // Adiciona eventos aos botões
    document.getElementById('loadExamplesBtn').addEventListener('click', loadExamples);
    document.getElementById('clearFieldsBtn').addEventListener('click', clearFields);
    
    // Removido: botão createListButton não existe no index.html. Ação é disparada a partir do mapButton.
    const mapButton = document.getElementById('mapButton');

    // Define o evento para o botão "Realizar Mapeamento"
    mapButton.addEventListener('click', async function () {
        // Primeiro, extrai as chaves do JSON de origem
        const sourceJsonText = sourceJsonTextarea.value;
        try {
            sourceJson = JSON.parse(sourceJsonText);
            const newKeysList = generateKeysList(sourceJson);
            keysList.length = 0;
            keysList.push(...newKeysList);
        } catch (error) {
            console.error('[map] Erro ao fazer parse do JSON de origem:', error);
            showMessage('JSON de origem inválido. Verifique o formato.', 'error');
            return;
        }

        const outputJson = parseJson(outputJsonTextarea.value);
        if (!outputJson) {
            showMessage('Por favor, forneça JSON de saída válido.', 'error');
            return;
        }

        // Limpa a saída, mas não o formulário aqui
        outputJsonContainer.value = '';
        updateOutputHighlight('');
        
        // Limpa qualquer formulário anterior e gera o novo com base na estrutura de saída e caminhos disponíveis do JSON de origem
        formContainer.innerHTML = '';
        formContainer.style.display = 'block';
        formContainer.setAttribute('aria-live', 'polite');
        
        // título do formulário
        const formTitle = document.createElement('h3');
        formTitle.textContent = 'Mapeamento de campos (defina as origens para cada destino)';
        formTitle.style.margin = '8px 0 12px';
        formContainer.appendChild(formTitle);
        
        try {
            const formFields = generateIndentedInputFields(outputJson, keysList);
            if (formFields) {
                formContainer.appendChild(formFields);
            }
        } catch (err) {
            console.error('Erro ao gerar formulário de mapeamento:', err);
            showMessage('Erro ao gerar o formulário de mapeamento. Veja o console para detalhes.', 'error');
        }
        
        const afterCount = formContainer.querySelectorAll('select[name]')?.length || 0;
        if (afterCount > 0) {
            showMessage(`Formulário de mapeamento gerado (${afterCount} campos). Use os selects para escolher as origens e clique em "Gerar JSON de Saída".`, 'success');
        } else {
            showMessage('Nenhum campo de mapeamento gerado. Verifique se os JSONs têm estrutura compatível.', 'warning');
        }
    });

    // Evento para o botão "Gerar o Json de saída"
    generateOutputJsonButton.addEventListener('click', function () {
        const formInputs = document.querySelectorAll('#formContainer select[name]');
        
        if (formInputs.length === 0) {
            showMessage('Nenhum campo de mapeamento encontrado. Por favor, gere o mapeamento primeiro.', 'error');
            return;
        }

        const outputJsonText = outputJsonTextarea.value;
        let outputJsonData;
        
        try {
            outputJsonData = JSON.parse(outputJsonText);
        } catch (error) {
            showMessage('Erro ao fazer parse do JSON de saída: ' + error.message, 'error');
            return;
        }

        // Popula o JSON de saída com os valores do formulário
        populateOutputJsonFromForm(formInputs, outputJsonData);

        // Exibe o JSON de saída formatado
        const outputJsonString = JSON.stringify(outputJsonData, null, 2);
        outputJsonContainer.value = outputJsonString;
        updateOutputHighlight(outputJsonString);

        showMessage('JSON de saída gerado com sucesso!', 'success');
    });

    // Configura as áreas de drop para os textareas
    setupDropZone(sourceJsonTextarea, sourceJsonTextarea);
    setupDropZone(outputJsonTextarea, outputJsonTextarea);

    // Adiciona evento para o botão "Novo Mapeamento"
    document.getElementById('newMappingButton').addEventListener('click', function() {
        clearFields();
        showMessage('Novo mapeamento iniciado. Cole os JSONs para começar.', 'info');
    });

    // Funções de highlight (implementações básicas)
    function updateHighlight(textareaId, highlightId) {
        // Implementação básica - pode ser expandida com syntax highlighting
        const textarea = document.getElementById(textareaId);
        if (textarea) {
            textarea.style.backgroundColor = '';
        }
    }

    function updateOutputHighlight(content) {
        const container = document.getElementById('outputJsonContainer');
        if (container) {
            container.style.backgroundColor = content ? '#f8f9fa' : '';
        }
    }
});
