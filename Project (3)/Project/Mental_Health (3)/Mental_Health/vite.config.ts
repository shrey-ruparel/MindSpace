import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    headers: {
      'Content-Security-Policy': 
        "default-src 'self'; " +
        "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " + // allow HMR & eval for Vite
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " + // Google Fonts
        "font-src 'self' https://fonts.gstatic.com data:; " +
        "img-src 'self' https://res.cloudinary.com data: blob:; " + // Cloudinary + base64 + blob
        "connect-src 'self' ws://localhost:5173 http://localhost:8000; " + // HMR + backend
        "media-src 'self' https://res.cloudinary.com; " +
        "frame-src 'self';"
    },
  },

  optimizeDeps: {
    exclude: ['lucide-react'],
  },
})
