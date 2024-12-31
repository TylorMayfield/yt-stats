import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { crx } from "@crxjs/vite-plugin";
import manifest from "./manifest.json";
import { resolve } from 'path';

export default defineConfig({
  plugins: [react(), crx({ manifest })],
  build: {
    emptyOutDir: true,
    outDir: "dist",
    modulePreload: false,
    sourcemap: true,
    minify: true,
    rollupOptions: {
      input: {
        content: resolve(__dirname, "src/content/content.js"),
        background: resolve(__dirname, "src/background/background.js")
      },
      output: {
        entryFileNames: (chunkInfo) => {
          return `src/${chunkInfo.name}/${chunkInfo.name}.js`;
        }
      }
    }
  },
  optimizeDeps: {
    exclude: ['sql.js-httpvfs']
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  }
});
