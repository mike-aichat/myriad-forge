import { drawSpark } from "./pixel.js";

const SHAPES = {};

function eye(g, x, y, tint = "k") {
  g.set(x, y, tint);
  g.set(x, y - 1, "w");
}

function speckle(g, rng, color = "h", tries = 18, count = 4) {
  let placed = 0;
  let attempt = 0;
  while (placed < count && attempt < tries * 4) {
    attempt += 1;
    const x = 3 + Math.floor(rng() * 18);
    const y = 3 + Math.floor(rng() * 18);
    const cell = g.get(x, y);
    if (cell === "b" || cell === "l" || cell === "a") {
      g.set(x, y, color);
      placed += 1;
    }
  }
}

SHAPES.flame = (g, p, rng) => {
  g.poly([[12, 2], [16, 8], [15, 11], [18, 14], [17, 19], [13, 21], [8, 20], [5, 16], [6, 11], [9, 13], [9, 8]], "b");
  g.poly([[12, 6], [14, 11], [13, 14], [15, 17], [13, 19], [10, 19], [8, 16], [9, 13], [10, 15]], "l");
  g.poly([[12, 10], [13, 13], [12, 17], [10, 16], [10, 13]], "h");
  g.poly([[13, 17], [14, 18], [12, 20], [10, 19]], "a");
  g.noOutline = false;
  if (rng() > 0.5) drawSpark(g, 18, 6, "h", "a");
};

SHAPES.droplet = (g, p) => {
  g.disc(12, 15, 5, "b");
  g.poly([[12, 3], [8, 12], [16, 12]], "b");
  g.ellipse(10, 14, 2, 3, "l");
  g.set(9, 12, "h");
  g.set(10, 13, "h");
  g.set(15, 18, "d");
};

SHAPES.rock = (g, p, rng) => {
  g.poly([[3, 17], [5, 11], [9, 7], [15, 6], [20, 11], [21, 17], [17, 21], [7, 21]], "b");
  g.poly([[5, 12], [9, 8], [14, 7], [12, 11], [8, 14]], "l");
  g.poly([[15, 7], [20, 12], [18, 15], [14, 12]], "l");
  g.poly([[8, 14], [12, 11], [18, 15], [17, 20], [9, 20]], "d");
  g.line(10, 13, 13, 17, "s");
  g.line(13, 17, 12, 20, "s");
  speckle(g, rng, "h", 10, 2);
};

SHAPES.wind = (g, p, rng) => {
  g.thickLine(3, 8, 12, 5, "b", 2);
  g.thickLine(12, 5, 18, 7, "b", 2);
  g.thickLine(5, 12, 14, 10, "l", 2);
  g.thickLine(14, 10, 20, 13, "l", 2);
  g.thickLine(3, 17, 10, 16, "b", 2);
  g.thickLine(10, 16, 15, 19, "b", 2);
  g.set(18, 5, "h");
  g.set(4, 20, "a");
  g.noOutline = true;
  speckle(g, rng, "h", 8, 2);
};

SHAPES.orb = (g, p, rng) => {
  g.disc(12, 12, 8, "b");
  g.disc(10, 10, 4, "l");
  g.disc(9, 9, 2, "h");
  g.ellipse(12, 17, 6, 3, "d");
  g.set(9, 15, "a");
  g.set(16, 8, "a");
  speckle(g, rng, "h", 6, 2);
};

SHAPES.cloud = (g, p, rng) => {
  g.disc(7, 15, 4, "b");
  g.disc(12, 12, 6, "b");
  g.disc(17, 15, 4, "b");
  g.rect(5, 15, 14, 4, "b");
  g.disc(10, 12, 3, "l");
  g.disc(15, 11, 2, "h");
  g.rect(6, 18, 12, 2, "d");
  g.set(8, 18, "a");
  speckle(g, rng, "h", 8, 2);
};

SHAPES.pool = (g, p, rng) => {
  g.ellipse(12, 16, 9, 4, "b");
  g.ellipse(12, 15, 7, 2, "l");
  g.ellipse(12, 19, 8, 2, "d");
  g.set(7, 15, "h");
  g.set(8, 14, "h");
  g.set(17, 16, "a");
  speckle(g, rng, "a", 10, 2);
};

SHAPES.dune = (g, p, rng) => {
  g.poly([[2, 20], [8, 13], [12, 15], [17, 8], [22, 20]], "b");
  g.poly([[8, 13], [12, 15], [9, 20], [3, 20]], "l");
  g.poly([[17, 8], [22, 20], [15, 20], [14, 14]], "d");
  g.line(11, 16, 18, 19, "s");
  g.set(17, 7, "h");
  g.ellipse(12, 21, 9, 1, "d");
  speckle(g, rng, "h", 8, 2);
};

SHAPES.rain = (g, p, rng) => {
  for (let i = 0; i < 4; i += 1) {
    const x = 5 + i * 4;
    const y = 6 + (i % 2) * 4;
    g.line(x, y, x - 2, y + 4, "b");
    g.line(x + 1, y, x - 1, y + 4, "l");
    g.set(x - 2, y + 5, "h");
    g.set(x, y, "h");
  }
  speckle(g, rng, "h", 8, 2);
};

SHAPES.snow = (g, p) => {
  g.noOutline = true;
  const cx = 12;
  const cy = 12;
  for (let a = 0; a < 6; a += 1) {
    const rad = (a * Math.PI) / 3;
    const x = Math.round(cx + Math.cos(rad) * 8);
    const y = Math.round(cy + Math.sin(rad) * 8);
    g.thickLine(cx, cy, x, y, "l", 2);
    g.set(Math.round(cx + Math.cos(rad) * 6), Math.round(cy + Math.sin(rad) * 6), "h");
    const bx = Math.round(cx + Math.cos(rad) * 5 + Math.cos(rad + 1.1) * 2);
    const by = Math.round(cy + Math.sin(rad) * 5 + Math.sin(rad + 1.1) * 2);
    g.set(bx, by, "b");
  }
  g.disc(12, 12, 1, "w");
  g.set(12, 12, "h");
};

SHAPES.bolt = (g, p) => {
  g.poly([[14, 2], [7, 12], [11, 12], [8, 21], [18, 8], [13, 8], [17, 2]], "b");
  g.poly([[13, 4], [10, 11], [13, 11], [11, 17], [15, 9], [12, 9], [15, 4]], "h");
  g.line(11, 13, 10, 17, "l");
};

SHAPES.wave = (g, p, rng) => {
  g.poly([[2, 18], [6, 13], [10, 15], [14, 10], [19, 13], [22, 16], [21, 21], [3, 21]], "b");
  g.disc(8, 13, 3, "l");
  g.disc(15, 12, 3, "l");
  g.poly([[5, 15], [8, 11], [11, 14], [9, 17], [6, 17]], "h");
  g.line(15, 9, 18, 6, "u");
  g.line(13, 8, 15, 5, "u");
  g.poly([[17, 16], [22, 18], [21, 21], [15, 21]], "d");
  g.set(7, 10, "w");
  g.set(14, 9, "w");
  speckle(g, rng, "h", 10, 2);
};

SHAPES.crystal = (g, p, rng) => {
  g.poly([[9, 21], [5, 12], [9, 4], [13, 7], [14, 21]], "b");
  g.poly([[14, 21], [14, 8], [19, 5], [21, 15], [18, 21]], "d");
  g.poly([[9, 4], [13, 7], [12, 19], [9, 21], [7, 12]], "l");
  g.poly([[9, 6], [11, 8], [10, 14], [8, 11]], "h");
  g.line(15, 9, 18, 12, "l");
  g.line(16, 15, 19, 18, "l");
  g.set(9, 22, "s");
  speckle(g, rng, "h", 6, 2);
};

SHAPES.cave = (g, p) => {
  g.poly([[2, 21], [5, 10], [10, 4], [16, 7], [21, 14], [22, 21]], "b");
  g.poly([[5, 10], [10, 4], [15, 7], [12, 10], [8, 14]], "l");
  g.ellipse(12, 19, 5, 6, "k");
  g.ellipse(12, 21, 6, 4, "k");
  g.set(8, 13, "h");
  g.set(16, 12, "a");
  g.line(17, 17, 19, 21, "d");
};

SHAPES.mountain = (g, p, rng) => {
  g.poly([[2, 21], [8, 8], [12, 13], [17, 3], [22, 21]], "b");
  g.poly([[8, 8], [12, 13], [9, 21], [2, 21]], "l");
  g.poly([[17, 3], [22, 21], [14, 21], [13, 10]], "d");
  g.poly([[15, 7], [17, 3], [19, 7], [17, 9]], "w");
  g.poly([[7, 11], [8, 8], [10, 12]], "h");
  g.line(12, 13, 17, 14, "s");
  speckle(g, rng, "h", 8, 2);
};

SHAPES.volcano = (g, p, rng) => {
  g.poly([[2, 21], [7, 12], [9, 7], [15, 7], [18, 12], [22, 21]], "b");
  g.poly([[2, 21], [7, 12], [9, 7], [11, 9], [9, 21]], "l");
  g.poly([[17, 10], [22, 21], [12, 21], [13, 9]], "d");
  g.ellipse(12, 7, 4, 2, "k");
  g.poly([[10, 6], [12, 8], [13, 6], [15, 5], [16, 8], [14, 10], [11, 9], [9, 9]], "a");
  g.line(13, 10, 14, 18, "a");
  g.line(12, 11, 11, 17, "u");
  g.disc(16, 4, 1, "l");
  g.disc(8, 3, 1, "l");
  speckle(g, rng, "a", 6, 2);
};

SHAPES.arc = (g, p) => {
  g.noOutline = true;
  const bands = ["#d95f4c", "#e7a65c", "#e8d27a", "#76b88b", "#6fa9c9", "#9b86c9"];
  for (let band = 0; band < bands.length; band += 1) {
    const radius = 10 - band;
    for (let a = 205; a <= 335; a += 2) {
      const rad = (a * Math.PI) / 180;
      const x = 12 + Math.cos(rad) * radius;
      const y = 19 + Math.sin(rad) * radius;
      g.set(x, y, "o");
      g.set(x, y - 1, "o");
      g.set(x, y + 1, "o");
      g.set(x, y, band % 2 ? "a" : "h");
    }
  }
  // Paint the colored bands directly over the dark arc using per-cell colors.
  for (let band = 0; band < bands.length; band += 1) {
    const radius = 10 - band;
    for (let a = 205; a <= 335; a += 2) {
      const rad = (a * Math.PI) / 180;
      g.set(12 + Math.cos(rad) * radius, 19 + Math.sin(rad) * radius, bands[band]);
    }
  }
};

SHAPES.comet = (g, p, rng) => {
  g.thickLine(3, 20, 10, 11, "u", 2);
  g.thickLine(5, 21, 12, 12, "a", 2);
  g.line(2, 17, 7, 12, "l");
  g.disc(15, 8, 5, "b");
  g.disc(14, 7, 3, "l");
  g.disc(14, 7, 1, "h");
  g.set(18, 9, "a");
  g.set(12, 11, "a");
  speckle(g, rng, "h", 8, 2);
};

SHAPES.coral = (g, p, rng) => {
  g.thickLine(7, 21, 7, 12, "b", 2);
  g.thickLine(7, 15, 4, 10, "b", 2);
  g.thickLine(7, 13, 10, 8, "b", 2);
  g.thickLine(7, 12, 5, 6, "b", 2);
  g.thickLine(16, 21, 16, 13, "a", 2);
  g.thickLine(16, 16, 19, 11, "a", 2);
  g.thickLine(16, 14, 13, 9, "a", 2);
  g.thickLine(16, 13, 18, 7, "a", 2);
  g.disc(4, 9, 2, "l");
  g.disc(10, 7, 2, "u");
  g.disc(18, 6, 2, "h");
  g.disc(9, 21, 4, "d");
  g.disc(17, 21, 4, "s");
  speckle(g, rng, "h", 8, 2);
};

