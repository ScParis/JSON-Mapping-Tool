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
    // Define a function to generate the dynamic form
    function generateDynamicForm(outputJson) {
        formContainer.innerHTML = ''; // Clear previous form
                
        for (const key in outputJson) {
            if (outputJson.hasOwnProperty(key)) {
                const fieldContainer = document.createElement('div');
                fieldContainer.classList.add('field-container');

                const label = document.createElement('label');
                label.textContent = key;
                label.classList.add('form-label'); // Add a custom class for labels

                const input = document.createElement('input');
                input.type = 'text';
                input.name = key;
                input.classList.add('form-input'); // Add a custom class for inputs

                fieldContainer.appendChild(label);
                fieldContainer.appendChild(input);
                formContainer.appendChild(fieldContainer);
            }
        }
        // Adicione este console.log para imprimir o resultado do formContainer
        console.log('Resultado do formContainer:', formContainer);
    }
    // Define o evento para o botão "Criar lista de dados"
    createListButton.addEventListener('click', function () {
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

    // Define the event listener for the "Realizar Mapeamento" button
    mapButton.addEventListener('click', function () {
        errorMessage.textContent = '';
        formContainer.innerHTML = ''; // Clear previous form
        mappedJsonContainer.textContent = ''; // Clear previous mapped JSON

        const sourceJson = parseJson(sourceJsonTextarea.value);
        const outputJson = parseJson(outputJsonTextarea.value);

        if (!sourceJson) {
            errorMessage.textContent = 'Por favor, forneça JSONs de origem válido válidos.';
            return;
        }else if (!outputJson){
            errorMessage.textContent = 'Por favor, forneça JSONs de saída válido válidos.';
            return;
        }

        generateIndentedInputFields(outputJson, formContainer, keysList); // Generate input fields with indentation and provide sourceJson

        const mappedJson = performJMESPathMapping(keysList, outputJson);

        mappedJsonContainer.textContent = JSON.stringify(mappedJson, null, 2);
        // Após a geração do formulário dinâmico, imprima o conteúdo do formContainer no console

    });


    function generateInputFields(json, parentContainer) {
        for (const key in json) {
            if (json.hasOwnProperty(key)) {
                const value = json[key];

                if (typeof value === 'object' && !Array.isArray(value)) {
                    const fieldContainer = document.createElement('div');
                    fieldContainer.classList.add('field-container');

                    const label = document.createElement('label');
                    label.textContent = key;

                    fieldContainer.appendChild(label);
                    parentContainer.appendChild(fieldContainer);

                    generateInputFields(value, fieldContainer);
                } else {
                    const fieldContainer = document.createElement('div');
                    fieldContainer.classList.add('field-container');

                    const label = document.createElement('label');
                    label.textContent = key;

                    const input = document.createElement('input');
                    input.type = 'text';
                    input.name = key;

                    fieldContainer.appendChild(label);
                    fieldContainer.appendChild(input);
                    parentContainer.appendChild(fieldContainer);
                }
            }
        }
    }

    function generateIndentedInputFields(json, parentContainer, sourceJson, depth = 0) {
        for (const key in json) {
            if (json.hasOwnProperty(key)) {
                const value = json[key];
                const fieldContainer = document.createElement('div');
                fieldContainer.classList.add('field-container');
                fieldContainer.style.marginLeft = `${depth * 20}px`; // Ajusta a indentação

                const label = document.createElement('span');
                label.classList.add('label');
                label.textContent = key + ':';
                fieldContainer.appendChild(label);

                if (Array.isArray(value)) {
                    if (value.length > 0) {
                        // Verifica se o valor no array é um objeto
                        if (typeof value[0] === 'object') {
                            generateIndentedInputFields(value[0], fieldContainer, sourceJson, depth + 1);
                        }
                    }
                } else if (typeof value === 'object' && !Array.isArray(value)) {
                    generateIndentedInputFields(value, fieldContainer, sourceJson, depth + 1);
                } else {
                    const select = document.createElement('select');
                    select.name = key + '_select';
                    select.style.marginLeft = '5px';
                    // Adicionar a opção de placeholder
                    const placeholderOption = document.createElement('option');
                    placeholderOption.value = '';
                    placeholderOption.textContent = 'Selecione a opção para mapeamento';
                    select.appendChild(placeholderOption);

                    for (const sourceKey in sourceJson) {
                        const option = document.createElement('option');
                        option.value = sourceJson[sourceKey];
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

    function generatePreviewJson(outputJson, parentElement, prefix = '') {
        for (const key in outputJson) {
            if (outputJson.hasOwnProperty(key)) {
                const currentElement = document.createElement('div');
                currentElement.classList.add('preview-element');

                const keyElement = document.createElement('span');
                keyElement.classList.add('preview-key');
                keyElement.textContent = prefix + key + ':';
                currentElement.appendChild(keyElement);

                if (typeof outputJson[key] === 'object' && outputJson[key] !== null) {
                    generatePreviewJson(outputJson[key], currentElement, prefix + key + '.');
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


    // Define the event listener for the "Generate Output JSON" button
    generateOutputJsonButton.addEventListener('click', function () {
        const outputJsonData = {};
        const formInputs = formContainer.querySelectorAll('input[name], select[name]');

        formInputs.forEach(input => {
            const key = input.name;
            const value = input.type === 'select-one' ? input.value : input.value;
            setNestedKeyValue(outputJsonData, key, value);
        });

        console.log('Output JSON Data:', outputJsonData);

        const outputJson = JSON.stringify(outputJsonData, null, 2);
        outputJsonContainer.textContent = outputJson;

        // Generate the preview of the output JSON structure
        generatePreviewJson(outputJsonData);
    });
    // Define a função para gerar o JSON de saída com valores limpos
    function generateEmptyOutputJson() {
        const outputJsonText = outputJsonTextarea.value;
        const outputJsonData = parseJson(outputJsonText);

        if (outputJsonData) {
            // Função para criar a lista mantendo a estrutura hierárquica
            function createListWithHierarchy(obj, indent = 0) {
                let list = '';

                for (let key in obj) {
                    const value = obj[key];
                    const lineIndent = ' '.repeat(indent * 2);

                    if (typeof value === 'object' && !Array.isArray(value)) {
                        // Objeto aninhado, chama a função recursivamente
                        list += `${lineIndent}"${key}": {\n`;
                        list += createListWithHierarchy(value, indent + 1);
                        list += `${lineIndent}},\n`;
                    } else {
                        // Valor simples, adiciona à lista
                        list += `${lineIndent}"${key}": "",\n`;
                    }
                }

                return list;
            }

            // Chama a função para criar a lista mantendo a estrutura hierárquica
            const formattedJsonList = `{\n${createListWithHierarchy(outputJsonData)}\n}`;

            // Log da lista no console
            console.log('Log da lista no console:', formattedJsonList);
        } else {
            errorMessage.textContent = 'Por favor, forneça um JSON de saída válido.';
        }
    }

    // Define o evento de clique para o botão "Gerar o Json de saída"
    generateOutputJsonButton.addEventListener('click', generateEmptyOutputJson);
    
});
