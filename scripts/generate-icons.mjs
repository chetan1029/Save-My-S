import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { Resvg } from "@resvg/resvg-js";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");

function rasterize(svgPath, outPath, opts) {
  const svg = readFileSync(svgPath, "utf8");
  const resvg = new Resvg(svg, {
    background: "rgba(0,0,0,0)",
    shapeRendering: 2,
    textRendering: 2,
    imageRendering: 0,
    ...opts,
  });
  const png = resvg.render().asPng();
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, png);
  console.log(`wrote ${outPath} (${png.length} bytes)`);
}

// Extension icons — rasterized at 4 sizes
const iconSvg = resolve(root, "assets/icon.svg");
for (const size of [16, 32, 48, 128]) {
  rasterize(iconSvg, resolve(root, `public/icons/${size}.png`), {
    fitTo: { mode: "width", value: size },
  });
}

// Chrome Web Store promo tile (440x280)
rasterize(
  resolve(root, "assets/promo-small.svg"),
  resolve(root, "assets/promo-small.png"),
  { fitTo: { mode: "width", value: 440 } },
);
