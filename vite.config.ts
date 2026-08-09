import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// The app is served at the root of the custom domain (management.incensostudio.com),
// so the base path is '/'.
export default defineConfig({
  base: '/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png', 'fonts/*'],
      manifest: {
        name: 'Incenso Studio',
        short_name: 'Incenso',
        description: 'Front-desk salon management for Incenso Studio',
        theme_color: '#e5dcc9',
        background_color: '#e5dcc9',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        scope: '/',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icons/icon-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,woff2,otf,png,svg}'],
        navigateFallback: '/index.html',
        // Never cache Supabase API calls — always hit the network for live data.
        navigateFallbackDenylist: [/^\/api/],
        runtimeCaching: [
          {
            urlPattern: /https:\/\/[a-z0-9]+\.supabase\.co\/.*/i,
            handler: 'NetworkOnly',
          },
        ],
      },
    }),
  ],
})