SHAPES.tree = (g, p, rng) => {
  g.rect(10, 13, 4, 8, "d");
  g.rect(12, 14, 2, 7, "l");
  g.line(11, 18, 8, 21, "d");
  g.line(13, 18, 16, 21, "d");
  g.disc(8, 10, 4, "b");
  g.disc(15, 9, 5, "b");
  g.disc(12, 7, 4, "b");
  g.disc(12, 13, 4, "b");
  g.disc(8, 9, 3, "l");
  g.disc(13, 6, 2, "l");
  g.disc(16, 9, 2, "h");
  g.disc(11, 12, 3, "d");
  g.set(10, 8, "h");
  g.set(6, 12, "a");
  speckle(g, rng, "h", 10, 3);
};

SHAPES.star = (g, p) => {
  const points = [];
  const cx = 12;
  const cy = 12;
  for (let i = 0; i < 10; i += 1) {
    const angle = -Math.PI / 2 + (i * Math.PI) / 5;
    const radius = i % 2 === 0 ? 9 : 4;
    points.push([cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius]);
  }
  g.poly(points, "b");
  g.poly([[12, 4], [13, 11], [9, 12], [12, 8], [10, 6]], "l");
  g.set(12, 9, "h");
  g.set(12, 11, "h");
  g.set(15, 13, "d");
};

SHAPES.sun = (g, p) => {
  for (let a = 0; a < 16; a += 1) {
    const rad = (a * Math.PI) / 8;
    const x = 12 + Math.cos(rad) * 10;
    const y = 12 + Math.sin(rad) * 10;
    g.set(x, y, "a");
    g.set(12 + Math.cos(rad) * 9, 12 + Math.sin(rad) * 9, "h");
  }
  g.disc(12, 12, 6, "b");
  g.disc(10, 10, 4, "l");
  g.disc(9, 9, 2, "h");
  g.set(15, 15, "d");
};

SHAPES.moon = (g, p) => {
  g.disc(12, 12, 8, "b");
  g.eraseDisc(16, 9, 6);
  g.disc(8, 9, 2, "l");
  g.disc(10, 15, 1, "d");
  g.set(6, 13, "h");
  g.set(8, 16, "h");
  g.set(18, 17, "a");
  drawSpark(g, 18, 5, "h", "a");
};

SHAPES.planet = (g, p, rng) => {
  g.ellipse(12, 13, 10, 3, "a");
  g.disc(12, 12, 7, "b");
  g.disc(10, 10, 3, "l");
  g.ellipse(12, 17, 5, 2, "d");
  g.line(6, 11, 10, 13, "d");
  g.line(13, 8, 17, 11, "d");
  g.set(9, 8, "h");
  g.set(12, 16, "a");
  g.ellipse(12, 13, 10, 3, "u");
  speckle(g, rng, "h", 8, 2);
};

SHAPES.galaxy = (g, p, rng) => {
  g.noOutline = true;
  for (let i = 0; i < 3; i += 1) {
    for (let t = 0; t < 26; t += 1) {
      const angle = t * 0.36 + i * 2.1;
      const radius = 2 + t * 0.26;
      const x = 12 + Math.cos(angle) * radius;
      const y = 12 + Math.sin(angle) * radius * 0.7;
      g.set(x, y, i === 1 ? "a" : "l");
      if (t % 4 === 0) g.set(x + 1, y, "u");
    }
  }
  g.disc(12, 12, 3, "b");
  g.disc(12, 12, 2, "h");
  for (let i = 0; i < 8; i += 1) {
    g.set(3 + Math.floor(rng() * 18), 3 + Math.floor(rng() * 18), "w");
  }
};

SHAPES.crown = (g, p) => {
  g.poly([[3, 18], [4, 8], [8, 12], [12, 5], [16, 12], [20, 8], [21, 18]], "b");
  g.rect(4, 17, 17, 4, "b");
  g.rect(5, 19, 15, 2, "d");
  g.poly([[5, 15], [5, 10], [8, 13], [7, 16]], "l");
  g.set(12, 11, "a");
  g.set(6, 18, "a");
  g.set(12, 18, "u");
  g.set(18, 18, "a");
  g.set(12, 5, "h");
};

SHAPES.hourglass = (g, p) => {
  g.rect(6, 3, 12, 2, "d");
  g.rect(6, 19, 12, 2, "d");
  g.poly([[8, 5], [16, 5], [12, 12]], "l");
  g.poly([[12, 12], [16, 19], [8, 19]], "l");
  g.poly([[9, 6], [15, 6], [12, 10]], "a");
  g.poly([[12, 15], [16, 18], [8, 18]], "a");
  g.rect(10, 12, 4, 1, "d");
  g.line(8, 5, 12, 12, "l");
  g.line(12, 12, 8, 19, "l");
  g.set(13, 6, "h");
  g.set(14, 17, "u");
};

SHAPES.heart = (g, p) => {
  g.disc(8, 9, 4, "b");
  g.disc(16, 9, 4, "b");
  g.poly([[4, 10], [12, 21], [20, 10], [16, 6], [12, 10], [8, 6]], "b");
  g.disc(8, 9, 2, "l");
  g.set(7, 7, "h");
  g.set(16, 16, "d");
  g.line(12, 12, 15, 16, "d");
};

SHAPES.eye = (g, p) => {
  g.poly([[2, 12], [8, 6], [16, 6], [22, 12], [16, 18], [8, 18]], "b");
  g.poly([[5, 12], [9, 8], [15, 8], [19, 12], [15, 16], [9, 16]], "w");
  g.disc(12, 12, 4, "a");
  g.disc(12, 12, 2, "k");
  g.set(10, 10, "h");
  g.set(14, 14, "u");
  g.set(6, 11, "l");
};

SHAPES.book = (g, p) => {
  g.poly([[3, 6], [12, 4], [21, 6], [19, 20], [12, 18], [5, 20]], "b");
  g.poly([[5, 8], [12, 6], [12, 17], [9, 19]], "l");
  g.poly([[12, 6], [19, 8], [16, 19], [12, 17]], "l");
  g.line(12, 6, 12, 18, "s");
  g.rect(6, 13, 4, 1, "a");
  g.rect(7, 15, 3, 1, "a");
  g.set(18, 6, "h");
  g.set(19, 8, "d");
};

SHAPES.potion = (g, p, rng) => {
  g.rect(10, 3, 4, 2, "d");
  g.rect(10, 5, 4, 4, "l");
  g.disc(12, 15, 6, "b");
  g.rect(8, 10, 8, 3, "b");
  g.ellipse(12, 17, 5, 4, "a");
  g.disc(10, 16, 2, "u");
  g.set(9, 14, "h");
  g.set(15, 15, "h");
  g.set(14, 18, "u");
  g.set(11, 12, "l");
  speckle(g, rng, "h", 8, 2);
};

SHAPES.rune = (g, p, rng) => {
  g.poly([[12, 2], [20, 7], [19, 19], [12, 22], [5, 19], [4, 7]], "d");
  g.poly([[12, 4], [18, 8], [17, 18], [12, 20], [7, 18], [6, 8]], "b");
  g.line(12, 7, 12, 17, "a");
  g.line(8, 10, 12, 7, "u");
  g.line(16, 10, 12, 7, "u");
  g.line(9, 15, 12, 13, "a");
  g.line(15, 15, 12, 13, "a");
  g.set(12, 17, "h");
  g.set(6, 7, "l");
  speckle(g, rng, "a", 10, 2);
};

SHAPES.cauldron = (g, p, rng) => {
  g.ellipse(12, 12, 8, 5, "b");
  g.poly([[4, 12], [6, 20], [18, 20], [20, 12]], "b");
  g.ellipse(12, 12, 6, 3, "a");
  g.ellipse(12, 13, 5, 2, "u");
  g.rect(8, 19, 2, 2, "d");
  g.rect(14, 19, 2, 2, "d");
  g.line(4, 13, 2, 16, "d");
  g.line(20, 13, 22, 16, "d");
  g.set(9, 12, "h");
  g.set(15, 12, "h");
  for (let i = 0; i < 3; i += 1) {
    const x = 8 + Math.floor(rng() * 8);
    g.set(x, 8 - i, "l");
    g.set(x + 1, 7 - i, "l");
  }
};

SHAPES.ingot = (g, p) => {
  g.poly([[4, 16], [8, 8], [20, 8], [17, 16]], "b");
  g.poly([[8, 8], [20, 8], [18, 11], [6, 11]], "l");
  g.poly([[4, 16], [17, 16], [19, 20], [6, 20]], "d");
  g.poly([[6, 11], [18, 11], [17, 16], [4, 16]], "b");
  g.line(8, 13, 15, 13, "h");
  g.line(7, 15, 13, 15, "a");
  g.set(17, 9, "h");
};

SHAPES.gem = (g, p) => {
  g.poly([[7, 4], [17, 4], [21, 10], [12, 21], [3, 10]], "b");
  g.poly([[7, 4], [12, 4], [12, 21], [3, 10]], "l");
  g.poly([[12, 4], [17, 4], [21, 10], [12, 21]], "d");
  g.poly([[9, 7], [11, 7], [8, 13], [6, 10]], "h");
  g.line(12, 6, 12, 17, "a");
  g.set(16, 7, "h");
  g.set(10, 16, "u");
};

SHAPES.seed = (g, p) => {
  g.ellipse(12, 15, 5, 7, "b");
  g.ellipse(10, 13, 2, 4, "l");
  g.line(12, 8, 14, 4, "d");
  g.disc(16, 5, 2, "a");
  g.set(15, 4, "u");
  g.set(9, 12, "h");
  g.line(9, 17, 10, 19, "d");
};

SHAPES.leaf = (g, p) => {
  g.poly([[4, 17], [7, 8], [15, 4], [20, 9], [14, 17], [8, 20]], "b");
  g.poly([[6, 15], [8, 9], [14, 5], [16, 8], [10, 15]], "l");
  g.line(6, 19, 17, 7, "d");
  g.line(10, 14, 15, 13, "d");
  g.line(12, 11, 17, 10, "d");
  g.set(15, 6, "h");
  g.set(8, 18, "a");
};

SHAPES.flower = (g, p, rng) => {
  g.line(12, 14, 12, 21, "d");
  g.line(12, 17, 8, 19, "d");
  g.line(12, 18, 16, 20, "d");
  for (let i = 0; i < 6; i += 1) {
    const a = (i * Math.PI) / 3;
    g.disc(12 + Math.cos(a) * 4, 9 + Math.sin(a) * 4, 3, "b");
  }
  g.disc(12, 9, 3, "l");
  g.disc(12, 9, 2, "a");
  g.set(11, 8, "h");
  g.set(13, 10, "u");
  speckle(g, rng, "h", 8, 2);
};

SHAPES.moss = (g, p, rng) => {
  g.poly([[3, 19], [5, 13], [9, 10], [15, 8], [20, 13], [21, 19]], "b");
  g.disc(8, 13, 2, "l");
  g.disc(13, 10, 2, "l");
  g.disc(16, 15, 2, "a");
  g.rect(4, 18, 17, 2, "d");
  speckle(g, rng, "h", 20, 4);
};

SHAPES.mushroom = (g, p) => {
  g.rect(9, 12, 6, 8, "l");
  g.rect(11, 15, 2, 5, "d");
  g.ellipse(12, 9, 8, 5, "b");
  g.ellipse(11, 8, 5, 3, "l");
  g.set(7, 10, "w");
  g.set(14, 7, "w");
  g.set(16, 11, "w");
  g.set(10, 18, "d");
  g.set(9, 19, "d");
};

