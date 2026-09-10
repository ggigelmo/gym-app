import path from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      // 'prompt' (not 'autoUpdate'): a new version must never swap the app
      // out from under someone mid-set. The user gets a banner and taps to
      // reload on their own terms — see src/components/UpdatePrompt.tsx.
      registerType: 'prompt',
      devOptions: {
        // Lets the service worker be exercised in `npm run dev`, not just
        // in a production build.
        enabled: true,
      },
      manifest: {
        name: 'Gym Tracker',
        short_name: 'Gym Tracker',
        description: 'Offline-first workout tracker for logging gym sessions, routines, and history — works with no connection.',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait-primary',
        theme_color: '#0b0f17',
        background_color: '#0b0f17',
        icons: [
          {
            src: 'icon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any',
          },
          {
            src: 'icon-maskable.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        // App-shell precache only — there's no backend/API, so no runtime
        // caching strategy is needed here.
        globPatterns: ['**/*.{js,css,html,svg,ico,woff2}'],
      },
    }),
  ],
  resolve: {
    alias: {
      '@shared': path.resolve(__dirname, '../shared'),
    },
  },
})
