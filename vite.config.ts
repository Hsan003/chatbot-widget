import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  define: {
    // Required: React needs NODE_ENV to tree-shake dev code
    "process.env.NODE_ENV": JSON.stringify("production"),
  },
  build: {
    lib: {
      entry: "src/main.tsx",
      name: "ChatAssistant",
      fileName: "chat-assistant",
      formats: ["iife"],        // single self-executing file, no module system needed
    },
    minify: "terser",           // smaller file on CDN
    rollupOptions: {
      // bundle everything — React, ReactDOM, your code — into one file
      // merchants don't have React on their site
      external: [],
    },
  },
});