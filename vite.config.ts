import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ command, mode, ssrBuild }) => {
  if (ssrBuild) {
    // Server build - target webworker and bundle externals to make it worker-friendly
    return {
      plugins: [react()],
      publicDir: "public",
      ssr: {
        target: "webworker",
        noExternal: true,
      },
      build: {
        outDir: "dist/server",
        // Preserve client assets in dist/ when building SSR bundle.
        emptyOutDir: false,
      },
      server: {
        host: true,
      },
    };
  }

  // Client build
  return {
    plugins: [react()],
    build: {
      outDir: "dist",
      emptyOutDir: true,
      manifest: true,
    },
    publicDir: "public",
    server: {
      host: true,
    },
  };
});
