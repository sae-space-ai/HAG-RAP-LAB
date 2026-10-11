import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: "0.0.0.0",
    port: 3000,
    strictPort: true,
    // Local development only: forward /api/v1 requests to the real Express server.
    // Production static hosts require VITE_API_BASE_URL pointing to a deployed backend.
    proxy: {
      '/api/v1': {
        target: 'http://127.0.0.1:4000',
        changeOrigin: true,
      },
    },
    hmr: {
      port: 3000,
    },
  },
});
