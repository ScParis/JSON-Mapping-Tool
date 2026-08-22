const mappingConfig = {
  "order.items[0].code": "pedido.itens[*].id",
  "order.items[0].description": "pedido.itens[*].nome",
  "order.delivery.type": "pedido.entrega.tipo"
};
const targetJson = {
  order: {
    items: [
      {
        code: "",
        description: ""
      }
    ],
    delivery: { type: "" }
  }
};

function buildJmespathExpression(mappingConfig, targetJson) {
    const buildNode = (targetPathPrefix, targetObj, indent) => {
        const ind = ' '.repeat(indent);
        const innerInd = ' '.repeat(indent + 2);

        if (Array.isArray(targetObj)) {
            if (targetObj.length === 0) return '`[]`';
            
            // Default to examining the first element's mappings
            const arrayPrefix = targetPathPrefix ? targetPathPrefix + '[0]' : '[0]';
            const mappedKeys = Object.keys(mappingConfig).filter(k => k.startsWith(arrayPrefix + '.') && mappingConfig[k]);
            
            let sourceArrayPrefix = '';
            if (mappedKeys.length > 0) {
                for (const tk of mappedKeys) {
                    const sourcePathFull = mappingConfig[tk];
                    const sourceArrayMatch = sourcePathFull.match(/^(.*?)\[\*\]/);
                    if (sourceArrayMatch) {
                        sourceArrayPrefix = sourceArrayMatch[1] + '[*]';
                        break;
                    }
                }
            }

            if (sourceArrayPrefix) {
                // Projection mode
                return `${sourceArrayPrefix}.{\n${innerInd}` + buildHash(arrayPrefix, targetObj[0], indent + 2, sourceArrayPrefix + '.') + `\n${ind}}`;
            } else {
                // Literal Array mode
                const arrayItems = [];
                for (let i = 0; i < targetObj.length; i++) {
                    const itemPrefix = targetPathPrefix ? `${targetPathPrefix}[${i}]` : `[${i}]`;
                    arrayItems.push(buildNode(itemPrefix, targetObj[i], indent + 2));
                }
                return `[\n${innerInd}${arrayItems.join(`,\n${innerInd}`)}\n${ind}]`;
            }
        } else if (typeof targetObj === 'object' && targetObj !== null) {
            return `{\n${innerInd}` + buildHash(targetPathPrefix, targetObj, indent + 2, '') + `\n${ind}}`;
        }
        return 'null';
    }

    const buildHash = (targetPathPrefix, targetObj, indent, relativeSourceStrip) => {
        const parts = [];
        for (const key in targetObj) {
            const currentTargetPath = targetPathPrefix ? `${targetPathPrefix}.${key}` : key;
            const mappedSource = mappingConfig[currentTargetPath];
            
            const keyNameStr = `"${key}"`;

            if (typeof targetObj[key] === 'object' && targetObj[key] !== null) {
                const val = buildNode(currentTargetPath, targetObj[key], indent);
                parts.push(`${keyNameStr}: ${val}`);
            } else {
                // To support projections, we strip the sourceArrayPrefix if it exists
                if (mappedSource) {
                    let sourceExpr = mappedSource;
                    if (relativeSourceStrip) {
                        sourceExpr = sourceExpr.split(relativeSourceStrip).join('');
                    }
                    parts.push(`${keyNameStr}: ${sourceExpr}`);
                } else {
                    const fallback = typeof targetObj[key] === 'number' ? '`0`' : '`""`';
                    parts.push(`${keyNameStr}: ${fallback}`);
                }
            }
        }
        return parts.join(`,\n${' '.repeat(indent)}`);
    }

    return buildNode('', targetJson, 0);
}

console.log("PROJECTION MODE:");
console.log(buildJmespathExpression(mappingConfig, targetJson));

mappingConfig["order.items[0].code"] = "pedido.itens[0].id";
mappingConfig["order.items[0].description"] = "pedido.itens[0].nome";
console.log("\nLITERAL ARRAY MODE:");
console.log(buildJmespathExpression(mappingConfig, targetJson));

