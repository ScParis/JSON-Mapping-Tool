import { KnowledgeSource } from '../types';

const DB_KEY = 'nexus_kb';

const getItem = async <T>(key: string): Promise<T | undefined> => {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : undefined;
  } catch (e) {
    console.error("Storage getItem failed", e);
    return undefined;
  }
};

const setItem = async <T>(key: string, val: T): Promise<void> => {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch (e) {
    console.error("Storage setItem failed", e);
  }
};

export const getKnowledgeBase = async (): Promise<KnowledgeSource[]> => {
  return (await getItem<KnowledgeSource[]>(DB_KEY)) || [];
};

export const saveKnowledgeSource = async (source: KnowledgeSource) => {
  const kb = await getKnowledgeBase();
  await setItem(DB_KEY, [...kb, source]);
};

export const deleteKnowledgeSource = async (id: string) => {
  const kb = await getKnowledgeBase();
  await setItem(DB_KEY, kb.filter(s => s.id !== id));
};
