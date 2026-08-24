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
    // Removido: elemento errorMessage inexistente no index.html. Usaremos showMessage()
    const formContainer = document.getElementById('formContainer');
    // Removido: elemento mappedJsonContainer não existe no index.html. Vamos usar outputJsonContainer + updateOutputHighlight()
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
            
            const message = document.createElement('div');
            message.className = 'loading-message';
            message.textContent = message;
            
            loading.appendChild(spinner);
            loading.appendChild(message);
            document.body.appendChild(loading);
        } else if (loading && !show) {
            loading.classList.add('fade-out');
            setTimeout(() => loading.remove(), 300);
        } else if (loading && show) {
            const messageEl = loading.querySelector('.loading-message');
            if (messageEl) messageEl.textContent = message;
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
    
    // Carrega exemplos por padrão
    loadExamples();
    
    // Função para adicionar manipulador de redimensionamento
    function setupResizableTextarea(textarea) {
        const container = textarea.closest('.code-container');
        const resizeHandle = document.createElement('div');
        resizeHandle.className = 'resize-handle';
        container.appendChild(resizeHandle);
        
        let startY, startHeight;
        
        function initResize(e) {
            e.preventDefault();
            startY = e.clientY;
            startHeight = parseInt(document.defaultView.getComputedStyle(container).height, 10);
            document.addEventListener('mousemove', resize);
            document.addEventListener('mouseup', stopResize);
            container.classList.add('resizing');
        }
        
        function resize(e) {
            const newHeight = (startHeight + e.clientY - startY) + 'px';
            container.style.height = newHeight;
            textarea.style.height = '100%';
            // Ajusta o pre/code para corresponder à altura do textarea
            const highlight = container.querySelector('pre');
            if (highlight) {
                highlight.style.height = '100%';
            }
        }
        
        function stopResize() {
            document.removeEventListener('mousemove', resize);
            document.removeEventListener('mouseup', stopResize);
            container.classList.remove('resizing');
            // Dispara um evento de redimensionamento para ajustar o highlight
            window.dispatchEvent(new Event('resize'));
        }
        
        resizeHandle.addEventListener('mousedown', initResize);
    }
    
    // Configura as áreas de drop para os textareas
    setupDropZone(sourceJsonTextarea, sourceJsonTextarea);
    setupDropZone(outputJsonTextarea, outputJsonTextarea);
    
    // Configura o redimensionamento para os textareas
    setupResizableTextarea(sourceJsonTextarea);
    setupResizableTextarea(outputJsonTextarea);
    
    // Adiciona validação em tempo real aos textareas
    [sourceJsonTextarea, outputJsonTextarea].forEach(textarea => {
        textarea.addEventListener('input', function() {
            const validation = validateJson(this.value);
            if (this.value.trim() === '') {
                this.classList.remove('invalid-json');
                this.title = '';
                return;
            }
            
            if (!validation.isValid) {
                this.classList.add('invalid-json');
                this.title = `Erro de JSON: ${validation.error.message}`;
            } else {
                this.classList.remove('invalid-json');
                this.title = 'JSON válido';
            }
            
            // Atualiza o highlight
            const highlightId = this.id === 'sourceJsonTextarea' ? 'sourceJsonHighlight' : 'outputJsonHighlight';
            updateHighlight(this.id, highlightId);
        });
    });
    
    // Função para alternar entre temas claro/escuro
    function toggleTheme() {
        const body = document.body;
        const isDark = body.classList.toggle('light-theme');
        localStorage.setItem('theme', isDark ? 'light' : 'dark');
        
        // Atualiza o ícone do botão
        const themeIcon = document.getElementById('themeIcon');
        if (themeIcon) {
            themeIcon.className = isDark ? 'fas fa-moon' : 'fas fa-sun';
        }
    }
    
    // Aplica o tema salvo ao carregar a página
    function applySavedTheme() {
        const savedTheme = localStorage.getItem('theme') || 'dark';
        const body = document.body;
        
        if (savedTheme === 'light') {
            body.classList.add('light-theme');
            const themeIcon = document.getElementById('themeIcon');
            if (themeIcon) {
                themeIcon.className = 'fas fa-sun';
            }
        } else {
            body.classList.remove('light-theme');
            const themeIcon = document.getElementById('themeIcon');
            if (themeIcon) {
                themeIcon.className = 'fas fa-moon';
            }
        }
    `;
    document.getElementById('global-controls').appendChild(controlsDiv);
    
    // Adiciona evento para o botão de alternar tema
    document.getElementById('themeToggleBtn').addEventListener('click', toggleTheme);
    
    // Aplica o tema salvo
    applySavedTheme();
    
    // Adiciona eventos aos botões
    document.getElementById('loadExamplesBtn').addEventListener('click', loadExamples);
    document.getElementById('clearFieldsBtn').addEventListener('click', clearFields);
    
    // Removido: botão createListButton não existe no index.html. A ação é disparada a partir do mapButton.
    const mapButton = document.getElementById('mapButton');
    

    // Define a função para parsear JSON
    function parseJson(jsonString) {
        try {
            return JSON.parse(jsonString);
        } catch (error) {
            return null;
        }
    }
     // Define a função para gerar a lista de chaves hierarquizadas (corrigida)
    function generateKeysList(obj, keys = [], prefix = '') {
        if (obj === null || typeof obj !== 'object') return keys;

        Object.keys(obj).forEach(key => {
            const newPrefix = prefix ? `${prefix}.${key}` : key;
            const value = obj[key];

            if (Array.isArray(value)) {
                if (value.length === 0) {
                    keys.push(newPrefix); // Adiciona o caminho do array vazio
                } else {
                    value.forEach((item, index) => {
                        const arrayPrefix = `${newPrefix}[${index}]`;
                        if (item !== null && typeof item === 'object') {
                            generateKeysList(item, keys, arrayPrefix);
                        } else {
                            keys.push(arrayPrefix);
                        }
                    });
                }
            } else if (value !== null && typeof value === 'object') {
                generateKeysList(value, keys, newPrefix);
            } else {
                keys.push(newPrefix);
            }
        });
        return keys;
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

        //errorMessage.textContent = '';
        // Limpa o JSON de saída exibido
        outputJsonContainer.value = '';
        updateOutputHighlight('');

        // Lista de chaves já foi gerada acima

        // Não preencher o painel "JSON Mapeado" aqui para evitar confusão.
        // A geração do JSON mapeado ocorrerá apenas ao clicar em "Gerar JSON de Saída".
    }

    // Função para verificar se todos os JSONs são válidos
    function areAllJsonsValid() {
        const sourceJson = sourceJsonTextarea.value.trim();
        const outputJson = outputJsonTextarea.value.trim();

        if (!sourceJson || !outputJson) {
            showMessage('Por favor, preencha todos os campos de JSON.', 'error');
            return false;
        }

        const sourceValidation = validateJson(sourceJson);
        const outputValidation = validateJson(outputJson);

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

    // Atualiza a função createListButtonAction para validar antes de processar
    const originalCreateListButtonAction = createListButtonAction;
    createListButtonAction = async function() {
        if (areAllJsonsValid()) {
            showLoading(true, 'Processando JSON de origem...');
            // Usa setTimeout para garantir que a UI seja atualizada
            await new Promise(resolve => setTimeout(resolve, 50));
            try {
                originalCreateListButtonAction();
            } catch (error) {
                console.error('Erro ao processar JSON:', error);
                showMessage('Ocorreu um erro ao processar o JSON. Verifique o console para mais detalhes.', 'error');
            } finally {
                showLoading(false);
            }
        }
    };

    // Removido: não há botão "Criar lista de dados" no index.html

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
        const beforeCount = 0;
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
        if (afterCount - beforeCount > 0) {
            showMessage(`Formulário de mapeamento gerado (${afterCount - beforeCount} campos). Use os selects para escolher as origens e clique em "Gerar JSON de Saída".`, 'success');
        } else {
            console.warn('[map] Nenhum select gerado. children:', formContainer.children.length, 'keysList size:', Array.isArray(keysList) ? keysList.length : 'n/a');
            showMessage('Nenhum campo de mapeamento gerado. Verifique se o JSON de Saída possui campos primitivos (strings/números/booleanos) ou arrays com itens.', 'warning');
            // Mensagem visível no container
            const info = document.createElement('div');
            info.style.padding = '8px 0';
            info.textContent = 'Nenhum campo detectado no JSON de Saída. Dica: chaves com valores "", 0, true/false geram campos de mapeamento.';
            formContainer.appendChild(info);
        }
        // Não gera o JSON mapeado automaticamente aqui; aguarda o botão "Gerar JSON de Saída"
        // Leva o usuário até o formulário e foca no primeiro campo
        formContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
        const firstSelect = formContainer.querySelector('select[name]');
        if (firstSelect) firstSelect.focus();
    });

    
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
        console.log('[generateFields] Iniciando com json:', JSON.stringify(json, null, 2));
        console.log('[generateFields] availablePaths:', availablePaths);
        console.log('[generateFields] depth:', depth, 'parentKeyPath:', parentKeyPath);
        
            if (!json || typeof json !== 'object') {
        console.log('[generateFields] Retornando null - json não é objeto válido');
        return null;
    }

    const fragment = document.createDocumentFragment();
        let createdCount = 0;
        console.log('[generateFields] Iterando sobre', Object.keys(json).length, 'chaves');
        for (const key in json) {
            if (json.hasOwnProperty(key)) {
                console.log('[generateFields] Processando chave:', key);
                const value = json[key];
                console.log('[generateFields] Valor da chave:', value, 'tipo:', typeof value);
                const fieldContainer = document.createElement('div');
                fieldContainer.classList.add('field-container');
                fieldContainer.style.margin = '8px 0';
                fieldContainer.style.paddingLeft = `${Math.min(depth * 16, 48)}px`;

                // Adicione uma borda com base no nível de profundidade
                if (depth > 0) {
                    fieldContainer.style.border = '1px solid #ccc'; // Adicione um estilo de borda
                    fieldContainer.style.padding = '5px'; // Adicione um preenchimento para espaçamento
                }

                const keyPath = parentKeyPath ? `${parentKeyPath}.${key}` : key;

                const label = document.createElement('span');
                label.classList.add('label');
                label.textContent = key + ':';
                fieldContainer.appendChild(label);

                if (Array.isArray(value)) {
                    // Verifique se o valor é um array
                    console.log('[generateFields] Processando array:', key, 'com', value.length, 'itens');
                    if (value.length > 0) {
                        // Se o array contém objetos, cria campos para CADA objeto do array
                        if (typeof value[0] === 'object' && value[0] !== null) {
                            console.log('[generateFields] Array de objetos detectado, criando campos para cada item');
                            
                            // Itere sobre cada item do array e crie campos para ele
                            value.forEach((item, index) => {
                                const arrayItemContainer = document.createElement('div');
                                arrayItemContainer.classList.add('array-item-instance');
                                arrayItemContainer.style.marginLeft = `${(depth + 1) * 20}px`;
                                arrayItemContainer.style.marginTop = '10px';
                                arrayItemContainer.style.padding = '10px';
                                arrayItemContainer.style.border = '1px solid #ddd';
                                arrayItemContainer.style.borderRadius = '4px';

                                // Adicione o índice do item
                                const itemIndexLabel = document.createElement('span');
                                itemIndexLabel.textContent = `${key}[${index}]:`;
                                itemIndexLabel.style.fontWeight = 'bold';
                                itemIndexLabel.style.color = '#1ab394';
                                itemIndexLabel.style.display = 'block';
                                itemIndexLabel.style.marginBottom = '8px';
                                arrayItemContainer.appendChild(itemIndexLabel);

                                console.log(`[generateFields] Criando campos para item ${index} do array ${key}:`, item);
                                const childFields = generateIndentedInputFields(item, availablePaths, depth + 2, `${keyPath}[${index}]`);
                                console.log(`[generateFields] childFields para item ${index}:`, childFields);
                                
                                if (childFields) {
                                    arrayItemContainer.appendChild(childFields);
                                }
                                fieldContainer.appendChild(arrayItemContainer);
                            });
                        } else {
                            // Array de primitivos: cria um select para o array inteiro
                            const itemContainer = document.createElement('div');
                            itemContainer.classList.add('array-item');
                            const itemLabel = document.createElement('span');
                            itemLabel.textContent = `${key} [array]:`;
                            itemLabel.style.fontWeight = 'bold';
                            itemLabel.style.color = '#1ab394';
                            itemContainer.appendChild(itemLabel);
                            
                            const select = document.createElement('select');
                            select.name = `${keyPath}_select`;
                            const placeholderOption = document.createElement('option');
                            placeholderOption.value = '';
                            placeholderOption.textContent = 'Selecione a opção para mapeamento';
                            select.appendChild(placeholderOption);
                            if (Array.isArray(availablePaths)) {
                                availablePaths.forEach(path => {
                                    const option = document.createElement('option');
                                    option.value = path;
                                    option.textContent = path;
                                    select.appendChild(option);
                                });
                            }
                            itemContainer.appendChild(select);
                            fieldContainer.appendChild(itemContainer);
                            createdCount++;
                        }
                    }
                } else if (value && typeof value === 'object' && !Array.isArray(value)) {
                                    const childFields = generateIndentedInputFields(value, availablePaths, depth + 1, keyPath);
                if (childFields) {
                    fieldContainer.appendChild(childFields);
                }
                } else {
                    // Sempre cria um select para valores primitivos, mesmo que vazios
                    const select = document.createElement('select');
                    select.name = keyPath + '_select';
                    select.style.marginLeft = '5px';

                    // Adicionar a opção de placeholder
                    const placeholderOption = document.createElement('option');
                    placeholderOption.value = '';
                    placeholderOption.textContent = 'Selecione a opção para mapeamento';
                    select.appendChild(placeholderOption);

                    // Preenche com caminhos disponíveis do JSON de origem (flattened)
                    if (Array.isArray(availablePaths) && availablePaths.length > 0) {
                        availablePaths.forEach(path => {
                            const option = document.createElement('option');
                            option.value = path;
                            option.textContent = path;
                            select.appendChild(option);
                        });
                        console.log('[map] Select criado para', keyPath, 'com', availablePaths.length, 'opções');
                    } else {
                        console.warn('[map] Nenhuma opção disponível para', keyPath);
                    }

                    fieldContainer.appendChild(select);
                    createdCount++;
                    console.log('[map] Campo criado:', keyPath);
                }

                                fragment.appendChild(fieldContainer);
            }
        }
        // Log auxiliar para diagnóstico
            console.log('generateIndentedInputFields: criados', createdCount, 'campos em', parentKeyPath || '<root>');
    return fragment;
    }


    function generateKeysListFromSource(json, parentContainer, prefix = '') {
        for (const key in json) {
            if (json.hasOwnProperty(key)) {
                const value = json[key];

                if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                    // Adiciona a opção à lista com a hierarquia
                    const option = document.createElement('option');
                    option.value = prefix + key;
                    option.textContent = prefix + key;
                    parentContainer.appendChild(option);

                    // Recursivamente gera as opções para as chaves internas
                    generateKeysListFromSource(value, parentContainer, prefix + key + '.');
                } else {
                    // Adiciona a opção à lista
                    const option = document.createElement('option');
                    option.value = prefix + key;
                    option.textContent = prefix + key;
                    parentContainer.appendChild(option);
                }
            }
        }
    }

    // Gera lista de chaves baseada no conteúdo atual do textarea de origem
    const initialParsedSource = parseJson(sourceJsonTextarea.value) || {};
    generateKeysListFromSource(initialParsedSource, keysListbox);

    //const selectedKeyField = document.getElementById('selectedKey');

    function setNestedKeyValue(obj, path, value) {
        const keys = path.split('.');
        let nestedObj = obj;

        for (let i = 0; i < keys.length - 1; i++) {
            const key = keys[i];
            if (!nestedObj[key]) {
                // Cria um objeto vazio se a chave ainda não existir
                nestedObj[key] = {};
            }
            nestedObj = nestedObj[key];
        }

        // Define o valor na chave mais interna
        const lastKey = keys[keys.length - 1];
        // Remove o sufixo "_select" do último nome da chave
        const cleanLastKey = lastKey.replace(/_select$/, '');
        nestedObj[cleanLastKey] = value;
    }

    function generatePreviewJson(outputJson, parentElement, prefix = '', sourceJson) {
        for (const key in outputJson) {
            if (outputJson.hasOwnProperty(key)) {
                const currentElement = document.createElement('div');
                currentElement.classList.add('preview-element');

                const keyElement = document.createElement('span');
                keyElement.classList.add('preview-key');
                keyElement.textContent = prefix + key + ':';
                currentElement.appendChild(keyElement);

                if (typeof outputJson[key] === 'object' && outputJson[key] !== null) {
                    if (sourceJson && sourceJson.hasOwnProperty(prefix + key)) {
                        generatePreviewJson(outputJson[key], currentElement, prefix + key + '.', sourceJson[prefix + key]);
                    } else {
                        generatePreviewJson(outputJson[key], currentElement, prefix + key + '.');
                    }
                } else {
                    const valueElement = document.createElement('span');
                    valueElement.classList.add('preview-value');
                    valueElement.textContent = key; // Use a chave como valor
                    currentElement.appendChild(valueElement);
                }

                if (parentElement) {
                    parentElement.appendChild(currentElement);
                }
            }
        }
    }


    // Função para popular o JSON de saída a partir do formulário
    function populateOutputJsonFromForm(formInputs, outputJsonData) {
        formInputs.forEach(input => {
            const key = input.name;
            // Usa o caminho selecionado (value) em vez do label; o label é igual ao value atualmente
            let value = input.type === 'select-one' ? input.value : input.value;
            console.log('[populate] Valor original do select:', value);
            const cleanKey = key.replace(/_select$/, '');
            const keys = cleanKey.split('.');
            let currentLevel = outputJsonData;

            // Remove aspas do valor se for uma expressão JMESPath
            if (typeof value === 'string' && value.includes('.')) {
                console.log('[populate] Detectado JMESPath, valor antes:', value);
                // Remove aspas do início e fim se existirem
                if (value.startsWith('"') && value.endsWith('"')) {
                    value = value.slice(1, -1);
                    console.log('[populate] Valor após remover aspas:', value);
                }
            }

            for (let i = 0; i < keys.length; i++) {
                const currentKey = keys[i];
                const nextKey = keys[i + 1];

                // Verifica se a chave atual indica um array (ex: "itens[0]")
                const arrayMatch = currentKey.match(/^(.+)\[(\d+)\]$/);

                if (arrayMatch) {
                    const arrayName = arrayMatch[1];
                    const index = parseInt(arrayMatch[2], 10);

                    // Cria o array se ele não existir
                    if (!currentLevel[arrayName]) {
                        currentLevel[arrayName] = [];
                    }

                    // Cria o objeto no índice do array se ele não existir
                    if (!currentLevel[arrayName][index]) {
                        currentLevel[arrayName][index] = {};
                    }

                    // Se for a última chave, define o valor
                    if (i === keys.length - 1) {
                        if (value !== "Selecione a opção para mapeamento") {
                            currentLevel[arrayName][index] = value;
                        }
                    } else {
                        // Move para o próximo nível dentro do objeto do array
                        currentLevel = currentLevel[arrayName][index];
                    }
                } else {
                    // Lógica para objetos normais
                    if (i === keys.length - 1) {
                        if (value !== "Selecione a opção para mapeamento") {
                            currentLevel[currentKey] = value;
                        }
                    } else {
                        if (!currentLevel[currentKey]) {
                            const nextArrayMatch = nextKey && nextKey.match(/^(.+)\[(\d+)\]$/);
                            if (nextArrayMatch) {
                                currentLevel[currentKey] = {}; // Objeto que conterá o array
                                if (!currentLevel[currentKey][nextArrayMatch[1]]) {
                                    currentLevel[currentKey][nextArrayMatch[1]] = [];
                                }
                            } else {
                                currentLevel[currentKey] = {};
                            }
                        }
                        currentLevel = currentLevel[currentKey];
                    }
                }
            }
        });
    }


    // Função para atualizar o destaque do JSON de saída
    function updateOutputHighlight(jsonString) {
        const outputHighlight = document.getElementById('outputJsonHighlightResult');
        try {
            const json = JSON.parse(jsonString);
            outputHighlight.textContent = JSON.stringify(json, null, 2);
        } catch (e) {
            outputHighlight.textContent = jsonString;
        }
        Prism.highlightElement(outputHighlight);
    }

    // Define o evento de clique para o botão "Gerar o Json de saída"
    generateOutputJsonButton.addEventListener('click', function () {
        const formInputs = formContainer.querySelectorAll('input[name], select[name]');
        const outputPreview = {};

        // Popula o JSON de saída com os valores do formulário
        populateOutputJsonFromForm(formInputs, outputPreview);

        // Função para corrigir a estrutura do JSON mapeado
        function fixArrayStructure(obj) {
            for (const key in obj) {
                if (key.includes('[') && key.includes('].')) {
                    // Transforma chaves como "itens[0].codigo" de volta para estrutura de array
                    const [arrayKey, index, fieldKey] = key.match(/([^\[]+)\[(\d+)\]\.(.+)/).slice(1);
                    
                    if (!obj[arrayKey]) {
                        obj[arrayKey] = [];
                    }
                    
                    if (!obj[arrayKey][parseInt(index)]) {
                        obj[arrayKey][parseInt(index)] = {};
                    }
                    
                    // Remove aspas do valor se for uma expressão JMESPath
                    let value = obj[key];
                    if (typeof value === 'string' && value.includes('.')) {
                        // Se parece com JMESPath (ex: "cliente.nome"), remove aspas
                        value = value.replace(/^"(.*)"$/, '$1');
                    }
                    
                    obj[arrayKey][parseInt(index)][fieldKey] = value;
                    delete obj[key];
                } else if (typeof obj[key] === 'object' && obj[key] !== null) {
                    obj[key] = fixArrayStructure(obj[key]);
                } else {
                    // Remove aspas do valor se for uma expressão JMESPath
                    let value = obj[key];
                    if (typeof value === 'string' && value.includes('.')) {
                        // Se parece com JMESPath (ex: "cliente.nome"), remove aspas
                        value = value.replace(/^"(.*)"$/, '$1');
                        obj[key] = value;
                    }
                }
            }
            
            return obj;
        }

        // Corrige a estrutura do JSON mapeado
        const fixedMappedJson = fixArrayStructure(outputPreview);

        // Exibe o JSON mapeado corrigido no textarea e no highlight
        // Gera como texto puro, não como JSON válido
        let jsonString = JSON.stringify(fixedMappedJson, null, 2);
        
        // Remove aspas de valores JMESPath no texto final
        jsonString = jsonString.replace(/"([a-zA-Z_][a-zA-Z0-9_]*(\.[a-zA-Z_][a-zA-Z0-9_]*)*(\[[0-9]+\])*)"/g, '$1');
        
        outputJsonContainer.value = jsonString;
        
        // Para o highlight, trata como texto puro também
        const outputHighlight = document.getElementById('outputJsonHighlightResult');
        if (outputHighlight) {
            outputHighlight.textContent = jsonString;
        }

        // Verifica se o JSON de origem está disponível
        if (sourceJson) {
            // Generate the preview of the output JSON structure
            generatePreviewJson(fixedMappedJson, null, '', sourceJson);
        }
    });

    // Define o evento change para campos de seleção (select)
    formContainer.addEventListener('change', function (event) {
        const target = event.target;

        if (target.tagName === 'SELECT') {
            const outputJsonData = {};
            const formInputs = formContainer.querySelectorAll('input[name], select[name]');
            const selectElement = target;
            const selectedOptions = Array.from(selectElement.selectedOptions);
            const optionLabels = selectedOptions.map(option => option.label);

            console.log('Labels dos elementos option selecionados:', optionLabels);

            // Popula o JSON de saída com os valores do formulário
            populateOutputJsonFromForm(formInputs, outputJsonData);

            // Log dos valores atualizados no console
            //console.log('Valores atualizados no JSON de saída:', outputJsonData);
        }
    });

    // Define a função para gerar o JSON de saída com valores limpos
    function generateEmptyOutputJson() {
        const outputJsonText = outputJsonTextarea.value;
        const outputJsonData = parseJson(outputJsonText);

        if (outputJsonData) {
            // Função para criar a lista mantendo a estrutura hierárquica
            function createListWithHierarchy(obj, indent = 0, prefix = '') {
                let list = '';

                for (let key in obj) {
                    const value = obj[key];
                    const lineIndent = ' '.repeat(indent * 2);
                    const fullKey = prefix ? `${prefix}.${key}` : key;

                    if (typeof value === 'object' && !Array.isArray(value)) {
                        // Objeto aninhado, chama a função recursivamente
                        list += `${lineIndent}"${fullKey}": {\n`;
                        list += createListWithHierarchy(value, indent + 1, fullKey);
                        list += `${lineIndent}},\n`;
                    } else if (Array.isArray(value)) {
                        // Array encontrado, percorra os elementos e chame a função para cada objeto
                        list += `${lineIndent}"${fullKey}": [\n`;

                        for (let i = 0; i < value.length; i++) {
                            list += `${lineIndent}  {\n`;
                            list += createListWithHierarchy(value[i], indent + 2, fullKey);
                            list += `${lineIndent}  },\n`;
                        }

                        list += `${lineIndent}],\n`;
                    } else {
                        // Valor simples, adiciona à lista
                        list += `${lineIndent}"${fullKey}": "",\n`;
                    }
                }

                return list;
            }

            // Chama a função para criar a lista mantendo a estrutura hierárquica
            const formattedJsonList = `{\n${createListWithHierarchy(outputJsonData)}\n}`;

            // Log da lista no console
            console.log('Log da lista no console:', formattedJsonList);
        } else {
            showMessage('Por favor, forneça um JSON de saída válido.', 'error');
        }
    }


    // Atualiza a função generateEmptyOutputJson para usar o highlight
    const originalGenerateEmptyOutputJson = generateEmptyOutputJson;
    generateEmptyOutputJson = function() {
        originalGenerateEmptyOutputJson();
        updateOutputHighlight(outputJsonContainer.value);
    };
    
    // Função para exportar o JSON mapeado
    function exportJson() {
        const jsonData = outputJsonContainer.value;
        if (!jsonData) {
            showMessage('Nenhum dado para exportar.', 'warning');
            return;
        }
        
        showLoading(true, 'Preparando arquivo para download...');
        
        // Usa setTimeout para garantir que a UI seja atualizada
        setTimeout(() => {
            try {
                // Cria um blob com o conteúdo JSON
                const blob = new Blob([jsonData], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                
                // Cria um link de download
                const a = document.createElement('a');
                a.href = url;
                a.download = 'mapeamento.json';
                
                // Dispara o download
                document.body.appendChild(a);
                a.click();
                
                // Limpa
                setTimeout(() => {
                    document.body.removeChild(a);
                    window.URL.revokeObjectURL(url);
                    showMessage('Arquivo exportado com sucesso!', 'success');
                    showLoading(false);
                }, 100);
            } catch (error) {
                console.error('Erro ao exportar JSON:', error);
                showMessage('Erro ao exportar o arquivo.', 'error');
                showLoading(false);
            }
        }, 50);
    }
    
    // Função para formatar JSON
    function formatJson(textarea) {
        try {
            const jsonData = JSON.parse(textarea.value);
            const formattedJson = JSON.stringify(jsonData, null, 2);
            textarea.value = formattedJson;
            
            // Atualiza o highlight
            const highlightId = textarea.id === 'sourceJsonTextarea' ? 'sourceJsonHighlight' : 'outputJsonHighlight';
            updateHighlight(textarea.id, highlightId);
            
            // Atualiza a visualização em árvore se estiver ativa
            if (textarea.viewMode === 'tree') {
                renderJsonTree(jsonData, textarea.id + 'Tree');
            }
            
            showMessage('JSON formatado com sucesso!', 'success');
            return jsonData;
        } catch (error) {
            console.error('Erro ao formatar JSON:', error);
            showMessage('Erro ao formatar JSON. Verifique se o JSON é válido.', 'error');
            return null;
        }
    }
    
    // Função para renderizar JSON como árvore
    function renderJsonTree(data, containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        container.innerHTML = '';
        
        function createNode(key, value, isRoot = false) {
            const node = document.createElement('div');
            node.className = 'json-node';
            
            if (value === null) {
                node.innerHTML = `<span class="json-key">${key}:</span> <span class="json-null">null</span>`;
                return node;
            }
            
            const type = typeof value;
            const isArray = Array.isArray(value);
            const isObject = value && type === 'object' && !isArray;
            
            let content = '';
            
            if (isRoot) {
                if (isArray) {
                    content = '<span class="json-bracket">[</span><div class="json-children">';
                    value.forEach((item, index) => {
                        content += createNode(index, item).outerHTML;
                        if (index < value.length - 1) content += '<span class="json-comma">,</span>';
                    });
                    content += '</div><span class="json-bracket">]</span>';
                } else if (isObject) {
                    content = '<span class="json-brace">{</span><div class="json-children">';
                    const keys = Object.keys(value);
                    keys.forEach((k, i) => {
                        content += createNode(k, value[k]).outerHTML;
                        if (i < keys.length - 1) content += '<span class="json-comma">,</span>';
                    });
                    content += '</div><span class="json-brace">}</span>';
                }
            } else {
                if (isArray) {
                    content = `<span class="json-key">${key}:</span> <span class="json-bracket">[</span><span class="json-summary">${value.length} items</span><span class="json-bracket">]</span>`;
                    node.addEventListener('click', function(e) {
                        e.stopPropagation();
                        this.classList.toggle('expanded');
                        if (this.classList.contains('expanded')) {
                            let children = '';
                            value.forEach((item, index) => {
                                children += createNode(index, item, true).outerHTML;
                                if (index < value.length - 1) children += '<span class="json-comma">,</span>';
                            });
                            const childrenEl = document.createElement('div');
                            childrenEl.className = 'json-children';
                            childrenEl.innerHTML = children;
                            this.appendChild(childrenEl);
                        } else {
                            const childrenEl = this.querySelector('.json-children');
                            if (childrenEl) childrenEl.remove();
                        }
                    });
                } else if (isObject) {
                    content = `<span class="json-key">${key}:</span> <span class="json-brace">{</span><span class="json-summary">${Object.keys(value).length} keys</span><span class="json-brace">}</span>`;
                    node.addEventListener('click', function(e) {
                        e.stopPropagation();
                        this.classList.toggle('expanded');
                        if (this.classList.contains('expanded')) {
                            let children = '';
                            const keys = Object.keys(value);
                            keys.forEach((k, i) => {
                                children += createNode(k, value[k], true).outerHTML;
                                if (i < keys.length - 1) children += '<span class="json-comma">,</span>';
                            });
                            const childrenEl = document.createElement('div');
                            childrenEl.className = 'json-children';
                            childrenEl.innerHTML = children;
                            this.appendChild(childrenEl);
                        } else {
                            const childrenEl = this.querySelector('.json-children');
                            if (childrenEl) childrenEl.remove();
                        }
                    });
                } else {
                    const valueClass = type === 'string' ? 'json-string' : 
                                     type === 'number' ? 'json-number' :
                                     type === 'boolean' ? 'json-boolean' : 'json-null';
                    const displayValue = type === 'string' ? `"${value}"` : value;
                    content = `<span class="json-key">${key}:</span> <span class="${valueClass}">${displayValue}</span>`;
                }
            }
            
            node.innerHTML = content;
            return node;
        }
        
        const rootNode = createNode('', data, true);
        container.appendChild(rootNode);
    }
    
    // Função para alternar entre visualização de texto e árvore
    function toggleViewMode(textareaId) {
        const textarea = document.getElementById(textareaId);
        const container = document.getElementById(textareaId + 'Container');
        const treeContainer = document.getElementById(textareaId + 'Tree');
        const toggleBtn = document.getElementById(textareaId + 'ToggleView');
        
        if (!textarea.viewMode || textarea.viewMode === 'text') {
            // Mudar para visualização em árvore
            const jsonData = formatJson(textarea);
            if (jsonData !== null) {
                textarea.style.display = 'none';
                treeContainer.style.display = 'block';
                textarea.viewMode = 'tree';
                toggleBtn.innerHTML = '<i class="fas fa-code"></i> Texto';
                toggleBtn.title = 'Alternar para visualização de texto';
                renderJsonTree(jsonData, textareaId + 'Tree');
            }
        } else {
            // Voltar para visualização de texto
            textarea.style.display = 'block';
            treeContainer.style.display = 'none';
            textarea.viewMode = 'text';
            toggleBtn.innerHTML = '<i class="fas fa-sitemap"></i> Árvore';
            toggleBtn.title = 'Alternar para visualização em árvore';
        }
    }
    
    // Função para copiar para a área de transferência
    function copyToClipboard() {
        const jsonData = outputJsonContainer.value;
        if (!jsonData) {
            showMessage('Nenhum dado para copiar.', 'warning');
            return;
        }
        
        navigator.clipboard.writeText(jsonData).then(() => {
            showMessage('JSON copiado para a área de transferência!', 'success');
        }).catch(err => {
            console.error('Erro ao copiar para a área de transferência:', err);
            showMessage('Erro ao copiar para a área de transferência.', 'error');
        });
    }
    
    // Adiciona os botões de exportação, cópia e formatação
    const formatSourceBtn = document.createElement('button');
    formatSourceBtn.className = 'btn-format';
    formatSourceBtn.setAttribute('data-tooltip', 'Formatar JSON de origem');
    formatSourceBtn.innerHTML = '<i class="fas fa-indent"></i> Format Source';
    formatSourceBtn.addEventListener('click', () => formatJson(sourceJsonTextarea));
    
    const formatOutputBtn = document.createElement('button');
    formatOutputBtn.className = 'btn-format';
    formatOutputBtn.setAttribute('data-tooltip', 'Formatar JSON de saída');
    formatOutputBtn.innerHTML = '<i class="fas fa-outdent"></i> Format Output';
    formatOutputBtn.addEventListener('click', () => formatJson(outputJsonTextarea));
    
    const exportButton = document.createElement('button');
    exportButton.id = 'exportButton';
    exportButton.className = 'btn-export';
    exportButton.setAttribute('data-tooltip', 'Baixar o JSON mapeado como arquivo');
    exportButton.innerHTML = '<i class="fas fa-file-export"></i> Exportar';
    exportButton.addEventListener('click', exportJson);
    
    const copyButton = document.createElement('button');
    copyButton.className = 'btn-copy';
    copyButton.setAttribute('data-tooltip', 'Copiar JSON para a área de transferência');
    copyButton.innerHTML = '<i class="far fa-copy"></i> Copiar';
    copyButton.addEventListener('click', copyToClipboard);
    
    const controls = document.querySelector('.controls');
    controls.appendChild(formatSourceBtn);
    controls.appendChild(formatOutputBtn);
    controls.appendChild(exportButton);
    controls.appendChild(copyButton);
    
    // Adiciona tooltips aos botões existentes
    mapButton.setAttribute('data-tooltip', 'Mapear campos entre os JSONs (Ctrl+M)');
    generateOutputJsonButton.setAttribute('data-tooltip', 'Gerar JSON de saída com base no mapeamento (Ctrl+G)');
    
    // Adiciona atalhos de teclado
    document.addEventListener('keydown', function(e) {
        // Ctrl+Enter - Criar lista de dados
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            e.preventDefault();
            createListButtonAction();
        }
        
        // Ctrl+M - Mapear campos
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'm') {
            e.preventDefault();
            mapButton.click();
        }
        
        // Ctrl+G - Gerar JSON de saída
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'g') {
            e.preventDefault();
            generateOutputJsonButton.click();
        }
        
        // Ctrl+S - Salvar/Exportar JSON
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
            e.preventDefault();
            exportJson();
        }
        
        // Ctrl+Shift+F - Formatar JSON ativo
        if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'f') {
            e.preventDefault();
            const activeElement = document.activeElement;
            if (activeElement === sourceJsonTextarea || activeElement === outputJsonTextarea) {
                formatJson(activeElement);
            } else if (document.activeElement === document.body) {
                // Se nenhum textarea estiver focado, formata ambos
                formatJson(sourceJsonTextarea);
                formatJson(outputJsonTextarea);
            }
        }
    });
    
    // Adiciona a barra de progresso de rolagem
    const progressContainer = document.createElement('div');
    progressContainer.className = 'progress-container';
    progressContainer.innerHTML = '<div class="progress-bar"></div>';
    document.body.insertBefore(progressContainer, document.body.firstChild);
    
    // Atualiza a barra de progresso ao rolar
    window.addEventListener('scroll', function() {
        const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
        const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        const scrolled = (winScroll / height) * 100;
        document.querySelector('.progress-bar').style.width = scrolled + '%';
    });
    
    // Adiciona dica de atalhos no rodapé
    const footer = document.createElement('div');
    footer.className = 'keyboard-shortcuts';
    
    // Mostra/esconde o botão de rolagem
    window.addEventListener('scroll', function() {
        if (window.pageYOffset > 300) {
            scrollToTopBtn.classList.add('show');
        } else {
            scrollToTopBtn.classList.remove('show');
        }
    });
    
    // Rola suavemente para o topo ao clicar no botão
    scrollToTopBtn.addEventListener('click', function() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
    
    // Atualiza os botões existentes com ícones (se existirem)
    const maybeCreateListBtn = document.getElementById('createListButton');
    if (maybeCreateListBtn) {
        maybeCreateListBtn.innerHTML = '<i class="fas fa-list"></i> ' + maybeCreateListBtn.textContent;
    }
    if (mapButton) {
        mapButton.innerHTML = '<i class="fas fa-project-diagram"></i> ' + mapButton.textContent;
    }
    if (generateOutputJsonButton) {
        generateOutputJsonButton.innerHTML = '<i class="fas fa-cogs"></i> ' + generateOutputJsonButton.textContent;
    }
    
    // Adiciona os manipuladores de eventos para os botões de visualização em árvore
    const sourceToggleBtn = document.getElementById('sourceJsonTextareaToggleView');
    const outputToggleBtn = document.getElementById('outputJsonTextareaToggleView');
    
    if (sourceToggleBtn) {
        sourceToggleBtn.addEventListener('click', () => toggleViewMode('sourceJsonTextarea'));
        document.getElementById('sourceJsonTextarea').viewMode = 'text';
    }
    
    if (outputToggleBtn) {
        outputToggleBtn.addEventListener('click', () => toggleViewMode('outputJsonTextarea'));
        document.getElementById('outputJsonTextarea').viewMode = 'text';
    }
    
    // Inicializa os tooltips
    const tooltips = document.querySelectorAll('[data-tooltip]');
    tooltips.forEach(tooltip => {
        tooltip.addEventListener('mouseenter', function(e) {
            const tooltipText = this.getAttribute('data-tooltip');
            const tooltipElement = document.createElement('div');
            tooltipElement.className = 'tooltip';
            tooltipElement.textContent = tooltipText;
            document.body.appendChild(tooltipElement);
            
            const rect = this.getBoundingClientRect();
            tooltipElement.style.top = (rect.top - tooltipElement.offsetHeight - 10) + 'px';
            tooltipElement.style.left = (rect.left + (this.offsetWidth / 2) - (tooltipElement.offsetWidth / 2)) + 'px';
            
            this.tooltipElement = tooltipElement;
        });
        
        tooltip.addEventListener('mouseleave', function() {
            if (this.tooltipElement) {
                this.tooltipElement.remove();
                this.tooltipElement = null;
            }
        });
    });
});
