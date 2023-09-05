// Módulo principal
(function () {
    // Função para validar a estrutura do JSON de origem
    function validateSourceJson(json) {
        // Verifique se o JSON de origem contém as chaves necessárias
        if (!json || !json.hasOwnProperty('chave1') || !json.hasOwnProperty('chave2')) {
            return false;
        }

        // Verifique se as chaves têm o formato correto (por exemplo, devem ser strings)
        if (typeof json['chave1'] !== 'string' || typeof json['chave2'] !== 'string') {
            return false;
        }

        // Adicione outras verificações conforme necessário

        return true;
    }

    // Função para validar a estrutura do JSON de saída
    function validateOutputJson(json) {
        // Verifique se o JSON de saída contém as chaves necessárias
        if (!json || !json.hasOwnProperty('chaveA') || !json.hasOwnProperty('chaveB')) {
            return false;
        }

        // Verifique se as chaves têm o formato correto (por exemplo, devem ser números)
        if (typeof json['chaveA'] !== 'number' || typeof json['chaveB'] !== 'number') {
            return false;
        }

        // Adicione outras verificações conforme necessário

        return true;
    }

    // Função para parsear JSON
    function parseJson(jsonString) {
        try {
            return JSON.parse(jsonString);
        } catch (error) {
            return null;
        }
    }
    // Função para gerar o formulário dinâmico com base no JSON de saída
    function generateDynamicForm(outputJson, formContainer, keysList) {
        // Limpa o conteúdo anterior do formulário
        formContainer.innerHTML = '';

        // Função auxiliar para criar elementos de formulário
        function createFormElement(key) {
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

        // Percorre as chaves da lista e cria elementos de formulário para cada uma delas
        keysList.forEach(key => {
            createFormElement(key);
        });
    }

    // Função para mapear o JSON de origem para o JSON de saída usando as chaves da lista
    function performJMESPathMapping(keysList, outputJson) {
        const mappedJson = {};

        // Função auxiliar para definir um valor em um objeto aninhado
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
            nestedObj[lastKey] = value;
        }

        // Itera sobre as chaves da lista e mapeia os valores correspondentes
        keysList.forEach(keyPath => {
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
        });

        return mappedJson;
    }

    // Função para gerar o JSON de saída com valores limpos
    function generateEmptyOutputJson() {
        const outputJsonText = outputJsonTextarea.value;
        const outputJsonData = parseJson(outputJsonText);

        if (!outputJsonData) {
            errorMessage.textContent = 'Por favor, forneça um JSON de saída válido.';
            return;
        }

        // Função para percorrer o objeto JSON e definir todos os valores como vazios
        function clearJsonValues(obj) {
            for (const key in obj) {
                if (typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
                    clearJsonValues(obj[key]); // Chama a função recursivamente para objetos aninhados
                } else {
                    obj[key] = ''; // Define o valor como vazio
                }
            }
        }

        const cleanOutputJsonData = JSON.parse(JSON.stringify(outputJsonData)); // Copia o JSON
        clearJsonValues(cleanOutputJsonData); // Chama a função para limpar os valores

        // Converte o objeto JSON limpo de volta para uma string JSON formatada
        const outputJson = JSON.stringify(cleanOutputJsonData, null, 2);

        // Atualiza o conteúdo do campo de saída
        outputJsonContainer.textContent = outputJson;
    }


    // Função para gerar a lista de chaves hierarquizadas
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


    // Função para gerar a visualização da estrutura do JSON de saída
    function generatePreviewJson(outputJson) {
        const previewJsonContainer = document.getElementById('previewJson');
        previewJsonContainer.innerHTML = ''; // Limpa o conteúdo anterior

        // Função auxiliar para criar elementos da visualização recursivamente
        function createPreviewElement(key, value) {
            const previewElement = document.createElement('div');
            previewElement.classList.add('preview-element');

            const keyElement = document.createElement('span');
            keyElement.classList.add('preview-key');
            keyElement.textContent = key;

            previewElement.appendChild(keyElement);

            if (typeof value === 'object' && value !== null) {
                const subElements = document.createElement('div');
                subElements.classList.add('sub-elements');

                for (const subKey in value) {
                    if (value.hasOwnProperty(subKey)) {
                        const subValue = value[subKey];
                        createPreviewElement(subKey, subValue);
                    }
                }

                previewElement.appendChild(subElements);
            }

            return previewElement;
        }

        // Percorre as chaves do JSON de saída e cria elementos da visualização
        for (const key in outputJson) {
            if (outputJson.hasOwnProperty(key)) {
                const previewElement = createPreviewElement(key, outputJson[key]);
                previewJsonContainer.appendChild(previewElement);
            }
        }
    }


    // Função para configurar os ouvintes de eventos
    function setupEventListeners() {
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

        // Define a função para realizar o mapeamento dos dados
        function performMapping(keysList, outputJson) {
            // Lógica para realizar o mapeamento dos dados
            // ...

            // Atualizar o formulário dinâmico com base no JSON de saída e na lista de chaves
            // ...

            // Atualizar o conteúdo do elemento de visualização de JSON mapeado
            // ...

        }

        // Define a função para gerar o JSON de saída com valores limpos
        function generateEmptyOutputJson() {
            const outputJsonText = outputJsonTextarea.value;
            const outputJsonData = parseJson(outputJsonText);

            if (outputJsonData) {
                // Função para percorrer o objeto JSON e definir todos os valores como vazios
                function clearJsonValues(obj) {
                    for (let key in obj) {
                        if (typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
                            clearJsonValues(obj[key]); // Chama a função recursivamente para objetos aninhados
                        } else {
                            obj[key] = ''; // Define o valor como vazio
                        }
                    }
                }

                const cleanOutputJsonData = JSON.parse(JSON.stringify(outputJsonData)); // Copia o JSON
                clearJsonValues(cleanOutputJsonData); // Chama a função para limpar os valores

                // Converte o objeto JSON limpo de volta para uma string JSON formatada
                const outputJson = JSON.stringify(cleanOutputJsonData, null, 2);

                // Crie uma lista encadeada em formato de array de strings
                const formattedJsonList = [];
                const lines = outputJson.split('\n');
                lines.forEach((line) => {
                    formattedJsonList.push(line);
                });

                // Log da lista encadeada no console
                console.log('Log da lista encadeada no console', formattedJsonList);
            } else {
                errorMessage.textContent = 'Por favor, forneça um JSON de saída válido.';
            }
        }

        // Define o evento de clique para o botão "Gerar o Json de saída"
        generateOutputJsonButton.addEventListener('click', generateEmptyOutputJson);

        // Define a função para gerar a visualização da estrutura do JSON de saída
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

        // Registra o evento de clique para o botão "Criar lista de dados"
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

        // Registra o evento de clique para o botão "Realizar Mapeamento"
        mapButton.addEventListener('click', function () {
            errorMessage.textContent = '';
            formContainer.innerHTML = ''; // Clear previous form
            mappedJsonContainer.textContent = ''; // Clear previous mapped JSON

            const sourceJson = parseJson(sourceJsonTextarea.value);
            const outputJson = parseJson(outputJsonTextarea.value);

            if (!sourceJson) {
                errorMessage.textContent = 'Por favor, forneça JSONs de origem válido válidos.';
                return;
            } else if (!outputJson) {
                errorMessage.textContent = 'Por favor, forneça JSONs de saída válido válidos.';
                return;
            }

            generateIndentedInputFields(outputJson, formContainer, keysList); // Generate input fields with indentation and provide sourceJson

            const mappedJson = performJMESPathMapping(keysList, outputJson);

            mappedJsonContainer.textContent = JSON.stringify(mappedJson, null, 2);
        });

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

        // ... (restante do código de configuração de eventos) ...
    }

    // Registra os ouvintes de eventos após o carregamento do DOM
    document.addEventListener('DOMContentLoaded', setupEventListeners);


    // Função principal de inicialização
    function init() {
        const sourceJsonTextarea = document.getElementById('sourceJsonTextarea');
        const outputJsonTextarea = document.getElementById('outputJsonTextarea');
        const errorMessage = document.getElementById('errorMessage');
        const formContainer = document.getElementById('formContainer');
        const mappedJsonContainer = document.getElementById('mappedJsonContainer');
        const generateOutputJsonButton = document.getElementById('generateOutputJson');
        const outputJsonContainer = document.getElementById('outputJsonContainer');

        // Configurar ouvintes de eventos
        setupEventListeners();
    }

    // Iniciar o aplicativo quando o DOM estiver pronto
    document.addEventListener('DOMContentLoaded', init);
})();
