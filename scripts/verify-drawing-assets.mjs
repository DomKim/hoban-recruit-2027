import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const projectRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const assetsRoot = join(projectRoot, "public", "assets");
const motionRoot = join(assetsRoot, "motion");

const expectedSourceSha256 = {
  "/assets/isolated/sketch-house-body.png": "a0c7ba3d73b3f6a8f1d45b430e7a1f897b482d974aac253c0e685d7852b12a36",
  "/assets/isolated/sketch-house-smoke.png": "db3e33f45d6f4c11983558928a1a5578160719e9ed1a53e647acfc5f4416a9a5",
  "/assets/isolated/sketch-gold.svg": "34159a27dac17580ddf09aa0f36cab647ff389670d6d15d6b8085ae7ef61e30a",
};

const [housePlan, goldPlan] = await Promise.all([
  readFile(join(motionRoot, "house-strokes.json"), "utf8").then(JSON.parse),
  readFile(join(motionRoot, "gold-strokes.json"), "utf8").then(JSON.parse),
]);

const xmlEscape = (value) => value.replaceAll("&", "&amp;").replaceAll('"', "&quot;");

async function dataUri(file) {
  const absolute = join(assetsRoot, file.replace(/^\/assets\//, ""));
  const bytes = await readFile(absolute);
  const mime = file.endsWith(".svg") ? "image/svg+xml" : "image/png";
  return `data:${mime};base64,${bytes.toString("base64")}`;
}

async function sourceFingerprint(file) {
  const absolute = join(assetsRoot, file.replace(/^\/assets\//, ""));
  const bytes = await readFile(absolute);
  return createHash("sha256").update(bytes).digest("hex");
}

async function renderDrawing({ viewBox, textures, strokes, completed }) {
  const [x, y, width, height] = viewBox;
  const images = await Promise.all(
    textures.map(async (texture) => {
      const href = await dataUri(texture.file);
      return `<image href="${href}" x="${texture.x}" y="${texture.y}" width="${texture.width}" height="${texture.height}" preserveAspectRatio="none"/>`;
    }),
  );
  const paths = strokes
    .map(
      (stroke) =>
        `<path d="${xmlEscape(stroke.d)}" fill="none" stroke="white" stroke-width="${stroke.width}" stroke-linecap="round" stroke-linejoin="round"/>`,
    )
    .join("");
  const completion = completed
    ? `<rect x="${x - 20}" y="${y - 20}" width="${width + 40}" height="${height + 40}" fill="white"/>`
    : "";
  const mask = `<mask id="draw" maskUnits="userSpaceOnUse" maskContentUnits="userSpaceOnUse" x="${x - 20}" y="${y - 20}" width="${width + 40}" height="${height + 40}"><rect x="${x - 20}" y="${y - 20}" width="${width + 40}" height="${height + 40}" fill="black"/>${paths}${completion}</mask>`;
  const source = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="${viewBox.join(" ")}">${images.join("")}</svg>`;
  const masked = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="${viewBox.join(" ")}"><defs>${mask}</defs><g mask="url(#draw)">${images.join("")}</g></svg>`;
  const raster = async (svg) =>
    sharp(Buffer.from(svg)).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  return Promise.all([raster(source), raster(masked)]);
}

function compare(source, candidate) {
  if (source.info.width !== candidate.info.width || source.info.height !== candidate.info.height) {
    throw new Error("Raster dimensions do not match");
  }
  let differentChannels = 0;
  let sourceAlpha = 0;
  let coveredAlpha = 0;
  let meaningfulPixels = 0;
  let coveredMeaningfulPixels = 0;
  for (let index = 0; index < source.data.length; index += 4) {
    for (let channel = 0; channel < 4; channel += 1) {
      if (source.data[index + channel] !== candidate.data[index + channel]) differentChannels += 1;
    }
    const sourceA = source.data[index + 3];
    const candidateA = candidate.data[index + 3];
    sourceAlpha += sourceA;
    coveredAlpha += Math.min(sourceA, candidateA);
    if (sourceA >= 64) {
      meaningfulPixels += 1;
      if (candidateA >= Math.max(1, sourceA - 8)) coveredMeaningfulPixels += 1;
    }
  }
  return {
    differentChannels,
    exact: differentChannels === 0,
    alphaWeightedCoverage: sourceAlpha ? coveredAlpha / sourceAlpha : 1,
    meaningfulPixelCoverage: meaningfulPixels
      ? coveredMeaningfulPixels / meaningfulPixels
      : 1,
  };
}

const houseTextures = housePlan.sourceAssets.map((asset) => ({
  file: asset.file,
  x: asset.x,
  y: asset.y,
  width: asset.width,
  height: asset.height,
}));
const houseStrokes = housePlan.strokes.map((stroke) => ({
  d: stroke.d,
  width: stroke.strokeWidth,
}));
const goldStrokes = goldPlan.motionOrder.map((order) => goldPlan.strokes[order - 1]).map((stroke) => ({
  d: stroke.d,
  width: stroke.maskWidth,
}));

const cases = [
  {
    name: "house",
    viewBox: housePlan.coordinateSpace.viewBox,
    textures: houseTextures,
    strokes: houseStrokes,
    strokeCount: housePlan.strokes.length,
  },
  {
    name: "gold",
    viewBox: goldPlan.coordinateSystem.artworkViewBox,
    textures: [
      { file: goldPlan.source.svg, x: 1505, y: 666, width: 162, height: 126 },
    ],
    strokes: goldStrokes,
    strokeCount: goldPlan.strokes.length,
  },
];

const sourceSha256 = Object.fromEntries(
  await Promise.all(
    Object.keys(expectedSourceSha256).map(async (file) => [file, await sourceFingerprint(file)]),
  ),
);

for (const [file, expected] of Object.entries(expectedSourceSha256)) {
  if (sourceSha256[file] !== expected) {
    throw new Error(`${file} no longer matches the approved source asset`);
  }
}

const report = { generatedAt: new Date().toISOString(), sourceSha256, cases: {} };
for (const drawing of cases) {
  const [source, traced] = await renderDrawing({ ...drawing, completed: false });
  const [, completed] = await renderDrawing({ ...drawing, completed: true });
  report.cases[drawing.name] = {
    strokeCount: drawing.strokeCount,
    tracedMask: compare(source, traced),
    completedFrame: compare(source, completed),
  };
}

for (const [name, result] of Object.entries(report.cases)) {
  if (!result.completedFrame.exact) {
    throw new Error(`${name} completed frame differs from its source artwork`);
  }
  if (result.tracedMask.alphaWeightedCoverage < 0.995) {
    throw new Error(`${name} stroke mask coverage is below 99.5%`);
  }
}

const reportPath = join(projectRoot, "qa", "drawing-validation.json");
await mkdir(dirname(reportPath), { recursive: true });
await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
