 import { resolve } from 'path'
 import { defineConfig } from 'vite'
 import react from '@vitejs/plugin-react'
 import tailwindcss from '@tailwindcss/vite'

 export default defineConfig({
   root: resolve('src/renderer'),
   resolve: {
     alias: { '@renderer': resolve('src/renderer/src') },
   },
   plugins: [react(), tailwindcss()],
   build: {
     outDir: resolve('dist/renderer'),
     emptyOutDir: true,
   },
 })