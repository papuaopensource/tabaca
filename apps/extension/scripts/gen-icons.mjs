/**
 * Generates the extension icons in public/ from assets/icon.png using sharp.
 * Run from apps/extension: node scripts/gen-icons.mjs
 * Requires: pnpm add -D sharp
 */
import { createRequire } from "node:module"
import path from "node:path"
import { fileURLToPath } from "node:url"

const require = createRequire(import.meta.url)
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")

async function main() {
  let sharp
  try {
    sharp = require("sharp")
  } catch {
    console.error("sharp not installed. Run: pnpm add -D sharp")
    process.exit(1)
  }

  const source = path.join(root, "assets", "icon.png")
  for (const size of [16, 32, 48, 128]) {
    const out = path.join(root, "public", `icon${size}.png`)
    await sharp(source).resize(size, size).png().toFile(out)
    console.log(`Created ${out}`)
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
