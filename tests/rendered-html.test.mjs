import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import { test } from "node:test";

const pagePath = new URL("../app/page.tsx", import.meta.url);
const heroPath = new URL("../app/HobanHero.tsx", import.meta.url);
const cssPath = new URL("../app/globals.css", import.meta.url);
const houseStrokePath = new URL(
  "../public/assets/motion/house-strokes.json",
  import.meta.url,
);
const goldStrokePath = new URL(
  "../public/assets/motion/gold-strokes.json",
  import.meta.url,
);
const drawingValidationPath = new URL(
  "../qa/drawing-validation.json",
  import.meta.url,
);
const tigerPencilPath = new URL(
  "../public/assets/isolated/tiger-pencil-tip.svg",
  import.meta.url,
);
const rabbitPencilPath = new URL(
  "../public/assets/isolated/rabbit-pencil-tip.svg",
  import.meta.url,
);
const rabbitCharacterPath = new URL(
  "../public/assets/isolated/rabbit-pencil-shaft.svg",
  import.meta.url,
);

const protectedStaticLayers = [
  "title-year",
  "title-orange",
  "title-black",
  "period-pill",
  "period-label",
  "period-date",
];

test("uses independently isolated assets at the original 1920x1068 coordinates", async () => {
  const [page, hero, css] = await Promise.all([
    readFile(pagePath, "utf8"),
    readFile(heroPath, "utf8"),
    readFile(cssPath, "utf8"),
  ]);
  const source = `${page}\n${hero}`;

  assert.match(source, /assets\/isolated/);
  assert.match(source, /paper-background\.webp/);
  assert.doesNotMatch(source, /isolated\/background-paper\.png/);
  assert.match(source, /character-tiger/);
  assert.match(source, /sketch-house/);
  assert.match(source, /tiger-pencil-tip\.svg/);
  assert.match(source, /character-rabbit-and-ladder/);
  assert.match(source, /rabbit-pencil-tip\.svg/);
  assert.match(source, /rabbit-hand-extra\.svg/);
  assert.match(source, /sketch-gold\.svg/);
  assert.match(source, /data-motion-role/);
  assert.match(source, /data-source-x/);
  assert.doesNotMatch(source, /elements\/.*\.jpg/);
  assert.doesNotMatch(source, /hoban-final-approved\.jpg/);
  assert.match(css, /aspect-ratio: 160 \/ 89/);
  assert.match(css, /background-image: url\("(?:\.\.\/public)?\/assets\/paper-background\.webp"\)/);
  assert.match(css, /background-size: cover/);
  assert.match(css, /object-fit: contain/);
  assert.doesNotMatch(
    css.replace(/@media \(prefers-reduced-motion:[\s\S]*$/m, ""),
    /(?:left|right|top|bottom|width|height|gap|padding|margin|translate)[^;]*-?\d+(?:\.\d+)?px\b/,
  );
  assert.match(hero, /gsap/i);
  assert.match(hero, /repeat: -1/);
  assert.match(hero, /data-motion="house-drawing"/);
  assert.match(hero, /data-motion="gold-drawing"/);
  assert.match(hero, /data-draw-stroke/);
  assert.match(hero, /getTotalLength\(\)/);
  assert.match(hero, /strokeDashoffset/);
  assert.match(hero, /data-mask-complete/);
  assert.match(hero, /transformOrigin: "16\.4% 97\.3%"/);
  assert.match(hero, /transformOrigin: "80% 95\.3%"/);
  assert.doesNotMatch(hero, /--reveal/);
  assert.doesNotMatch(css, /\.draw-reveal/);
  assert.match(css, /\.stroke-drawing \[data-draw-stroke\],[\s\S]*opacity: 0/);
  assert.match(css, /prefers-reduced-motion[\s\S]*\[data-mask-complete\][\s\S]*opacity: 1/);

  for (const layer of protectedStaticLayers) {
    assert.match(hero, new RegExp(`staticCopyLayers[\\s\\S]*${layer}`));
    assert.doesNotMatch(
      hero,
      new RegExp(`(?:loop|gsap\\.(?:to|fromTo))\\([^\\n]*${layer}`),
      `${layer} must stay completely static`,
    );
  }
});

test("draws the untouched house and gold artwork one logical stroke at a time", async () => {
  const [housePlan, goldPlan, validation] = await Promise.all([
    readFile(houseStrokePath, "utf8").then(JSON.parse),
    readFile(goldStrokePath, "utf8").then(JSON.parse),
    readFile(drawingValidationPath, "utf8").then(JSON.parse),
  ]);

  assert.equal(housePlan.strokes.length, 13);
  assert.equal(goldPlan.strokes.length, 45);
  assert.deepEqual(
    housePlan.strokes.map((stroke) => stroke.order),
    Array.from({ length: housePlan.strokes.length }, (_, index) => index + 1),
  );
  assert.deepEqual(
    goldPlan.strokes.map((stroke) => stroke.order),
    Array.from({ length: goldPlan.strokes.length }, (_, index) => index + 1),
  );
  assert.deepEqual(
    [...goldPlan.motionOrder].sort((a, b) => a - b),
    Array.from({ length: goldPlan.strokes.length }, (_, index) => index + 1),
  );
  for (const stroke of [...housePlan.strokes, ...goldPlan.strokes]) {
    assert.equal(
      stroke.d.match(/(?:^|\s)[Mm](?=\s)/g)?.length,
      1,
      `${stroke.id} must be one continuous SVG path`,
    );
  }
  assert.equal(goldPlan.rendering.pencilFollowsSamePath, false);
  assert.ok(goldPlan.rendering.maxPathLength <= 35.01);
  assert.ok(Math.max(...goldPlan.strokes.map((stroke) => stroke.maskWidth)) <= 11.75);
  assert.ok(validation.cases.house.tracedMask.alphaWeightedCoverage > 0.995);
  assert.ok(validation.cases.gold.tracedMask.alphaWeightedCoverage > 0.995);
  assert.ok(validation.cases.gold.temporalProgression.maxSingleStrokeDelta < 0.05);
  assert.ok(validation.cases.gold.temporalProgression.minSingleStrokeDelta >= 0.0005);
  assert.ok(validation.cases.gold.temporalProgression.precompletionCoverage >= 0.995);
  assert.ok(validation.cases.gold.temporalProgression.finalCompletionPop < 0.005);
  for (const drawing of [validation.cases.house, validation.cases.gold]) {
    const frames = drawing.frameProgression;
    assert.ok(frames.maximumFrameDelta <= frames.thresholds.maximumFrameAlphaDelta);
    assert.ok(
      frames.maximumConsecutiveStalledFrames <=
        frames.thresholds.maximumConsecutiveStalledFrames,
    );
    assert.equal(frames.regressionFrameCount, 0);
  }
  assert.equal(validation.cases.house.completedFrame.exact, true);
  assert.equal(validation.cases.gold.completedFrame.exact, true);
  assert.equal(
    validation.sourceSha256["/assets/isolated/sketch-house-body.png"],
    "a0c7ba3d73b3f6a8f1d45b430e7a1f897b482d974aac253c0e685d7852b12a36",
  );
  assert.equal(
    validation.sourceSha256["/assets/isolated/sketch-house-smoke.png"],
    "db3e33f45d6f4c11983558928a1a5578160719e9ed1a53e647acfc5f4416a9a5",
  );
  assert.equal(
    validation.sourceSha256["/assets/isolated/sketch-gold.svg"],
    "34159a27dac17580ddf09aa0f36cab647ff389670d6d15d6b8085ae7ef61e30a",
  );
});

test("every layer source referenced by the page exists", async () => {
  const hero = await readFile(heroPath, "utf8");
  const filenames = [...hero.matchAll(/"([a-z0-9-]+\.(?:png|svg))"/g)].map((match) => match[1]);

  assert.ok(filenames.length >= 53, `expected at least 53 assets, got ${filenames.length}`);
  await Promise.all(
    filenames.map((filename) =>
      access(new URL(`../public/assets/isolated/${filename}`, import.meta.url)),
    ),
  );
});

test("preserves the original faceted shading on both pencils", async () => {
  const [tigerPencil, rabbitPencil, rabbitCharacter] = await Promise.all([
    readFile(tigerPencilPath, "utf8"),
    readFile(rabbitPencilPath, "utf8"),
    readFile(rabbitCharacterPath, "utf8"),
  ]);

  assert.match(tigerPencil, /id="tiger-pencil-shadow"/);
  assert.match(rabbitPencil, /id="rabbit-pencil-tip-shadow"/);
  assert.match(rabbitCharacter, /id="rabbit-pencil-shaft-shadow"/);
  assert.match(tigerPencil, /fill-opacity="0\.190002"/);
  assert.match(rabbitPencil, /fill-opacity="0\.190002"/);
  assert.match(rabbitCharacter, /fill-opacity="0\.190002"/);
});
