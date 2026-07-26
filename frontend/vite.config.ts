import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  base: "./",
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/deploy': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/status': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
});