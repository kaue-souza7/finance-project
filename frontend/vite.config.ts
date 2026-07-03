import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "prompt",
      injectRegister: "auto",
      manifest: {
        name: "Finance Project",
        short_name: "Finance",
        description: "Sistema de gerenciamento financeiro pessoal",
        theme_color: "#6366f1",
        background_color: "#ffffff",
        display: "standalone",
        orientation: "portrait",
        scope: "/",
        start_url: "/",
        lang: "pt-BR",
        categories: ["finance", "productivity"],
        icons: [
          {
            src: "/pwa-icons/icon-72x72.svg",
            sizes: "72x72",
            type: "image/svg+xml",
          },
          {
            src: "/pwa-icons/icon-96x96.svg",
            sizes: "96x96",
            type: "image/svg+xml",
          },
          {
            src: "/pwa-icons/icon-128x128.svg",
            sizes: "128x128",
            type: "image/svg+xml",
          },
          {
            src: "/pwa-icons/icon-192x192.svg",
            sizes: "192x192",
            type: "image/svg+xml",
          },
          {
            src: "/pwa-icons/icon-384x384.svg",
            sizes: "384x384",
            type: "image/svg+xml",
          },
          {
            src: "/pwa-icons/icon-512x512.svg",
            sizes: "512x512",
            type: "image/svg+xml",
            purpose: "any",
          },
          {
            src: "/pwa-icons/icon-512x512.maskable.svg",
            sizes: "512x512",
            type: "image/svg+xml",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        globPatterns: [
          "**/*.{js,css,html,svg,png,jpg,jpeg,gif,webp,ico,woff,woff2}",
        ],
        runtimeCaching: [
          {
            urlPattern: /^\/api\/.*/,
            handler: "NetworkOnly",
          },
          {
            urlPattern: /\.(?:png|jpg|jpeg|gif|webp|svg|ico)$/,
            handler: "CacheFirst",
            options: {
              cacheName: "pwa-images",
              expiration: {
                maxEntries: 60,
                maxAgeSeconds: 60 * 60 * 24 * 30,
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],
        navigateFallback: "/index.html",
        navigateFallbackDenylist: [/^\/api\/.*/],
      },
    }),
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom", "react-router-dom"],
          motion: ["framer-motion"],
          charts: ["recharts"],
          maps: ["leaflet", "react-leaflet"],
        },
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:8000",
        changeOrigin: true,
      },
    },
  },
});
