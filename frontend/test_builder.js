const mappingConfig = {
  "order.items[0].code": "pedido.itens[0].id",
  "order.items[0].description": "pedido.itens[0].nome",
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
            
            const arrayItems = [];
            for (let i = 0; i < targetObj.length; i++) {
                const itemPrefix = targetPathPrefix ? `${targetPathPrefix}[${i}]` : `[${i}]`;
                arrayItems.push(buildNode(itemPrefix, targetObj[i], indent + 2));
            }
            return `[\n${innerInd}${arrayItems.join(`,\n${innerInd}`)}\n${ind}]`;
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

console.log(buildJmespathExpression(mappingConfig, targetJson));
