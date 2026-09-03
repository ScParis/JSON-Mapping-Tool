import { KnowledgeSource } from './types';

export const SYSTEM_INSTRUCTION = `Você é o Nexus AI, um assistente inteligente especializado. 
Modo Estrito: Use APENAS a base de conhecimento fornecida. Se a informação não estiver lá, diga que não possui a resposta.
Modo Extenso: Use a base de conhecimento como prioridade, mas pode complementar com conhecimento geral, distinguindo claramente as fontes.`;

export const KNOWLEDGE_BASE_SEED: KnowledgeSource[] = [
  { id: '1', title: 'Documentação WhatsApp Cloud API', content: 'A API de conversação permite o envio de mensagens e templates...', domain: 'developers.facebook.com' },
  { id: '2', title: 'Integração de CRM Externo', content: 'Para integrar um CRM externo...', domain: 'crm.exemplo.com' }
];

// Mapeamento para Feature Flags (Exemplos binários)
export const FLAG_MAP: Record<number, string> = {
  1: 'ENABLE_CRM_INTEGRATION',
  2: 'ENABLE_WHATSAPP_API',
  4: 'ENABLE_ANALYTICS',
  8: 'STRICT_KNOWLEDGE_MODE'
};

export const DEFAULT_CONTENT = `# Universal Studio Pro

Bem-vindo ao **Universal Studio Pro**.

- Use variáveis dinâmicas como \`{{cliente.nome}}\` para injeção em contratos.
- Acesse as ferramentas de HSM para simulação de WhatsApp.
- Explore a integração de IA para auditoria e conversão de documentos.
`;
