import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import viteCompression from 'vite-plugin-compression';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  root: __dirname,
  server: {
    host: "::",
    port: 8080,
    strictPort: true,
    proxy: {
      "/api": "http://127.0.0.1:4000",
    },
    hmr: {
      overlay: false,
    },
  },
  preview: {
    port: 8080,
    strictPort: true,
    proxy: {
      "/api": "http://127.0.0.1:4000",
    },
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    viteCompression({
      algorithm: 'gzip',
      ext: '.gz',
    })
  ].filter(Boolean),
  css: {
    postcss: path.resolve(__dirname, ".."),
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    outDir: path.resolve(__dirname, "../dist"),
    emptyOutDir: true,
    minify: 'terser',
    sourcemap: false,
    rollupOptions: {
      output: {
        // manualChunks removed for Vite 8 / Rolldown compatibility
      },
    },
  },
}));
