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
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-supabase': ['@supabase/supabase-js'],
          'vendor-milkdown': [
            '@milkdown/core',
            '@milkdown/react',
            '@milkdown/preset-commonmark',
            '@milkdown/preset-gfm',
            '@milkdown/plugin-listener',
            '@milkdown/plugin-history',
            '@milkdown/utils',
          ],
          'vendor-icons': ['lucide-react'],
          'vendor-dnd': ['@dnd-kit/core', '@dnd-kit/sortable', '@dnd-kit/utilities'],
        },
      },
    },
  },
})
