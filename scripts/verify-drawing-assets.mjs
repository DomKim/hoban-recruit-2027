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

function inspectOpenPath(stroke, motionIndex) {
  const commands = stroke.d.match(/[AaCcHhLlMmQqSsTtVvZz]/g) ?? [];
  const uppercaseMoveCommandCount = commands.filter((command) => command === "M").length;
  const lowercaseMoveCommandCount = commands.filter((command) => command === "m").length;
  const closeCommandCount = commands.filter((command) => command === "Z" || command === "z").length;
  return {
    motionIndex,
    strokeId: stroke.id,
    sourceIndex: stroke.sourceIndex,
    uppercaseMoveCommandCount,
    lowercaseMoveCommandCount,
    moveCommandCount: uppercaseMoveCommandCount + lowercaseMoveCommandCount,
    closeCommandCount,
    valid:
      uppercaseMoveCommandCount === 1 &&
      lowercaseMoveCommandCount === 0 &&
      closeCommandCount === 0,
  };
}

function measureNewAlphaComponents(source, previous, current) {
  const { width, height } = source.info;
  const pixelCount = width * height;
  const deltaAlpha = new Uint8Array(pixelCount);
  let newlyRevealedPixelCount = 0;
  let newlyRevealedAlpha = 0;

  for (let pixel = 0; pixel < pixelCount; pixel += 1) {
    const alphaOffset = pixel * 4 + 3;
    const sourceAlpha = source.data[alphaOffset];
    const previousAlpha = previous
      ? Math.min(sourceAlpha, previous.data[alphaOffset])
      : 0;
    const currentAlpha = Math.min(sourceAlpha, current.data[alphaOffset]);
    const alphaDelta = Math.max(0, currentAlpha - previousAlpha);
    deltaAlpha[pixel] = alphaDelta;
    if (alphaDelta > 0) {
      newlyRevealedPixelCount += 1;
      newlyRevealedAlpha += alphaDelta;
    }
  }

  const visited = new Uint8Array(pixelCount);
  const stack = new Int32Array(pixelCount);
  let connectedComponentCount = 0;
  let materialConnectedComponentCount = 0;
  let largestComponentPixelCount = 0;

  for (let start = 0; start < pixelCount; start += 1) {
    if (deltaAlpha[start] === 0 || visited[start]) continue;
    connectedComponentCount += 1;
    let stackSize = 1;
    let componentPixelCount = 0;
    let componentAlpha = 0;
    stack[0] = start;
    visited[start] = 1;

    while (stackSize > 0) {
      const pixel = stack[(stackSize -= 1)];
      componentPixelCount += 1;
      componentAlpha += deltaAlpha[pixel];
      const x = pixel % width;
      const y = Math.floor(pixel / width);
      const minX = Math.max(0, x - 1);
      const maxX = Math.min(width - 1, x + 1);
      const minY = Math.max(0, y - 1);
      const maxY = Math.min(height - 1, y + 1);

      for (let neighborY = minY; neighborY <= maxY; neighborY += 1) {
        for (let neighborX = minX; neighborX <= maxX; neighborX += 1) {
          const neighbor = neighborY * width + neighborX;
          if (visited[neighbor] || deltaAlpha[neighbor] === 0) continue;
          visited[neighbor] = 1;
          stack[stackSize] = neighbor;
          stackSize += 1;
        }
      }
    }

    largestComponentPixelCount = Math.max(largestComponentPixelCount, componentPixelCount);
    // Suppress one-pixel antialiasing specks while retaining small text strokes.
    if (componentPixelCount >= 2 && componentAlpha >= 64) {
      materialConnectedComponentCount += 1;
    }
  }

  return {
    newlyRevealedPixelCount,
    newlyRevealedAlpha,
    connectedComponentCount,
    materialConnectedComponentCount,
    largestComponentPixelCount,
  };
}

