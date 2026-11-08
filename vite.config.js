import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => {
  // Vite ne copie pas .env dans process.env pour ce fichier : on le charge explicitement,
  // sinon VITE_PROXY_TARGET du .env serait ignoré.
  const env = loadEnv(mode, process.cwd(), '')
  // 127.0.0.1 plutôt que localhost : selon la machine, « localhost » résout d'abord vers ::1 (IPv6)
  // alors que Flask n'écoute qu'en IPv4 -> le proxy échoue et renvoie « Internal Server Error ».
  const proxyTarget = env.VITE_PROXY_TARGET || process.env.VITE_PROXY_TARGET || 'http://127.0.0.1:5000'

  return {
    plugins: [react(), tailwindcss()],
    server: {
      port: 5173,
      proxy: {
        // Même rôle que Nginx en production : /api est relayé vers Flask
        '/api': {
          target: proxyTarget,
          changeOrigin: true,
        },
      },
    },
    test: {
      environment: 'jsdom',
      globals: true,
      setupFiles: './src/tests/setup.js',
      coverage: {
        provider: 'v8',
        reporter: ['text', 'lcov'],
        include: ['src/**/*.{js,jsx}'],
        exclude: ['src/tests/**', 'src/main.jsx'],
      },
    },
  }
})
