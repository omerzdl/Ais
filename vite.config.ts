import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig(({ command, mode }) => {
  // In dev mode (serve command), always use '/' as base path
  // In build mode, use '/Ais' for GitHub Pages, '/' for Netlify
  // Check if NETLIFY environment variable is set (Netlify sets this automatically)
  const isNetlify = process.env.NETLIFY === 'true' || process.env.CONTEXT === 'production';
  const base = command === 'serve' ? '/' : (isNetlify ? '/' : (mode === 'production' ? '/Ais' : '/'));
  
  return {
    plugins: [
      react(),
      // Plugin to ensure i18n.js script and catalog route script are preserved in build
      {
        name: 'preserve-scripts',
        transformIndexHtml(html) {
          // Ensure scripts in index.html are preserved during build
          // The script handles catalog route detection and static content hiding
          return html;
        }
      }
    ],
    // Only use base path in production build, not in dev server
    base,
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    optimizeDeps: {
      exclude: ['/main.js']
    },
    server: {
      port: 4182,
      open: true,
      hmr: {
        overlay: false
      }
    },
    publicDir: 'public',
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
  };
});



