import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import tailwindcss from "@tailwindcss/vite"
import { defineConfig } from "wxt"

const root = dirname(fileURLToPath(import.meta.url))

const apiOrigin = new URL(
  process.env.VITE_API_BASE_URL ?? "http://localhost:8000"
).origin

export default defineConfig({
  srcDir: "src",
  entrypointsDir: resolve(root, "entrypoints"),
  publicDir: resolve(root, "public"),
  modules: ["@wxt-dev/module-react"],
  // Everything is imported explicitly; no auto-import globals.
  imports: false,
  vite: () => ({
    plugins: [tailwindcss()]
  }),
  zip: {
    name: "tabaca"
  },
  manifest: {
    name: "Tabaca",
    description: "Stories from Papua, One Tab Away",
    // `search` lets the new tab search box use the browser's default engine.
    permissions: ["storage", "alarms", "search"],
    host_permissions: [`${apiOrigin}/*`],
    icons: {
      "16": "/icon16.png",
      "32": "/icon32.png",
      "48": "/icon48.png",
      "128": "/icon128.png"
    }
  }
})
