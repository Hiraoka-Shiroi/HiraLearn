
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { viteSingleFile } from 'vite-plugin-singlefile'
import { compression } from 'vite-plugin-compression2'

export default defineConfig({
  base: './',
  plugins: [
    react(),
    viteSingleFile({
      useRecommendedBuildConfig: true,
      removeViteModuleLoader: true
    })
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    target: 'es2015',
    minify: 'terser', // Use Terser for better compression than default esbuild
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.logs for production
        drop_debugger: true,
        pure_funcs: ['console.info', 'console.debug', 'console.warn'],
      },
      format: {
        comments: false, // Remove all comments
      },
    },
    assetsInlineLimit: 100000000,
    chunkSizeWarningLimit: 100000000,
    cssCodeSplit: false,
    rollupOptions: {
      inlineDynamicImports: true,
      output: {
        format: 'iife',
        manualChunks: undefined,
      }
    }
  }
})
