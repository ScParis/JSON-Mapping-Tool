// URL base do backend Nexora Devkit.
// Em desenvolvimento usa localhost; em produção vem de VITE_BACKEND_URL (build-time).
export const BACKEND_URL =
  (import.meta.env?.VITE_BACKEND_URL as string | undefined)?.replace(/\/$/, '')
  || 'http://localhost:3001';
