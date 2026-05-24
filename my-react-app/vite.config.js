import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Em produção (Render) a base é '/'
// Em GitHub Pages seria '/M-Render/' — mas agora o deploy é via Render
export default defineConfig({
  plugins: [react()],
  base: process.env.NODE_ENV === 'production' ? '/' : '/M-Render/',
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
})
