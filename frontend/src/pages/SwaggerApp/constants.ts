export const PETSTORE_YAML = `openapi: 3.0.3
info:
  title: Swagger Petstore - OpenAPI 3.0
  description: |-
    This is a sample Pet Store Server based on the OpenAPI 3.0 specification.
    You can find out more about Swagger at [https://swagger.io](https://swagger.io).
  termsOfService: https://swagger.io/terms/
  contact:
    email: apiteam@swagger.io
  license:
    name: Apache 2.0
    url: https://www.apache.org/licenses/LICENSE-2.0.html
  version: 1.0.11
servers:
  - url: https://petstore3.swagger.io/api/v3
    description: Production Server
  - url: https://sandbox.petstore3.swagger.io/api/v3
    description: Sandbox Server
tags:
  - name: pet
    description: Everything about your Pets
  - name: store
    description: Access to Petstore orders
  - name: user
    description: Operations about user
paths:
  /pet:
    put:
      tags:
        - pet
      summary: Update an existing pet
      description: Update an existing pet by Id
      operationId: updatePet
      requestBody:
        description: Update an existent pet in the store
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/Pet'
        required: true
      responses:
        '200':
          description: Successful operation
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Pet'
        '400':
          description: Invalid ID supplied
        '404':
          description: Pet not found
      security:
        - petstore_auth:
            - write:pets
            - read:pets
    post:
      tags:
        - pet
      summary: Add a new pet to the store
      description: Add a new pet to the store
      operationId: addPet
      requestBody:
        description: Create a new pet in the store
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/Pet'
        required: true
      responses:
        '200':
          description: Successful operation
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Pet'
        '405':
          description: Invalid input
      security:
        - petstore_auth:
            - write:pets
            - read:pets

  /pet/findByStatus:
    get:
      tags:
        - pet
      summary: Finds Pets by status
      description: Multiple status values can be provided with comma separated strings
      operationId: findPetsByStatus
      parameters:
        - name: status
          in: query
          description: Status values that need to be considered for filter
          required: false
          schema:
            type: string
            default: available
            enum:
              - available
              - pending
              - sold
      responses:
        '200':
          description: successful operation
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/Pet'
        '400':
          description: Invalid status value

  /pet/{petId}:
    get:
      tags:
        - pet
      summary: Find pet by ID
      description: Returns a single pet
      operationId: getPetById
      parameters:
        - name: petId
          in: path
          description: ID of pet to return
          required: true
          schema:
            type: integer
            format: int64
      responses:
        '200':
          description: successful operation
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Pet'
        '400':
          description: Invalid ID supplied
        '404':
          description: Pet not found
      security:
        - api_key: []
    delete:
      tags:
        - pet
      summary: Deletes a pet
      description: delete a pet
      operationId: deletePet
      parameters:
        - name: api_key
          in: header
          description: ''
          required: false
          schema:
            type: string
        - name: petId
          in: path
          description: Pet id to delete
          required: true
          schema:
            type: integer
            format: int64
      responses:
        '200':
          description: Pet deleted successfully
        '400':
          description: Invalid pet value

  /store/order:
    post:
      tags:
        - store
      summary: Place an order for a pet
      description: Place a new order in the store
      operationId: placeOrder
      requestBody:
        description: order placed for purchasing the pet
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/Order'
      responses:
        '200':
          description: successful operation
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Order'
        '400':
          description: Invalid Order

  /store/order/{orderId}:
    get:
      tags:
        - store
      summary: Find purchase order by ID
      description: For valid response try integer IDs with value <= 5 or > 10. Other values will generate exceptions.
      operationId: getOrderById
      parameters:
        - name: orderId
          in: path
          description: ID of order that needs to be fetched
          required: true
          schema:
            type: integer
            format: int64
      responses:
        '200':
          description: successful operation
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Order'
        '400':
          description: Invalid ID supplied
        '404':
          description: Order not found

components:
  schemas:
    Category:
      type: object
      properties:
        id:
          type: integer
          format: int64
          example: 1
        name:
          type: string
          example: Dogs
    Tag:
      type: object
      properties:
        id:
          type: integer
          format: int64
        name:
          type: string
    Pet:
      required:
        - name
        - photoUrls
      type: object
      properties:
        id:
          type: integer
          format: int64
          example: 10
        name:
          type: string
          example: Doggie
        category:
          $ref: '#/components/schemas/Category'
        photoUrls:
          type: array
          items:
            type: string
        tags:
          type: array
          items:
            $ref: '#/components/schemas/Tag'
        status:
          type: string
          description: pet status in the store
          enum:
            - available
            - pending
            - sold
    Order:
      type: object
      properties:
        id:
          type: integer
          format: int64
          example: 10
        petId:
          type: integer
          format: int64
          example: 198772
        quantity:
          type: integer
          format: int32
          example: 7
        shipDate:
          type: string
          format: date-time
        status:
          type: string
          description: Order Status
          enum:
            - placed
            - approved
            - delivered
        complete:
          type: boolean
  securitySchemes:
    petstore_auth:
      type: oauth2
      flows:
        implicit:
          authorizationUrl: https://petstore3.swagger.io/oauth/authorize
          scopes:
            write:pets: modify pets in your account
            read:pets: read your pets
    api_key:
      type: apiKey
      name: api_key
      in: header
`;

