
import React from 'react';

export enum TextFormat {
  MARKDOWN = 'Markdown',
  HTML = 'HTML',
  JSON = 'JSON',
  PLAINTEXT = 'Texto simples',
  SLACK = 'Slack mrkdwn',
  CSV = 'CSV (Planilha)',
  SQL = 'SQL Query',
  JAVASCRIPT = 'JavaScript',
  PYTHON = 'Python',
  XML = 'XML'
}

export interface MarkdownState {
  raw: string;
  html: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  updatedAt: number;
}

export interface KnowledgeSource {
  id: string;
  title: string;
  content: string;
  domain: string;
}

export type View = 'home' | 'editor' | 'whatsapp-builder' | 'nexus-ai' | 'hsm-studio';

export enum AIAction {
  REFINE = 'REFINE',
  SUMMARIZE = 'SUMMARIZE',
  FIX_GRAMMAR = 'FIX_GRAMMAR',
  EXTEND = 'EXTEND',
  FORMAT_JSON = 'FORMAT_JSON',
  CONVERT_HTML = 'CONVERT_HTML',
  FORMAT_SLACK = 'FORMAT_SLACK',
  EXPLAIN = 'EXPLAIN'
}

export interface Command {
  id: string;
  label: string;
  description?: string;
  icon?: React.ReactNode;
  shortcut?: string;
  action?: () => void;
  subCommands?: Command[];
  category?: 'Estrutura' | 'Inteligência Artificial' | 'Formatação' | 'Alertas' | 'Linguagens';
}

export interface ToolbarAction {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  tooltip?: string;
}
