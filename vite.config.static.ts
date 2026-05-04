/**
 * Vite config for static GitHub Pages build
 * - Uses main-static.tsx as entry (local tRPC link, no server)
 * - Outputs to dist-static/
 * - No server-side dependencies
 * - Post-build plugin renames index-static.html → index.html,
 *   injects SPA redirect handler, and writes 404.html
 */

import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import fs from "fs";
import path from "path";
import { defineConfig, Plugin } from "vite";

const BASE = "/platinum_03b_future_power-ee";

/** After build: rename HTML, inject SPA script, write 404.html */
function githubPagesSpaPlugin(): Plugin {
  return {
    name: "github-pages-spa",
    closeBundle() {
      const outDir = path.resolve(import.meta.dirname, "dist-static");
      const src = path.join(outDir, "index-static.html");
      const dest = path.join(outDir, "index.html");

      if (fs.existsSync(src)) {
        let html = fs.readFileSync(src, "utf-8");

        // Fix favicon path to include base
        html = html.replace(
          'href="/favicon.ico"',
          `href="${BASE}/favicon.ico"`
        );

        // Inject SPA redirect handler right after <head>
        const spaScript = `
    <script>
      // SPA redirect handler for GitHub Pages
      (function() {
        var redirect = sessionStorage.getItem('redirect');
        if (redirect) {
          sessionStorage.removeItem('redirect');
          if (redirect !== window.location.pathname + window.location.search + window.location.hash) {
            window.history.replaceState(null, null, '${BASE}' + redirect);
          }
        }
      })();
    </script>`;
        html = html.replace("<head>", "<head>" + spaScript);

        fs.writeFileSync(dest, html);
        fs.unlinkSync(src);
        console.log("[github-pages-spa] Wrote index.html");
      }

      // Write 404.html for SPA deep-link support
      const html404 = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>16 Psyche Power System Simulator</title>
  <script>
    var base = '${BASE}';
    var l = window.location;
    var p = l.pathname.slice(base.length) || '/';
    sessionStorage.setItem('redirect', p + l.search + l.hash);
    l.replace(base + '/');
  </script>
</head>
<body></body>
</html>`;
      fs.writeFileSync(path.join(outDir, "404.html"), html404);
      console.log("[github-pages-spa] Wrote 404.html");
    },
  };
}

export default defineConfig({
  base: `${BASE}/`,
  plugins: [react(), tailwindcss(), githubPagesSpaPlugin()],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  envDir: path.resolve(import.meta.dirname),
  root: path.resolve(import.meta.dirname, "client"),
  publicDir: path.resolve(import.meta.dirname, "client", "public"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist-static"),
    emptyOutDir: true,
    rollupOptions: {
      input: path.resolve(import.meta.dirname, "client", "index-static.html"),
    },
  },
  define: {
    "import.meta.env.VITE_STATIC_BUILD": JSON.stringify("true"),
  },
});
