import { PixelGrid, addOutline, mulberry32, hashString, SPRITE_W, SPRITE_H } from "./pixel.js";
import { resolvePalette, PALETTE_TOKEN } from "./palette.js";
import { drawShape } from "./shapes.js";

const urlCache = new Map();
const canvasCache = new Map();

function colorFor(token, palette) {
  if (!token) return null;
  if (PALETTE_TOKEN[token]) return palette[PALETTE_TOKEN[token]];
  return token;
}

export function buildSpriteCanvas(element) {
  if (canvasCache.has(element.id)) return canvasCache.get(element.id);
  const palette = resolvePalette(element);
  const rng = mulberry32(hashString(`${element.id}:${element.shape}:${element.palette || ""}`));
  const grid = new PixelGrid(SPRITE_W, SPRITE_H);
  drawShape(grid, element, palette, rng);
  addOutline(grid);
  const canvas = document.createElement("canvas");
  canvas.width = SPRITE_W;
  canvas.height = SPRITE_H;
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = "rgba(4,10,12,0.22)";
  ctx.fillRect(7, SPRITE_H - 2, 10, 1);
  ctx.fillStyle = "rgba(4,10,12,0.12)";
  ctx.fillRect(5, SPRITE_H - 1, 14, 1);
  grid.forEach((x, y, token) => {
    const color = colorFor(token, palette);
    if (!color) return;
    ctx.fillStyle = color;
    ctx.fillRect(x, y, 1, 1);
  });
  canvasCache.set(element.id, canvas);
  return canvas;
}

export function spriteUrl(element) {
  if (urlCache.has(element.id)) return urlCache.get(element.id);
  const canvas = buildSpriteCanvas(element);
  const url = canvas.toDataURL();
  urlCache.set(element.id, url);
  return url;
}

export function spriteData(element) {
  return {
    url: spriteUrl(element),
    palette: resolvePalette(element),
  };
}

export function renderSpriteInto(canvas, element, scale = 1) {
  const source = buildSpriteCanvas(element);
  canvas.width = SPRITE_W * scale;
  canvas.height = SPRITE_H * scale;
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
}
