import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, '.', '');
  
  return {
    plugins: [react()],
    server: {
      host: '0.0.0.0', // CRITICAL: Explicitly bind to all network interfaces (IPv4)
      port: 5173,      // Force port 5173
      strictPort: true, // Fail if port is busy instead of switching (avoids confusion)
      cors: true,       // Allow requests from other devices
      hmr: {
        // Fix for "WebSocket connection failed" on mobile devices
        clientPort: 5173,
      },
      allowedHosts: true, // Allow any host (tunneling or local IP)
    },
    preview: {
      host: '0.0.0.0',
      port: 5173,
    },
    define: {
      // Polyfill process.env for the browser
      'process.env': env
    }
  };
});