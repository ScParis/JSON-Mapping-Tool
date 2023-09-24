let sourceJson;
let formattedJsonList = '';

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
            keysList.length = 0; // Limpa a lista de chaves
            generateKeysList(sourceJson, keysList);
            console.log('Lista de chaves hierarquizadas:', keysList);
        } catch (error) {
            console.error('Erro ao fazer o parse do JSON de origem:', error);
        }

        // Limpa os elementos anteriores
        formContainer.innerHTML = '';
        mappedJsonContainer.textContent = '';
        errorMessage.textContent = '';

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
        formContainer.innerHTML = ''; // Limpa o formulário anterior
        mappedJsonContainer.textContent = ''; // Limpa o JSON mapeado anterior

        const sourceJson = parseJson(sourceJsonTextarea.value);
        const outputJson = parseJson(outputJsonTextarea.value);

        if (!sourceJson) {
            errorMessage.textContent = 'Por favor, forneça JSONs de origem válidos.';
            return;
        } else if (!outputJson) {
            errorMessage.textContent = 'Por favor, forneça JSONs de saída válidos.';
            return;
        }

        generateIndentedInputFields(outputJson, formContainer, sourceJson, keysList); // Generate input fields with indentation and provide sourceJson

        const mappedJson = performJMESPathMapping(keysList, outputJson);

        mappedJsonContainer.textContent = JSON.stringify(mappedJson, null, 2);
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

    function generateIndentedInputFields(json, parentContainer, sourceJson, keysList, depth = 0, parentKeyPath = '') {
        for (const key in json) {
            if (json.hasOwnProperty(key)) {
                const value = json[key];
                const fieldContainer = document.createElement('div');
                fieldContainer.classList.add('field-container');
                fieldContainer.style.marginLeft = `${depth * 20}px`; // Ajusta a indentação

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
                                generateIndentedInputFields(value[i], arrayItemContainer, sourceJson, keysList, depth + 1, `${keyPath}[${i}]`);
                                fieldContainer.appendChild(arrayItemContainer);
                            }
                        }
                    }
                } else if (typeof value === 'object' && !Array.isArray(value)) {
                    generateIndentedInputFields(value, fieldContainer, sourceJson, keysList, depth + 1, keyPath);
                } else {
                    const select = document.createElement('select');
                    select.name = keyPath + '_select';
                    select.style.marginLeft = '5px';

                    // Adicionar a opção de placeholder
                    const placeholderOption = document.createElement('option');
                    placeholderOption.value = '';
                    placeholderOption.textContent = 'Selecione a opção para mapeamento';
                    select.appendChild(placeholderOption);

                    keysList.forEach((sourceKey, index) => {
                        const option = document.createElement('option');
                        option.value = sourceKey; // Chave completa
                        option.textContent = sourceKey;
                        select.appendChild(option);
                    });

                    fieldContainer.appendChild(select);
                }

                parentContainer.appendChild(fieldContainer);
            }
        }
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

                        if (Array.isArray(outputJson[key])) {
                            // Se o valor for um array, crie uma estrutura de array correspondente
                            const arrayContainer = document.createElement('div');
                            arrayContainer.classList.add('preview-array');

                            for (let i = 0; i < outputJson[key].length; i++) {
                                const arrayItemContainer = document.createElement('div');
                                arrayItemContainer.classList.add('preview-array-item');

                                generatePreviewJson(
                                    outputJson[key][i],
                                    arrayItemContainer,
                                    `${prefix + key}[${i}]`,
                                    sourceJson ? sourceJson[`${prefix + key}[${i}]`] : undefined
                                );

                                arrayContainer.appendChild(arrayItemContainer);
                            }

                            currentElement.appendChild(arrayContainer);
                        }
                    }
                } else {
                    const valueElement = document.createElement('span');
                    valueElement.classList.add('preview-value');
                    valueElement.textContent = outputJson[key]; // Use o valor correspondente em vez da chave
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
            const value = input.type === 'select-one' ? input.options[input.selectedIndex].value : input.value;

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
            if (value !== 'Selecione a opção para mapeamento') {
                currentLevel[lastKey] = value;
            }
        });
    }
 
    // Define o evento de clique para o botão "Gerar o JSON de Saída"
    generateOutputJsonButton.addEventListener('click', function () {
        const outputJsonTextarea = document.getElementById('outputJsonTextarea');
        const outputJsonContainer = document.getElementById('outputJsonContainer');

        // Obtém o conteúdo do campo outputJsonTextarea
        const outputJsonText = outputJsonTextarea.value;

        // Analisa o JSON para um objeto JavaScript
        const outputJsonObject = JSON.parse(outputJsonText);

        // Remove todos os valores do objeto, mantendo apenas as chaves
        function removeValues(obj) {
            for (const key in obj) {
                if (typeof obj[key] === 'object') {
                    removeValues(obj[key]);
                } else {
                    obj[key] = typeof obj[key] === 'object' ? {} : '';
                }
            }
        }

        removeValues(outputJsonObject);

        // Converte o objeto JavaScript resultante de volta para JSON
        const cleanedOutputJsonText = JSON.stringify(outputJsonObject, null, 2);

        // Exibe o JSON limpo no elemento outputJsonContainer
        outputJsonContainer.textContent = cleanedOutputJsonText;
    });

    
    // Define o evento de clique para o botão "Novo Mapeamento"
    newMappingButton.addEventListener('click', function () {
        const sourceJsonTextarea = document.getElementById('sourceJsonTextarea');
        const outputJsonTextarea = document.getElementById('outputJsonTextarea');
        const outputJsonContainer = document.getElementById('outputJsonContainer');
        const mappingJsonTextarea = document.getElementById('mapping_json');
        const mappedJsonContainer = document.getElementById('mappedJsonContainer');
        const formContainer = document.getElementById('formContainer');
        const keysListbox = document.getElementById('keysListbox');
        const previewJson = document.getElementById('previewJson');

        // Verifica se pelo menos um dos campos contém dados
        if (!isTextareaEmpty(sourceJsonTextarea) || !isTextareaEmpty(outputJsonTextarea) || !isTextareaEmpty(outputJsonContainer) || !isTextareaEmpty(mappingJsonTextarea)) {
            const confirmation = confirm('Você tem dados não salvos. Se continuar, os dados serão perdidos. Deseja continuar?');

            if (!confirmation) {
                // O usuário optou por não continuar, então não faz nada
                return;
            }
        }

        // Limpa os campos de JSON de origem, JSON de saída, listas, campo de JSON de saída mapeado e elementos adicionais
        sourceJsonTextarea.value = '';
        outputJsonTextarea.value = '';
        mappedJsonContainer.textContent = '';
        keysList.length = 0;

        // Limpa o conteúdo dos elementos
        if (outputJsonContainer) {
            outputJsonContainer.textContent = '';
        }

        if (mappingJsonTextarea) {
            mappingJsonTextarea.innerHTML = '';
        }

        if (formContainer) {
            formContainer.innerHTML = '';
        }

        if (keysListbox) {
            keysListbox.innerHTML = '';
        }

        if (previewJson) {
            previewJson.innerHTML = '';
        }
    });
});