SHAPES.microbe = (g, p, rng) => {
  g.disc(12, 12, 6, "b");
  g.disc(10, 10, 3, "l");
  for (let i = 0; i < 10; i += 1) {
    const a = (i * Math.PI) / 5;
    g.line(12 + Math.cos(a) * 6, 12 + Math.sin(a) * 6, 12 + Math.cos(a) * 8, 12 + Math.sin(a) * 8, "a");
  }
  g.set(10, 12, "k");
  g.set(14, 12, "k");
  g.set(11, 9, "h");
  g.set(15, 16, "d");
  speckle(g, rng, "u", 8, 2);
};

SHAPES.worm = (g, p) => {
  for (let i = 0; i < 5; i += 1) {
    g.disc(4 + i * 4, 16 - Math.sin(i * 1.2) * 3, 3, i % 2 ? "l" : "b");
  }
  g.set(4, 16, "d");
  g.set(20, 14, "k");
  g.set(21, 13, "w");
  g.line(17, 19, 20, 21, "a");
};

SHAPES.bug = (g, p, rng, el) => {
  const bodyColor = el.motif === "shell" ? "d" : "b";
  for (let i = 0; i < 3; i += 1) {
    g.line(7 + i * 4, 17, 5 + i * 4, 21, "d");
    g.line(7 + i * 4, 11, 5 + i * 4, 8, "d");
  }
  g.ellipse(12, 14, 6, 7, bodyColor);
  g.disc(12, 8, 4, "b");
  g.line(10, 5, 8, 2, "d");
  g.line(14, 5, 16, 2, "d");
  g.ellipse(9, 13, 2, 4, "l");
  g.set(10, 8, "k");
  g.set(14, 8, "k");
  g.set(10, 7, "w");
  g.set(14, 7, "w");
  if (el.motif === "wings") {
    g.ellipse(5, 11, 4, 3, "u");
    g.ellipse(19, 11, 4, 3, "u");
  }
  if (el.motif === "shell") {
    g.line(12, 8, 12, 20, "s");
  }
  speckle(g, rng, "h", 10, 2);
};

SHAPES.spider = (g, p) => {
  g.noOutline = false;
  g.disc(12, 13, 5, "b");
  g.disc(12, 8, 3, "d");
  for (let i = 0; i < 4; i += 1) {
    g.line(8, 11 + i, 2, 8 + i * 2, "d");
    g.line(16, 11 + i, 22, 8 + i * 2, "d");
  }
  g.set(10, 8, "w");
  g.set(14, 8, "w");
  g.set(10, 9, "k");
  g.set(14, 9, "k");
  g.set(12, 12, "a");
  g.line(9, 17, 6, 21, "d");
  g.line(15, 17, 18, 21, "d");
};

SHAPES.fish = (g, p) => {
  g.ellipse(12, 13, 7, 5, "b");
  g.poly([[19, 13], [23, 8], [22, 17]], "d");
  g.poly([[8, 9], [12, 6], [14, 9]], "d");
  g.ellipse(10, 12, 4, 2, "l");
  g.set(9, 12, "k");
  g.set(9, 11, "w");
  g.ellipse(12, 17, 3, 2, "l");
  g.line(12, 11, 15, 12, "a");
  g.set(18, 11, "a");
};

SHAPES.bird = (g, p, rng, el) => {
  const owl = el.shape === "owl";
  const peacock = el.shape === "peacock";
  const penguin = el.shape === "penguin";
  const parrot = el.shape === "parrot";
  const eagle = el.shape === "eagle";
  g.ellipse(12, 13, 5, 6, "b");
  g.disc(14, 7, 4, "b");
  if (peacock) {
    for (let i = 0; i < 5; i += 1) {
      const a = -0.8 + i * 0.4;
      g.ellipse(12 + Math.cos(a) * 8, 14 + Math.sin(a) * 5, 3, 5, i % 2 ? "a" : "u");
      g.set(12 + Math.cos(a) * 10, 14 + Math.sin(a) * 6, "h");
    }
  }
  g.poly([[18, 7], [22, 9], [18, 10]], "a");
  g.ellipse(8, 13, 3, 5, "l");
  if (!penguin) {
    g.poly([[6, 14], [2, 11], [7, 18]], "d");
    g.poly([[16, 12], [20, 8], [18, 16]], "l");
  }
  if (eagle) {
    g.poly([[15, 9], [21, 11], [18, 14]], "l");
  }
  g.set(14, 6, "k");
  g.set(13, 6, "w");
  g.line(11, 19, 10, 21, "d");
  g.line(14, 19, 15, 21, "d");
  if (owl) {
    g.disc(12, 7, 2, "w");
    g.disc(16, 7, 2, "w");
    g.set(12, 7, "k");
    g.set(16, 7, "k");
  }
  if (parrot) {
    g.set(17, 6, "a");
    g.set(18, 6, "h");
  }
  speckle(g, rng, "h", 8, 2);
};

SHAPES.beast = (g, p, rng, el) => {
  const motif = el.motif;
  g.ellipse(12, 13, 7, 4, "b");
  g.disc(17, 10, 4, "b");
  g.poly([[14, 8], [16, 5], [17, 9]], "d");
  g.poly([[19, 8], [21, 5], [21, 10]], "d");
  g.rect(6, 15, 2, 6, "d");
  g.rect(10, 16, 2, 5, "d");
  g.rect(15, 16, 2, 5, "d");
  g.rect(18, 15, 2, 6, "d");
  g.ellipse(11, 11, 4, 2, "l");
  g.poly([[4, 11], [1, 7], [6, 14]], "d");
  g.set(19, 9, "k");
  g.set(18, 9, "w");
  g.set(21, 11, "k");
  if (motif === "mane") {
    for (let i = 0; i < 5; i += 1) {
      g.line(17 + (i % 2), 6 + i, 21 + (i % 3), 5 + i, "h");
    }
  }
  if (motif === "horn") {
    g.line(15, 7, 13, 3, "h");
    g.line(20, 7, 22, 3, "h");
  }
  if (motif === "stripes") {
    for (let i = 0; i < 3; i += 1) g.line(9 + i * 3, 9, 8 + i * 3, 15, "d");
  }
  if (motif === "wool") {
    for (let i = 0; i < 4; i += 1) g.disc(7 + i * 3, 10, 2, "l");
  }
  if (motif === "snout") {
    g.set(21, 12, "a");
    g.set(22, 11, "a");
  }
  if (motif === "patch") {
    g.disc(17, 8, 2, "k");
    g.disc(10, 13, 2, "w");
  }
  speckle(g, rng, "h", 10, 2);
};

SHAPES.human = (g, p, rng, el) => {
  g.disc(12, 6, 3, "b");
  g.rect(10, 9, 5, 7, "b");
  g.rect(8, 10, 2, 6, "l");
  g.rect(15, 10, 2, 6, "l");
  g.rect(9, 16, 3, 5, "d");
  g.rect(13, 16, 3, 5, "d");
  g.set(11, 6, "k");
  g.set(14, 6, "k");
  g.set(12, 10, "a");
  if (el.motif === "crown") {
    g.poly([[8, 3], [9, 0], [11, 2], [12, -1], [13, 2], [15, 0], [16, 3]], "a");
  }
  if (el.motif === "halo") {
    g.ring(12, 1, 4, "h");
  }
  if (el.shape === "angel") {
    g.poly([[8, 10], [2, 6], [4, 13], [8, 15]], "u");
    g.poly([[16, 10], [22, 6], [20, 13], [16, 15]], "u");
  }
  if (el.shape === "demon") {
    g.line(9, 3, 7, 0, "a");
    g.line(15, 3, 17, 0, "a");
    g.poly([[8, 11], [2, 8], [5, 15]], "d");
    g.poly([[16, 11], [22, 8], [19, 15]], "d");
  }
  if (el.shape === "reaper") {
    g.rect(8, 3, 9, 5, "d");
    g.set(11, 6, "a");
    g.set(14, 6, "a");
    g.line(18, 8, 22, 21, "d");
    g.line(20, 8, 24, 19, "d");
  }
  if (el.shape === "dance") {
    g.line(8, 12, 3, 9, "l");
    g.line(16, 12, 21, 8, "l");
    g.line(15, 17, 20, 20, "l");
  }
  speckle(g, rng, "h", 8, 1);
};

SHAPES.skull = (g, p) => {
  g.disc(12, 9, 6, "b");
  g.rect(7, 10, 11, 6, "b");
  g.poly([[8, 16], [9, 21], [15, 21], [16, 16]], "b");
  g.disc(9, 9, 2, "k");
  g.disc(15, 9, 2, "k");
  g.set(12, 12, "k");
  g.line(9, 18, 9, 20, "d");
  g.line(12, 18, 12, 20, "d");
  g.line(15, 18, 15, 20, "d");
  g.line(8, 7, 10, 5, "l");
  g.set(13, 5, "h");
};

SHAPES.gear = (g, p) => {
  g.disc(12, 12, 8, "b");
  g.eraseDisc(12, 12, 3);
  for (let i = 0; i < 8; i += 1) {
    const a = (i * Math.PI) / 4;
    g.rect(12 + Math.cos(a) * 8 - 2, 12 + Math.sin(a) * 8 - 2, 4, 4, "b");
  }
  g.ring(12, 12, 8, "d");
  g.ring(12, 12, 4, "d");
  g.set(9, 8, "l");
  g.set(8, 9, "h");
  g.set(16, 15, "a");
};

SHAPES.tool = (g, p) => {
  g.rect(11, 10, 3, 11, "d");
  g.poly([[5, 5], [15, 5], [19, 9], [17, 11], [12, 8], [7, 11], [5, 9]], "b");
  g.poly([[6, 6], [14, 6], [16, 8], [13, 9], [7, 8]], "l");
  g.line(12, 11, 12, 20, "l");
  g.set(16, 6, "h");
};

SHAPES.building = (g, p, rng, el) => {
  const isHouse = el.shape === "house";
  const isTower = el.shape === "tower" || el.shape === "empire";
  const isCity = el.shape === "city";
  const width = isTower ? 10 : 14;
  const x = 12 - Math.floor(width / 2);
  const baseY = isTower ? 5 : 8;
  g.rect(x, baseY, width, 21 - baseY, "b");
  g.rect(x, baseY, 3, 21 - baseY, "l");
  g.rect(x + width - 3, baseY, 3, 21 - baseY, "d");
  if (isHouse) {
    g.poly([[x - 2, baseY], [12, 2], [x + width + 2, baseY]], "a");
    g.poly([[x - 2, baseY], [12, 2], [12, baseY]], "l");
  } else if (!isCity) {
    for (let i = 0; i < 3; i += 1) g.rect(x + 1 + i * 4, baseY - 2, 2, 2, "b");
  }
  if (isCity) {
    g.rect(x - 4, 12, 4, 9, "d");
    g.rect(x + width, 10, 4, 11, "d");
    g.rect(x - 3, 13, 2, 2, "h");
    g.rect(x + width + 1, 12, 2, 2, "h");
  }
  for (let i = 0; i < 2; i += 1) {
    for (let j = 0; j < 2; j += 1) {
      const lit = rng() > 0.3;
      g.rect(x + 4 + i * 4, baseY + 4 + j * 4, 2, 2, lit ? "h" : "s");
    }
  }
  g.rect(x + width - 4, 15, 3, 6, "d");
  g.set(x + width - 3, 18, "a");
};

SHAPES.sword = (g, p, rng, el) => {
  const spear = el.shape === "spear" || el.shape === "arrow";
  g.poly([[11, 2], [14, 2], [14, 13], [11, 13]], "b");
  g.poly([[12, 2], [12, 12], [11, 13], [11, 3]], "h");
  g.line(13, 4, 13, 11, "l");
  g.rect(6, 13, 13, 2, "a");
  g.rect(11, 15, 3, 5, "d");
  g.disc(12, 21, 2, "a");
  if (spear) {
    g.poly([[12, 1], [16, 6], [12, 10], [8, 6]], "b");
    g.rect(11, 8, 3, 13, "d");
    g.line(12, 3, 12, 8, "h");
  }
};

