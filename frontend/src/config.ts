// URL base do backend Nexora Devkit.
// Em desenvolvimento usa localhost; em produção vem de VITE_BACKEND_URL (build-time).
// Obtém a URL base do backend Nexora Devkit.
// Prioridade: 1) localStorage ('NEXORA_BACKEND_URL'), 2) VITE_BACKEND_URL, 3) localhost:3001
const getInitialBackendUrl = (): string => {
  try {
    const local = localStorage.getItem('NEXORA_BACKEND_URL');
    if (local && local.trim()) return local.trim().replace(/\/$/, '');
  } catch {}
  
  // No Vite, import.meta.env.VITE_BACKEND_URL deve ser referenciado diretamente sem o operador '?.'
  // para que a substituição estática ocorra corretamente durante o build em produção.
  const envUrl = import.meta.env.VITE_BACKEND_URL as string | undefined;
  if (envUrl) {
    return envUrl.replace(/\/$/, '');
  }
  
  return 'http://localhost:3001';
};

export const BACKEND_URL = getInitialBackendUrl();
