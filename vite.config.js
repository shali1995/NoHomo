import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import fs from "node:fs";
import path from "node:path";

// Client-side routes are real paths (/tokens/solana/<mint>, /profile/<handle>), so a
// hard load or a refresh on one of them must serve index.html rather than 404. The
// dev server already falls back for SPA, but `vite preview` does not, so add it.
function spaFallback() {
  return {
    name: "spa-fallback",
    configurePreviewServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = (req.url ?? "/").split("?")[0];
        if (url.includes(".") || url.startsWith("/@")) return next();
        const index = path.resolve(server.config.root, "dist/index.html");
        if (!fs.existsSync(index)) return next();
        res.setHeader("Content-Type", "text/html");
        res.end(fs.readFileSync(index));
      });
    }
  };
}

// One port for both servers, pinned so the fidelity check always measures the same
// origin (the capture's viewport, scrollbars and DPR only reproduce there).
export default defineConfig({
  plugins: [svelte(), spaFallback()],
  // `allowedHosts` so the machine's own name works: the LAN address here changes between
  // .63, .18 and .153 in a day, and a phone that bookmarked one of them just fails. The
  // `.local` name does not move. Vite checks the Host header and answers 403 without this.
  server: {
    port: 5180,
    host: "127.0.0.1",
    strictPort: true,
    allowedHosts: [".local", "localhost", "127.0.0.1"]
  },
  preview: {
    port: 5180,
    host: "127.0.0.1",
    strictPort: true,
    allowedHosts: [".local", "localhost", "127.0.0.1"]
  }
});