SHAPES.shield = (g, p) => {
  g.poly([[4, 4], [20, 4], [20, 12], [12, 22], [4, 12]], "b");
  g.poly([[6, 6], [12, 6], [12, 19], [6, 12]], "l");
  g.poly([[12, 6], [18, 6], [18, 12], [12, 19]], "d");
  g.line(12, 6, 12, 18, "a");
  g.line(7, 10, 17, 10, "a");
  g.set(12, 4, "h");
  g.set(8, 7, "h");
};

SHAPES.key = (g, p) => {
  g.ring(8, 8, 4, "b");
  g.ring(8, 8, 2, "d");
  g.line(11, 11, 20, 20, "b");
  g.line(12, 12, 21, 21, "l");
  g.rect(17, 16, 4, 2, "b");
  g.rect(15, 19, 4, 2, "b");
  g.set(8, 4, "h");
  g.set(20, 20, "a");
};

SHAPES.shell = (g, p) => {
  g.poly([[2, 17], [6, 5], [18, 5], [22, 17]], "b");
  g.poly([[5, 16], [8, 8], [16, 8], [19, 16]], "l");
  g.line(5, 16, 19, 16, "d");
  for (let i = 0; i < 4; i += 1) {
    g.line(9 + i * 2, 8, 7 + i * 3, 15, "a");
  }
  g.ellipse(12, 18, 8, 2, "d");
  g.set(8, 7, "h");
};

SHAPES.rocket = (g, p) => {
  g.poly([[12, 2], [17, 8], [17, 17], [12, 20], [7, 17], [7, 8]], "b");
  g.poly([[12, 2], [14, 8], [12, 17], [10, 8]], "l");
  g.poly([[7, 13], [3, 20], [8, 18]], "d");
  g.poly([[17, 13], [21, 20], [16, 18]], "d");
  g.disc(12, 10, 2, "a");
  g.set(11, 9, "h");
  g.poly([[9, 19], [12, 23], [15, 19]], "a");
  g.poly([[10, 20], [12, 23], [14, 20]], "h");
};

SHAPES.robot = (g, p) => {
  g.rect(6, 7, 12, 10, "b");
  g.rect(8, 3, 8, 5, "l");
  g.rect(4, 10, 2, 5, "d");
  g.rect(18, 10, 2, 5, "d");
  g.rect(9, 17, 2, 4, "d");
  g.rect(13, 17, 2, 4, "d");
  g.set(10, 5, "k");
  g.set(14, 5, "k");
  g.set(10, 4, "w");
  g.set(14, 4, "w");
  g.line(12, 1, 12, 3, "a");
  g.disc(12, 1, 1, "a");
  g.rect(9, 9, 6, 4, "s");
  g.set(10, 10, "h");
  g.set(13, 12, "a");
};

SHAPES.circuit = (g, p) => {
  g.rect(3, 5, 18, 14, "d");
  g.rect(4, 6, 16, 12, "b");
  g.line(6, 9, 11, 9, "a");
  g.line(11, 9, 11, 15, "a");
  g.line(11, 15, 17, 15, "a");
  g.line(8, 16, 8, 12, "h");
  g.line(8, 12, 15, 12, "h");
  g.set(6, 9, "u");
  g.set(17, 15, "u");
  g.set(11, 9, "w");
  g.rect(14, 8, 3, 2, "d");
  g.rect(7, 7, 3, 2, "d");
};

SHAPES.mask = (g, p) => {
  g.poly([[4, 6], [12, 3], [20, 6], [19, 16], [12, 22], [5, 16]], "b");
  g.poly([[6, 7], [12, 5], [12, 19], [7, 15]], "l");
  g.ellipse(9, 10, 2, 1, "k");
  g.ellipse(15, 10, 2, 1, "k");
  g.poly([[9, 16], [12, 18], [15, 16], [12, 20]], "a");
  g.line(6, 14, 9, 13, "d");
  g.line(18, 14, 15, 13, "d");
};

SHAPES.bell = (g, p) => {
  g.disc(12, 13, 7, "b");
  g.rect(5, 13, 14, 5, "b");
  g.poly([[5, 18], [19, 18], [17, 20], [7, 20]], "d");
  g.disc(12, 6, 2, "l");
  g.rect(10, 2, 4, 2, "d");
  g.disc(12, 19, 2, "a");
  g.set(8, 10, "h");
  g.set(16, 14, "d");
};

SHAPES.web = (g, p) => {
  g.noOutline = true;
  for (let i = 0; i < 8; i += 1) {
    const a = (i * Math.PI) / 4;
    g.line(12, 12, 12 + Math.cos(a) * 10, 12 + Math.sin(a) * 10, "l");
  }
  for (let r = 3; r <= 9; r += 3) {
    g.ring(12, 12, r, "b");
  }
  g.disc(12, 12, 1, "a");
};

SHAPES.scales = (g, p) => {
  g.line(12, 3, 12, 20, "d");
  g.line(4, 7, 20, 7, "b");
  g.line(4, 7, 4, 13, "d");
  g.line(20, 7, 20, 13, "d");
  g.ellipse(4, 14, 4, 2, "b");
  g.ellipse(20, 14, 4, 2, "b");
  g.poly([[1, 13], [7, 13], [4, 17]], "a");
  g.poly([[17, 13], [23, 13], [20, 17]], "a");
  g.disc(12, 2, 2, "h");
  g.rect(8, 20, 9, 2, "d");
};

SHAPES.infinity = (g, p) => {
  g.noOutline = false;
  for (let i = 0; i < 360; i += 3) {
    const a = (i * Math.PI) / 180;
    const scale = 1 + Math.cos(a) * 0.0;
    const x = 12 + Math.cos(a) * 9 * scale;
    const y = 12 + Math.sin(a) * 4.5 * Math.cos(a);
    g.set(x, y, "b");
    g.set(x + Math.cos(a), y + Math.sin(a), "l");
  }
  g.disc(7, 12, 3, "b");
  g.eraseDisc(7, 12, 1);
  g.disc(17, 12, 3, "b");
  g.eraseDisc(17, 12, 1);
  g.set(6, 9, "h");
  g.set(18, 15, "a");
};

SHAPES.portal = (g, p, rng) => {
  g.ring(12, 12, 9, "b");
  g.ring(12, 12, 8, "d");
  g.ring(12, 12, 7, "a");
  g.ring(12, 12, 5, "u");
  g.disc(12, 12, 3, "s");
  g.disc(12, 12, 2, "b");
  for (let i = 0; i < 5; i += 1) {
    const a = i * 1.3;
    g.set(12 + Math.cos(a) * 4, 12 + Math.sin(a) * 4, "h");
  }
  g.set(4, 5, "h");
  g.set(20, 18, "a");
  speckle(g, rng, "h", 10, 2);
};

SHAPES.dragon = (g, p, rng) => {
  g.poly([[8, 12], [12, 8], [16, 12], [18, 18], [14, 21], [10, 19]], "b");
  g.poly([[12, 8], [18, 6], [22, 9], [21, 13], [17, 12]], "b");
  g.poly([[20, 7], [23, 8], [22, 11], [19, 11]], "b");
  g.set(21, 9, "a");
  g.poly([[10, 11], [2, 5], [5, 12], [2, 17], [10, 16]], "d");
  g.poly([[14, 11], [22, 4], [19, 12], [22, 16], [14, 16]], "u");
  g.line(10, 19, 6, 22, "d");
  g.line(14, 20, 18, 23, "d");
  g.set(20, 8, "k");
  g.set(19, 8, "w");
  for (let i = 0; i < 4; i += 1) g.set(11 + i, 10 + i, "a");
  speckle(g, rng, "h", 8, 2);
};

SHAPES.cat = (g, p) => {
  g.ellipse(12, 15, 6, 6, "b");
  g.disc(12, 8, 4, "b");
  g.poly([[8, 7], [7, 2], [11, 5]], "b");
  g.poly([[16, 7], [17, 2], [13, 5]], "b");
  g.set(10, 8, "k");
  g.set(14, 8, "k");
  g.set(10, 7, "w");
  g.set(14, 7, "w");
  g.set(12, 10, "a");
  g.line(18, 16, 21, 12, "b");
  g.line(21, 12, 20, 8, "b");
  g.line(9, 15, 9, 20, "d");
  g.line(15, 15, 15, 20, "d");
  g.ellipse(10, 13, 2, 3, "l");
  g.set(18, 18, "d");
};

SHAPES.horse = (g, p, rng, el) => {
  g.ellipse(12, 13, 7, 4, "b");
  g.rect(17, 7, 4, 7, "b");
  g.poly([[17, 8], [21, 5], [22, 8], [20, 10]], "b");
  g.line(18, 6, 19, 4, "d");
  g.line(6, 16, 6, 21, "d");
  g.line(10, 16, 10, 21, "d");
  g.line(15, 16, 15, 21, "d");
  g.line(18, 15, 18, 21, "d");
  g.line(4, 12, 1, 9, "d");
  g.line(4, 12, 2, 17, "d");
  g.set(20, 7, "k");
  g.set(19, 7, "w");
  g.ellipse(10, 11, 4, 2, "l");
  if (el.shape === "unicorn" || el.motif === "horn") {
    g.line(20, 5, 22, 1, "h");
    g.set(22, 0, "u");
  }
  if (el.shape === "centaur") {
    g.disc(16, 7, 3, "b");
    g.set(16, 6, "k");
  }
  speckle(g, rng, "h", 8, 2);
};

SHAPES.rabbit = (g, p) => {
  g.ellipse(12, 15, 5, 6, "b");
  g.disc(12, 9, 4, "b");
  g.ellipse(9, 3, 2, 5, "b");
  g.ellipse(15, 3, 2, 5, "b");
  g.ellipse(9, 3, 1, 3, "a");
  g.ellipse(15, 3, 1, 3, "a");
  g.set(10, 9, "k");
  g.set(14, 9, "k");
  g.set(10, 8, "w");
  g.set(14, 8, "w");
  g.set(12, 11, "a");
  g.disc(17, 16, 2, "l");
  g.ellipse(10, 14, 2, 3, "l");
};

SHAPES.deer = (g, p) => {
  g.ellipse(12, 14, 6, 4, "b");
  g.rect(16, 7, 3, 7, "b");
  g.poly([[16, 8], [20, 5], [21, 8], [19, 10]], "b");
  g.line(17, 6, 15, 2, "d");
  g.line(15, 2, 13, 3, "d");
  g.line(17, 6, 19, 2, "d");
  g.line(19, 2, 21, 3, "d");
  g.line(7, 16, 7, 21, "d");
  g.line(11, 16, 11, 21, "d");
  g.line(15, 16, 15, 21, "d");
  g.set(20, 8, "k");
  g.set(19, 8, "w");
  g.set(8, 10, "h");
  g.line(4, 14, 1, 12, "d");
};

SHAPES.elephant = (g, p) => {
  g.ellipse(12, 13, 7, 5, "b");
  g.disc(17, 11, 4, "b");
  g.ellipse(20, 14, 2, 5, "b");
  g.line(20, 18, 20, 20, "b");
  g.disc(15, 10, 4, "d");
  g.set(18, 10, "k");
  g.set(17, 10, "w");
  g.rect(7, 17, 2, 4, "d");
  g.rect(11, 17, 2, 4, "d");
  g.rect(15, 17, 2, 4, "d");
  g.line(5, 11, 2, 9, "d");
  g.set(8, 9, "h");
  g.set(11, 11, "l");
};

SHAPES.bat = (g, p) => {
  g.poly([[12, 8], [6, 10], [1, 6], [4, 15], [8, 13], [12, 18], [16, 13], [20, 15], [23, 6], [18, 10]], "b");
  g.disc(12, 13, 3, "d");
  g.poly([[10, 9], [10, 6], [12, 8], [14, 6], [14, 9]], "d");
  g.set(11, 12, "a");
  g.set(13, 12, "a");
  g.set(9, 10, "h");
  g.set(15, 10, "h");
  g.poly([[9, 15], [12, 20], [15, 15]], "l");
};

