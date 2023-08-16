let sourceJson;

document.addEventListener('DOMContentLoaded', function () {
    const sourceJsonTextarea = document.getElementById('sourceJsonTextarea');
    const outputJsonTextarea = document.getElementById('outputJsonTextarea');
    const mapButton = document.getElementById('mapButton');
    const createListButton = document.getElementById('createListButton'); // Novo botão
    const errorMessage = document.getElementById('errorMessage');
    const formContainer = document.getElementById('formContainer');
    const mappedJsonContainer = document.getElementById('mappedJsonContainer');
    const keysListbox = document.getElementById('keys-listbox');

    function parseJson(jsonString) {
        try {
            return JSON.parse(jsonString);
        } catch (error) {
            return null;
        }
    }

    function generateKeysList(json, parentContainer, prefix = '') {
        // Implementação anterior aqui
    }

    function generateDynamicForm(outputJson) {
        // Implementação anterior aqui
    }

    createListButton.addEventListener('click', function () {
        errorMessage.textContent = '';
        formContainer.innerHTML = ''; // Limpa o formulário anterior
        mappedJsonContainer.textContent = ''; // Limpa o JSON mapeado anterior

        sourceJson = parseJson(sourceJsonTextarea.value);

        if (!sourceJson) {
            errorMessage.textContent = 'Por favor, forneça um JSON válido.';
            return;
        }

        const keysList = [];
        generateKeysList(sourceJson, keysList);
        console.log('Lista de chaves hierarquizadas:', keysList);

        // Exemplo de código para gerar o JSON mapeado
        const mappedJson = keysList.join('\n');
        mappedJsonContainer.textContent = mappedJson;
    });

    mapButton.addEventListener('click', function () {
        errorMessage.textContent = '';
        formContainer.innerHTML = ''; // Clear previous form
        mappedJsonContainer.textContent = ''; // Clear previous mapped JSON

        const sourceJson = parseJson(sourceJsonTextarea.value);
        const outputJson = parseJson(outputJsonTextarea.value);

        if (!sourceJson || !outputJson) {
            errorMessage.textContent = 'Por favor, forneça JSONs válidos.';
            return;
        }

        generateIndentedInputFields(outputJson, formContainer, sourceJson);
        const mappedJson = performJMESPathMapping(sourceJson, outputJson);
        mappedJsonContainer.textContent = JSON.stringify(mappedJson, null, 2);
    });

    function generateIndentedInputFields(json, parentContainer, sourceJson, depth = 0) {
        for (const key in json) {
            if (json.hasOwnProperty(key)) {
                const value = json[key];
                const fieldContainer = document.createElement('div');
                fieldContainer.classList.add('field-container');
                fieldContainer.style.marginLeft = `${depth * 20}px`; // Adjust the indentation

                if (typeof value === 'object' && !Array.isArray(value)) {
                    const label = document.createElement('span');
                    label.classList.add('label');
                    label.textContent = key + ':';
                    fieldContainer.appendChild(label);

                    generateIndentedInputFields(value, fieldContainer, sourceJson, depth + 1);
                } else if (Array.isArray(value)) {
                    const label = document.createElement('span');
                    label.classList.add('label');
                    label.textContent = key + ':';
                    fieldContainer.appendChild(label);

                    if (value.length > 0) {
                        generateIndentedInputFields(value[0], fieldContainer, sourceJson, depth + 1);
                    }
                } else {
                    const label = document.createElement('span');
                    label.classList.add('label');
                    label.textContent = key + ':';

                    const input = document.createElement('input');
                    input.type = 'text';
                    input.name = key;

                    const select = document.createElement('select');
                    select.name = key + '_select';

                    console.log('Source:', sourceJson)

                    // Populate select with keys from sourceJson
                    for (const sourceKey in sourceJson) {
                        const option = document.createElement('option');
                        option.value = sourceKey;
                        option.textContent = sourceKey;
                        select.appendChild(option);
                    }

                    fieldContainer.appendChild(label);
                    //fieldContainer.appendChild(input);
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

    keysListbox.addEventListener('change', function () {
        const selectedKey = keysListbox.value;
        selectedKeyField.value = selectedKey;

        generateForm(jsonOutput, selectedKey, keysListbox.options);
    });

    const selectedKeyField = document.getElementById('selectedKey');

    generateKeysList(jsonOrigin.data, keysListbox);

    keysListbox.addEventListener('change', function () {
        const selectedKey = keysListbox.value;
        selectedKeyField.value = selectedKey;

        generateForm(jsonOutput, selectedKey, keysListbox.options);
    });

});



document.addEventListener('DOMContentLoaded', function () {
    const sourceJsonTextarea = document.getElementById('sourceJsonTextarea');
    const outputJsonTextarea = document.getElementById('outputJsonTextarea');
    const createListButton = document.getElementById('createListButton');
    const generateOutputJsonButton = document.getElementById('generateOutputJson');
    const formContainer = document.getElementById('formContainer');
    const outputJsonContainer = document.getElementById('outputJsonContainer');

    let sourceJson;
    const keysList = [];

    createListButton.addEventListener('click', function () {
        const sourceJsonText = sourceJsonTextarea.value;
        try {
            sourceJson = JSON.parse(sourceJsonText);
            keysList.length = 0; // Clear the keysList array
            generateKeysList(sourceJson, keysList);
            console.log('Lista de chaves hierarquizadas:', keysList);
        } catch (error) {
            console.error('Erro ao fazer o parse do JSON de origem:', error);
        }
    });

    generateOutputJsonButton.addEventListener('click', function () {
        const outputJsonData = {};
        const formInputs = formContainer.querySelectorAll('input[name]');

        formInputs.forEach(input => {
            const key = input.name;
            const value = input.value;
            setNestedKeyValue(outputJsonData, key, value);
        });

        const outputJson = JSON.stringify(outputJsonData, null, 2);
        outputJsonContainer.textContent = outputJson;
    });

    function generateKeysList(json, parentContainer, prefix = '') {
        for (const key in json) {
            if (json.hasOwnProperty(key)) {
                const value = json[key];

                if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                    parentContainer.push(prefix + key);
                    generateKeysList(value, parentContainer, prefix + key + '.');
                } else {
                    parentContainer.push(prefix + key);
                }
            }
        }
    }

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
        nestedObj[lastKey] = value;
    }
});
