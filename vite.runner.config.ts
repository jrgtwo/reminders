import { resolve } from 'path'
import { defineConfig } from 'vite'

/**
 * Bundles src/runner/runner.js to dist/renderer/runner.js so npx cap sync
 * copies it into iOS App/App/public/runner.js and Android assets/public/runner.js.
 *
 * The runner has a stripped JS context (no window, no localStorage, no @capacitor/*
 * plugin bridge). Only globals available at runtime: fetch, crypto, console,
 * setTimeout, CapacitorKV, CapacitorNotifications, CapacitorDevice, CapacitorApp.
 *
 * Therefore: bundle as a single inline ES module with no dynamic imports, no
 * external dependencies, and no node-specific modules.
 */
export default defineConfig({
  build: {
    target: 'es2022',
    outDir: resolve('dist/renderer'),
    emptyOutDir: false, // do not wipe the renderer build that ran first
    lib: {
      entry: resolve('src/runner/runner.js'),
      formats: ['es'],
      fileName: () => 'runner.js',
    },
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
      },
    },
    minify: false, // easier debugging via Xcode/adb logs; size isn't a concern
  },
})
