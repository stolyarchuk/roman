import { readFileSync, writeFileSync } from "fs";
import { resolve } from "path";

import fs from "fs";
import path from "path";

const candidates = [
  path.resolve(process.cwd(), "dist/manifest.json"),
  path.resolve(process.cwd(), "dist/.vite/manifest.json"),
  path.resolve(process.cwd(), "dist/client/manifest.json"),
  path.resolve(process.cwd(), "dist/client/.vite/manifest.json"),
];
const dest = path.resolve(process.cwd(), "src/ssr-manifest.json");

let src = null;
for (const c of candidates) {
  if (fs.existsSync(c)) {
    src = c;
    break;
  }
}

if (!src) {
  console.error(
    "Failed to copy manifest.json. Make sure client build completed.",
  );
  process.exit(1);
}

try {
  const data = readFileSync(src, "utf-8");
  writeFileSync(dest, data, "utf-8");
  console.log("Copied manifest to src/ssr-manifest.json from", src);
} catch (e) {
  console.error("Failed to copy manifest.json.", e);
  process.exit(1);
}
