import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'
import react from '@vitejs/plugin-react-swc'


// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      devOptions: {
        enabled: true
      },
      workbox: {
        // Le decimos que NO precachee el archivo del SW de Firebase
        globIgnores: ['firebase-messaging-sw.js'],
        // Inyectamos el SW de Firebase en el SW principal
        importScripts: ['/firebase-messaging-sw.js']
      },

      manifest: {
        name: 'Red Estudiantil',
        short_name: 'RedEstudiantil',
        gcm_sender_id: '103953800507',
        description: 'Plataforma de gestión escolar y comunicación en tiempo real',
        theme_color: '#ffffff',
        start_url: '/',
        display: 'standalone',
        background_color: '#ffffff',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
})