SHAPES.lizard = (g, p, rng, el) => {
  g.ellipse(12, 14, 6, 3, "b");
  g.disc(18, 12, 3, "b");
  g.poly([[4, 13], [1, 10], [2, 16]], "d");
  g.line(8, 16, 6, 20, "d");
  g.line(12, 16, 12, 20, "d");
  g.line(15, 16, 17, 20, "d");
  g.set(19, 11, "k");
  g.set(20, 11, "w");
  g.line(16, 14, 21, 16, "a");
  if (el.shape === "turtle") {
    g.ellipse(12, 13, 7, 5, "d");
    g.ellipse(12, 12, 6, 4, "b");
    g.line(7, 12, 17, 12, "a");
    g.line(12, 8, 12, 16, "a");
  }
  if (el.shape === "snake") {
    g.noOutline = false;
    g.ellipse(12, 15, 5, 3, "b");
    g.disc(19, 12, 3, "b");
    g.line(6, 15, 2, 11, "d");
    g.line(2, 11, 4, 8, "d");
    g.set(20, 11, "k");
    g.line(21, 13, 23, 13, "a");
  }
  if (el.shape === "dinosaur" || el.shape === "croc") {
    g.poly([[8, 11], [10, 8], [12, 11]], "d");
    g.poly([[13, 11], [15, 8], [17, 11]], "d");
    g.set(20, 12, "k");
  }
  speckle(g, rng, "h", 8, 2);
};

SHAPES.frog = (g, p) => {
  g.ellipse(12, 15, 7, 5, "b");
  g.disc(9, 9, 3, "b");
  g.disc(15, 9, 3, "b");
  g.disc(9, 9, 1, "h");
  g.disc(15, 9, 1, "h");
  g.set(9, 9, "k");
  g.set(15, 9, "k");
  g.line(8, 19, 5, 21, "d");
  g.line(16, 19, 19, 21, "d");
  g.line(9, 14, 15, 14, "d");
  g.set(8, 12, "h");
};

SHAPES.turtle = (g, p) => {
  g.ellipse(12, 14, 7, 5, "b");
  g.ellipse(12, 13, 6, 4, "d");
  g.ellipse(12, 12, 5, 3, "b");
  g.line(7, 12, 17, 12, "a");
  g.line(12, 8, 12, 16, "a");
  g.disc(19, 12, 3, "b");
  g.set(20, 11, "k");
  g.ellipse(4, 19, 2, 2, "b");
  g.ellipse(20, 18, 2, 2, "b");
  g.set(8, 10, "h");
};

SHAPES.octopus = (g, p, rng) => {
  g.disc(12, 10, 6, "b");
  g.ellipse(10, 8, 3, 2, "l");
  g.set(10, 10, "k");
  g.set(14, 10, "k");
  g.set(10, 9, "w");
  g.set(14, 9, "w");
  for (let i = 0; i < 5; i += 1) {
    const x = 7 + i * 2;
    g.thickLine(x, 15, x + Math.sin(i) * 4, 21, i % 2 ? "a" : "b", 1);
    g.set(x + Math.sin(i) * 4, 21, "u");
  }
  speckle(g, rng, "h", 8, 2);
};

SHAPES.crab = (g, p) => {
  g.ellipse(12, 14, 7, 4, "b");
  g.disc(12, 10, 4, "b");
  g.disc(4, 12, 3, "d");
  g.disc(20, 12, 3, "d");
  g.set(3, 10, "b");
  g.set(21, 10, "b");
  g.set(10, 9, "k");
  g.set(14, 9, "k");
  g.set(10, 8, "w");
  g.set(14, 8, "w");
  g.line(7, 16, 5, 20, "d");
  g.line(10, 17, 9, 21, "d");
  g.line(14, 17, 15, 21, "d");
  g.line(17, 16, 19, 20, "d");
  g.set(8, 12, "h");
};

SHAPES.boat = (g, p) => {
  g.poly([[3, 15], [21, 15], [17, 20], [7, 20]], "b");
  g.poly([[5, 15], [19, 15], [17, 18], [7, 18]], "l");
  g.rect(11, 4, 2, 12, "d");
  g.poly([[13, 5], [20, 13], [13, 13]], "a");
  g.poly([[11, 6], [5, 13], [11, 13]], "u");
  g.line(3, 20, 21, 20, "d");
  g.set(18, 14, "h");
};

SHAPES.wheel = (g, p) => {
  g.disc(12, 12, 9, "b");
  g.eraseDisc(12, 12, 7);
  g.ring(12, 12, 8, "d");
  g.ring(12, 12, 3, "a");
  for (let i = 0; i < 6; i += 1) {
    const a = (i * Math.PI) / 3;
    g.line(12 + Math.cos(a) * 3, 12 + Math.sin(a) * 3, 12 + Math.cos(a) * 7, 12 + Math.sin(a) * 7, "l");
  }
  g.set(8, 6, "h");
  g.set(16, 17, "a");
};

SHAPES.bow = (g, p) => {
  g.noOutline = false;
  for (let y = 3; y <= 21; y += 1) {
    const x = 7 + Math.round(Math.sin(((y - 3) / 18) * Math.PI) * 5);
    g.set(x, y, "b");
    g.set(x - 1, y, "l");
  }
  g.line(7, 3, 7, 21, "a");
  g.line(12, 12, 21, 12, "d");
  g.poly([[21, 12], [18, 10], [18, 14]], "h");
};

SHAPES.feather = (g, p) => {
  g.line(6, 21, 17, 4, "d");
  g.poly([[17, 4], [21, 3], [20, 8], [16, 10], [13, 15], [9, 17], [10, 12], [14, 8]], "b");
  g.poly([[17, 5], [19, 4], [18, 8], [15, 9], [13, 12]], "l");
  for (let i = 0; i < 4; i += 1) g.line(11 + i, 15 - i * 2, 16 + i, 10 - i * 2, "a");
  g.set(19, 4, "h");
  g.set(7, 20, "u");
};

SHAPES.rope = (g, p) => {
  g.noOutline = false;
  for (let t = 0; t < 40; t += 1) {
    const a = t * 0.28;
    const x = 12 + Math.cos(a) * (3 + t * 0.18);
    const y = 12 + Math.sin(a) * (3 + t * 0.18);
    g.set(x, y, t % 3 === 0 ? "d" : "b");
    g.set(x + 1, y, "l");
  }
  g.disc(5, 10, 2, "a");
  g.set(6, 8, "h");
};

SHAPES.cloth = (g, p) => {
  g.poly([[4, 4], [18, 5], [21, 17], [10, 21], [3, 14]], "b");
  g.poly([[6, 6], [12, 6], [10, 15], [5, 12]], "l");
  g.poly([[12, 6], [18, 6], [19, 16], [10, 15]], "d");
  g.line(6, 5, 5, 14, "a");
  g.set(10, 8, "h");
  g.set(16, 13, "u");
};

SHAPES.lamp = (g, p) => {
  g.rect(9, 3, 6, 2, "d");
  g.rect(7, 5, 10, 13, "l");
  g.rect(8, 6, 8, 11, "b");
  g.rect(9, 7, 6, 9, "h");
  g.rect(10, 8, 4, 6, "a");
  g.rect(6, 18, 12, 2, "d");
  g.line(12, 1, 12, 3, "d");
  g.set(9, 19, "h");
  g.set(14, 14, "u");
};

SHAPES.lampshade = (g, p) => {
  g.poly([[5, 20], [7, 10], [10, 5], [14, 5], [17, 10], [19, 20]], "b");
  g.poly([[7, 20], [8, 10], [11, 7], [12, 20]], "l");
  g.poly([[12, 20], [12, 7], [15, 8], [17, 20]], "d");
  g.rect(4, 19, 16, 3, "s");
  g.line(11, 6, 11, 18, "h");
  g.line(9, 10, 9, 18, "u");
  g.rect(9, 20, 6, 2, "d");
  g.set(12, 5, "h");
};

SHAPES.mirror = (g, p) => {
  g.ellipse(12, 11, 7, 9, "b");
  g.ellipse(12, 11, 5, 7, "l");
  g.ellipse(10, 9, 2, 4, "h");
  g.line(5, 3, 3, 1, "a");
  g.line(19, 3, 21, 1, "a");
  g.rect(11, 19, 2, 3, "d");
  g.ellipse(12, 21, 4, 1, "d");
  g.set(8, 14, "u");
};

SHAPES.telescope = (g, p) => {
  g.poly([[3, 13], [18, 4], [21, 8], [7, 17]], "b");
  g.poly([[4, 13], [18, 5], [19, 7], [6, 15]], "l");
  g.line(3, 13, 1, 15, "a");
  g.line(7, 17, 5, 22, "d");
  g.line(14, 12, 17, 21, "d");
  g.line(10, 15, 12, 22, "d");
  g.set(17, 5, "h");
};

SHAPES.device = (g, p, rng, el) => {
  const tv = el.shape === "monitor";
  const radio = el.shape === "radio";
  const phone = el.shape === "device";
  g.rect(4, 5, 16, 13, "d");
  g.rect(5, 6, 14, 10, "b");
  g.rect(6, 7, 12, 7, "s");
  if (tv) {
    g.rect(6, 7, 12, 7, "a");
    g.rect(7, 8, 10, 5, "u");
    g.line(8, 19, 6, 21, "d");
    g.line(16, 19, 18, 21, "d");
  } else if (radio) {
    g.line(7, 20, 5, 22, "d");
    g.line(17, 20, 19, 22, "d");
    g.disc(9, 11, 1, "h");
    g.disc(14, 11, 1, "h");
    g.rect(8, 14, 8, 1, "a");
  } else {
    g.rect(8, 8, 8, 5, "l");
    g.rect(9, 9, 6, 3, "h");
    g.disc(12, 17, 1, "a");
  }
  g.set(18, 6, "u");
};

SHAPES.satellite = (g, p) => {
  g.rect(9, 9, 6, 6, "b");
  g.rect(2, 10, 6, 4, "d");
  g.rect(16, 10, 6, 4, "d");
  g.line(4, 11, 7, 11, "a");
  g.line(17, 11, 20, 11, "a");
  g.line(12, 9, 12, 5, "d");
  g.ring(12, 4, 3, "l");
  g.line(12, 15, 12, 20, "d");
  g.disc(12, 21, 2, "a");
  g.set(10, 10, "h");
};

SHAPES.helix = (g, p) => {
  for (let y = 3; y <= 21; y += 1) {
    const offset = Math.round(Math.sin(y * 0.6) * 5);
    g.set(12 + offset, y, "b");
    g.set(12 - offset, y, "l");
    if (y % 3 === 0) g.line(12 - offset, y, 12 + offset, y, "a");
  }
  g.noOutline = false;
  g.set(12, 2, "h");
};

SHAPES.fruit = (g, p) => {
  g.disc(10, 13, 5, "b");
  g.disc(15, 14, 4, "b");
  g.disc(9, 11, 3, "l");
  g.set(8, 10, "h");
  g.line(12, 8, 13, 3, "d");
  g.poly([[13, 6], [17, 4], [16, 8]], "a");
  g.set(16, 16, "d");
};

SHAPES.bread = (g, p) => {
  g.ellipse(12, 14, 9, 6, "b");
  g.ellipse(12, 13, 7, 4, "l");
  g.line(8, 10, 11, 15, "d");
  g.line(11, 9, 14, 15, "d");
  g.line(14, 9, 17, 14, "d");
  g.set(7, 14, "h");
  g.set(16, 16, "a");
};

SHAPES.cactus = (g, p) => {
  g.rect(10, 6, 5, 15, "b");
  g.rect(11, 7, 2, 13, "l");
  g.rect(5, 10, 5, 3, "b");
  g.rect(5, 10, 3, 6, "b");
  g.rect(15, 8, 4, 3, "b");
  g.rect(16, 8, 3, 7, "b");
  g.line(7, 8, 7, 10, "l");
  g.line(17, 6, 17, 8, "l");
  for (let i = 0; i < 4; i += 1) {
    g.set(9, 9 + i * 3, "h");
    g.set(16, 11 + i * 2, "h");
  }
  g.set(8, 16, "a");
};

