import { mkdir, readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const projectRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const assetsRoot = join(projectRoot, "public", "assets");
const motionRoot = join(assetsRoot, "motion");
const ownershipRoot = join(motionRoot, "ownership");

const [housePlan, goldPlan] = await Promise.all([
  readFile(join(motionRoot, "house-strokes.json"), "utf8").then(JSON.parse),
  readFile(join(motionRoot, "gold-strokes.json"), "utf8").then(JSON.parse),
]);

function samplePath(d) {
  const tokens = d.match(/[MLCZ]|-?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?/gi) ?? [];
  const segments = [];
  let cursor = 0;
  let command = null;
  let x = 0;
  let y = 0;
  let startX = 0;
  let startY = 0;
  const number = () => Number(tokens[cursor++]);
  const lineTo = (nextX, nextY) => {
    segments.push([x, y, nextX, nextY]);
    x = nextX;
    y = nextY;
  };

  while (cursor < tokens.length) {
    if (/^[MLCZ]$/i.test(tokens[cursor])) command = tokens[cursor++].toUpperCase();
    if (command === "M") {
      x = number();
      y = number();
      startX = x;
      startY = y;
      command = "L";
    } else if (command === "L") {
      lineTo(number(), number());
    } else if (command === "C") {
      const x1 = number();
      const y1 = number();
      const x2 = number();
      const y2 = number();
      const nextX = number();
      const nextY = number();
      const originX = x;
      const originY = y;
      let previousX = x;
      let previousY = y;
      for (let step = 1; step <= 64; step += 1) {
        const t = step / 64;
        const inverse = 1 - t;
        const sampleX =
          inverse ** 3 * originX +
          3 * inverse ** 2 * t * x1 +
          3 * inverse * t ** 2 * x2 +
          t ** 3 * nextX;
        const sampleY =
          inverse ** 3 * originY +
          3 * inverse ** 2 * t * y1 +
          3 * inverse * t ** 2 * y2 +
          t ** 3 * nextY;
        segments.push([previousX, previousY, sampleX, sampleY]);
        previousX = sampleX;
        previousY = sampleY;
      }
      x = nextX;
      y = nextY;
    } else if (command === "Z") {
      lineTo(startX, startY);
      command = null;
    } else {
      throw new Error(`Unsupported SVG path command in: ${d}`);
    }
  }
  return segments;
}

function distanceSquaredToSegment(px, py, [x1, y1, x2, y2]) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const denominator = dx * dx + dy * dy;
  const t = denominator
    ? Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / denominator))
    : 0;
  const closestX = x1 + t * dx;
  const closestY = y1 + t * dy;
  return (px - closestX) ** 2 + (py - closestY) ** 2;
}

async function renderSourceAlpha({ width, height, textures }) {
  const composite = await Promise.all(
    textures.map(async ({ file, left, top }) => ({
      input: await readFile(join(assetsRoot, file.replace(/^\/assets\//, ""))),
      left,
      top,
    })),
  );
  return sharp({
    create: { width, height, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
  })
    .composite(composite)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
}

async function writeOwnership({ id, viewBox, strokes, source }) {
  const [viewX, viewY, width, height] = viewBox;
  const sampled = strokes.map((stroke) => ({
    segments: samplePath(stroke.d),
    halfWidth: stroke.width / 2,
  }));
  const ownerBuffers = strokes.map(() => Buffer.alloc(width * height * 4));
  const ownerCounts = strokes.map(() => 0);
  let sourcePixelCount = 0;

  for (let pixelY = 0; pixelY < height; pixelY += 1) {
    for (let pixelX = 0; pixelX < width; pixelX += 1) {
      const pixel = pixelY * width + pixelX;
      if (source.data[pixel * 4 + 3] === 0) continue;
      sourcePixelCount += 1;
      const pointX = viewX + pixelX + 0.5;
      const pointY = viewY + pixelY + 0.5;
      let owner = 0;
      let bestScore = Number.POSITIVE_INFINITY;

      sampled.forEach((stroke, index) => {
        let distanceSquared = Number.POSITIVE_INFINITY;
        for (const segment of stroke.segments) {
          distanceSquared = Math.min(
            distanceSquared,
            distanceSquaredToSegment(pointX, pointY, segment),
          );
        }
        const score = distanceSquared / stroke.halfWidth ** 2;
        if (score < bestScore) {
          bestScore = score;
          owner = index;
        }
      });

      const offset = pixel * 4;
      ownerBuffers[owner][offset] = 255;
      ownerBuffers[owner][offset + 1] = 255;
      ownerBuffers[owner][offset + 2] = 255;
      ownerBuffers[owner][offset + 3] = 255;
      ownerCounts[owner] += 1;
    }
  }

  const outputDirectory = join(ownershipRoot, id);
  await mkdir(outputDirectory, { recursive: true });
  await Promise.all(
    ownerBuffers.map((buffer, index) =>
      sharp(buffer, { raw: { width, height, channels: 4 } }).png().toFile(
        join(outputDirectory, `${String(index + 1).padStart(3, "0")}.png`),
      ),
    ),
  );

  return { id, sourcePixelCount, assignedPixelCount: ownerCounts.reduce((a, b) => a + b, 0), ownerCounts };
}

const houseSource = await renderSourceAlpha({
  width: 94,
  height: 139,
  textures: housePlan.sourceAssets.map((asset) => ({
    file: asset.file,
    left: asset.x,
    top: asset.y,
  })),
});
const goldSource = await renderSourceAlpha({
  width: 162,
  height: 126,
  textures: [{ file: goldPlan.source.svg, left: 0, top: 0 }],
});

const reports = await Promise.all([
  writeOwnership({
    id: "house",
    viewBox: housePlan.coordinateSpace.viewBox,
    strokes: housePlan.strokes.map((stroke) => ({ d: stroke.d, width: stroke.strokeWidth })),
    source: houseSource,
  }),
  writeOwnership({
    id: "gold",
    viewBox: goldPlan.coordinateSystem.artworkViewBox,
    strokes: goldPlan.motionOrder.map((sourceIndex) => {
      const stroke = goldPlan.strokes[sourceIndex - 1];
      return { d: stroke.d, width: stroke.maskWidth };
    }),
    source: goldSource,
  }),
]);

for (const report of reports) {
  if (report.sourcePixelCount !== report.assignedPixelCount) {
    throw new Error(`${report.id} ownership masks do not partition every source pixel`);
  }
}

console.log(JSON.stringify(reports, null, 2));
