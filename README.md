# Aplicação de Mapeamento de Saída para Arquivos JSON

Bem-vindo à documentação da nossa aplicação de mapeamento de saída para arquivos JSON! Neste arquivo README, vamos detalhar as funcionalidades principais e o processo de desenvolvimento da aplicação.

## Funcionalidades

1. **Envio de JSON de Origem:** Os usuários podem inserir um JSON de origem que servirá como base para preparar o JSON de saída.
2. **Envio de JSON de Saída:** Os usuários podem fornecer um JSON de saída desejado, que será usado como modelo para a estrutura final.
3. **Validação de Estrutura:** A aplicação verifica se os JSONs de origem e saída estão bem formados e exibe mensagens de erro ou aviso caso haja problemas de estrutura.
4. **Limpeza dos Valores das Chaves:** Os valores das chaves no JSON de saída são limpos para possivelmente remover informações sensíveis.
5. **Conversão para Formulário:** A estrutura do JSON de saída é mapeada para um formulário visual, onde cada chave é representada por um campo de input.
6. **Campos de Input e Listagem de Chaves:** Os campos de input permitem que os usuários insiram valores para as chaves do JSON de saída. Uma lista suspensa exibe as chaves hierárquicas do JSON de origem para seleção.
7. **Mapeamento JMESPath:** Os valores inseridos pelos usuários são mapeados para os valores correspondentes usando expressões JMESPath.
8. **Geração do JSON de Saída:** Ao finalizar o mapeamento, a aplicação gera o JSON de saída completo, incluindo chaves e valores com mapeamento JMESPath.

------
## Exemplos
### JSON de Origem

```json
{
   "pedido":{
      "id":1,
      "vendedor":"nome",
      "data":"23/08/2023",
      "entrega":{
         "id":3,
         "tipo":2,
         "nome":"Transportadora"
      },
      "itens":[
         {
            "id":1588,
            "nome":"Câmera infravermelho",
            "quantidade":20,
            "valor":"325.00"
         },
         {
            "id":1001,
            "nome":"Central de vigilância",
            "quantidade":2,
            "valor":"5,325.00"
         }
      ]
   },
   "cliente":{
      "id":12,
      "nome":"Pedro",
      "data_nascimento":"01/01/2000",
      "endereco":{
         "cep":"13087010",
         "tipoLogradouro":"RUA",
         "logradouro":"Latino Coelho,421 Pq Taquaral Casa 25",
         "numero":"421",
         "complemento":"Casa 25",
         "bairro":"Pq Taquaral",
         "municipio":"Campinas",
         "uf":"SP",
         "descricaoUf":"São Paulo"
      }
   }
}
```

### JSON de saída

```json

{
   "parceiro":{
      "codigo":35196
   },
   "responsavelFinanceiro":{
      "nome":"Maria de Fatima Gomes Bastos",
      "dataNascimento":"1959-01-12",
      "endereco":{
         "cep":"13087010",
         "tipoLogradouro":"RUA",
         "logradouro":"Latino Coelho,421 Pq Taquaral Casa 25",
         "numero":"421",
         "complemento":"Casa 25",
         "bairro":"Pq Taquaral",
         "municipio":"Campinas",
         "uf":"SP",
         "descricaoUf":"São Paulo"
      }
   }
}
```