SHAPES.wheat = (g, p) => {
  g.line(12, 21, 12, 4, "d");
  for (let i = 0; i < 4; i += 1) {
    g.ellipse(9, 6 + i * 3, 2, 2, "b");
    g.ellipse(15, 7 + i * 3, 2, 2, "b");
    g.set(8, 5 + i * 3, "h");
    g.set(16, 6 + i * 3, "h");
  }
  g.ellipse(12, 3, 2, 3, "a");
  g.line(12, 16, 8, 19, "d");
};

SHAPES.root = (g, p) => {
  g.poly([[8, 2], [16, 2], [15, 9], [12, 13], [9, 9]], "d");
  g.line(8, 9, 3, 15, "b");
  g.line(3, 15, 2, 21, "b");
  g.line(10, 10, 8, 17, "b");
  g.line(8, 17, 6, 21, "b");
  g.line(13, 10, 14, 18, "b");
  g.line(14, 18, 17, 21, "b");
  g.line(15, 8, 20, 13, "d");
  g.set(6, 16, "l");
  g.set(15, 14, "l");
};

SHAPES.pot = (g, p) => {
  g.ellipse(12, 9, 6, 2, "d");
  g.poly([[6, 9], [7, 17], [12, 21], [17, 17], [18, 9]], "b");
  g.poly([[7, 9], [10, 9], [9, 17], [7, 16]], "l");
  g.poly([[14, 9], [17, 9], [17, 16], [14, 18]], "d");
  g.line(7, 12, 17, 12, "a");
  g.set(9, 11, "h");
  g.ellipse(12, 20, 5, 1, "d");
};

SHAPES.brick = (g, p) => {
  g.rect(3, 7, 18, 12, "b");
  g.rect(4, 8, 16, 4, "l");
  g.line(12, 7, 12, 12, "d");
  g.line(7, 13, 7, 18, "d");
  g.line(16, 13, 16, 18, "d");
  g.line(3, 13, 21, 13, "d");
  g.set(5, 8, "h");
  g.set(18, 17, "a");
};

SHAPES.staff = (g, p) => {
  g.line(7, 21, 15, 6, "d");
  g.line(8, 21, 16, 6, "l");
  g.ring(17, 4, 3, "a");
  g.disc(17, 4, 2, "u");
  g.disc(17, 4, 1, "h");
  g.line(6, 15, 10, 14, "a");
  g.set(19, 2, "w");
};

SHAPES.mermaid = (g, p) => {
  g.disc(15, 6, 3, "b");
  g.rect(13, 9, 5, 5, "b");
  g.line(12, 10, 9, 14, "l");
  g.line(18, 10, 21, 13, "l");
  g.poly([[11, 14], [17, 14], [20, 18], [15, 21], [9, 19]], "a");
  g.poly([[9, 19], [4, 21], [7, 17], [3, 15]], "u");
  g.set(16, 6, "k");
  g.set(15, 6, "w");
  g.line(13, 11, 15, 13, "d");
  g.set(17, 15, "h");
};

SHAPES.ghost = (g, p) => {
  g.disc(12, 9, 6, "b");
  g.rect(6, 9, 12, 9, "b");
  g.poly([[6, 18], [8, 21], [10, 18], [12, 21], [14, 18], [16, 21], [18, 18]], "b");
  g.ellipse(9, 8, 3, 2, "l");
  g.set(10, 9, "k");
  g.set(14, 9, "k");
  g.set(12, 13, "a");
  g.set(8, 12, "h");
  g.set(16, 15, "u");
};

SHAPES.treeoflife = (g, p, rng) => {
  g.rect(10, 12, 5, 11, "d");
  g.rect(12, 13, 2, 9, "l");
  g.line(11, 18, 6, 22, "d");
  g.line(13, 18, 19, 22, "d");
  g.disc(7, 9, 5, "b");
  g.disc(16, 8, 5, "b");
  g.disc(12, 5, 5, "b");
  g.disc(12, 13, 5, "b");
  g.disc(7, 8, 3, "l");
  g.disc(13, 5, 2, "h");
  g.disc(17, 9, 2, "u");
  g.disc(12, 11, 2, "a");
  for (let i = 0; i < 5; i += 1) {
    drawSpark(g, 6 + Math.floor(rng() * 13), 3 + Math.floor(rng() * 9), "h", "a");
  }
};

SHAPES.riveroftime = (g, p, rng) => {
  g.ring(8, 5, 4, "b");
  g.ring(16, 5, 4, "b");
  g.rect(9, 5, 6, 2, "d");
  g.poly([[7, 5], [17, 5], [16, 21], [8, 21]], "s");
  g.line(8, 20, 11, 16, "a");
  g.line(11, 16, 9, 12, "u");
  g.line(9, 12, 15, 8, "a");
  g.line(15, 8, 13, 4, "u");
  g.poly([[9, 15], [11, 17], [10, 21], [8, 20]], "h");
  for (let i = 0; i < 4; i += 1) g.set(7 + i * 2, 2, "l");
  speckle(g, rng, "h", 12, 3);
};

SHAPES.crownofstars = (g, p, rng) => {
  g.poly([[2, 18], [3, 8], [8, 12], [12, 4], [16, 12], [21, 8], [22, 18]], "b");
  g.rect(4, 17, 17, 4, "b");
  g.rect(5, 19, 15, 2, "d");
  g.set(12, 10, "a");
  g.set(6, 7, "h");
  g.set(19, 7, "h");
  for (let i = 0; i < 4; i += 1) {
    drawSpark(g, 5 + Math.floor(rng() * 15), 1 + Math.floor(rng() * 8), "w", "h");
  }
};

SHAPES.worldcore = (g, p, rng) => {
  g.disc(12, 12, 9, "d");
  g.disc(12, 12, 8, "b");
  g.disc(12, 12, 6, "s");
  g.disc(10, 10, 4, "l");
  g.ring(12, 12, 7, "a");
  g.ring(12, 12, 4, "u");
  g.disc(12, 12, 2, "h");
  for (let i = 0; i < 6; i += 1) {
    const a = i * 1.1;
    g.set(12 + Math.cos(a) * 7, 12 + Math.sin(a) * 7, "h");
  }
  speckle(g, rng, "h", 10, 3);
};

SHAPES.oracleheart = (g, p, rng) => {
  g.disc(8, 9, 4, "b");
  g.disc(16, 9, 4, "b");
  g.poly([[4, 10], [12, 21], [20, 10], [16, 6], [12, 10], [8, 6]], "b");
  g.ellipse(12, 12, 5, 3, "w");
  g.disc(12, 12, 2, "a");
  g.set(12, 12, "k");
  g.set(10, 10, "h");
  for (let i = 0; i < 4; i += 1) {
    const a = -0.8 + i * 0.55;
    g.line(12 + Math.cos(a) * 8, 8 + Math.sin(a) * 4, 12 + Math.cos(a) * 10, 8 + Math.sin(a) * 6, "u");
  }
  speckle(g, rng, "h", 8, 2);
};

SHAPES.allinone = (g, p, rng) => {
  g.noOutline = false;
  g.disc(12, 12, 8, "d");
  g.disc(12, 12, 7, "b");
  g.disc(10, 10, 4, "l");
  g.disc(8, 8, 2, "h");
  g.ring(12, 12, 8, "a");
  for (let i = 0; i < 180; i += 2) {
    const rad = (i * Math.PI) / 90;
    g.set(12 + Math.cos(rad) * 6, 12 + Math.sin(rad * 2) * 3, i % 6 === 0 ? "u" : "h");
  }
  g.disc(12, 12, 2, "a");
  g.set(12, 12, "w");
  for (let i = 0; i < 5; i += 1) {
    drawSpark(g, 3 + Math.floor(rng() * 18), 2 + Math.floor(rng() * 18), "h", "u");
  }
};

SHAPES.bone = (g, p) => {
  g.rect(7, 10, 10, 4, "b");
  g.disc(6, 10, 2, "b");
  g.disc(6, 14, 2, "b");
  g.disc(18, 10, 2, "b");
  g.disc(18, 14, 2, "b");
  g.rect(8, 11, 7, 1, "h");
  g.rect(8, 13, 6, 1, "d");
  g.set(5, 9, "l");
  g.set(19, 15, "a");
};

SHAPES.lock = (g, p) => {
  g.ring(12, 8, 4, "d");
  g.rect(7, 10, 10, 9, "b");
  g.rect(8, 11, 3, 6, "l");
  g.rect(10, 13, 4, 3, "k");
  g.rect(11, 14, 2, 3, "a");
  g.set(15, 17, "a");
};

SHAPES.camera = (g, p) => {
  g.rect(3, 8, 18, 11, "d");
  g.rect(4, 9, 16, 9, "b");
  g.poly([[8, 8], [10, 5], [15, 5], [17, 8]], "b");
  g.disc(12, 13, 4, "s");
  g.disc(12, 13, 3, "a");
  g.disc(12, 13, 2, "k");
  g.set(10, 11, "h");
  g.rect(17, 10, 2, 2, "h");
  g.set(6, 11, "l");
};

SHAPES.compass = (g, p) => {
  g.disc(12, 12, 9, "b");
  g.disc(12, 12, 7, "l");
  g.disc(12, 12, 6, "s");
  g.poly([[12, 6], [14, 12], [12, 18], [10, 12]], "a");
  g.poly([[12, 6], [13, 12], [12, 12]], "h");
  g.set(12, 12, "k");
  g.set(9, 8, "u");
};

SHAPES.palette = (g, p, rng) => {
  g.ellipse(12, 13, 9, 7, "b");
  g.ellipse(10, 11, 5, 4, "l");
  g.eraseDisc(8, 16, 2);
  g.set(8, 16, "s");
  const pigments = ["#d65b4c", "#e3a44e", "#e3d16b", "#75b57b", "#6aa7c7", "#a07fc4"];
  pigments.forEach((color, index) => {
    const a = -1.8 + index * 0.6;
    g.disc(12 + Math.cos(a) * 6, 12 + Math.sin(a) * 4, 1, color);
  });
  g.line(19, 9, 22, 4, "d");
  g.set(21, 3, "h");
  speckle(g, rng, "h", 8, 2);
};

SHAPES.world = (g, p, rng) => {
  g.disc(12, 12, 8, "b");
  g.disc(10, 10, 3, "l");
  g.poly([[6, 12], [9, 10], [11, 12], [9, 15], [6, 15]], "a");
  g.poly([[13, 8], [17, 9], [18, 12], [15, 12], [14, 10]], "a");
  g.ellipse(12, 17, 6, 2, "d");
  g.ellipse(12, 12, 10, 3, "a");
  g.set(8, 8, "h");
  speckle(g, rng, "h", 10, 2);
};

SHAPES.needle = (g, p) => {
  g.thickLine(5, 20, 18, 5, "b", 1);
  g.line(6, 19, 17, 6, "l");
  g.line(17, 6, 20, 2, "h");
  g.ring(5, 20, 2, "a");
  g.line(4, 21, 3, 17, "a");
  g.line(3, 17, 5, 14, "u");
  g.set(18, 5, "w");
  g.set(7, 18, "s");
};

SHAPES.roof = (g, p) => {
  g.poly([[2, 20], [12, 7], [22, 20]], "b");
  g.poly([[5, 18], [12, 9], [19, 18]], "l");
  g.line(12, 9, 12, 18, "d");
  for (let x = 5; x <= 19; x += 4) g.line(x, 14, x + 2, 18, "d");
  g.rect(2, 19, 20, 2, "d");
  g.line(12, 9, 7, 14, "h");
  g.set(4, 20, "a");
  g.set(20, 20, "a");
};