export const WHATSAPP_CLOUD_API_YAML = `openapi: 3.0.3
info:
  title: Meta WhatsApp Cloud API v20.0
  description: |-
    Especificação OpenAPI oficial para envio de mensagens, templates HSM, mídias e webhooks através da **WhatsApp Business Platform (Cloud API)**.
    
    ### Recursos Disponíveis:
    - Envio de Mensagens de Texto simples
    - Disparo de Templates HSM oficiais pré-aprovados
    - Mensagens Interativas (Botões Rápidos e Menus de Lista)
    - Envio de Mídia (Imagens, Documentos, Áudio)
    - Verificação de Status e Webhooks
  version: 20.0.0
  contact:
    name: Nexora Devkit API Team
    url: https://nexora-devkit.vercel.app
servers:
  - url: https://graph.facebook.com/v20.0
    description: WhatsApp Graph API v20.0 (Produção)
tags:
  - name: Mensagens
    description: Envio de mensagens de texto, HSM e mídias
  - name: Templates HSM
    description: Gerenciamento e consulta de templates de mensagem
  - name: Mídia
    description: Upload e consulta de ativos de mídia
paths:
  /{phone_number_id}/messages:
    post:
      tags:
        - Mensagens
      summary: Enviar Mensagem (Texto, Template ou Interativa)
      description: Envia uma mensagem para o número de destino informado em formato E.164.
      operationId: sendWhatsAppMessage
      parameters:
        - name: phone_number_id
          in: path
          required: true
          description: ID do número de telefone WhatsApp Business
          schema:
            type: string
            example: '109823485719284'
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/SendMessagePayload'
      responses:
        '200':
          description: Mensagem despachada com sucesso
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/MessageResponse'
        '400':
          description: Parâmetros inválidos ou violação de regras Meta
        '401':
          description: Token de autenticação inválido ou expirado
      security:
        - BearerAuth: []

  /{phone_number_id}/media:
    post:
      tags:
        - Mídia
      summary: Upload de Ativo de Mídia
      description: Realiza upload de imagens, PDFs ou áudios para envio posterior no WhatsApp.
      operationId: uploadMedia
      parameters:
        - name: phone_number_id
          in: path
          required: true
          schema:
            type: string
      requestBody:
        required: true
        content:
          multipart/form-data:
            schema:
              type: object
              properties:
                file:
                  type: string
                  format: binary
                  description: Arquivo a ser enviado
                messaging_product:
                  type: string
                  default: whatsapp
                type:
                  type: string
                  enum: [image/jpeg, image/png, application/pdf, audio/ogg]
      responses:
        '200':
          description: Mídia enviada com sucesso
          content:
            application/json:
              schema:
                type: object
                properties:
                  id:
                    type: string
                    example: '827364819284726'
      security:
        - BearerAuth: []

components:
  schemas:
    SendMessagePayload:
      type: object
      required:
        - messaging_product
        - to
        - type
      properties:
        messaging_product:
          type: string
          default: whatsapp
          example: whatsapp
        recipient_type:
          type: string
          default: individual
        to:
          type: string
          description: Número de telefone no formato internacional E.164
          example: '5511999998888'
        type:
          type: string
          enum: [text, template, interactive, image, document]
          example: text
        text:
          type: object
          properties:
            preview_url:
              type: boolean
              default: false
            body:
              type: string
              example: 'Olá! Como posso ajudar você hoje?'
        template:
          type: object
          properties:
            name:
              type: string
              example: 'boas_vindas_v1'
            language:
              type: object
              properties:
                code:
                  type: string
                  default: pt_BR
                  example: pt_BR
            components:
              type: array
              items:
                type: object
                properties:
                  type:
                    type: string
                    enum: [header, body, button]
                  parameters:
                    type: array
                    items:
                      type: object
                      properties:
                        type:
                          type: string
                          enum: [text, currency, date_time, image]
                        text:
                          type: string
                          example: 'João Silva'
    MessageResponse:
      type: object
      properties:
        messaging_product:
          type: string
          example: whatsapp
        contacts:
          type: array
          items:
            type: object
            properties:
              input:
                type: string
                example: '5511999998888'
              wa_id:
                type: string
                example: '5511999998888'
        messages:
          type: array
          items:
            type: object
            properties:
              id:
                type: string
                example: 'wamid.HBgNNTUxMTk5OTk5ODg4OBUCAB...'
  securitySchemes:
    BearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
      description: Token permanente ou de sistema do Gerenciador de Negócios da Meta.
`;

