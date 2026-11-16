import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const rawApiUrl = env.VITE_API_URL || env.VITE_API_BASE_URL || 'https://dcvc-api.diversity-collective-vc.workers.dev/api';
  const targetOrigin = rawApiUrl.replace(/\/api\/?$/, '');

  return {
    plugins: [
      tailwindcss(),
      react()
    ],
    server: {
      proxy: {
        '/api': {
          target: targetOrigin,
          changeOrigin: true,
          secure: true
        }
      }
    }
  };
})

