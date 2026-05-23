import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: "/M-Render/",
  server: {
    proxy: {
      // Redireciona /api/* para o servidor Express local
      "/api": {
        target: "http://localhost:3001",
        changeOrigin: true,
      },
    },
  },
})
