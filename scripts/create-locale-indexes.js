import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const distDir = new URL("../dist/", import.meta.url).pathname;
const indexPath = join(distDir, "index.html");
const indexHtml = readFileSync(indexPath, "utf8");

const locales = ["en", "ru"];

locales.forEach((locale) => {
  const localeDir = join(distDir, locale);
  mkdirSync(localeDir, { recursive: true });
  writeFileSync(join(localeDir, "index.html"), indexHtml);
});
