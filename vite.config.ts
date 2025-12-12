import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, '.', '');
  
  return {
    plugins: [react()],
    server: {
      host: true,      // Listen on all addresses (0.0.0.0) automatically
      port: 5173,      // Keep port consistent
    },
    define: {
      // Polyfill process.env for the browser
      'process.env': env
    }
  };
});