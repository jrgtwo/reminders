import { resolve } from 'path'
import { defineConfig } from 'electron-vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  main: {
    envDir: resolve('.'),
    build: {
      rollupOptions: {
        external: ['better-sqlite3']
      }
    }
  },
  preload: {},
  renderer: {
    envDir: resolve('.'),
    resolve: {
      alias: {
        '@renderer': resolve('src/renderer/src')
      }
    },
    plugins: [react(), tailwindcss()],
    build: {
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
    }
  }
})
