import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // <--- ESTO ES LA CLAVE (equivale a 0.0.0.0)
    port: 5173,
    watch: {
      usePolling: true // A veces necesario en Docker/Windows para que detecte cambios
    }
  }
})