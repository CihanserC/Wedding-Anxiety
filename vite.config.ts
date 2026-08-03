import { defineConfig } from 'vite';

export default defineConfig({
  base: process.env.NETLIFY ? '/' : '/Wedding-Anxiety/',
  build: {
    target: 'es2020',
    outDir: 'dist',
    sourcemap: false,
  },
  server: {
    port: 5173,
    open: true,
  },
});
