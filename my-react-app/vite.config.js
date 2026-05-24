import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],

  // VITE_BASE_PATH controla o base path:
  //   - GitHub Pages: /M-Render/  (setado no workflow)
  //   - Render (full-stack): /    (setado no painel do Render)
  //   - dev local: /M-Render/     (default)
  base: process.env.VITE_BASE_PATH || '/M-Render/',

  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
})
