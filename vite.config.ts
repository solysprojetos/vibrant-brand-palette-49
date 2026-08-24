import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsConfigPaths from "vite-tsconfig-paths";
import { resolve } from "node:path";

// GitHub Pages serve o site em /<repo>/ ate um dominio proprio ser configurado;
// a partir dai serve na raiz e redireciona o endereco github.io para o dominio.
// O workflow passa em BASE_PATH o prefixo que o proprio Pages reporta, entao os
// dois momentos ficam corretos — bastando um novo deploy apos o dominio entrar.
const base = process.env.BASE_PATH ?? "/";

export default defineConfig({
  base,
  plugins: [
    tsConfigPaths({ projects: ["./tsconfig.json"] }),
    tailwindcss(),
    tanstackStart({
      // Redirect TanStack Start's bundled server entry to src/server.ts
      // (our SSR error wrapper). nitro/vite builds from this.
      server: { entry: "server" },
      // Emit a static index.html so the site can be hosted without a server.
      prerender: { enabled: true, crawlLinks: true },
      pages: [{ path: "/" }, { path: "/politica-de-privacidade" }],
    }),
    viteReact(),
  ],
  resolve: {
    alias: { "@": resolve(import.meta.dirname, "./src") },
    dedupe: ["react", "react-dom", "@tanstack/react-router", "@tanstack/react-store"],
  },
});
