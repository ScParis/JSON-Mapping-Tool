<h1>Aplicação de Mapeamento de Saída para Arquivos JSON</h1>

<p>Bem-vindo à documentação da nossa aplicação de mapeamento de saída para arquivos JSON! Neste arquivo README, vamos detalhar as funcionalidades principais e o processo de desenvolvimento da aplicação.</p>

<h2>Funcionalidades</h2>

<ol>
  <li><strong>Envio de JSON de Origem:</strong> Os usuários podem inserir um JSON de origem que servirá como base para preparar o JSON de saída.</li>
  <li><strong>Envio de JSON de Saída:</strong> Os usuários podem fornecer um JSON de saída desejado, que será usado como modelo para a estrutura final.</li>
  <li><strong>Validação de Estrutura:</strong> A aplicação verifica se os JSONs de origem e saída estão bem formados e exibe mensagens de erro ou aviso caso haja problemas de estrutura.</li>
  <li><strong>Limpeza dos Valores das Chaves:</strong> Os valores das chaves no JSON de saída são limpos para possivelmente remover informações sensíveis.</li>
  <li><strong>Conversão para Formulário:</strong> A estrutura do JSON de saída é mapeada para um formulário visual, onde cada chave é representada por um campo de input.</li>
  <li><strong>Campos de Input e Listagem de Chaves:</strong> Os campos de input permitem que os usuários insiram valores para as chaves do JSON de saída. Uma lista suspensa exibe as chaves hierárquicas do JSON de origem para seleção.</li>
  <li><strong>Mapeamento JMESPath:</strong> Os valores inseridos pelos usuários são mapeados para os valores correspondentes usando expressões JMESPath.</li>
  <li><strong>Geração do JSON de Saída:</strong> Ao finalizar o mapeamento, a aplicação gera o JSON de saída completo, incluindo chaves e valores com mapeamento JMESPath.</li>
</ol>