SHAPES.pouch = (g, p) => {
  g.poly([[6, 8], [18, 8], [21, 18], [16, 22], [8, 22], [3, 18]], "b");
  g.poly([[8, 10], [16, 10], [18, 17], [14, 20], [10, 20], [6, 17]], "l");
  g.line(6, 8, 18, 8, "d");
  g.line(8, 7, 16, 7, "a");
  g.line(9, 7, 7, 3, "a");
  g.line(15, 7, 17, 3, "a");
  g.set(12, 11, "h");
  g.set(7, 15, "s");
  g.set(17, 19, "s");
};

SHAPES.pocketmoon = (g, p) => {
  g.disc(12, 7, 5, "h");
  g.eraseDisc(14, 6, 4);
  g.poly([[5, 10], [19, 10], [21, 19], [16, 22], [7, 22], [3, 19]], "b");
  g.poly([[7, 12], [17, 12], [18, 18], [14, 21], [8, 21], [5, 18]], "l");
  g.line(5, 10, 19, 10, "d");
  g.line(8, 9, 6, 5, "a");
  g.line(16, 9, 18, 5, "a");
  g.set(8, 17, "w");
  g.set(15, 19, "a");
};

SHAPES.ruler = (g, p) => {
  g.poly([[2, 10], [21, 6], [22, 12], [3, 17]], "b");
  g.poly([[4, 11], [20, 8], [20, 11], [4, 14]], "l");
  for (let i = 0; i < 5; i += 1) {
    const x = 5 + i * 3.5;
    const y = 11.5 - i * 0.6;
    g.line(x, y, x, y + 3, "d");
  }
  g.set(18, 7, "h");
  g.set(5, 15, "a");
};

SHAPES.calm = (g, p) => {
  g.noOutline = true;
  g.thickLine(3, 8, 20, 8, "l", 1);
  g.thickLine(5, 12, 21, 12, "b", 1);
  g.thickLine(3, 16, 18, 16, "l", 1);
  g.set(20, 8, "h");
  g.set(4, 12, "a");
  g.set(19, 16, "h");
};

SHAPES.shoe = (g, p) => {
  g.poly([[3, 16], [6, 10], [10, 9], [13, 14], [20, 15], [21, 19], [4, 19]], "b");
  g.poly([[5, 15], [7, 11], [9, 11], [12, 15], [18, 16], [18, 17], [6, 17]], "l");
  g.rect(4, 19, 17, 2, "d");
  g.line(4, 20, 20, 20, "s");
  g.set(8, 12, "h");
  g.set(15, 16, "a");
};

SHAPES.shoelast = (g, p) => {
  g.poly([[6, 4], [16, 5], [18, 12], [13, 15], [5, 13]], "b");
  g.poly([[8, 6], [14, 7], [15, 11], [11, 13], [7, 11]], "l");
  g.rect(11, 15, 2, 5, "d");
  g.rect(7, 20, 10, 2, "d");
  g.line(9, 8, 13, 8, "d");
  g.set(10, 6, "h");
  g.set(6, 13, "s");
};

SHAPES.shadowshoe = (g, p) => {
  g.poly([[3, 15], [6, 9], [10, 8], [13, 13], [20, 15], [21, 19], [4, 19]], "b");
  g.poly([[5, 14], [7, 10], [9, 10], [12, 14], [18, 16], [18, 17], [6, 17]], "d");
  g.rect(4, 19, 17, 2, "h");
  g.line(4, 21, 20, 21, "a");
  g.line(8, 11, 11, 15, "a");
  g.set(8, 12, "w");
  g.set(17, 18, "h");
  g.set(5, 18, "u");
};

SHAPES.clockface = (g, p) => {
  g.disc(12, 11, 8, "b");
  g.disc(12, 11, 6, "l");
  g.ring(12, 11, 8, "d");
  for (let i = 0; i < 12; i += 1) {
    const a = (i * Math.PI) / 6;
    g.set(12 + Math.cos(a) * 6, 11 + Math.sin(a) * 6, "d");
  }
  g.line(12, 11, 12, 7, "d");
  g.line(12, 11, 15, 14, "d");
  g.set(12, 11, "k");
  g.set(12, 6, "h");
  g.rect(9, 19, 6, 2, "d");
  g.rect(7, 21, 10, 1, "s");
};

SHAPES.tile = (g, p) => {
  for (let row = 0; row < 4; row += 1) {
    for (let col = 0; col < 4; col += 1) {
      const x = 3 + col * 5 + (row % 2) * 2;
      const y = 4 + row * 4;
      g.ellipse(x, y, 3, 2, "b");
      g.line(x - 2, y - 1, x + 2, y - 1, "l");
      g.set(x, y + 1, "d");
    }
  }
  g.set(18, 6, "h");
  g.set(6, 18, "a");
};

SHAPES.rainclock = (g, p) => {
  g.disc(12, 12, 8, "b");
  g.disc(12, 12, 6, "l");
  g.ring(12, 12, 8, "d");
  g.line(12, 12, 12, 7, "d");
  g.line(12, 12, 15, 14, "d");
  g.set(12, 12, "k");
  g.set(12, 6, "h");
  for (let i = 0; i < 4; i += 1) {
    const x = 5 + i * 4;
    g.line(x, 18, x - 1, 21, "u");
  }
  g.rect(8, 20, 8, 2, "d");
  g.set(8, 7, "w");
  g.set(16, 9, "a");
};

SHAPES.origami = (g, p) => {
  g.poly([[2, 14], [12, 4], [14, 12], [22, 8], [16, 18], [9, 17]], "b");
  g.poly([[4, 14], [12, 6], [12, 12], [8, 16]], "l");
  g.poly([[14, 12], [21, 9], [16, 17], [11, 16]], "d");
  g.line(12, 6, 12, 16, "a");
  g.line(4, 14, 12, 12, "a");
  g.set(12, 4, "h");
  g.set(20, 8, "h");
};

SHAPES.letter = (g, p) => {
  g.rect(3, 6, 18, 13, "b");
  g.rect(4, 7, 16, 11, "l");
  g.line(4, 7, 12, 13, "d");
  g.line(20, 7, 12, 13, "d");
  g.line(4, 18, 10, 12, "a");
  g.line(20, 18, 14, 12, "a");
  g.disc(12, 15, 3, "h");
  g.set(12, 15, "a");
  g.set(11, 14, "w");
};

SHAPES.driftletter = (g, p) => {
  g.poly([[7, 5], [13, 5], [15, 10], [20, 14], [19, 19], [13, 21], [8, 17], [7, 11]], "l");
  g.poly([[9, 7], [12, 7], [14, 11], [18, 15], [17, 18], [13, 19], [10, 16], [9, 11]], "b");
  g.rect(8, 3, 4, 3, "d");
  g.rect(8, 4, 4, 1, "a");
  g.rect(11, 12, 4, 4, "w");
  g.line(12, 13, 14, 13, "a");
  g.line(12, 14, 14, 14, "a");
  g.line(2, 21, 6, 19, "u");
  g.line(17, 21, 22, 19, "u");
  g.set(18, 13, "h");
};

SHAPES.ticket = (g, p) => {
  g.rect(3, 7, 18, 11, "b");
  g.rect(4, 8, 16, 9, "l");
  g.line(4, 8, 20, 8, "h");
  g.line(10, 8, 10, 16, "d");
  g.set(9, 12, "l");
  g.set(11, 12, "l");
  g.set(9, 14, "l");
  g.set(11, 14, "l");
  g.rect(14, 11, 5, 1, "a");
  g.rect(14, 13, 4, 1, "d");
  g.set(3, 10, "d");
  g.set(20, 15, "d");
};

SHAPES.seat = (g, p) => {
  g.rect(6, 4, 12, 9, "b");
  g.rect(7, 5, 10, 7, "l");
  g.line(8, 6, 15, 6, "h");
  g.rect(5, 12, 14, 3, "d");
  g.rect(6, 12, 12, 1, "l");
  g.rect(7, 15, 2, 6, "b");
  g.rect(15, 15, 2, 6, "b");
  g.rect(10, 16, 4, 1, "d");
  g.rect(5, 20, 14, 1, "s");
  g.set(16, 13, "h");
};

SHAPES.jar = (g, p) => {
  g.rect(7, 3, 10, 2, "d");
  g.rect(8, 5, 8, 3, "b");
  g.rect(6, 8, 12, 12, "b");
  g.rect(7, 9, 10, 10, "l");
  g.rect(8, 10, 3, 6, "h");
  g.rect(13, 12, 4, 5, "d");
  g.rect(6, 18, 12, 2, "d");
  g.line(8, 19, 16, 19, "s");
  g.set(15, 9, "w");
  g.set(9, 7, "a");
};

SHAPES.chart = (g, p) => {
  g.poly([[3, 4], [19, 3], [21, 19], [4, 21]], "b");
  g.poly([[4, 5], [18, 4], [19, 18], [5, 19]], "l");
  g.line(5, 9, 18, 8, "d");
  g.line(5, 14, 18, 13, "d");
  g.line(5, 17, 18, 16, "d");
  g.line(7, 11, 11, 7, "a");
  g.line(11, 7, 15, 11, "a");
  g.line(15, 11, 10, 15, "a");
  g.set(7, 11, "h");
  g.set(11, 7, "h");
  g.set(15, 11, "h");
  g.set(10, 15, "h");
};

SHAPES.tooth = (g, p) => {
  g.rect(7, 4, 10, 9, "l");
  g.rect(8, 5, 8, 6, "b");
  g.rect(6, 6, 2, 4, "l");
  g.rect(16, 6, 2, 4, "l");
  g.poly([[8, 12], [10, 12], [9, 19], [7, 17]], "b");
  g.poly([[14, 12], [16, 12], [16, 17], [14, 19]], "b");
  g.line(11, 5, 11, 9, "h");
  g.line(13, 6, 13, 10, "h");
  g.set(14, 5, "a");
  g.set(8, 16, "d");
};

SHAPES.frame = (g, p) => {
  g.frame(4, 3, 16, 18, "d");
  g.frame(5, 4, 14, 16, "b");
  g.frame(7, 6, 10, 12, "l");
  g.frame(8, 7, 8, 10, "s");
  g.rect(8, 8, 8, 8, "d");
  g.set(4, 3, "h");
  g.set(19, 3, "h");
  g.set(4, 20, "h");
  g.set(19, 20, "h");
  g.set(11, 11, "a");
};

SHAPES.photo = (g, p) => {
  g.rect(4, 4, 16, 16, "l");
  g.rect(5, 5, 14, 14, "b");
  g.rect(5, 12, 14, 7, "d");
  g.rect(5, 14, 14, 5, "b");
  g.disc(14, 9, 3, "h");
  g.set(14, 9, "a");
  g.line(6, 16, 10, 12, "l");
  g.line(10, 12, 14, 16, "l");
  g.line(12, 17, 18, 16, "l");
  g.set(6, 6, "w");
  g.set(19, 5, "d");
};

SHAPES.door = (g, p) => {
  g.rect(4, 2, 16, 20, "d");
  g.rect(5, 3, 14, 19, "b");
  g.rect(7, 5, 10, 8, "l");
  g.rect(7, 14, 10, 7, "d");
  g.rect(8, 6, 8, 6, "b");
  g.line(8, 15, 16, 15, "b");
  g.set(15, 12, "h");
  g.set(16, 12, "a");
  g.rect(3, 21, 18, 1, "s");
};

SHAPES.desk = (g, p) => {
  g.rect(3, 10, 18, 3, "d");
  g.rect(3, 10, 18, 1, "h");
  g.rect(4, 13, 3, 8, "b");
  g.rect(17, 13, 3, 8, "b");
  g.rect(8, 5, 8, 5, "b");
  g.rect(9, 6, 6, 3, "l");
  g.line(9, 8, 14, 8, "d");
  g.rect(10, 3, 4, 2, "d");
  g.disc(12, 4, 2, "a");
  g.set(12, 3, "h");
  g.rect(8, 16, 8, 5, "b");
  g.rect(9, 17, 6, 3, "l");
};

