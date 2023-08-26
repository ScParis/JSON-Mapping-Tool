let sourceJson;
const keysList = [];

document.addEventListener('DOMContentLoaded', function () {
    const sourceJsonTextarea = document.getElementById('sourceJsonTextarea');
    const outputJsonTextarea = document.getElementById('outputJsonTextarea');
    const errorMessage = document.getElementById('errorMessage');
    const formContainer = document.getElementById('formContainer');
    const mappedJsonContainer = document.getElementById('mappedJsonContainer');
    const keysListbox = document.getElementById('keys-listbox');
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

        for (const keyPath of keysList) {
            const keys = keyPath.split('.');
            let sourceValue = outputJson;

            for (const key of keys) {
                const matchArray = key.match(/(.+)\[(\d+)\]$/); // Verifica se a chave é um array
                if (matchArray) {
                    const arrayKey = matchArray[1];
                    const index = parseInt(matchArray[2]);

                    if (sourceValue.hasOwnProperty(arrayKey) && Array.isArray(sourceValue[arrayKey])) {
                        const arrayItem = sourceValue[arrayKey][index];
                        sourceValue = arrayItem;
                    } else {
                        sourceValue = null;
                        break;
                    }
                } else {
                    if (sourceValue.hasOwnProperty(key)) {
                        sourceValue = sourceValue[key];
                    } else {
                        sourceValue = null;
                        break;
                    }
                }
            }

            setNestedKeyValue(mappedJson, keyPath, sourceValue);
        }

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

    const selectedKeyField = document.getElementById('selectedKey');

    function setNestedKeyValue(obj, path, value) {
        const keys = path.split('.');
        let nestedObj = obj;

        for (let i = 0; i < keys.length - 1; i++) {
            const key = keys[i];
            if (!nestedObj[key]) {
                nestedObj[key] = {};
            }
            nestedObj = nestedObj[key];
        }

        const lastKey = keys[keys.length - 1];
        if (value !== '') { // Adiciona a verificação para ignorar campos vazios
            nestedObj[lastKey] = value;
        }
    }
    function generatePreviewJson(outputJson) {
        const previewJsonContainer = document.getElementById('previewJson');
        previewJsonContainer.innerHTML = ''; // Limpa o conteúdo anterior

        function createPreviewElement(key, value) {
            const previewElement = document.createElement('div');
            previewElement.classList.add('preview-element');

            const keyElement = document.createElement('span');
            keyElement.classList.add('preview-key');
            keyElement.textContent = key;

            if (typeof value === 'object' && value !== null) {
                const subElements = document.createElement('div');
                subElements.classList.add('sub-elements');

                for (const subKey in value) {
                    if (value.hasOwnProperty(subKey)) {
                        createPreviewElement(subKey, value[subKey]);
                    }
                }

                previewElement.appendChild(keyElement);
                previewElement.appendChild(subElements);
            } else {
                previewElement.appendChild(keyElement);
            }

            return previewElement;
        }

        for (const key in outputJson) {
            if (outputJson.hasOwnProperty(key)) {
                const previewElement = createPreviewElement(key, outputJson[key]);
                previewJsonContainer.appendChild(previewElement);
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
});
