// Copies non-TS assets (images, etc.) from src/ to dist/src/ so the
// compiled server can find them at runtime via __dirname-relative paths.
// Run automatically as part of `npm run build`.
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'src');
const DIST = path.join(ROOT, 'dist', 'src');

const ASSET_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.ico', '.woff', '.woff2', '.ttf']);

function walk(dir) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...walk(full));
    } else if (entry.isFile() && ASSET_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) {
      out.push(full);
    }
  }
  return out;
}

if (!fs.existsSync(DIST)) {
  console.error(`[copy-assets] dist directory not found: ${DIST}`);
  console.error('[copy-assets] did you run "tsc" first?');
  process.exit(0); // don't fail the build
}

let copied = 0;
for (const file of walk(SRC)) {
  const rel = path.relative(SRC, file);
  const dest = path.join(DIST, rel);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(file, dest);
  copied += 1;
}
console.log(`[copy-assets] copied ${copied} asset file(s) to dist/src/`);
