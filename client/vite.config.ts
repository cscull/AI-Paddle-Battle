import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 4000,
    proxy: {
      '/socket.io': {
        target: 'http://localhost:4001',
        ws: true,
      },
      '/api': {
        target: 'http://localhost:4001',
      },
    },
  },
});
