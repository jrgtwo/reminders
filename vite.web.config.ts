import { resolve } from 'path'
import { defineConfig, type HtmlTagDescriptor, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import basicSsl from '@vitejs/plugin-basic-ssl'

/**
 * Injects <link rel="preload"> for .woff2 font assets into the HTML.
 * Breaks the CSS → font discovery chain so fonts load in parallel with CSS.
 */
function fontPreloadPlugin(): Plugin {
  return {
    name: 'font-preload',
    enforce: 'post',
    transformIndexHtml(_html, ctx) {
      if (!ctx.bundle) return []
      const tags: HtmlTagDescriptor[] = []
      // Only preload Latin subsets — the ones needed for initial render.
      // Other subsets (cyrillic, greek, vietnamese) load on demand via unicode-range.
      const criticalFonts = ['inter-latin-wght', 'bree-serif-latin-400', 'archivo-latin-wght']
      for (const fileName of Object.keys(ctx.bundle)) {
        if (
          fileName.endsWith('.woff2') &&
          criticalFonts.some((f) => fileName.includes(f))
        ) {
          tags.push({
            tag: 'link',
            attrs: {
              rel: 'preload',
              href: `/${fileName}`,
              as: 'font',
              type: 'font/woff2',
              crossorigin: 'anonymous',
            },
            injectTo: 'head',
          })
        }
      }
      return tags
    },
  }
}

export default defineConfig({
  server: {
    allowedHosts: ['local.remindertoday.com'],
  },
  root: resolve('src/renderer'),
  envDir: resolve('.'),
  resolve: {
    alias: { '@renderer': resolve('src/renderer/src') },
  },
  plugins: [
    basicSsl({ domains: ['local.remindertoday.com'] }),
    react(),
    tailwindcss(),
    fontPreloadPlugin(),
  ],
  build: {
    target: 'es2022',
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
