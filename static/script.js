let sourceJson;
const keysList = [];

document.addEventListener('DOMContentLoaded', function () {
    const sourceJsonTextarea = document.getElementById('sourceJsonTextarea');
    const outputJsonTextarea = document.getElementById('outputJsonTextarea');
    const errorMessage = document.getElementById('errorMessage');
    const formContainer = document.getElementById('formContainer');
    const mappedJsonContainer = document.getElementById('mappedJsonContainer');
    const keysListbox = document.getElementById('keysListbox');
    const generateOutputJsonButton = document.getElementById('generateOutputJson');
    const outputJsonContainer = document.getElementById('outputJsonContainer');
    
    const createListButton = document.getElementById('createListButton');
    const mapButton = document.getElementById('mapButton');
    

    // Define a função para parsear JSON
    function parseJson(jsonString) {
        try {
            return JSON.parse(jsonString);
        } catch (error) {
            return null;
        }
    }
    // Define a função para gerar a lista de chaves hierarquizadas
    function generateKeysList(json, parentContainer, prefix = '') {
        for (const key in json) {
            if (json.hasOwnProperty(key)) {
                const value = json[key];

                if (Array.isArray(value)) {
                    // Para arrays, gere chaves para as propriedades dos objetos dentro do array
                    value.forEach((item, index) => {
                        generateKeysList(item, parentContainer, `${prefix}${key}[${index}].`);
                    });
                } else if (typeof value === 'object' && value !== null) {
                    // Para objetos, gere chaves de forma recursiva
                    parentContainer.push(prefix + key);
                    generateKeysList(value, parentContainer, prefix + key + '.');
                } else {
                    parentContainer.push(prefix + key);
                }
            }
        }
    }

    // Função que contém o código do evento "Criar lista de dados"
    function createListButtonAction() {
        const sourceJsonText = sourceJsonTextarea.value;
        try {
            sourceJson = JSON.parse(sourceJsonText);
            generateKeysList(keysList);
            console.log('Lista de chaves hierarquizadas:', keysList);
        } catch (error) {
            console.error('Erro ao fazer o parse do JSON de origem:', error);
        }

        //errorMessage.textContent = '';
        formContainer.innerHTML = ''; // Limpa o formulário anterior
        mappedJsonContainer.textContent = ''; // Limpa o JSON mapeado anterior

        generateKeysList(sourceJson, keysList);

        // Exemplo de código para gerar o JSON mapeado
        const mappedJson = keysList.join('\n');

        // Exibir o JSON mapeado no elemento correspondente
        mappedJsonContainer.textContent = mappedJson;
    }

    // Define o evento para o botão "Criar lista de dados"
    createListButton.addEventListener('click', createListButtonAction);

    // Define o evento para o botão "Realizar Mapeamento"
    mapButton.addEventListener('click', function () {
        // Chama a função createListButtonAction antes de continuar
        createListButtonAction();

        // Resto do código do evento mapButton
        errorMessage.textContent = '';
        formContainer.innerHTML = ''; // Clear previous form
        mappedJsonContainer.textContent = ''; // Clear previous mapped JSON

        const sourceJson = parseJson(sourceJsonTextarea.value);
        const outputJson = parseJson(outputJsonTextarea.value);

        if (!sourceJson) {
            errorMessage.textContent = 'Por favor, forneça JSONs de origem válidos.';
            return;
        } else if (!outputJson) {
            errorMessage.textContent = 'Por favor, forneça JSONs de saída válidos.';
            return;
        }

        generateIndentedInputFields(outputJson, formContainer, keysList); // Generate input fields with indentation and provide sourceJson

        const mappedJson = performJMESPathMapping(keysList, outputJson);

        mappedJsonContainer.textContent = JSON.stringify(mappedJson, null, 2);
        // Após a geração do formulário dinâmico, imprima o conteúdo do formContainer no console
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

    function generateIndentedInputFields(json, parentContainer, sourceJson, depth = 0, parentKeyPath = '') {
        for (const key in json) {
            if (json.hasOwnProperty(key)) {
                const value = json[key];
                const fieldContainer = document.createElement('div');
                fieldContainer.classList.add('field-container');
                fieldContainer.style.marginLeft = `${depth * 20}px`; // Ajusta a indentação
                fieldContainer.style.marginLeft = `1px`;

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
                    if (value.length > 0) {
                        // Verifique se o array contém objetos
                        if (typeof value[0] === 'object') {
                            // Crie campos para cada objeto no array
                            for (let i = 0; i < value.length; i++) {
                                const arrayItemContainer = document.createElement('div');
                                arrayItemContainer.classList.add('array-item-container');
                                arrayItemContainer.style.marginLeft = `${(depth + 1) * 20}px`; // Indentação adicional

                                // Adicione o índice do objeto dentro do array
                                const indexLabel = document.createElement('span');
                                indexLabel.textContent = `${i}:`;
                                arrayItemContainer.appendChild(indexLabel);

                                // Crie campos para os objetos dentro do array
                                generateIndentedInputFields(value[i], arrayItemContainer, sourceJson, depth + 1, `${keyPath}[${i}]`);
                                fieldContainer.appendChild(arrayItemContainer);
                            }
                        }
                    }
                } else if (typeof value === 'object' && !Array.isArray(value)) {
                    generateIndentedInputFields(value, fieldContainer, sourceJson, depth + 1, keyPath);
                } else {
                    const select = document.createElement('select');
                    select.name = keyPath + '_select';
                    select.style.marginLeft = '5px';

                    // Adicionar a opção de placeholder
                    const placeholderOption = document.createElement('option');
                    placeholderOption.value = '';
                    placeholderOption.textContent = 'Selecione a opção para mapeamento';
                    select.appendChild(placeholderOption);

                    for (const sourceKey in sourceJson) {
                        const option = document.createElement('option');
                        option.value = keyPath + '.' + sourceKey; // Chave completa
                        option.textContent = sourceJson[sourceKey];
                        select.appendChild(option);
                    }

                    fieldContainer.appendChild(select);
                }

                parentContainer.appendChild(fieldContainer);
            }
        }
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

    generateKeysListFromSource(sourceJson, keysListbox);

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
                    // Verifica se a chave mapeada está presente em sourceJson
                    const mappedKey = prefix + key;
                    if (sourceJson.hasOwnProperty(mappedKey)) {
                        generatePreviewJson(outputJson[key], currentElement, prefix + key + '.', sourceJson);
                    } else {
                        generatePreviewJson(outputJson[key], currentElement, prefix + key + '.');
                    }
                } else {
                    const valueElement = document.createElement('span');
                    valueElement.classList.add('preview-value');
                    valueElement.textContent = key; // Usar a chave como valor
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
            const value = input.type === 'select-one' ? input.options[input.selectedIndex].label : input.value;

            // Remove o sufixo "_select" do último nome da chave
            const cleanKey = key.replace(/_select$/, '');

            // Divide a chave em partes
            const keys = cleanKey.split('.');
            let currentLevel = outputJsonData;

            // Percorre as partes da chave e cria os objetos pai, se necessário
            for (let i = 0; i < keys.length - 1; i++) {
                const currentKey = keys[i];

                if (!currentLevel[currentKey]) {
                    currentLevel[currentKey] = {};
                }

                currentLevel = currentLevel[currentKey];
            }

            // Define o valor na chave mais interna
            const lastKey = keys[keys.length - 1];

            // Verifica se o valor selecionado é o placeholder
            if (value === "Selecione a opção para mapeamento") {
                currentLevel[lastKey] = ""; // Ou currentLevel[lastKey] = null; para definir como null
            } else {
                currentLevel[lastKey] = value;
            }
        });
    }


    // Define o evento de clique para o botão "Gerar o Json de saída"
    // Define o evento de clique para o botão "Gerar o Json de saída"
    generateOutputJsonButton.addEventListener('click', function () {
        const formInputs = formContainer.querySelectorAll('input[name], select[name]');
        const outputPreview = {};

        // Popula o JSON de saída com os valores do formulário
        populateOutputJsonFromForm(formInputs, outputPreview);

        // Função para corrigir a estrutura do JSON mapeado
        function fixArrayStructure(obj) {
            for (const key in obj) {
                if (Array.isArray(obj[key])) {
                    // Se o valor for um array, verifique se ele contém objetos
                    if (obj[key].length > 0 && typeof obj[key][0] === 'object') {
                        const newArray = {};

                        for (let i = 0; i < obj[key].length; i++) {
                            const newItem = fixArrayStructure(obj[key][i]);
                            Object.keys(newItem).forEach(newKey => {
                                newArray[`${key}[${i}].${newKey}`] = newItem[newKey];
                            });
                        }

                        obj[key] = newArray;
                    }
                } else if (typeof obj[key] === 'object' && obj[key] !== null) {
                    obj[key] = fixArrayStructure(obj[key]);
                }
            }

            return obj;
        }

        // Corrige a estrutura do JSON mapeado
        const fixedMappedJson = fixArrayStructure(outputPreview);

        // Exibe o JSON mapeado corrigido no textarea
        const outputJson = JSON.stringify(fixedMappedJson, null, 2);
        outputJsonContainer.textContent = outputJson;

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
            //console.log('Log da lista no console:', formattedJsonList);
        } else {
            errorMessage.textContent = 'Por favor, forneça um JSON de saída válido.';
        }
    }


    // Define o evento de clique para o botão "Gerar o Json de saída"
    generateOutputJsonButton.addEventListener('click', generateEmptyOutputJson);
        
});
