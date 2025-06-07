import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/shorten': 'http://localhost:3001',
      '/info': 'http://localhost:3001',
      '/delete': 'http://localhost:3001',
      '/analytics': 'http://localhost:3001',
      '/all-links': 'http://localhost:3001'
    }
  }
})
