# Aplicação de Mapeamento de Saída para Arquivos JSON

Bem-vindo à documentação da nossa aplicação de mapeamento de saída para arquivos JSON! Neste arquivo README, vamos detalhar as funcionalidades principais e o processo de desenvolvimento da aplicação.

## Visão geral do que o código faz e como ele está estruturado:

### HTML:

- O HTML define a estrutura da página web, incluindo cabeçalho, corpo e elementos como botões, áreas de texto e contêineres para exibição de JSONs.

### CSS:

- O CSS fornece estilos de formatação para elementos HTML na página, como cores de fundo, bordas, margens, tamanho de fonte, etc. Ele ajuda a tornar a interface mais atraente e legível.

### JavaScript:

- O JavaScript é usado para adicionar funcionalidade interativa à página. Ele faz o seguinte:
- Define várias variáveis para elementos HTML, como áreas de texto, botões e contêineres.
- Define funções para análise JSON, geração de lista de chaves hierarquizadas, mapeamento de JSON e muito mais.

- Configura manipuladores de eventos para botões, como "Criar lista de dados" e "Realizar Mapeamento", para executar a lógica quando clicados.
- Popula o JSON de saída a partir do formulário com valores do formulário e gera uma visualização da estrutura JSON de saída.

## Principais recursos e funcionalidades:

1. A ferramenta permite aos usuários colar JSONs de origem e de saída em áreas de texto.
2. O botão "Criar lista de dados" gera uma lista hierarquizada das chaves no JSON de origem.
3. O botão "Realizar Mapeamento" gera um formulário dinâmico com opções para mapear as chaves do JSON de origem para o JSON de saída.
4. Os usuários podem selecionar as opções no formulário para realizar o mapeamento.
5. O botão "Gerar o Json de saída" gera o JSON de saída com base nas seleções feitas no formulário.
6. A ferramenta fornece uma visualização da estrutura do JSON de saída.

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
