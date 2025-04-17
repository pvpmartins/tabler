/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  test: {
    environment: 'happy-dom',
    globals: true,
    setupFiles: 'src/setupTests.js',
    testTimeout: 1000000,
    hookTimeout: 100000,
    // environmentOptions: {
    //   coverage: true,
    //   testPathIgnorePatterns: [
    //     '.*.js',
    //     '.*d.ts',
    //     '.*http.ts',
    //     '.*pv-response.ts',
    //     '.*test-utils.ts',
    //   ],
    // },
    coverage: {
      reporter: ['text', 'json', 'html'],
    },
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    cors: true,
    strictPort: true,
    origin: 'http://frontend-server:5173',
  },
  plugins: [react()],
  // base: '/app_dist',
  build: {
    outDir: 'app_dist',
  },
});
