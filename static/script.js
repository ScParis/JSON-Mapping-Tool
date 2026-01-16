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

    // Dentro do evento de clique para o botão "Realizar Mapeamento"
    mapButton.addEventListener('click', function () {
        // Chama a função createListButtonAction antes de continuar
        createListButtonAction();

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

        // Primeiro, extrai as chaves do JSON de origem
        try {
            const newKeysList = [];
            generateKeysList(sourceJson, newKeysList);
            keysList.length = 0;
            keysList.push(...newKeysList);
            console.log('[map] Chaves extraídas:', keysList.length, 'chaves:', keysList);
        } catch (error) {
            console.error('[map] Erro ao extrair chaves do JSON de origem:', error);
            errorMessage.textContent = 'Erro ao processar JSON de origem.';
            return;
        }

        generateIndentedInputFields(outputJson, formContainer, sourceJson, keysList); // Generate input fields with indentation and provide sourceJson

        const mappedJson = performJMESPathMapping(keysList, outputJson);

        mappedJsonContainer.textContent = JSON.stringify(mappedJson, null, 2);

        // Crie a variável outputJsonObject e atribua o valor
        const outputJsonObject = outputJson;

        // Remove os valores do JSON de saída, mantendo apenas as chaves, exceto no campo outputJsonTextarea
        removeValues(outputJsonObject, outputJsonTextarea);

        // Armazene o JSON limpo no LocalStorage como "template_de_saida"
        localStorage.setItem("template_de_saida", JSON.stringify(outputJsonObject));

        // Converte o JSON limpo em uma string formatada e armazena no LocalStorage como "output_json_text"
        const outputJsonCleanedText = formatJsonString(JSON.stringify(outputJsonObject, null, 2));
        localStorage.setItem("output_json_text", outputJsonCleanedText);

        // Console.log para validar o conteúdo salvo
        console.log('Conteúdo salvo no LocalStorage como "template_de_saida":', localStorage.getItem("template_de_saida"));
        console.log('Conteúdo salvo no LocalStorage como "output_json_text":', localStorage.getItem("output_json_text"));
    });

    // Função para remover valores do JSON, mantendo apenas as chaves
    function removeValues(obj) {
        for (const key in obj) {
            if (typeof obj[key] === 'object') {
                removeValues(obj[key]);
            } else {
                if (typeof obj[key] !== 'function') {
                    obj[key] = typeof obj[key] === 'object' ? {} : '';
                }
            }
        }
    }
    // Função para formatar uma string JSON com hierarquia e identação preservadas
    function formatJsonString(jsonString) {
        try {
            const jsonObj = JSON.parse(jsonString);
            return JSON.stringify(jsonObj, null, 2);
        } catch (error) {
            console.error('Erro ao formatar a string JSON:', error);
            return jsonString; // Retorna a string original se houver um erro de parse
        }
    }


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
                                const childFields = generateIndentedInputFields(item, parentContainer, sourceJson, keysList, depth + 2, `${keyPath}[${index}]`);
                                console.log(`[generateFields] childFields para item ${index}:`, childFields);
                                
                                if (childFields) {
                                    arrayItemContainer.appendChild(childFields);
                                }
                                fieldContainer.appendChild(arrayItemContainer);
                            });
                        } else {
                            // Para arrays de valores primitivos, crie um único select
                            const select = document.createElement('select');
                            select.name = keyPath + '_select';
                            select.style.width = '100%';
                            select.style.padding = '5px';
                            select.style.marginTop = '5px';

                            // Adicione uma opção padrão
                            const defaultOption = document.createElement('option');
                            defaultOption.value = '';
                            defaultOption.textContent = 'Selecione a opção para mapeamento';
                            select.appendChild(defaultOption);

                            // Adicione as chaves disponíveis como opções
                            keysList.forEach(key => {
                                const option = document.createElement('option');
                                option.value = key;
                                option.textContent = key;
                                select.appendChild(option);
                            });

                            fieldContainer.appendChild(select);
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

    
    // Função para popular o JSON de saída a partir do formulário e salvar no Local Storage
    function populateOutputJsonFrom(formInputs, outputJsonData) {
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

                // Após definir o valor, atualize o Local Storage
                localStorage.setItem("template_de_saida", JSON.stringify(outputJsonData));
                localStorage.setItem("output_json_text", JSON.stringify(outputJsonData, null, 2));
            }
        });

        // Adicione um console.log para verificar se a função está sendo chamada
        console.log('populateOutputJsonFrom foi chamada');
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
        let cleanedOutputJsonText = JSON.stringify(outputJsonObject, null, 2);
        
        // Remove aspas de valores JMESPath no texto final
        cleanedOutputJsonText = cleanedOutputJsonText.replace(/"([a-zA-Z_][a-zA-Z0-9_]*(\.[a-zA-Z_][a-zA-Z0-9_]*)*(\[[0-9]+\])*)"/g, '$1');

        // Exibe o JSON limpo no elemento outputJsonContainer
        outputJsonContainer.textContent = cleanedOutputJsonText;

        // Adicione um console.log para verificar
        console.log('JSON de saída limpo:', cleanedOutputJsonText);
    });

    const dynamicSelects = document.querySelectorAll('.dynamic-select');

    dynamicSelects.forEach(select => {
        select.addEventListener('change', function () {
            populateOutputJsonFrom(formContainer.querySelectorAll('select'), outputJson);
        });
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
