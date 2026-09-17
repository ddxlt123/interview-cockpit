import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

const base = process.env.VITE_BASE_PATH || '/'

export default defineConfig({
  base,
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: false,
      manifest: {
        name: '面试舱',
        short_name: '面试舱',
        description: '随时练习面试题，查看回答提示、参考作答与方法论。',
        theme_color: '#0b1828',
        background_color: '#f4f6f8',
        display: 'standalone',
        start_url: base,
        scope: base,
        lang: 'zh-CN',
        icons: [
          {
            src: `${base}app-icon-192.png`,
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: `${base}app-icon-512.png`,
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        cleanupOutdatedCaches: true,
        globPatterns: ['**/*.{html,js,css,json,png,svg,woff2}'],
        navigateFallback: 'index.html',
      },
    }),
  ],
})
