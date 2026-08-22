export interface SampleDataset {
    id: string;
    name: string;
    description: string;
    sourceJson: any;
    targetJson: any;
    defaultMappings: Record<string, string>;
}

export const SAMPLE_DATASETS: SampleDataset[] = [
    {
        id: 'ecommerce',
        name: '🛒 E-Commerce & Pedidos',
        description: 'Mapeamento de resposta de API REST de E-Commerce para modelo interno de pedido',
        sourceJson: {
            "order_id": "ORD-98765",
            "customer_details": {
                "first_name": "Mariana",
                "last_name": "Almeida",
                "email_address": "mariana.almeida@example.com",
                "phone": "+55 11 98765-4321"
            },
            "shipping_address": {
                "street": "Avenida Paulista, 1000",
                "suite": "Apto 42",
                "city_name": "São Paulo",
                "state_code": "SP",
                "zip_code": "01310-100"
            },
            "cart_items": [
                {
                    "sku": "PROD-001",
                    "title": "Fone de Ouvido Bluetooth Noise Cancelling",
                    "quantity": 1,
                    "unit_price": 499.90
                },
                {
                    "sku": "PROD-045",
                    "title": "Suporte Ergonômico para Notebook",
                    "quantity": 2,
                    "unit_price": 89.90
                }
            ],
            "payment_info": {
                "status": "APPROVED",
                "method": "CREDIT_CARD",
                "transaction_total": 679.70
            }
        },
        targetJson: {
            "pedidoId": "",
            "cliente": {
                "nomeCompleto": "",
                "contatoEmail": ""
            },
            "entrega": {
                "endereco": "",
                "cidadeUf": ""
            },
            "itens": [
                {
                    "codigoItem": "",
                    "descricao": "",
                    "quantidade": 0,
                    "preco": 0
                }
            ],
            "totalPago": 0
        },
        defaultMappings: {
            "pedidoId": "order_id",
            "cliente.nomeCompleto": "join(' ', [customer_details.first_name, customer_details.last_name])",
            "cliente.contatoEmail": "customer_details.email_address",
            "entrega.endereco": "shipping_address.street",
            "entrega.cidadeUf": "join(' - ', [shipping_address.city_name, shipping_address.state_code])",
            "itens[0].codigoItem": "cart_items[*].sku",
            "itens[0].descricao": "cart_items[*].title",
            "itens[0].quantidade": "cart_items[*].quantity",
            "itens[0].preco": "cart_items[*].unit_price",
            "totalPago": "payment_info.transaction_total"
        }
    },
    {
        id: 'users',
        name: '👤 Usuários e Perfis',
        description: 'Mapeamento de registros de usuários de sistema legado para API moderna',
        sourceJson: {
            "account_info": {
                "uid": "usr_774102",
                "login": "bruno_santos",
                "active_status": true,
                "created_at_timestamp": 1705300000
            },
            "profile": {
                "full_name": "Bruno Santos",
                "avatar_url": "https://i.pravatar.cc/150?u=bruno",
                "roles_list": ["ADMIN", "DEVELOPER", "AUDITOR"],
                "settings": {
                    "theme_mode": "dark",
                    "notifications_enabled": true
                }
            }
        },
        targetJson: {
            "idUsuario": "",
            "username": "",
            "status": "",
            "perfil": {
                "nome": "",
                "permissoes": [],
                "tema": ""
            }
        },
        defaultMappings: {
            "idUsuario": "account_info.uid",
            "username": "account_info.login",
            "status": "account_info.active_status",
            "perfil.nome": "profile.full_name",
            "perfil.permissoes": "profile.roles_list",
            "perfil.tema": "profile.settings.theme_mode"
        }
    },
    {
        id: 'logistics',
        name: '🚚 Logística e Rastreamento',
        description: 'Transformação de eventos de rastreamento de transportadora',
        sourceJson: {
            "tracking_number": "BR987654321PT",
            "carrier_code": "CORREIOS_SEDEX",
            "origin_hub": "CD SP Capital",
            "destination_hub": "CD RJ Baixada",
            "events_history": [
                {
                    "step": 1,
                    "description": "Objeto postado",
                    "location": "São Paulo / SP",
                    "timestamp": "2026-08-20T10:00:00Z"
                },
                {
                    "step": 2,
                    "description": "Em trânsito para a unidade de tratamento",
                    "location": "Campinas / SP",
                    "timestamp": "2026-08-21T04:30:00Z"
                },
                {
                    "step": 3,
                    "description": "Objeto saiu para entrega ao destinatário",
                    "location": "Rio de Janeiro / RJ",
                    "timestamp": "2026-08-22T08:15:00Z"
                }
            ]
        },
        targetJson: {
            "codigoRastreio": "",
            "transportadora": "",
            "ultimoStatus": "",
            "historicoFormatado": []
        },
        defaultMappings: {
            "codigoRastreio": "tracking_number",
            "transportadora": "carrier_code",
            "ultimoStatus": "events_history[-1].description",
            "historicoFormatado": "events_history[*].{etapa: step, evento: description, local: location}"
        }
    }
];
