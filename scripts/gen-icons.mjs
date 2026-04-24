/**
 * Generates PNG icons from assets/icon.svg using sharp.
 * Run: node scripts/gen-icons.mjs
 * Requires: npm install -D sharp
 */
import { createRequire } from "module"
import { fileURLToPath } from "url"
import path from "path"
import fs from "fs"

const require = createRequire(import.meta.url)
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, "..")

async function main() {
  let sharp
  try {
    sharp = require("sharp")
  } catch {
    console.error("sharp not installed. Run: npm install -D sharp")
    process.exit(1)
  }

  const svgPath = path.join(root, "assets", "icon.svg")
  const sizes = [16, 32, 48, 128]

  for (const size of sizes) {
    const out = path.join(root, "assets", `icon${size}.png`)
    await sharp(svgPath).resize(size, size).png().toFile(out)
    console.log(`Created ${out}`)
  }
}

main().catch(console.error)
