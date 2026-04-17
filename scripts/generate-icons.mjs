import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { Resvg } from "@resvg/resvg-js";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");
const svgPath = resolve(root, "assets/icon.svg");
const outDir = resolve(root, "public/icons");

const svg = readFileSync(svgPath, "utf8");
const sizes = [16, 32, 48, 128];

mkdirSync(outDir, { recursive: true });

for (const size of sizes) {
  const resvg = new Resvg(svg, {
    fitTo: { mode: "width", value: size },
    background: "rgba(0,0,0,0)",
    shapeRendering: 2,
    textRendering: 2,
    imageRendering: 0,
  });
  const png = resvg.render().asPng();
  const out = resolve(outDir, `${size}.png`);
  writeFileSync(out, png);
  console.log(`wrote ${out} (${png.length} bytes)`);
}
