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
const tigerArmPath = new URL(
  "../public/assets/isolated/tiger-drawing-arm.svg",
  import.meta.url,
);
const tigerHandPath = new URL(
  "../public/assets/isolated/tiger-drawing-hand.svg",
  import.meta.url,
);
const tigerSleevePath = new URL(
  "../public/assets/isolated/tiger-drawing-sleeve.svg",
  import.meta.url,
);
const rabbitArmPath = new URL(
  "../public/assets/isolated/rabbit-hand-extra.svg",
  import.meta.url,
);
const rabbitHandPath = new URL(
  "../public/assets/isolated/rabbit-drawing-hand.svg",
  import.meta.url,
);
const rabbitSleevePath = new URL(
  "../public/assets/isolated/rabbit-drawing-sleeve.svg",
  import.meta.url,
);

const svgPathSignatures = (svg) =>
  [...svg.matchAll(/<(?:[a-z0-9]+:)?path\b([^>]*)\/?\s*>/gi)].map((match) => {
    const attributes = match[1];
    const read = (name) =>
      attributes.match(new RegExp(`(?:^|\\s)${name}="([^"]*)"`, "i"))?.[1] ?? "";

    return {
      d: read("d").replace(/\s+/g, " ").trim(),
      fill: read("fill"),
      fillOpacity: read("fill-opacity") || "1",
      fillRule: read("fill-rule") || "nonzero",
    };
  });

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
  assert.match(hero, /data-writing-phase/);
  assert.match(hero, /data-writing-phase": "preposition"/);
  assert.match(hero, /const strokeRotations = strokes\.map/);
  assert.match(hero, /const wristStrokeDirections = strokes\.map/);
  assert.match(hero, /getPointAtLength\(\(length \* segmentIndex\) \/ segmentCount\)/);
  assert.match(hero, /strokeWristRotation \+ strokeDirection\.rotation \* wristRotationPerSegment/);
  assert.match(hero, /xPercent: strokeWristXPercent/);
  assert.match(hero, /data-motion="tiger-drawing-wrist"/);
  assert.match(hero, /data-motion="rabbit-drawing-wrist"/);
  assert.match(hero, /data-wrist-phase/);
  assert.match(hero, /data-wrist-direction/);
  assert.match(hero, /data-wrist-segment/);
  assert.match(hero, /wristMaximumRotation: 0\.72/);
  assert.match(hero, /wristMaximumRotation: 0\.68/);
  assert.match(hero, /wristContactPress: 0\.24/);
  assert.match(hero, /wristHorizontalSweep: 1\.1/);
  assert.match(hero, /wristHorizontalSweep: 1\.3/);
  assert.match(hero, /wristHorizontalBias: 0\.25/);
  assert.match(hero, /wristHorizontalPulse: 0\.75/);
  assert.match(hero, /wristHorizontalPulseHold: 3/);
  assert.match(hero, /Math\.floor\(wristPulseIndex\+\+ \/ wristHorizontalPulseHold\)/);
  assert.match(hero, /strokeDirection\.pulse\.toFixed\(0\)/);
  assert.match(hero, /"data-wrist-horizontal": "0"/);
  assert.match(hero, /"data-wrist-pulse": "0"/);
  assert.match(hero, /wristLiftHeight: 0\.72/);
  assert.match(hero, /wristLiftHeight: 0\.67/);
  assert.match(hero, /yPercent: -wristLiftHeight/);
  assert.match(hero, /tiger-drawing-hand\.svg/);
  assert.match(hero, /tiger-drawing-sleeve\.svg/);
  assert.match(hero, /rabbit-drawing-hand\.svg/);
  assert.match(hero, /rabbit-drawing-sleeve\.svg/);
  assert.match(hero, /maximumRotation: 2\.6/);
  assert.match(hero, /maximumRotation: 2\.55/);
  assert.match(hero, /strokeBlend: 0\.72/);
  assert.match(hero, /detailLimit: 0\.8/);
  assert.match(hero, /detailStrength: 0\.22/);
  assert.match(hero, /liftRotation: -0\.53/);
  assert.match(hero, /liftRotation: 0\.48/);
  assert.match(hero, /liftDurationScale: 1\.1/);
  assert.match(hero, /liftDurationScale: 2\.1/);
  assert.match(hero, /bodyLeanLimit: 0\.14/);
  assert.match(hero, /preparationBlend: 0\.32/);
  assert.match(hero, /preparationBlend: 0\.34/);
  assert.match(hero, /let actorRotation = 0/);
  assert.match(hero, /actorRotation = readyRotation/);
  assert.match(hero, /liftSpeedLimit: 19/);
  assert.match(hero, /liftSpeedLimit: 20/);
  assert.match(hero, /preparationSpeedLimit: 24/);
  assert.doesNotMatch(hero, /previousRotation \+ direction \* Math\.min/);
  assert.doesNotMatch(hero, /--reveal/);
  assert.doesNotMatch(css, /\.draw-reveal/);
  assert.match(css, /\.stroke-drawing \[data-draw-stroke\],[\s\S]*opacity: 0/);
  assert.match(css, /prefers-reduced-motion[\s\S]*\[data-mask-complete\][\s\S]*opacity: 1/);
  assert.match(css, /prefers-reduced-motion[\s\S]*visibility: visible !important/);
  assert.match(css, /prefers-reduced-motion[\s\S]*\[data-mask-complete\][\s\S]*opacity: 1 !important/);

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
  const expectedHouseDrawingMs = housePlan.strokes.reduce(
    (total, stroke) => total + stroke.drawMs + stroke.liftAfterMs,
    0,
  );
  const expectedGoldDrawingMs = goldPlan.motionOrder.reduce((total, sourceIndex, index) => {
    const stroke = goldPlan.strokes[sourceIndex - 1];
    const drawMs = Math.max(
      goldPlan.rendering.minimumVisibleStrokeMs,
      stroke.suggestedDurationMs,
    );
    const liftMs = index === goldPlan.motionOrder.length - 1
      ? 0
      : (stroke.liftAfterMs ?? goldPlan.rendering.penLiftBetweenStrokesMs);
    return total + drawMs + liftMs;
  }, 0);
  assert.equal(expectedHouseDrawingMs, 4495);
  assert.equal(expectedGoldDrawingMs, 4618);
  assert.equal(housePlan.timeline.loopMs, expectedHouseDrawingMs + 1690);
  assert.equal(goldPlan.rendering.recommendedCycleMs, expectedGoldDrawingMs + 1690);
  for (const drawing of [validation.cases.house, validation.cases.gold]) {
    assert.equal(drawing.ownershipIsolation.unassignedSourcePixelCount, 0);
    assert.equal(drawing.ownershipIsolation.multiplyAssignedSourcePixelCount, 0);
    assert.equal(drawing.ownershipIsolation.maximumPreRevealRatio, 0);
    const frameRuns = [
      drawing.frameProgression,
      ...Object.values(drawing.highRefreshProgression),
    ];
    assert.deepEqual(
      frameRuns.map((frames) => frames.framesPerSecond),
      [60, 100, 120],
    );
    for (const frames of frameRuns) {
      assert.equal(
        frames.totalDurationMs,
        drawing === validation.cases.house
          ? expectedHouseDrawingMs
          : expectedGoldDrawingMs,
      );
      assert.ok(frames.maximumFrameDelta <= frames.thresholds.maximumFrameAlphaDelta);
      assert.ok(
        frames.maximumConsecutiveDrawingStalledDurationMs <=
          frames.thresholds.maximumDrawingStallDurationMs,
      );
      assert.ok(
        frames.maximumConsecutiveStalledDurationMs <=
          frames.thresholds.maximumTotalStallDurationMs,
      );
      assert.ok(
        frames.maximumConfiguredPenLiftMs <=
          frames.thresholds.maximumPenLiftDurationMs,
      );
      assert.equal(frames.regressionFrameCount, 0);
    }
  }
  assert.equal(validation.cases.house.completedFrame.exact, true);
  assert.equal(validation.cases.gold.completedFrame.exact, true);

  for (const [name, count] of [["house", 13], ["gold", 45]]) {
    for (let index = 1; index <= count; index += 1) {
      await access(
        new URL(
          `../public/assets/motion/ownership/${name}/${String(index).padStart(3, "0")}.png`,
          import.meta.url,
        ),
      );
    }
  }
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

test("keeps the exact original arm artwork while adding a direction-synced wrist joint", async () => {
  const [tigerArm, tigerHand, tigerSleeve, rabbitArm, rabbitHand, rabbitSleeve] =
    await Promise.all([
      readFile(tigerArmPath, "utf8"),
      readFile(tigerHandPath, "utf8"),
      readFile(tigerSleevePath, "utf8"),
      readFile(rabbitArmPath, "utf8"),
      readFile(rabbitHandPath, "utf8"),
      readFile(rabbitSleevePath, "utf8"),
    ]);

  assert.deepEqual(
    [...svgPathSignatures(tigerHand), ...svgPathSignatures(tigerSleeve)],
    svgPathSignatures(tigerArm),
  );
  assert.deepEqual(
    [...svgPathSignatures(rabbitHand), ...svgPathSignatures(rabbitSleeve)],
    svgPathSignatures(rabbitArm),
  );
});
