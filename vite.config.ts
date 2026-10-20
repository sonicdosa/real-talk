import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: './',
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg', 'apple-touch-icon.png'],
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,webmanifest}'],
        // Voice clips are not precached: Safari plays media only from 206 range responses,
        // which precache can't give. A runtime cache with range support can; src/lib/audioCache.ts fills it.
        runtimeCaching: [
          {
            urlPattern: /\/audio\/[0-9a-f]+\.mp3$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'audio-clips',
              rangeRequests: true,
              cacheableResponse: { statuses: [200] },
              matchOptions: { ignoreVary: true },
            },
          },
        ],
      },
      manifest: {
        name: 'Real Talk - 원어민 영어회화',
        short_name: 'Real Talk',
        description: '원어민이 실제로 쓰는 일상 대화로 배우는 영어회화',
        lang: 'ko',
        start_url: './',
        scope: './',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#fafaf9',
        theme_color: '#4f46e5',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
    }),
  ],
})
