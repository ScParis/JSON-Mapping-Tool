import { AIAction } from "../types";

const BACKEND_URL = 'http://localhost:3001';

export const processTextWithAI = async (text: string, action: AIAction): Promise<string> => {
  if (!text.trim()) return text;

  try {
    const response = await fetch(`${BACKEND_URL}/api/ai/process`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text, action }),
    });

    if (!response.ok) {
      throw new Error(`Erro do backend: ${response.statusText}`);
    }

    const data = await response.json();
    return data.text || text;
  } catch (error) {
    console.error("Erro ao chamar processTextWithAI no backend:", error);
    return text;
  }
};

export const auditHsmTemplate = async (templateData: any): Promise<any> => {
  try {
    const response = await fetch(`${BACKEND_URL}/api/ai/audit-hsm`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ templateData }),
    });

    if (!response.ok) {
      throw new Error(`Erro do backend: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Erro ao chamar auditHsmTemplate no backend:", error);
    return {
      qualityScore: 0,
      grammarIssues: ['Erro na auditoria do backend'],
      policyWarnings: [],
      improvedVersion: templateData.body || '',
    };
  }
};

export const convertImageToMarkdown = async (base64Image: string, mimeType: string): Promise<string> => {
  try {
    const response = await fetch(`${BACKEND_URL}/api/ai/convert-image`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ base64Image, mimeType }),
    });

    if (!response.ok) {
      throw new Error(`Erro do backend: ${response.statusText}`);
    }

    const data = await response.json();
    return data.text || '';
  } catch (error) {
    console.error("Erro ao chamar convertImageToMarkdown no backend:", error);
    return '';
  }
};
