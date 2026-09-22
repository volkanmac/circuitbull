import { copyFileSync, readFileSync, writeFileSync } from "fs";
import { spawnSync } from "child_process";
import sharp from "sharp";

for (const size of [16, 32, 48]) {
  await sharp("brand/mark.svg", { density: 384 })
    .resize(size, size)
    .png()
    .toFile(`brand/favicon-${size}.png`);
}

const r = spawnSync(
  "magick",
  ["brand/favicon-16.png", "brand/favicon-32.png", "brand/favicon-48.png", "brand/favicon.ico"],
  { encoding: "utf8" }
);
if (r.status !== 0) throw new Error(r.stderr || r.stdout || "magick ico failed");

const copies = [
  "mark.svg",
  "logo.svg",
  "logo-on-dark.svg",
  "favicon.svg",
  "favicon.ico",
  "apple-touch-icon.png",
];
for (const name of copies) copyFileSync(`brand/${name}`, `worker/src/brand/${name}`);

function b64(path) {
  return readFileSync(path).toString("base64");
}
function svgLit(path) {
  return readFileSync(path, "utf8").replace(/\\/g, "\\\\").replace(/`/g, "\\`").replace(/\$/g, "\\$");
}

const ts = `/** Bundled Circuitbull brand assets — cropped from circuitbull.svg */

export const MARK_SVG = \`${svgLit("brand/mark.svg")}\`;
export const LOGO_SVG = \`${svgLit("brand/logo.svg")}\`;
export const LOGO_ON_DARK_SVG = \`${svgLit("brand/logo-on-dark.svg")}\`;

const FAVICON_ICO_B64 = "${b64("brand/favicon.ico")}";
const APPLE_TOUCH_B64 = "${b64("brand/apple-touch-icon.png")}";

function fromB64(b64: string) {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

export const FAVICON_ICO = fromB64(FAVICON_ICO_B64);
export const APPLE_TOUCH_PNG = fromB64(APPLE_TOUCH_B64);

export const BRAND_HEADERS = {
  svg: {
    "Content-Type": "image/svg+xml; charset=utf-8",
    "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
  },
  ico: {
    "Content-Type": "image/x-icon",
    "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
  },
  png: {
    "Content-Type": "image/png",
    "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
  },
} as const;
`;

writeFileSync("worker/src/ui/brand-assets.ts", ts);
console.log("wrote worker/src/ui/brand-assets.ts", ts.length);
console.log("ico", readFileSync("brand/favicon.ico").length, "apple", readFileSync("brand/apple-touch-icon.png").length);
