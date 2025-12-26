import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate', // Se actualiza sola cuando detecta cambios
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'Plataforma CEITM',
        short_name: 'CEITM',
        description: 'Plataforma Oficial del Consejo Estudiantil del ITM',
        theme_color: '#800020', // Tu color Guinda institucional
        background_color: '#ffffff',
        display: 'standalone', // Se ve como app nativa (sin barra de navegador)
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: '/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable' // Importante para Android
          }
        ]
      }
    })
  ],
  server: {
    host: true,
    port: 5173,
    watch: {
      usePolling: true
    }
  }
});