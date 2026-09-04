import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Carrega todas as envs (arquivos .env + process.env do host de build).
  // Prefixo '' apenas para LEITURA no build — nada é exposto ao client sem passar por 'define'.
  const env = loadEnv(mode, process.cwd(), '');

  // O Vercel bloqueia o prefixo VITE_, então aceitamos BACKEND_URL (sem prefixo).
  // Ordem: BACKEND_URL (Vercel) > VITE_BACKEND_URL (.env local) > vazio (fallback localhost no config.ts).
  const backendUrl = env.BACKEND_URL || env.VITE_BACKEND_URL || '';

  return {
    plugins: [
      react(),
      tailwindcss()
    ],
    // Constante global própria (não import.meta.env, que o Vite processa de forma
    // especial e ignora um define manual). Substituída textualmente no build.
    define: {
      __BACKEND_URL__: JSON.stringify(backendUrl),
    },
    server: {
      port: 3000,
      host: true,
    },
  };
});
