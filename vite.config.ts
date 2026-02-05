import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
  publicDir: "public",
  server: {
    // Exposes your dev server and makes it accessible for the devices in the same network.
    host: true,
  },
});
