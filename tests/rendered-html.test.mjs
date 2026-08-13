import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import { test } from "node:test";

const pagePath = new URL("../app/page.tsx", import.meta.url);
const heroPath = new URL("../app/HobanHero.tsx", import.meta.url);
const cssPath = new URL("../app/globals.css", import.meta.url);
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

  for (const layer of protectedStaticLayers) {
    assert.match(hero, new RegExp(`staticCopyLayers[\\s\\S]*${layer}`));
    assert.doesNotMatch(
      hero,
      new RegExp(`(?:loop|gsap\\.(?:to|fromTo))\\([^\\n]*${layer}`),
      `${layer} must stay completely static`,
    );
  }
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