async function buildTemporalProgression(drawing, source, completedComparison) {
  const thresholds = {
    maximumSingleStrokeDelta: 0.05,
    minimumNontrivialStrokeDelta: 0.0005,
    minimumPrecompletionCoverage: 0.995,
    maximumFinalCompletionPop: 0.005,
  };
  const pathChecks = drawing.strokes.map((stroke, index) => inspectOpenPath(stroke, index + 1));
  const prefixes = [];
  let previousRaster = null;
  let previousCoverage = 0;

  for (let index = 0; index < drawing.strokes.length; index += 1) {
    const [, prefixRaster] = await renderDrawing({
      ...drawing,
      strokes: drawing.strokes.slice(0, index + 1),
      completed: false,
    });
    const comparison = compare(source, prefixRaster);
    const coverageDelta = comparison.alphaWeightedCoverage - previousCoverage;
    prefixes.push({
      prefixStrokeCount: index + 1,
      strokeId: drawing.strokes[index].id,
      sourceIndex: drawing.strokes[index].sourceIndex,
      alphaWeightedCoverage: comparison.alphaWeightedCoverage,
      alphaWeightedCoverageDelta: coverageDelta,
      meaningfulPixelCoverage: comparison.meaningfulPixelCoverage,
      newlyRevealed: measureNewAlphaComponents(source, previousRaster, prefixRaster),
    });
    previousRaster = prefixRaster;
    previousCoverage = comparison.alphaWeightedCoverage;
  }

  const deltas = prefixes.map((prefix) => prefix.alphaWeightedCoverageDelta);
  const precompletionCoverage = prefixes.at(-1)?.alphaWeightedCoverage ?? 0;
  const finalCompletionPop = completedComparison.alphaWeightedCoverage - precompletionCoverage;
  return {
    thresholds,
    pathGrammar: {
      requirement: "exactly one uppercase M and no m/Z/z per path",
      allValid: pathChecks.every((check) => check.valid),
      paths: pathChecks,
    },
    prefixes,
    maxSingleStrokeDelta: deltas.length ? Math.max(...deltas) : 0,
    minSingleStrokeDelta: deltas.length ? Math.min(...deltas) : 0,
    zeroContributionStrokeCount: deltas.filter((delta) => delta <= 0).length,
    nontrivialContributionStrokeCount: deltas.filter(
      (delta) => delta >= thresholds.minimumNontrivialStrokeDelta,
    ).length,
    precompletionCoverage,
    completionCoverage: completedComparison.alphaWeightedCoverage,
    completionExact: completedComparison.exact,
    finalCompletionPop,
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
const goldMotionOrder =
  goldPlan.motionOrder ?? goldPlan.strokes.map((_, index) => index + 1);
if (
  goldMotionOrder.length !== goldPlan.strokes.length ||
  new Set(goldMotionOrder).size !== goldPlan.strokes.length ||
  goldMotionOrder.some(
    (sourceIndex) =>
      !Number.isInteger(sourceIndex) || sourceIndex < 1 || sourceIndex > goldPlan.strokes.length,
  )
) {
  throw new Error("gold motionOrder must be a complete 1-based permutation of its strokes");
}
const goldStrokes = goldMotionOrder.map((sourceIndex) => {
  const stroke = goldPlan.strokes[sourceIndex - 1];
  return {
    id: stroke.id ?? `stroke-${sourceIndex}`,
    sourceIndex,
    d: stroke.d,
    width: stroke.maskWidth,
  };
});

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
  const tracedMask = compare(source, traced);
  const completedFrame = compare(source, completed);
  report.cases[drawing.name] = {
    strokeCount: drawing.strokeCount,
    tracedMask,
    completedFrame,
  };
  if (drawing.name === "gold") {
    report.cases.gold.temporalProgression = await buildTemporalProgression(
      drawing,
      source,
      completedFrame,
    );
  }
}

for (const [name, result] of Object.entries(report.cases)) {
  if (!result.completedFrame.exact) {
    throw new Error(`${name} completed frame differs from its source artwork`);
  }
  if (result.tracedMask.alphaWeightedCoverage < 0.995) {
    throw new Error(`${name} stroke mask coverage is below 99.5%`);
  }
}

const goldTemporal = report.cases.gold.temporalProgression;
const temporalFailures = [];
if (!goldTemporal.pathGrammar.allValid) {
  const invalidPaths = goldTemporal.pathGrammar.paths
    .filter((pathCheck) => !pathCheck.valid)
    .map((pathCheck) => pathCheck.strokeId)
    .join(", ");
  temporalFailures.push(`invalid open-path grammar: ${invalidPaths}`);
}
const largestDeltaPrefix = goldTemporal.prefixes.reduce(
  (largest, prefix) =>
    !largest || prefix.alphaWeightedCoverageDelta > largest.alphaWeightedCoverageDelta
      ? prefix
      : largest,
  null,
);
if (goldTemporal.maxSingleStrokeDelta > goldTemporal.thresholds.maximumSingleStrokeDelta) {
  temporalFailures.push(
    `single-stroke delta ${(goldTemporal.maxSingleStrokeDelta * 100).toFixed(3)}% (${largestDeltaPrefix?.strokeId}) exceeds 5%`,
  );
}
const trivialPrefixes = goldTemporal.prefixes.filter(
  (prefix) =>
    prefix.alphaWeightedCoverageDelta <
    goldTemporal.thresholds.minimumNontrivialStrokeDelta,
);
if (trivialPrefixes.length > 0) {
  temporalFailures.push(
    `stroke contribution below 0.05%: ${trivialPrefixes
      .map(
        (prefix) =>
          `${prefix.strokeId}=${(prefix.alphaWeightedCoverageDelta * 100).toFixed(3)}%`,
      )
      .join(", ")}`,
  );
}
if (
  goldTemporal.precompletionCoverage <
  goldTemporal.thresholds.minimumPrecompletionCoverage
) {
  temporalFailures.push(
    `precompletion coverage ${(goldTemporal.precompletionCoverage * 100).toFixed(3)}% is below 99.5%`,
  );
}
if (!goldTemporal.completionExact) {
  temporalFailures.push("completed frame is not pixel-exact");
}
if (goldTemporal.finalCompletionPop > goldTemporal.thresholds.maximumFinalCompletionPop) {
  temporalFailures.push(
    `final completion pop ${(goldTemporal.finalCompletionPop * 100).toFixed(3)}% exceeds 0.5%`,
  );
}
if (temporalFailures.length > 0) {
  throw new Error(`gold temporal progression failed: ${temporalFailures.join("; ")}`);
}

const reportPath = join(projectRoot, "qa", "drawing-validation.json");
await mkdir(dirname(reportPath), { recursive: true });
await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
