import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path';
// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss()
  ],
  resolve: {
    alias: {
      // Esto mapea @ a la carpeta src
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    // Proxy API calls so the client can run same-origin (used with VITE_API_URL=/api)
    proxy: {
      "/api": "http://localhost:4000",
    },
  },
})
