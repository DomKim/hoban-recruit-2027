"use client";

/* eslint-disable @next/next/no-img-element -- isolated source layers must keep their exact native pixels */

import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import goldStrokePlan from "../public/assets/motion/gold-strokes.json";
import houseStrokePlan from "../public/assets/motion/house-strokes.json";

type MotionRole = "character" | "drawing";

type Layer = {
  name: string;
  label: string;
  file: string;
  x: number;
  y: number;
  width: number;
  height: number;
  role?: MotionRole;
};

type RawLayer = readonly [string, number, number, number, number, string];

type DrawingStroke = {
  d: string;
  duration: number;
  gesture: number;
  id: string;
  lift: number;
  width: number;
};

type DrawingTexture = {
  file: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

const assetPath = (path: string) =>
  `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}${path}`;

const labels: Record<string, string> = {
  "character-tiger": "호랑이 캐릭터",
  "character-rabbit-and-ladder": "토끼 캐릭터와 사다리",
  "rabbit-hand-extra": "토끼의 그림 그리는 손",
  "tiger-pencil-tip": "호랑이 연필의 나무촉과 심",
  "rabbit-pencil-tip": "토끼 연필의 나무촉과 심",
  "sketch-house": "호랑이가 그리는 집",
  "sketch-gold": "토끼가 그리는 금괴",
  "sketch-platform": "호랑이 발판",
  "sketch-wind-and-lake": "풍력 발전기와 섬",
  "sketch-green-tree-left": "하단 큰 나무",
  "milk-carton-extra": "대한전선 스케치",
  logo: "HOBAN 로고",
};

const characterLayers = new Set([
  "character-tiger",
  "character-rabbit-and-ladder",
  "rabbit-hand-extra",
]);

const drawingLayers = new Set([
  "sketch-house",
  "sketch-gold",
  "sketch-platform",
  "sketch-wind-and-lake",
  "sketch-green-tree-left",
  "milk-carton-extra",
  "tiger-pencil-tip",
  "rabbit-pencil-tip",
]);

const taglineLayers = new Set(["tagline-color", "tagline-cont", "tagline-blue"]);
const staticCopyLayers = new Set([
  "title-year",
  "title-orange",
  "title-black",
  "period-pill",
  "period-label",
  "period-date",
]);

const compactHiddenLayers = new Set([
  "doodles-purple-bottommid",
  "icon-blue-note",
  "icon-orange-mark",
  "icon-orange-squiggle",
  "icon-star-top",
  "icon-star-set-1",
  "icon-star-set-2",
  "icon-star-set-3",
  "icon-star5",
  "right-corner-extra",
  "sketch-eraser",
]);

const copyFrame = { x: 97, y: 230, width: 664, height: 551 };

const copyOrder = [
  "tagline-color",
  "tagline-cont",
  "tagline-blue",
  "title-year",
  "title-orange",
  "title-black",
  "period-pill",
  "period-label",
  "period-date",
];

const rawLayers: readonly RawLayer[] = [
  ["doodles-purple-bottomleft", 386, 991, 56, 56, "doodles-purple-bottomleft.png"],
  ["doodles-purple-bottommid", 824, 852, 46, 45, "doodles-purple-bottommid.png"],
  ["doodles-purple-left", 1222, 369, 124, 122, "doodles-purple-left.png"],
  ["doodles-purple-middle", 1335, 499, 87, 86, "doodles-purple-middle.png"],
  ["icon-birds", 555, 281, 103, 68, "icon-birds.png"],
  ["icon-blue-note", 1072, 677, 18, 23, "icon-blue-note.png"],
  ["icon-butterflies", 1069, 509, 49, 43, "icon-butterflies.png"],
  ["icon-color-note", 242, 891, 78, 70, "icon-color-note.png"],
  ["icon-orange-doodle", 1178, 200, 93, 85, "icon-orange-doodle.png"],
  ["icon-orange-flag", 1496, 923, 83, 77, "icon-orange-flag.png"],
  ["icon-partyhat-bottom", 702, 923, 80, 102, "icon-partyhat-bottom.png"],
  ["icon-partyhat", 414, 56, 147, 158, "icon-partyhat.png"],
  ["icon-pink-ball", 1291, 184, 115, 93, "icon-pink-ball.png"],
  ["icon-rainbow", 604, 348, 152, 84, "icon-rainbow.png"],
  ["icon-star-small", 501, 901, 19, 16, "icon-star-small.png"],
  ["icon-star-top", 1290, 40, 30, 25, "icon-star-top.png"],
  ["icon-star2", 404, 875, 25, 21, "icon-star2.png"],
  ["icon-star3", 458, 915, 44, 38, "icon-star3.png"],
  ["icon-star4", 165, 90, 37, 31, "icon-star4.png"],
  ["icon-star5", 967, 467, 35, 30, "icon-star5.png"],
  ["icon-tote", 643, 825, 63, 77, "icon-tote.png"],
  ["icon-yellow-starburst", 1491, 599, 67, 79, "icon-yellow-starburst.png"],
  ["logo", 1677, 32, 170, 30, "logo.png"],
  ["milk-carton-extra", 1512, 245, 97, 252, "milk-carton-extra.svg"],
  ["period-pill", 105, 720, 184, 61, "period-pill.png"],
  ["period-label", 133, 732, 129, 34, "period-label.png"],
  ["period-date", 313, 729, 440, 42, "period-date.png"],
  ["right-corner-extra", 1792, 286, 54, 54, "right-corner-extra.png"],
  ["sketch-green-tree-left", 1243, 834, 159, 208, "sketch-green-tree-left.svg"],
  ["sketch-green-tree-small", 103, 930, 100, 119, "sketch-green-tree-small.png"],
  ["sketch-green-tree", 1579, 121, 91, 103, "sketch-green-tree.png"],
  ["sketch-green-vegetables", 1694, 183, 83, 101, "sketch-green-vegetables.png"],
  ["sketch-top-ribbon", 855, 0, 71, 142, "sketch-top-ribbon.png"],
  ["tagline-blue", 341, 231, 71, 33, "tagline-blue.png"],
  ["tagline-color", 101, 234, 83, 48, "tagline-color.png"],
  ["tagline-cont", 199, 230, 126, 56, "tagline-cont.png"],
  ["title-black", 97, 557, 664, 111, "title-black.png"],
  ["title-orange", 101, 430, 415, 111, "title-orange.png"],
  ["title-year", 101, 328, 209, 70, "title-year.png"],
  ["tree-extra", 1160, 937, 88, 106, "tree-extra.png"],
  ["icon-star-set-1", 996, 85, 21, 18, "icon-star-set-1.png"],
  ["icon-star-set-2", 1017, 105, 39, 33, "icon-star-set-2.png"],
  ["icon-star-set-3", 1866, 818, 21, 18, "icon-star-set-3.png"],
  ["icon-orange-mark", 859, 414, 30, 32, "icon-orange-mark.png"],
  ["icon-orange-squiggle", 905, 580, 56, 51, "icon-orange-squiggle.png"],
  ["sketch-eraser", 991, 267, 89, 75, "sketch-eraser.png"],
  ["sketch-platform", 856, 929, 278, 139, "sketch-platform.png"],
  ["sketch-house", 1057, 662, 137, 183, "sketch-house.png"],
  ["tiger-pencil-tip", 1065, 775, 40, 70, "tiger-pencil-tip.svg"],
  ["character-tiger", 906, 679, 177, 257, "character-tiger.svg"],
  ["sketch-gold", 1505, 666, 162, 126, "sketch-gold.svg"],
  ["character-rabbit-and-ladder", 1621, 669, 181, 399, "character-rabbit-and-ladder.svg"],
  ["rabbit-pencil-tip", 1619, 769, 18, 21, "rabbit-pencil-tip.svg"],
  ["rabbit-hand-extra", 1644, 814, 55, 64, "rabbit-hand-extra.svg"],
] as const;

const layers: Layer[] = rawLayers.map(([name, x, y, width, height, file]) => ({
  name,
  label: labels[name] ?? name,
  file,
  x,
  y,
  width,
  height,
  role: characterLayers.has(name)
    ? "character"
    : drawingLayers.has(name)
      ? "drawing"
      : undefined,
}));

const pct = (value: number, total: number) => `${(value / total) * 100}%`;

const taglineCharacters = [
  { name: "tagline-color-char-1", file: "tagline-color-char-1.png", x: 101, y: 234, width: 36, height: 48 },
  { name: "tagline-color-char-2", file: "tagline-color-char-2.png", x: 137, y: 234, width: 23, height: 48 },
  { name: "tagline-color-char-3", file: "tagline-color-char-3.png", x: 160, y: 234, width: 24, height: 48 },
  { name: "tagline-cont-char-1", file: "tagline-cont-char-1.png", x: 199, y: 230, width: 29, height: 56 },
  { name: "tagline-cont-char-2", file: "tagline-cont-char-2.png", x: 228, y: 230, width: 34, height: 56 },
  { name: "tagline-cont-char-3", file: "tagline-cont-char-3.png", x: 262, y: 230, width: 21, height: 56 },
  { name: "tagline-cont-char-4", file: "tagline-cont-char-4.png", x: 283, y: 230, width: 16, height: 56 },
  { name: "tagline-cont-char-5", file: "tagline-cont-char-5.png", x: 299, y: 230, width: 26, height: 56 },
  { name: "tagline-blue-char-1", file: "tagline-blue-char-1.png", x: 341, y: 231, width: 21, height: 33 },
  { name: "tagline-blue-char-2", file: "tagline-blue-char-2.png", x: 362, y: 231, width: 12, height: 33 },
  { name: "tagline-blue-char-3", file: "tagline-blue-char-3.png", x: 374, y: 231, width: 38, height: 33 },
] as const;

const houseActorCadence = [-0.85, 0.7, -1.9, 2.05, 1.45, -1.25, 1.3, -0.95, 0.65, 0.45, -1.15, 0.9, -0.7];
const goldActorCadence = [0.7, -1.55, -0.95, 1.75, 1.05, -0.55, -1.15];

const houseStrokes: readonly DrawingStroke[] = houseStrokePlan.strokes.map((stroke, index) => ({
  d: stroke.d,
  duration: stroke.drawMs / 1000,
  gesture: houseActorCadence[index],
  id: stroke.id,
  lift: stroke.liftAfterMs / 1000,
  width: stroke.strokeWidth,
}));

const goldStrokes: readonly DrawingStroke[] = goldStrokePlan.motionOrder
  .map((order) => goldStrokePlan.strokes[order - 1])
  .map((stroke, index, orderedStrokes) => {
    const defaultLiftMs = goldStrokePlan.rendering.penLiftBetweenStrokesMs;
    const configuredLiftMs = "liftAfterMs" in stroke
      ? Number(stroke.liftAfterMs)
      : defaultLiftMs;

    return {
      d: stroke.d,
      duration: Math.max(
        goldStrokePlan.rendering.minimumVisibleStrokeMs,
        stroke.suggestedDurationMs,
      ) / 1000,
      gesture: stroke.gesture,
      id: stroke.id,
      lift: index === orderedStrokes.length - 1 ? 0 : configuredLiftMs / 1000,
      width: stroke.maskWidth,
    };
  });

type LayerBounds = Pick<Layer, "x" | "y" | "width" | "height">;

function layerStyle({ x, y, width, height }: LayerBounds) {
  return {
    left: pct(x, 1920),
    top: pct(y, 1068),
    width: pct(width, 1920),
    height: pct(height, 1068),
  };
}

function StrokeDrawing({
  bounds,
  id,
  strokes,
  textures,
  viewBox,
}: {
  bounds: LayerBounds;
  id: "house" | "gold";
  strokes: readonly DrawingStroke[];
  textures: readonly DrawingTexture[];
  viewBox: readonly [number, number, number, number];
}) {
  const [viewX, viewY, viewWidth, viewHeight] = viewBox;
  const maskId = `${id}-stroke-mask`;

  return (
    <svg
      className="stroke-drawing"
      data-motion={`${id}-drawing`}
      data-draw-phase="complete"
      data-active-stroke={strokes.length}
      data-stroke-count={strokes.length}
      style={layerStyle(bounds)}
      viewBox={viewBox.join(" ")}
      aria-hidden="true"
    >
      <defs>
        {strokes.map((stroke, index) => (
          <mask
            key={`${stroke.id}-owner`}
            id={`${maskId}-owner-${index + 1}`}
            maskUnits="userSpaceOnUse"
            maskContentUnits="userSpaceOnUse"
            x={viewX}
            y={viewY}
            width={viewWidth}
            height={viewHeight}
          >
            <image
              href={assetPath(
                `/assets/motion/ownership/${id}/${String(index + 1).padStart(3, "0")}.png`,
              )}
              x={viewX}
              y={viewY}
              width={viewWidth}
              height={viewHeight}
              preserveAspectRatio="none"
              style={{ imageRendering: "pixelated" }}
            />
          </mask>
        ))}
        <mask
          id={maskId}
          maskUnits="userSpaceOnUse"
          maskContentUnits="userSpaceOnUse"
          x={viewX - 20}
          y={viewY - 20}
          width={viewWidth + 40}
          height={viewHeight + 40}
        >
          <rect x={viewX - 20} y={viewY - 20} width={viewWidth + 40} height={viewHeight + 40} fill="black" />
          {strokes.map((stroke, index) => (
            <g
              key={stroke.id}
              mask={`url(#${maskId}-owner-${index + 1})`}
            >
              <path
                data-draw-stroke={index + 1}
                data-stroke-id={stroke.id}
                data-stroke-duration={stroke.duration}
                data-stroke-gesture={stroke.gesture}
                data-stroke-lift={stroke.lift}
                d={stroke.d}
                fill="none"
                stroke="white"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={stroke.width}
              />
            </g>
          ))}
          <rect
            data-mask-complete="true"
            x={viewX - 20}
            y={viewY - 20}
            width={viewWidth + 40}
            height={viewHeight + 40}
            fill="white"
          />
        </mask>
      </defs>
      <g mask={`url(#${maskId})`}>
        {textures.map((texture) => (
          <image
            key={texture.file}
            href={assetPath(texture.file)}
            x={texture.x}
            y={texture.y}
            width={texture.width}
            height={texture.height}
            preserveAspectRatio="none"
          />
        ))}
      </g>
    </svg>
  );
}

function copyStyle({ x, y, width, height }: LayerBounds) {
  return {
    left: pct(x - copyFrame.x, copyFrame.width),
    top: pct(y - copyFrame.y, copyFrame.height),
    width: pct(width, copyFrame.width),
    height: pct(height, copyFrame.height),
  };
}

const copyLayers = copyOrder
  .map((name) => layers.find((layer) => layer.name === name))
  .filter((layer): layer is Layer => Boolean(layer));

export default function HobanHero() {
  const artboardRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    const artboard = artboardRef.current;
    const stage = stageRef.current;
    if (!artboard || !stage) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      artboard.dataset.motionReady = "true";
      return;
    }

    const q = gsap.utils.selector(stage);
    const ctx = gsap.context(() => {
      const loop = (target: string, vars: gsap.TweenVars) =>
        gsap.to(q(target), { repeat: -1, ...vars });

      const taglineIntro = gsap.timeline();
      taglineIntro.set(q(".tagline-static"), { autoAlpha: 0 });
      taglineIntro.fromTo(
        q(".tagline-char"),
        { autoAlpha: 0, yPercent: 38, scale: 0.78, rotation: -8 },
        {
          autoAlpha: 1,
          yPercent: 0,
          scale: 1,
          rotation: 0,
          duration: 0.62,
          stagger: 0.09,
          ease: "back.out(1.9)",
        },
      );
      taglineIntro.set(q(".tagline-static"), { autoAlpha: 1 });
      taglineIntro.set(q(".tagline-char"), { autoAlpha: 0 });

      loop('[data-layer="doodles-purple-left"]', {
        keyframes: [
          { autoAlpha: 0.45, scale: 0.72, rotation: -5, duration: 0 },
          { autoAlpha: 1, scale: 1.05, rotation: 3, duration: 0.86, ease: "back.out(1.7)" },
          { scale: 1, rotation: 0, duration: 0.48, ease: "sine.out" },
          { autoAlpha: 1, duration: 1.65 },
          { autoAlpha: 0.45, scale: 0.72, duration: 0.72, ease: "sine.in" },
          { duration: 0.95 },
        ],
        transformOrigin: "50% 50%",
      });

      loop('[data-layer="doodles-purple-middle"]', {
        keyframes: [
          { autoAlpha: 0.38, scale: 0.68, rotation: 7, duration: 0 },
          { autoAlpha: 1, scale: 1.08, rotation: -4, duration: 0.38, ease: "back.out(2.2)" },
          { scale: 1, rotation: 0, duration: 0.25, ease: "sine.out" },
          { autoAlpha: 1, duration: 0.52 },
          { autoAlpha: 0.38, scale: 0.68, duration: 0.35, ease: "sine.in" },
          { duration: 0.72 },
        ],
        transformOrigin: "50% 50%",
        delay: 0.34,
      });

      loop('[data-layer="doodles-purple-bottomleft"]', {
        keyframes: [
          { autoAlpha: 0.48, scale: 0.78, duration: 0 },
          { autoAlpha: 1, scale: 1.07, rotation: 7, duration: 0.42, ease: "back.out(2)" },
          { scale: 1, rotation: 0, duration: 0.25 },
          { autoAlpha: 0.48, scale: 0.78, duration: 0.43, delay: 0.58 },
          { duration: 1.12 },
        ],
        transformOrigin: "50% 50%",
        delay: 0.9,
      });

      loop('[data-layer="doodles-purple-bottommid"]', {
        keyframes: [
          { autoAlpha: 0.5, scale: 0.8, duration: 0 },
          { autoAlpha: 1, scale: 1.08, rotation: -8, duration: 0.35, ease: "back.out(2)" },
          { scale: 1, rotation: 0, duration: 0.22 },
          { autoAlpha: 0.5, scale: 0.8, duration: 0.38, delay: 0.45 },
          { duration: 1.35 },
        ],
        transformOrigin: "50% 50%",
        delay: 0.18,
      });

      loop('[data-layer="icon-yellow-starburst"]', {
        keyframes: [
          { scale: 0.86, rotation: -4, autoAlpha: 0.7, duration: 0 },
          { scale: 1.08, rotation: 4, autoAlpha: 1, duration: 0.48, ease: "back.out(2)" },
          { scale: 1, rotation: 0, duration: 0.28 },
          { scale: 0.86, autoAlpha: 0.7, duration: 0.52, delay: 1.2 },
          { duration: 1.4 },
        ],
        transformOrigin: "50% 70%",
      });

      loop('[data-layer="orange-fly"]', {
        keyframes: [
          { xPercent: -2, yPercent: 7, rotation: -4, duration: 0 },
          { xPercent: 4, yPercent: -6, rotation: 4, duration: 1.35, ease: "sine.inOut" },
          { xPercent: -1, yPercent: -10, rotation: -2, duration: 1.1, ease: "sine.inOut" },
          { xPercent: -5, yPercent: 1, rotation: 3, duration: 1.25, ease: "sine.inOut" },
          { xPercent: -2, yPercent: 7, rotation: -4, duration: 1.2, ease: "sine.inOut" },
        ],
        transformOrigin: "50% 50%",
      });

      loop('[data-layer="orange-fly-trail"]', {
        keyframes: [
          { autoAlpha: 0.35, duration: 0.65, ease: "sine.inOut" },
          { autoAlpha: 1, duration: 0.65, ease: "sine.inOut" },
        ],
        yoyo: true,
      });

      loop('[data-layer="sports-golf-club"]', {
        keyframes: [
          { rotation: 0, xPercent: 0, yPercent: 0, duration: 0 },
          { rotation: -8, xPercent: -2, yPercent: -1, duration: 0.72, ease: "sine.inOut" },
          { rotation: 9, xPercent: 2, yPercent: 1, duration: 0.3, ease: "power2.in" },
          { rotation: -2, xPercent: 0.5, yPercent: -0.5, duration: 0.54, ease: "back.out(1.5)" },
          { rotation: 0, xPercent: 0, yPercent: 0, duration: 0.42, ease: "sine.out" },
          { duration: 2.75 },
        ],
        transformOrigin: "78% 92%",
        delay: 0.6,
      });

      loop('[data-layer="sports-golf-ball"]', {
        keyframes: [
          { yPercent: 0, scaleX: 1, scaleY: 1, duration: 0.98 },
          { yPercent: -19, scaleX: 0.97, scaleY: 1.035, duration: 0.16, ease: "power2.out" },
          { yPercent: 0, scaleX: 1.035, scaleY: 0.965, duration: 0.13, ease: "power2.in" },
          { yPercent: -10, scaleX: 0.985, scaleY: 1.02, duration: 0.13, ease: "power2.out" },
          { yPercent: 0, scaleX: 1.02, scaleY: 0.98, duration: 0.11, ease: "power2.in" },
          { scaleX: 1, scaleY: 1, duration: 0.12, ease: "back.out(2)" },
          { duration: 3.45 },
        ],
        transformOrigin: "50% 100%",
        delay: 0.6,
      });

      loop('[data-layer="sports-note-big"]', {
        keyframes: [
          { yPercent: -5, rotation: -3, duration: 0.75, ease: "sine.inOut" },
          { yPercent: 4, rotation: 3, duration: 0.75, ease: "sine.inOut" },
        ],
        yoyo: true,
        transformOrigin: "50% 50%",
      });

      loop('[data-layer="sports-note-small"]', {
        keyframes: [
          { yPercent: 4, rotation: 3, duration: 0.62, ease: "sine.inOut" },
          { yPercent: -6, rotation: -4, duration: 0.62, ease: "sine.inOut" },
        ],
        yoyo: true,
        transformOrigin: "50% 50%",
      });

      const sway = (target: string, angle: number, duration: number, origin = "50% 100%") =>
        loop(target, {
          keyframes: [
            { rotation: -angle, duration, ease: "sine.inOut" },
            { rotation: angle, duration, ease: "sine.inOut" },
          ],
          yoyo: true,
          transformOrigin: origin,
        });

      sway('[data-layer="milk-carton-extra"]', 1.6, 1.7, "50% 92%");
      sway('[data-layer="sketch-green-tree-left"]', 1.25, 2.1);
      sway('[data-layer="tree-extra"]', 1.65, 1.85);
      sway('[data-layer="sketch-green-tree-small"]', 3.2, 1.65, "50% 96%");
      sway('[data-layer="sketch-green-tree"]', 1.15, 2.05);
      sway('[data-layer="icon-partyhat-bottom"]', 3.4, 1.45, "50% 96%");
      sway('[data-layer="windmill-center"]', 0.55, 2.25, "50% 100%");
      sway('[data-layer="windmill-left"]', 0.7, 2.05, "50% 100%");
      sway('[data-layer="windmill-right"]', 0.6, 2.45, "50% 100%");

      loop('[data-layer="sketch-lake"]', {
        keyframes: [
          { xPercent: -0.35, duration: 1.8, ease: "sine.inOut" },
          { xPercent: 0.35, duration: 1.8, ease: "sine.inOut" },
        ],
        yoyo: true,
      });

      loop('[data-layer="icon-birds"]', {
        keyframes: [
          { xPercent: -2, yPercent: 2, rotation: -2, duration: 1.5, ease: "sine.inOut" },
          { xPercent: 2, yPercent: -3, rotation: 2, duration: 1.5, ease: "sine.inOut" },
        ],
        yoyo: true,
        transformOrigin: "50% 50%",
      });

      loop('[data-layer="icon-pink-ball"]', {
        keyframes: [
          { yPercent: -2, rotation: -2, duration: 1.4, ease: "sine.inOut" },
          { yPercent: 3, rotation: 2, duration: 1.4, ease: "sine.inOut" },
        ],
        yoyo: true,
        transformOrigin: "50% 50%",
      });

      loop('[data-layer="sketch-top-ribbon"]', {
        keyframes: [
          { rotation: -1.2, xPercent: -0.8, duration: 1.8, ease: "sine.inOut" },
          { rotation: 1.2, xPercent: 0.8, duration: 1.8, ease: "sine.inOut" },
        ],
        yoyo: true,
        transformOrigin: "50% 0%",
      });

      const createStrokeDrawingLoop = ({
        wrapper,
        actorTarget,
        characterTarget,
        delay,
        actorCadence,
        bodyLean,
        bodyPress,
        detailLimit,
        detailStrength,
        liftRotation,
        maximumRotation,
        pressureRotation,
        strokeBlend,
        transformOrigin,
      }: {
        wrapper: string;
        actorTarget: string;
        characterTarget: string;
        delay: number;
        actorCadence: readonly number[];
        bodyLean: number;
        bodyPress: number;
        detailLimit: number;
        detailStrength: number;
        liftRotation: number;
        maximumRotation: number;
        pressureRotation: number;
        strokeBlend: number;
        transformOrigin: string;
      }) => {
        const drawing = stage.querySelector<SVGSVGElement>(wrapper);
        const actor = stage.querySelector<HTMLElement>(actorTarget);
        const character = stage.querySelector<HTMLElement>(characterTarget);
        if (!drawing || !actor || !character) return;

        const strokes = Array.from(drawing.querySelectorAll<SVGPathElement>("[data-draw-stroke]"));
        const completion = drawing.querySelector<SVGRectElement>("[data-mask-complete]");
        if (!strokes.length || !completion) return;

        strokes.forEach((stroke) => {
          const length = stroke.getTotalLength();
          stroke.dataset.strokeLength = String(length);
          gsap.set(stroke, { opacity: 0, strokeDasharray: length, strokeDashoffset: length });
        });
        gsap.set(completion, { opacity: 0 });
        gsap.set(drawing, { autoAlpha: 1 });
        gsap.set(actor, { rotation: 0, transformOrigin });
        gsap.set(character, {
          rotation: 0,
          xPercent: 0,
          yPercent: 0,
          scaleX: 1,
          scaleY: 1,
          transformOrigin: "50% 100%",
        });
        const timeline = gsap.timeline({ repeat: -1, delay });

        timeline.set(drawing, {
          attr: { "data-active-stroke": "0", "data-draw-phase": "drawing" },
        });
        timeline.to({}, { duration: 0.15 });

        const clampRotation = (rotation: number) =>
          Math.max(-maximumRotation, Math.min(maximumRotation, rotation));
        const clampDetail = (detail: number) =>
          Math.max(-detailLimit, Math.min(detailLimit, detail));
        let gestureGroupIndex = 0;
        let previousRotation = 0;

        const strokeRotations = strokes.map((stroke, index) => {
          const cadence = actorCadence[gestureGroupIndex % actorCadence.length];
          const authoredGesture = Number(stroke.dataset.strokeGesture ?? 0);
          const requestedRotation = clampRotation(
            cadence + clampDetail(authoredGesture * detailStrength),
          );
          const blend = index === 0 ? 1 : strokeBlend;
          const filteredRotation = clampRotation(
            previousRotation * (1 - blend) + requestedRotation * blend,
          );

          previousRotation = filteredRotation;
          const lift = Number(stroke.dataset.strokeLift ?? 0);
          if (lift > 0 || index === strokes.length - 1) gestureGroupIndex += 1;
          return filteredRotation;
        });

        previousRotation = 0;

        strokes.forEach((stroke, index) => {
          const duration = Number(stroke.dataset.strokeDuration ?? 0.2);
          const lift = Number(stroke.dataset.strokeLift ?? 0.045);
          const targetRotation = strokeRotations[index];
          const rotationDelta = targetRotation - previousRotation;
          const direction = Math.sign(rotationDelta) || Math.sign(targetRotation) || 1;

          timeline.set(drawing, {
            attr: { "data-active-stroke": String(index + 1), "data-draw-phase": "drawing" },
          });
          timeline.set(actor, {
            attr: { "data-writing-phase": "contact", "data-writing-stroke": String(index + 1) },
          });
          const strokeStartAt = timeline.duration();
          timeline.to(stroke, {
            strokeDashoffset: 0,
            duration,
            ease: "none",
          }, strokeStartAt);
          timeline.to(stroke, {
            opacity: 1,
            duration: Math.min(0.08, duration * 0.7),
            ease: "none",
          }, strokeStartAt);

          if (duration >= 0.36) {
            const approachDuration = duration * 0.18;
            const sweepDuration = duration * 0.64;
            const overshootDuration = duration * 0.09;
            const approachRotation = clampRotation(
              targetRotation - direction * pressureRotation,
            );
            const overshootRotation = clampRotation(
              targetRotation + direction * Math.min(0.12, pressureRotation * 0.7),
            );

            timeline.to(actor, {
              rotation: approachRotation,
              duration: approachDuration,
              ease: "sine.out",
              transformOrigin,
            }, strokeStartAt);
            timeline.to(actor, {
              rotation: targetRotation,
              duration: sweepDuration,
              ease: "sine.inOut",
              transformOrigin,
            }, strokeStartAt + approachDuration);
            timeline.to(actor, {
              rotation: overshootRotation,
              duration: overshootDuration,
              ease: "sine.out",
              transformOrigin,
            }, strokeStartAt + approachDuration + sweepDuration);
            timeline.to(actor, {
              rotation: targetRotation,
              duration: duration - approachDuration - sweepDuration - overshootDuration,
              ease: "sine.in",
              transformOrigin,
            }, strokeStartAt + approachDuration + sweepDuration + overshootDuration);
          } else if (duration > 0.12) {
            const contactDuration = Math.min(0.03, duration * 0.2);
            const contactRotation = clampRotation(
              previousRotation + direction * Math.min(
                pressureRotation,
                Math.abs(rotationDelta) * 0.42,
              ),
            );

            timeline.to(actor, {
              rotation: contactRotation,
              duration: contactDuration,
              ease: "sine.out",
              transformOrigin,
            }, strokeStartAt);
            timeline.to(actor, {
              rotation: targetRotation,
              duration: duration - contactDuration,
              ease: "sine.inOut",
              transformOrigin,
            }, strokeStartAt + contactDuration);
          } else {
            timeline.to(actor, {
              rotation: targetRotation,
              duration,
              ease: "sine.inOut",
              transformOrigin,
            }, strokeStartAt);
          }

          if (bodyPress > 0) {
            timeline.to(character, {
              rotation: Math.max(-0.08, Math.min(0.08, -targetRotation * bodyLean)),
              yPercent: bodyPress,
              duration: Math.min(0.11, duration * 0.45),
              ease: "sine.out",
            }, strokeStartAt);
          }

          const strokeEndAt = strokeStartAt + duration;

          if (lift > 0) {
            timeline.to({}, { duration: lift });
            timeline.set(actor, {
              attr: { "data-writing-phase": "lift" },
            }, strokeEndAt);
            const liftPeakDuration = Math.min(
              lift * 0.45,
              bodyPress > 0 ? 0.018 : 0.014,
            );
            const liftPeakRotation = clampRotation(targetRotation + liftRotation);
            const nextRotation = strokeRotations[index + 1] ?? 0;
            const readyRotation = clampRotation(
              liftPeakRotation + (nextRotation - liftPeakRotation) * 0.25,
            );
            timeline.to(actor, {
              rotation: liftPeakRotation,
              duration: liftPeakDuration,
              ease: "power2.out",
              transformOrigin,
            }, strokeEndAt);
            timeline.to(actor, {
              rotation: readyRotation,
              duration: lift - liftPeakDuration,
              ease: "sine.inOut",
              transformOrigin,
            }, strokeEndAt + liftPeakDuration);
            if (bodyPress > 0) {
              timeline.to(character, {
                rotation: 0,
                yPercent: 0,
                duration: lift,
                ease: "power1.out",
              }, strokeEndAt);
            }
          }

          previousRotation = targetRotation;
        });

        timeline.to(completion, { opacity: 1, duration: 0.08, ease: "none" });
        timeline.set(drawing, {
          attr: { "data-active-stroke": String(strokes.length), "data-draw-phase": "complete" },
        });
        const settleStartAt = timeline.duration();
        timeline.set(actor, {
          attr: { "data-writing-phase": "complete" },
        });
        timeline.to(actor, {
          rotation: 0,
          duration: 0.16,
          ease: "back.out(1.25)",
        }, settleStartAt);
        timeline.to(character, {
          rotation: 0,
          xPercent: 0,
          yPercent: 0,
          duration: 0.16,
          ease: "back.out(1.25)",
        }, settleStartAt);
        timeline.to(character, {
          keyframes: [
            { yPercent: -2.8, scaleX: 0.985, scaleY: 1.018, duration: 0.13, ease: "power2.out" },
            { yPercent: 0, scaleX: 1.025, scaleY: 0.975, duration: 0.12, ease: "power2.in" },
            { yPercent: -1.75, scaleX: 0.99, scaleY: 1.012, duration: 0.11, ease: "power2.out" },
            { yPercent: 0, scaleX: 1.016, scaleY: 0.984, duration: 0.1, ease: "power2.in" },
            { scaleX: 1, scaleY: 1, duration: 0.12, ease: "back.out(2)" },
          ],
        });
        timeline.to({}, { duration: 0.5 });
        timeline.to(drawing, { autoAlpha: 0, duration: 0.22, ease: "sine.in" });
        timeline.set(strokes, {
          opacity: 0,
          strokeDashoffset: (_index: number, stroke: SVGPathElement) =>
            Number(stroke.dataset.strokeLength ?? 0),
        });
        timeline.set(completion, { opacity: 0 });
        timeline.set(drawing, {
          autoAlpha: 1,
          attr: { "data-active-stroke": "0", "data-draw-phase": "reset" },
        });
        timeline.set(actor, {
          attr: { "data-writing-phase": "reset", "data-writing-stroke": "0" },
        }, "<");
      };

      createStrokeDrawingLoop({
        wrapper: '[data-motion="house-drawing"]',
        actorTarget: '[data-motion="tiger-drawing-tool"]',
        characterTarget: '[data-motion="tiger-character"]',
        delay: 0.25,
        actorCadence: houseActorCadence,
        bodyLean: 0.04,
        bodyPress: 0.12,
        detailLimit: 0,
        detailStrength: 0,
        liftRotation: -0.45,
        maximumRotation: 2.1,
        pressureRotation: 0.18,
        strokeBlend: 1,
        transformOrigin: "16.4% 97.3%",
      });

      createStrokeDrawingLoop({
        wrapper: '[data-motion="gold-drawing"]',
        actorTarget: '[data-motion="rabbit-drawing-tool"]',
        characterTarget: '[data-motion="rabbit-character"]',
        delay: 2.1,
        actorCadence: goldActorCadence,
        bodyLean: 0,
        bodyPress: 0,
        detailLimit: 0.22,
        detailStrength: 0.055,
        liftRotation: 0.35,
        maximumRotation: 2,
        pressureRotation: 0.14,
        strokeBlend: 0.35,
        transformOrigin: "80% 95.3%",
      });

      artboard.dataset.motionReady = "true";
    }, stage);

    return () => ctx.revert();
  }, []);

  const renderImage = (layer: Layer, extraClass = "") => (
    <img
      key={layer.name}
      className={`art-layer${layer.role ? ` ${layer.role}` : ""}${
        compactHiddenLayers.has(layer.name) ? " compact-hidden" : ""
      }${extraClass ? ` ${extraClass}` : ""}`}
      src={assetPath(`/assets/isolated/${layer.file}`)}
      alt=""
      aria-hidden="true"
      data-layer={layer.name}
      data-label={layer.label}
      data-motion-role={layer.role}
      data-source-x={layer.x}
      data-source-y={layer.y}
      style={layerStyle(layer)}
    />
  );

  const renderGroupedImage = (layer: Layer, bounds: LayerBounds) => (
    <img
      key={layer.name}
      className={`art-layer${layer.role ? ` ${layer.role}` : ""}`}
      src={assetPath(`/assets/isolated/${layer.file}`)}
      alt=""
      aria-hidden="true"
      data-layer={layer.name}
      data-label={layer.label}
      data-motion-role={layer.role}
      style={{
        left: pct(layer.x - bounds.x, bounds.width),
        top: pct(layer.y - bounds.y, bounds.height),
        width: pct(layer.width, bounds.width),
        height: pct(layer.height, bounds.height),
      }}
    />
  );

  const golfBounds = { x: 1721, y: 347, width: 199, height: 260 };
  const tigerToolBounds = { x: 1024, y: 775, width: 81, height: 102 };
  const rabbitToolBounds = { x: 1619, y: 769, width: 80, height: 109 };
  const tigerCharacterBounds = { x: 906, y: 679, width: 199, height: 257 };
  const rabbitCharacterBounds = { x: 1619, y: 669, width: 183, height: 399 };
  const houseDrawingBounds = { x: 1100, y: 662, width: 94, height: 139 };

  const nestedStyle = (inner: LayerBounds, outer: LayerBounds) => ({
    left: pct(inner.x - outer.x, outer.width),
    top: pct(inner.y - outer.y, outer.height),
    width: pct(inner.width, outer.width),
    height: pct(inner.height, outer.height),
  });

  return (
    <main>
      <section className="hero-shell" aria-label="2027 호반그룹 신입사원 채용 키비주얼" ref={stageRef}>
        <div className="hero-scene">
          <div className="artboard" data-artboard="1920x1068" ref={artboardRef}>
            <img
              className="paper"
              src={assetPath("/assets/paper-background.webp")}
              alt=""
              aria-hidden="true"
            />

            {layers.map((layer) => {
              if (taglineLayers.has(layer.name)) return null;
              if (
                layer.name === "sketch-house" ||
                layer.name === "character-tiger" ||
                layer.name === "tiger-pencil-tip" ||
                layer.name === "character-rabbit-and-ladder" ||
                layer.name === "rabbit-pencil-tip" ||
                layer.name === "rabbit-hand-extra" ||
                layer.name === "icon-orange-doodle"
              ) return null;

              if (layer.name === "sketch-gold") {
                return (
                  <StrokeDrawing
                    key={layer.name}
                    bounds={layer}
                    id="gold"
                    strokes={goldStrokes}
                    textures={[
                      { file: "/assets/isolated/sketch-gold.svg", x: 1505, y: 666, width: 162, height: 126 },
                    ]}
                    viewBox={[1505, 666, 162, 126]}
                  />
                );
              }

              const extraClasses = [
                taglineLayers.has(layer.name) ? "tagline-piece" : "",
                staticCopyLayers.has(layer.name) ? "static-copy" : "",
                layer.name === "tiger-pencil-tip" ? "pencil-motion" : "",
                layer.name === "rabbit-pencil-tip" ? "pencil-motion" : "",
              ]
                .filter(Boolean)
                .join(" ");

              const image = renderImage(layer, extraClasses);
              return image;
            })}

            {renderImage(
              { name: "orange-fly-trail", label: "파리의 비행 궤적", file: "orange-fly-trail.png", x: 1221, y: 216, width: 50, height: 69 },
            )}
            {renderImage(
              { name: "orange-fly", label: "날아다니는 파리", file: "orange-fly.png", x: 1178, y: 200, width: 42, height: 40 },
            )}

            {renderImage(
              { name: "windmill-left", label: "왼쪽 풍력발전기", file: "windmill-left.svg", x: 1233, y: 658, width: 55, height: 100 },
            )}
            {renderImage(
              { name: "windmill-center", label: "가운데 풍력발전기", file: "windmill-center.svg", x: 1271, y: 600, width: 86, height: 154 },
            )}
            {renderImage(
              { name: "windmill-right", label: "오른쪽 풍력발전기", file: "windmill-right.svg", x: 1355, y: 631, width: 46, height: 83 },
            )}
            {renderImage(
              { name: "sketch-lake", label: "풍력발전기 아래 호수", file: "sketch-lake.svg", x: 1335, y: 714, width: 102, height: 58 },
            )}

            <span className="golf-group" style={layerStyle(golfBounds)}>
              {renderGroupedImage(
                { name: "sports-note-small", label: "골프 위 작은 음표", file: "sports-note-small.png", x: 1721, y: 369, width: 22, height: 34 },
                golfBounds,
              )}
              {renderGroupedImage(
                { name: "sports-note-big", label: "골프 위 큰 음표", file: "sports-note-big.png", x: 1749, y: 347, width: 25, height: 50 },
                golfBounds,
              )}
              {renderGroupedImage(
                { name: "sports-golf-field", label: "골프 필드", file: "sports-golf-field-static.png", x: 1737, y: 422, width: 183, height: 185 },
                golfBounds,
              )}
              {renderGroupedImage(
                { name: "sports-golf-ball", label: "두 번 통통 뛰는 골프공", file: "sports-golf-ball.png", x: 1812, y: 470, width: 46, height: 47 },
                golfBounds,
              )}
              {renderGroupedImage(
                { name: "sports-golf-club", label: "움직이는 골프채", file: "sports-golf-club.png", x: 1731, y: 417, width: 80, height: 128 },
                golfBounds,
              )}
            </span>

            <StrokeDrawing
              bounds={houseDrawingBounds}
              id="house"
              strokes={houseStrokes}
              textures={[
                { file: "/assets/isolated/sketch-house-smoke.png", x: 32, y: 0, width: 62, height: 43 },
                { file: "/assets/isolated/sketch-house-body.png", x: 0, y: 47, width: 61, height: 92 },
              ]}
              viewBox={[0, 0, 94, 139]}
            />

            <span
              className="character-motion-group"
              data-motion="tiger-character"
              style={layerStyle(tigerCharacterBounds)}
            >
              {renderGroupedImage(
                { name: "character-tiger-body", label: "호랑이 몸통", file: "character-tiger-body.svg", x: 906, y: 679, width: 177, height: 257, role: "character" },
                tigerCharacterBounds,
              )}
              <span
                className="drawing-tool"
                data-motion="tiger-drawing-tool"
                style={nestedStyle(tigerToolBounds, tigerCharacterBounds)}
              >
                {renderGroupedImage(
                  { name: "tiger-pencil-shaft", label: "호랑이 연필 몸통", file: "tiger-pencil-shaft.png", x: 1057, y: 786, width: 44, height: 59, role: "drawing" },
                  tigerToolBounds,
                )}
                {renderGroupedImage(
                  { name: "tiger-pencil-tip", label: "호랑이 연필 촉과 측면", file: "tiger-pencil-tip.svg", x: 1065, y: 775, width: 40, height: 70, role: "drawing" },
                  tigerToolBounds,
                )}
                {renderGroupedImage(
                  { name: "tiger-drawing-arm", label: "호랑이 그림 그리는 팔", file: "tiger-drawing-arm.svg", x: 1024, y: 814, width: 52, height: 63, role: "character" },
                  tigerToolBounds,
                )}
              </span>
            </span>

            <span
              className="character-motion-group"
              data-motion="rabbit-character"
              style={layerStyle(rabbitCharacterBounds)}
            >
              {renderGroupedImage(
                { name: "character-rabbit-body-and-ladder", label: "토끼 몸통과 사다리", file: "character-rabbit-body-and-ladder.svg", x: 1621, y: 669, width: 181, height: 399, role: "character" },
                rabbitCharacterBounds,
              )}
              <span
                className="drawing-tool"
                data-motion="rabbit-drawing-tool"
                style={nestedStyle(rabbitToolBounds, rabbitCharacterBounds)}
              >
                {renderGroupedImage(
                  { name: "rabbit-pencil-shaft", label: "토끼 연필 몸통과 측면", file: "rabbit-pencil-shaft.svg", x: 1621, y: 781, width: 42, height: 65, role: "drawing" },
                  rabbitToolBounds,
                )}
                {renderGroupedImage(
                  { name: "rabbit-pencil-tip", label: "토끼 연필 촉", file: "rabbit-pencil-tip.svg", x: 1619, y: 769, width: 18, height: 21, role: "drawing" },
                  rabbitToolBounds,
                )}
                {renderGroupedImage(
                  { name: "rabbit-hand-extra", label: "토끼 그림 그리는 손", file: "rabbit-hand-extra.svg", x: 1644, y: 814, width: 55, height: 64, role: "character" },
                  rabbitToolBounds,
                )}
              </span>
            </span>

            {renderImage(
              { name: "compact-sun", label: "모바일 햇살 두들", file: "icon-partyhat.png", x: 838, y: 296, width: 182, height: 196 },
              "compact-only",
            )}

            {layers
              .filter((layer) => taglineLayers.has(layer.name))
              .map((layer) => renderImage(layer, "tagline-static"))}

            {taglineCharacters.map((character, index) => (
              <img
                className="art-layer tagline-char"
                src={assetPath(`/assets/isolated/${character.file}`)}
                alt=""
                aria-hidden="true"
                data-tagline-index={index}
                key={character.name}
                style={{
                  left: pct(character.x, 1920),
                  top: pct(character.y, 1068),
                  width: pct(character.width, 1920),
                  height: pct(character.height, 1068),
                }}
              />
            ))}
          </div>
        </div>
        <div className="hero-copy" aria-hidden="true">
          {copyLayers.map((layer) => (
            <img
              key={`copy-${layer.name}`}
              className={`copy-layer${taglineLayers.has(layer.name) ? " tagline-static" : ""}`}
              src={assetPath(`/assets/isolated/${layer.file}`)}
              alt=""
              aria-hidden="true"
              data-copy-layer={layer.name}
              style={copyStyle(layer)}
            />
          ))}

          {taglineCharacters.map((character, index) => (
            <img
              key={`copy-${character.name}`}
              className="copy-layer tagline-char"
              src={assetPath(`/assets/isolated/${character.file}`)}
              alt=""
              aria-hidden="true"
              data-tagline-index={index}
              style={copyStyle(character)}
            />
          ))}
        </div>
        <p className="sr-only">
          함께 그려가는 미래, 2027 호반그룹 신입사원 채용. 모집기간 9월 24일부터 10월 11일까지.
        </p>
      </section>
    </main>
  );
}
