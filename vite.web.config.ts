import { resolve } from 'path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import basicSsl from '@vitejs/plugin-basic-ssl'

export default defineConfig({
  server: {
    allowedHosts: ['local.remindertoday.com'],
  },
  root: resolve('src/renderer'),
  envDir: resolve('.'),
  resolve: {
    alias: { '@renderer': resolve('src/renderer/src') },
  },
  plugins: [basicSsl({ domains: ['local.remindertoday.com'] }), react(), tailwindcss()],
  build: {
    outDir: resolve('dist/renderer'),
    emptyOutDir: true,
  },
})
