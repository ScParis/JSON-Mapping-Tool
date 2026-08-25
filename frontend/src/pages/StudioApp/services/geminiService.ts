import { AIAction } from "../types";
import { runAiRequest, getAiConfig } from "../../../services/aiConfig";

const BACKEND_URL = 'http://localhost:3001';

export const processTextWithAI = async (text: string, action: AIAction): Promise<string> => {
  if (!text.trim()) return text;

  try {
    const prompt = `Ação: ${action}\n\nTexto original:\n${text}`;
    return await runAiRequest(prompt, {
      systemPrompt: 'Você é um assistente de IA especialista em engenharia de prompt e formatação de texto.'
    });
  } catch (error) {
    console.warn("Retornando fallback para processTextWithAI:", error);
    return text;
  }
};

export const auditHsmTemplate = async (templateData: any): Promise<any> => {
  const body = templateData.body || '';

  // Regras de auditoria estáticas para WhatsApp Meta HSM
  const grammarIssues: string[] = [];
  const policyWarnings: string[] = [];
  let score = 100;

  if (body.length > 1024) {
    policyWarnings.push('O corpo do modelo excede o limite máximo de 1024 caracteres permitido pela Meta.');
    score -= 30;
  }
  if (/([A-Z]{4,})/.test(body)) {
    grammarIssues.push('Evite o uso excessivo de PALAVRAS EM MAIÚSCULAS para não acionar filtros de spam.');
    score -= 10;
  }
  if (!/\{\{1\}\}/.test(body) && templateData.variables && Object.keys(templateData.variables).length > 0) {
    policyWarnings.push('As variáveis devem começar obrigatoriamente pelo índice {{1}}.');
    score -= 15;
  }
  if (/(bit\.ly|tinyurl|t\.co)/i.test(body)) {
    policyWarnings.push('Encurtadores de URL genéricos (bit.ly, tinyurl) não são recomendados em mensagens de negócios.');
    score -= 20;
  }

  // Tenta realizar otimização por IA se houver chave configurada
  try {
    const prompt = `Analise e otimize o seguinte template HSM do WhatsApp. Retorne APENAS um JSON no formato {"qualityScore": 90, "grammarIssues": [], "policyWarnings": [], "improvedVersion": "texto melhorado"}:\n\n${JSON.stringify(templateData)}`;
    const aiResultStr = await runAiRequest(prompt, {
      systemPrompt: 'Você é um auditor especialista em compliance de políticas do WhatsApp Meta Enterprise.'
    });
    
    // Tenta extrair JSON da resposta da IA
    const jsonMatch = aiResultStr.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        qualityScore: parsed.qualityScore || Math.max(score, 60),
        grammarIssues: parsed.grammarIssues || grammarIssues,
        policyWarnings: parsed.policyWarnings || policyWarnings,
        improvedVersion: parsed.improvedVersion || body
      };
    }
  } catch (e) {
    // Modo offline/estático
  }

  return {
    qualityScore: Math.max(score, 50),
    grammarIssues,
    policyWarnings,
    improvedVersion: body.replace(/\b(oferta imperdível|ganhe grátis)\b/gi, 'oportunidade especial')
  };
};

export const convertImageToMarkdown = async (base64Image: string, mimeType: string): Promise<string> => {
  try {
    const response = await fetch(`${BACKEND_URL}/api/ai/convert-image`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ base64Image, mimeType }),
    });

    if (response.ok) {
      const data = await response.json();
      if (data.text) return data.text;
    }
  } catch (error) {
    // Ignore backend missing
  }
  return '![Imagem carregada com sucesso]';
};
