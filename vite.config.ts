import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
    // Plugin to ensure i18n.js script is preserved in build
    {
      name: 'preserve-i18n-script',
      transformIndexHtml(html) {
        // Ensure i18n.js script is present before module scripts
        // This will be handled by the existing script in index.html
        return html;
      }
    }
  ],
  // Only use base path in production build, not in dev server
  base: process.env.NODE_ENV === 'production' ? '/Ais/' : '/',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3002,
    open: true
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      // Preserve non-module scripts
      output: {
        manualChunks: undefined
      }
    }
  }
});



