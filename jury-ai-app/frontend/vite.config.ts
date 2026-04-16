import { loadEnv } from 'vite';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const allEnv = { ...process.env, ...env };

  const injectedEnv = Object.keys(allEnv)
    .filter((key) => key.startsWith('REACT_APP_'))
    .reduce<Record<string, string>>((acc, key) => {
      acc[`process.env.${key}`] = JSON.stringify(allEnv[key]);
      return acc;
    }, {});

  return {
    plugins: [react()],
    define: {
      ...injectedEnv,
    },
    server: {
      port: 3000,
      proxy: {
        '/api': {
          target: 'http://localhost:5000',
          changeOrigin: true,
        },
      },
    },
  };
});
