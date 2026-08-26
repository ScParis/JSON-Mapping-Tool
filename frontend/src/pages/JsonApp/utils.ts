// Helper to set nested values when constructing the target JSON
export const setNestedValue = (obj: any, path: string, value: any) => {
    const keys = path.split('.');
    let current = obj;

    for (let i = 0; i < keys.length - 1; i++) {
        const key = keys[i];

        if (key.includes('[') && key.includes(']')) {
            const [arrayKey, indexStr] = key.split('[');
            const index = parseInt(indexStr.replace(']', ''));

            if (!current[arrayKey]) current[arrayKey] = [];
            if (!current[arrayKey][index]) current[arrayKey][index] = {};

            current = current[arrayKey][index];
        } else {
            if (!current[key]) current[key] = {};
            current = current[key];
        }
    }

    const lastKey = keys[keys.length - 1];
    if (lastKey.includes('[') && lastKey.includes(']')) {
        const [arrayKey, indexStr] = lastKey.split('[');
        const index = parseInt(indexStr.replace(']', ''));

        if (!current[arrayKey]) current[arrayKey] = [];
        current[arrayKey][index] = value;
    } else {
        current[lastKey] = value;
    }
};

// Generates basic paths for dropdown options
export const generateKeysList = (json: any, prefix = '', isSource = false): string[] => {
    let keys: string[] = [];

    if (Array.isArray(json)) {
        if (json.length > 0) {
            json.forEach((item, index) => {
                keys = keys.concat(generateKeysList(item, prefix ? `${prefix}[${index}]` : `[${index}]`, isSource));
            });
        }
        return keys;
    }

    for (const key in json) {
        if (Object.prototype.hasOwnProperty.call(json, key)) {
            const fullKey = prefix ? prefix + '.' + key : key;

            if (typeof json[key] === 'object' && json[key] !== null) {
                keys = keys.concat(generateKeysList(json[key], fullKey, isSource));
            } else {
                keys.push(fullKey);
            }
        }
    }

    return keys;
};
