// URL base do backend Nexora Devkit.
// Em desenvolvimento usa localhost; em produção vem de VITE_BACKEND_URL (build-time).
// Obtém a URL base do backend Nexora Devkit.
// Prioridade: 1) localStorage ('NEXORA_BACKEND_URL'), 2) VITE_BACKEND_URL, 3) localhost:3001
const getInitialBackendUrl = (): string => {
  try {
    const local = localStorage.getItem('NEXORA_BACKEND_URL');
    if (local && local.trim()) return local.trim().replace(/\/$/, '');
  } catch {}
  
  // __BACKEND_URL__ é injetado no build pelo Vite (vite.config.ts) a partir de
  // BACKEND_URL/VITE_BACKEND_URL. Usa um global próprio porque o Vercel bloqueia
  // o prefixo VITE_ e o Vite ignora define manual sobre import.meta.env.
  const envUrl = typeof __BACKEND_URL__ !== 'undefined' ? __BACKEND_URL__ : '';
  if (envUrl) {
    return envUrl.replace(/\/$/, '');
  }

  return 'http://localhost:3001';
};

export const BACKEND_URL = getInitialBackendUrl();
