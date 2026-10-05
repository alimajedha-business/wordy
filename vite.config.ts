/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'pwa-192x192.png', 'pwa-512x512.png', 'app-icon.png'],
      manifest: {
        name: 'کلمه‌بازی | Kalameh Bazi',
        short_name: 'کلمه‌بازی',
        description: 'بازی دورهمی کلمه‌بازی برای تیم‌ها در یک گوشی مشترک',
        theme_color: '#1a1f36',
        background_color: '#0e1326',
        display: 'standalone',
        orientation: 'portrait',
        dir: 'rtl',
        lang: 'fa',
        start_url: '/',
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
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: 'app-icon.png',
            sizes: '1024x1024',
            type: 'image/png'
          }
        ]
      }
    })
  ],
  server: {
    host: '0.0.0.0',
    port: 5173
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.ts'
  }
});
