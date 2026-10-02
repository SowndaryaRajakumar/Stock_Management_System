import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    open: false,
    proxy: {
      '/api/electrical': {
        target: 'http://localhost:5050',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api\/electrical/, '/api')
      },
      '/api/hardware': {
        target: 'http://localhost:5051',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api\/hardware/, '/api')
      },
      '/api': {
        target: 'http://localhost:5051',
        changeOrigin: true,
        secure: false
      }
    }
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.js'
  }
})
