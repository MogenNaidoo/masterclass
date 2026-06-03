import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  base: '/masterclass/',
  plugins: [react()],
  server: {
    proxy: {
      '/masterclass/api': {
        target: 'http://localhost:3001',
        changeOrigin: true
      },
      '/masterclass/socket.io': {
        target: 'http://localhost:3001',
        ws: true
      }
    }
  }
})
