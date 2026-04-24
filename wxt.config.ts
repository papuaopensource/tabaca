import { defineConfig } from "wxt"
import { fileURLToPath } from "url"
import { dirname, resolve } from "path"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

export default defineConfig({
  srcDir: "src",
  entrypointsDir: resolve(__dirname, "entrypoints"),
  publicDir: resolve(__dirname, "public"),
  modules: ["@wxt-dev/module-react"],
  manifest: {
    name: "Tabaca",
    description: "Stories from Papua, One Tab Away",
    version: "0.1.0",
    permissions: ["storage", "alarms"],
    host_permissions: [
      "https://feeds.bbci.co.uk/*",
      "https://theconversation.com/*",
      "https://jubi.id/*",
      "https://www.antaranews.com/*"
    ],
    icons: {
      "16": "/icon16.png",
      "32": "/icon32.png",
      "48": "/icon48.png",
      "128": "/icon128.png"
    }
  }
})
