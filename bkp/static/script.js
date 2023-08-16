let sourceJson;
const keysList = [];

document.addEventListener('DOMContentLoaded', function () {
    const sourceJsonTextarea = document.getElementById('sourceJsonTextarea');
    const outputJsonTextarea = document.getElementById('outputJsonTextarea');
    const mapButton = document.getElementById('mapButton');
    const createListButton = document.getElementById('createListButton'); // Novo botão
    const errorMessage = document.getElementById('errorMessage');
    const formContainer = document.getElementById('formContainer');
    const mappedJsonContainer = document.getElementById('mappedJsonContainer');
    const keysListbox = document.getElementById('keys-listbox');
    const generateOutputJsonButton = document.getElementById('generateOutputJson');
    const outputJsonContainer = document.getElementById('outputJsonContainer');

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

                if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                    // Adiciona a chave à lista com a hierarquia
                    parentContainer.push(prefix + key);

                    // Recursivamente gera as chaves internas
                    generateKeysList(value, parentContainer, prefix + key + '.');
                } else {
                    // Adiciona a chave à lista
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

                const input = document.createElement('input');
                input.type = 'text';
                input.name = key;

                fieldContainer.appendChild(label);
                fieldContainer.appendChild(input);
                formContainer.appendChild(fieldContainer);
            }
        }
    }
    // Define o evento para o botão "Criar lista de dados"
    createListButton.addEventListener('click', function () {
        errorMessage.textContent = '';
        formContainer.innerHTML = ''; // Limpa o formulário anterior
        mappedJsonContainer.textContent = ''; // Limpa o JSON mapeado anterior

        const sourceJson = parseJson(sourceJsonTextarea.value);

        if (!sourceJson) {
            errorMessage.textContent = 'Por favor, forneça um JSON válido.';
            return;
        }


        generateKeysList(sourceJson, keysList);
        console.log('Lista de chaves hierarquizadas:', keysList);

        // Exemplo de código para gerar o JSON mapeado
        const mappedJson = keysList.join('\n');

        // Exibir o JSON mapeado no elemento correspondente
        //mappedJsonContainer.textContent = mappedJson;
        //console.log('JsonMapper:', mappedJson); 
    });

    // Define the event listener for the "Realizar Mapeamento" button
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

                    //console.log('Source:', sourceJson)

                    // Populate select with keys from sourceJson
                    for (const sourceKey in sourceJson) {
                        const option = document.createElement('option');
                        option.value = sourceJson[sourceKey];
                        option.textContent = sourceJson[sourceKey];
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

    // Gerar as opções da lista de seleção a partir do JSON de origem
    generateKeysListFromSource(sourceJson, keysListbox);

    keysListbox.addEventListener('change', function () {
        const selectedKey = keysListbox.value;
        selectedKeyField.value = selectedKey;

        generateForm(jsonOutput, selectedKey, keysListbox.options); // Gere o formulário aqui com a chave selecionada e as opções do keysListbox
    });
    //const keysListbox = document.getElementById('keys-listbox');
    const selectedKeyField = document.getElementById('selectedKey');

    generateKeysList(jsonOrigin.data, keysListbox);

    keysListbox.addEventListener('change', function () {
        const selectedKey = keysListbox.value;
        selectedKeyField.value = selectedKey;

        generateForm(jsonOutput, selectedKey, keysListbox.options); // Gere o formulário aqui com a chave selecionada e as opções do keysListbox
    });
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
