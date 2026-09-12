import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  server: {
    sourcemap: true,
    host: 'localhost',
    port: 5173,
    open: false
  },
  build: {
    sourcemap: true,
    minify: false
  },
  plugins: [
    react(),
    {
      name: 'authenticated-pwa-manifest',
      enforce: 'post',
      generateBundle: { order: 'post', handler(_options, bundle) {
        const html = bundle['index.html']
        if (html && typeof html.source === 'string') html.source = html.source.replace(/<link\b[^>]*rel=["']manifest["'][^>]*>/gi, '')
      } },
      transformIndexHtml: { order: 'post', handler: html => html.replace(/<link\b[^>]*rel=["']manifest["'][^>]*>/gi, '') },
    },
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: false,
      includeAssets: ['favicon.svg', 'icons/icon-192.png', 'icons/icon-512.png'],
      manifest: {
        name: 'Gakuren | Aplikasi Manajemen Sekolah',
        short_name: 'Gakuren',
        description: 'Kelola absensi, izin, penggajian guru, hingga laporan sekolah dalam satu platform yang aman, mudah digunakan, dan terintegrasi.',
        theme_color: '#4F46E5',
        background_color: '#F8FAFC',
        display: 'standalone',
        start_url: '/?source=pwa',
        scope: '/',
        orientation: 'portrait-primary',
        icons: [
          {
            src: 'icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: 'icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
        cleanupOutdatedCaches: true,
        navigateFallback: 'index.html',
        navigateFallbackDenylist: [/^\/v1\//],
        globPatterns: ['**/*.{js,css,html,svg,png,ico}'],
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.startsWith('/v1/'),
            handler: 'NetworkOnly',
          },
          {
            urlPattern: ({ url, request }) =>
              url.origin === self.location.origin &&
              ['script', 'style', 'worker'].includes(request.destination),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'gakuren-app-assets',
              networkTimeoutSeconds: 3,
              expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 7 }
            }
          },
          {
            // Let the browser honor OSM cache headers; do not store tiles for offline use.
            urlPattern: ({ url }) => url.hostname === 'tile.openstreetmap.org',
            handler: 'NetworkOnly',
          },
          {
            urlPattern: ({ request }) => request.destination === 'image',
            handler: 'CacheFirst',
            options: {
              cacheName: 'gakuren-images',
              expiration: { maxEntries: 60, maxAgeSeconds: 60 * 60 * 24 * 30 }
            }
          }
        ]
      },
      devOptions: {
        enabled: false,
        navigateFallback: '/index.html',
        navigateFallbackAllowlist: [/^\/.*$/]
      }
    })
  ]
})