SHAPES.sunset = (g, p) => {
  g.disc(12, 13, 6, "b");
  g.disc(12, 13, 5, "a");
  g.disc(12, 13, 3, "h");
  g.rect(2, 17, 20, 4, "d");
  g.rect(2, 17, 20, 1, "b");
  g.line(4, 18, 9, 18, "a");
  g.line(14, 18, 19, 18, "a");
  g.set(12, 4, "w");
  g.set(5, 8, "u");
  g.set(19, 7, "u");
  g.set(20, 12, "h");
};

// Aliases keep the 129 authored shape names within a hand-drawn family.
const SHAPE_ALIASES = {
  ant: "bug",
  beetle: "bug",
  bee: "bug",
  butterfly: "bug",
  slug: "worm",
  shell: "shell",
  snail: "shell",
  shrimp: "crab",
  starfish: "star",
  shark: "fish",
  whale: "fish",
  angler: "fish",
  jellyfish: "octopus",
  snake: "lizard",
  croc: "lizard",
  dinosaur: "lizard",
  turtle: "turtle",
  frog: "frog",
  eagle: "bird",
  owl: "bird",
  penguin: "bird",
  peacock: "bird",
  parrot: "bird",
  phoenix: "bird",
  griffin: "bird",
  wolf: "beast",
  fox: "beast",
  cow: "beast",
  sheep: "beast",
  pig: "beast",
  bear: "beast",
  lion: "beast",
  tiger: "beast",
  monkey: "beast",
  panda: "beast",
  werewolf: "beast",
  unicorn: "horse",
  centaur: "horse",
  elf: "human",
  dwarf: "human",
  giant: "human",
  king: "human",
  god: "human",
  goddess: "human",
  titan: "human",
  dance: "human",
  skeleton: "skull",
  mummy: "skull",
  golem: "rock",
  vampire: "bat",
  angel: "human",
  demon: "human",
  reaper: "human",
  house: "building",
  village: "building",
  city: "building",
  tower: "building",
  empire: "building",
  library: "building",
  museum: "building",
  bank: "building",
  religion: "building",
  castle: "building",
  palace: "building",
  knife: "sword",
  spear: "sword",
  arrow: "sword",
  axe: "sword",
  dagger: "sword",
  cart: "wheel",
  ship: "boat",
  trade: "boat",
  sail: "cloth",
  flag: "cloth",
  leather: "cloth",
  silk: "cloth",
  shirt: "cloth",
  wardrobe: "cloth",
  photo: "device",
  photograph: "device",
  camera: "device",
  monitor: "device",
  television: "device",
  phone: "device",
  radio: "device",
  sonar: "device",
  battery: "device",
  compass: "gear",
  clock: "hourglass",
  lock: "key",
  gold: "ingot",
  silver: "ingot",
  bronze: "ingot",
  iron: "ingot",
  steel: "ingot",
  copper: "ingot",
  mithril: "ingot",
  adamant: "ingot",
  money: "ingot",
  bone: "tool",
  drum: "pot",
  pottery: "pot",
  bowl: "pot",
  brick: "brick",
  telescope: "telescope",
  microscope: "telescope",
  spacetelescope: "telescope",
  satellite: "satellite",
  station: "satellite",
  radar: "satellite",
  rocket: "rocket",
  spaceship: "rocket",
  warpdrive: "rocket",
  robot: "robot",
  drone: "robot",
  photo: "device",
  scroll: "book",
  paper: "book",
  map: "book",
  news: "book",
  magicbook: "book",
  story: "book",
  knowledge: "book",
  philosophy: "book",
  education: "book",
  history: "book",
  palettes: "palette",
  palette: "palette",
  color: "palette",
  art: "palette",
  rune: "rune",
  symbol: "rune",
  language: "rune",
  math: "rune",
  faith: "rune",
  spell: "rune",
  staff: "staff",
  potion: "potion",
  elixir: "potion",
  honey: "potion",
  wax: "potion",
  wine: "potion",
  immortality: "potion",
  vaccine: "potion",
  cauldron: "cauldron",
  forge: "cauldron",
  furnace: "cauldron",
  crucible: "cauldron",
  alchemy: "cauldron",
  creation: "cauldron",
  heart: "heart",
  love: "heart",
  emotion: "heart",
  courage: "heart",
  hope: "heart",
  sorrow: "heart",
  eye: "eye",
  secret: "eye",
  fate: "eye",
  wisdom: "eye",
  consciousness: "eye",
  truth: "eye",
  fear: "eye",
  curiosity: "eye",
  oracle: "eye",
  ai: "eye",
  bell: "bell",
  music: "bell",
  sound: "bell",
  echo: "bell",
  instrument: "bell",
  web: "web",
  internet: "web",
  network: "web",
  cosmicweb: "web",
  socialmedia: "web",
  circuit: "circuit",
  wire: "circuit",
  chip: "circuit",
  telegraph: "circuit",
  algorithm: "circuit",
  quantumcomputer: "circuit",
  scales: "scales",
  law: "scales",
  balance: "scales",
  order: "scales",
  pressure: "scales",
  infinity: "infinity",
  firstcause: "infinity",
  portal: "portal",
  blackhole: "portal",
  whitehole: "portal",
  wormhole: "portal",
  quasar: "portal",
  stargate: "portal",
  dimension: "portal",
  reincarnation: "portal",
  star: "star",
  constellation: "star",
  supernova: "star",
  pulsar: "star",
  sun: "sun",
  joy: "sun",
  moon: "moon",
  dream: "moon",
  planet: "planet",
  terra: "planet",
  gasgiant: "planet",
  terraforming: "planet",
  galaxy: "galaxy",
  nebula: "galaxy",
  milkyway: "galaxy",
  universe: "galaxy",
  hourglass: "hourglass",
  time: "hourglass",
  memory: "hourglass",
  timemachine: "hourglass",
  treeoflife: "treeoflife",
  riveroftime: "riveroftime",
  crownofstars: "crownofstars",
  worldcore: "worldcore",
  oracleheart: "oracleheart",
  allinone: "allinone",
  world: "world",
  ...Object.fromEntries(
    [
      "snow",
      "rain",
      "bolt",
      "wind",
      "cloud",
      "pool",
      "dune",
      "wave",
      "crystal",
      "cave",
      "mountain",
      "volcano",
      "arc",
      "comet",
      "coral",
      "tree",
      "leaf",
      "flower",
      "seed",
      "mushroom",
      "cactus",
      "wheat",
      "root",
      "fruit",
      "bread",
      "moss",
      "microbe",
      "worm",
      "fish",
      "bird",
      "beast",
      "human",
      "skull",
      "gear",
      "tool",
      "building",
      "sword",
      "shield",
      "key",
      "shell",
      "rocket",
      "robot",
      "circuit",
      "mask",
      "bell",
      "web",
      "scales",
      "infinity",
      "portal",
      "dragon",
      "bug",
      "cat",
      "horse",
      "rabbit",
      "deer",
      "elephant",
      "bat",
      "lizard",
      "octopus",
      "crab",
      "boat",
      "wheel",
      "bow",
      "cloth",
      "lamp",
      "mirror",
      "telescope",
      "device",
      "satellite",
      "helix",
      "pot",
      "brick",
      "staff",
      "mermaid",
      "ghost",
      "treeoflife",
      "riveroftime",
      "crownofstars",
      "worldcore",
      "oracleheart",
      "allinone",
      "world",
      "flame",
      "droplet",
      "rock",
      "orb",
      "star",
      "sun",
      "moon",
      "planet",
      "galaxy",
      "crown",
      "hourglass",
      "heart",
      "eye",
      "book",
      "potion",
      "rune",
      "cauldron",
      "ingot",
      "gem",
      "aqua",
    ].map((name) => [name, name])
  ),
};

SHAPE_ALIASES.palette = "palette";
SHAPE_ALIASES.palettes = "palette";

function applyMotif(g, element, rng) {
  const motif = element.motif;
  if (!motif) {
    speckle(g, rng, "h", 12, 1);
    return;
  }
  const accents = {
    spark: () => drawSpark(g, 19, 5, "h", "a"),
    glow: () => {
      drawSpark(g, 4, 4, "h", "u");
      drawSpark(g, 20, 18, "u", "a");
    },
    halo: () => g.ring(12, 2, 3, "h"),
    ring: () => g.ring(12, 12, 10, "a"),
    rings: () => {
      g.ring(12, 12, 10, "a");
      g.ring(12, 12, 8, "u");
    },
    stars: () => {
      for (let i = 0; i < 4; i += 1) g.set(3 + Math.floor(rng() * 18), 2 + Math.floor(rng() * 6), "w");
    },
    star: () => drawSpark(g, 19, 4, "w", "h"),
    bubble: () => {
      g.disc(5, 6, 1, "u");
      g.disc(19, 7, 1, "h");
    },
    bubble2: () => g.disc(17, 5, 1, "u"),
    speck: () => speckle(g, rng, "h", 20, 3),
    dots: () => speckle(g, rng, "u", 20, 3),
    lines: () => {
      g.line(4, 8, 8, 6, "a");
      g.line(16, 6, 20, 8, "a");
    },
    rain: () => {
      g.line(7, 19, 5, 22, "l");
      g.line(16, 18, 14, 21, "l");
    },
    foam: () => {
      g.set(4, 19, "w");
      g.set(6, 20, "w");
      g.set(18, 18, "w");
    },
    snow: () => {
      g.set(4, 5, "w");
      g.set(20, 7, "w");
    },
    sun: () => {
      g.disc(20, 4, 2, "a");
    },
    moon: () => {
      g.disc(19, 4, 2, "h");
      g.eraseDisc(20, 3, 1);
    },
    mountain: () => {
      g.poly([[2, 21], [5, 16], [8, 21]], "d");
    },
    crack: () => {
      g.line(12, 15, 10, 18, "k");
      g.line(10, 18, 13, 21, "k");
    },
    trail: () => {
      g.line(2, 21, 7, 16, "u");
      g.line(4, 22, 9, 17, "a");
    },
    chain: () => {
      g.ring(6, 12, 2, "a");
      g.ring(10, 12, 2, "u");
    },
    spikes: () => {
      g.line(6, 7, 4, 3, "a");
      g.line(9, 6, 8, 2, "a");
      g.line(18, 7, 20, 3, "a");
    },
    wings: () => {
      g.poly([[6, 12], [1, 8], [4, 17]], "u");
      g.poly([[18, 12], [23, 8], [20, 17]], "u");
    },
    horn: () => {
      g.line(17, 6, 20, 2, "h");
    },
    crown: () => {
      g.poly([[8, 3], [9, 0], [11, 2], [12, -1], [13, 2], [15, 0], [16, 3]], "a");
    },
    note: () => {
      g.set(19, 6, "a");
      g.line(19, 6, 19, 10, "a");
      g.set(18, 10, "h");
    },
    grid: () => {
      g.line(5, 9, 19, 9, "a");
      g.line(5, 14, 19, 14, "a");
    },
    tear: () => {
      g.set(5, 6, "u");
    },
    flame: () => {
      g.poly([[19, 8], [21, 5], [22, 8], [21, 11]], "a");
    },
  };
  if (accents[motif]) accents[motif]();
  else speckle(g, rng, "h", 14, 1);
}

export function resolveShapeName(shape) {
  if (SHAPES[shape]) return shape;
  return SHAPE_ALIASES[shape] || null;
}

export function drawShape(grid, element, palette, rng) {
  const resolved = resolveShapeName(element.shape) || "orb";
  SHAPES[resolved](grid, palette, rng, element);
  applyMotif(grid, element, rng);
}

export const SHAPE_NAMES = new Set([...Object.keys(SHAPES), ...Object.keys(SHAPE_ALIASES)]);