export const ECOMMERCE_API_YAML = `openapi: 3.0.3
info:
  title: Nexora E-Commerce Store API
  description: API RESTful completa para plataforma de comércio eletrônico com autenticação JWT, catálogo de produtos, carrinho de compras e checkout.
  version: 1.2.0
servers:
  - url: https://api.nexora-store.com/v1
    description: Servidor de Produção
  - url: http://localhost:4000/v1
    description: Ambiente de Desenvolvimento Local
tags:
  - name: Autenticação
    description: Endpoints de login, cadastro e renovação de tokens JWT
  - name: Produtos
    description: Catálogo, filtros, categorias e estoque
  - name: Pedidos
    description: Gestão do ciclo de vida de pedidos e pagamentos
paths:
  /auth/login:
    post:
      tags:
        - Autenticação
      summary: Autenticar usuário e obter JWT
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [email, password]
              properties:
                email:
                  type: string
                  format: email
                  example: usuario@nexora.com
                password:
                  type: string
                  format: password
                  example: 'SenhaForte#123'
      responses:
        '200':
          description: Login efetuado com sucesso
          content:
            application/json:
              schema:
                type: object
                properties:
                  accessToken:
                    type: string
                    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
                  refreshToken:
                    type: string
                  expiresIn:
                    type: integer
                    example: 3600
        '401':
          description: Credenciais inválidas

  /products:
    get:
      tags:
        - Produtos
      summary: Listar produtos com paginação e filtros
      parameters:
        - name: page
          in: query
          required: false
          schema:
            type: integer
            default: 1
        - name: limit
          in: query
          required: false
          schema:
            type: integer
            default: 10
        - name: category
          in: query
          required: false
          schema:
            type: string
            example: eletronicos
        - name: minPrice
          in: query
          required: false
          schema:
            type: number
            example: 50.00
      responses:
        '200':
          description: Lista paginada de produtos
          content:
            application/json:
              schema:
                type: object
                properties:
                  total:
                    type: integer
                    example: 42
                  items:
                    type: array
                    items:
                      $ref: '#/components/schemas/Product'
    post:
      tags:
        - Produtos
      summary: Criar novo produto (Admin)
      security:
        - BearerJWT: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/ProductInput'
      responses:
        '201':
          description: Produto cadastrado com sucesso
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Product'

  /products/{productId}:
    get:
      tags:
        - Produtos
      summary: Obter detalhes do produto por ID
      parameters:
        - name: productId
          in: path
          required: true
          schema:
            type: string
            example: 'prod_98124'
      responses:
        '200':
          description: Detalhes do produto
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Product'
        '404':
          description: Produto não encontrado

components:
  schemas:
    Product:
      type: object
      required: [id, title, price, inStock]
      properties:
        id:
          type: string
          example: 'prod_98124'
        title:
          type: string
          example: 'Teclado Mecânico RGB Sem Fio'
        description:
          type: string
          example: 'Switch marrom silencioso com conexão tri-mode e bateria de 4000mAh.'
        price:
          type: number
          format: float
          example: 349.90
        category:
          type: string
          example: 'perifericos'
        inStock:
          type: boolean
          example: true
        stockQuantity:
          type: integer
          example: 18
    ProductInput:
      type: object
      required: [title, price]
      properties:
        title:
          type: string
          example: 'Mouse Gamer Ultraleve 26000 DPI'
        description:
          type: string
        price:
          type: number
          example: 219.00
        category:
          type: string
        stockQuantity:
          type: integer
          default: 0
  securitySchemes:
    BearerJWT:
      type: http
      scheme: bearer
      bearerFormat: JWT
`;

export const MINIMAL_SPEC_YAML = `openapi: 3.0.3
info:
  title: Nova API REST
  description: Especifique seus endpoints e schemas aqui...
  version: 1.0.0
servers:
  - url: https://api.exemplo.com/v1
    description: Servidor Principal
paths:
  /hello:
    get:
      summary: Endpoint de boas-vindas
      description: Retorna uma mensagem de status da API
      responses:
        '200':
          description: Sucesso
          content:
            application/json:
              schema:
                type: object
                properties:
                  message:
                    type: string
                    example: 'API funcionando perfeitamente!'
`;

export const TEMPLATES = [
  { id: 'petstore', name: 'Petstore OpenAPI 3.0', content: PETSTORE_YAML, desc: 'Padrão clássico Swagger para testes e demonstração' },
  { id: 'whatsapp', name: 'WhatsApp Meta Cloud API v20.0', content: WHATSAPP_CLOUD_API_YAML, desc: 'Especificação completa WhatsApp Business Cloud' },
  { id: 'ecommerce', name: 'E-Commerce & JWT Auth API', content: ECOMMERCE_API_YAML, desc: 'Autenticação JWT, catálogo de produtos e paginação' },
  { id: 'minimal', name: 'Starter Mínimo em Branco', content: MINIMAL_SPEC_YAML, desc: 'Estrutura limpa para iniciar um novo projeto do zero' }
];
