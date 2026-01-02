import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
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
    assetsDir: 'assets'
  }
});



