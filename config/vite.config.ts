import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    outDir: 'dist',
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, '../src')
    }
  },
  css: {
    postcss: resolve(__dirname, './postcss.config.js'),
  },
  optimizeDeps: {
    exclude: ['tailwindcss'],
  },
});
