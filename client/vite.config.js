import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// In development, API calls are forwarded to the Node server.
export default defineConfig({
  plugins: [react()],
  server: { port: 5173, proxy: { '/api': 'http://localhost:4000' } },
});
