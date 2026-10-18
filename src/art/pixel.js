export const SPRITE_W = 24;
export const SPRITE_H = 24;

export function hashString(value) {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function mulberry32(seed) {
  let a = seed >>> 0;
  return function random() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export class PixelGrid {
  constructor(width = SPRITE_W, height = SPRITE_H) {
    this.w = width;
    this.h = height;
    this.cells = new Array(width * height).fill(null);
    this.noOutline = false;
  }

  set(x, y, color) {
    const px = Math.floor(x);
    const py = Math.floor(y);
    if (px < 0 || py < 0 || px >= this.w || py >= this.h) return;
    this.cells[py * this.w + px] = color;
  }

  get(x, y) {
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return null;
    return this.cells[y * this.w + x];
  }

  erase(x, y) {
    this.set(x, y, null);
  }

  rect(x, y, w, h, color) {
    for (let yy = Math.round(y); yy < Math.round(y + h); yy += 1) {
      for (let xx = Math.round(x); xx < Math.round(x + w); xx += 1) {
        this.set(xx, yy, color);
      }
    }
  }

  frame(x, y, w, h, color) {
    for (let xx = x; xx < x + w; xx += 1) {
      this.set(xx, y, color);
      this.set(xx, y + h - 1, color);
    }
    for (let yy = y; yy < y + h; yy += 1) {
      this.set(x, yy, color);
      this.set(x + w - 1, yy, color);
    }
  }

  line(x0, y0, x1, y1, color) {
    let x = Math.round(x0);
    let y = Math.round(y0);
    const tx = Math.round(x1);
    const ty = Math.round(y1);
    const dx = Math.abs(tx - x);
    const sx = x < tx ? 1 : -1;
    const dy = -Math.abs(ty - y);
    const sy = y < ty ? 1 : -1;
    let error = dx + dy;
    while (true) {
      this.set(x, y, color);
      if (x === tx && y === ty) break;
      const e2 = 2 * error;
      if (e2 >= dy) {
        error += dy;
        x += sx;
      }
      if (e2 <= dx) {
        error += dx;
        y += sy;
      }
    }
  }

  thickLine(x0, y0, x1, y1, color, width = 2) {
    const offset = Math.floor(width / 2);
    for (let ox = -offset; ox <= offset; ox += 1) {
      for (let oy = -offset; oy <= offset; oy += 1) {
        if (Math.abs(ox) + Math.abs(oy) > offset) continue;
        this.line(x0 + ox, y0 + oy, x1 + ox, y1 + oy, color);
      }
    }
  }

  disc(cx, cy, radius, color) {
    const r = Math.max(0, Math.round(radius));
    for (let y = -r; y <= r; y += 1) {
      for (let x = -r; x <= r; x += 1) {
        if (x * x + y * y <= r * r + r * 0.5) this.set(cx + x, cy + y, color);
      }
    }
  }

  ellipse(cx, cy, rx, ry, color) {
    const a = Math.max(1, Math.round(rx));
    const b = Math.max(1, Math.round(ry));
    for (let y = -b; y <= b; y += 1) {
      for (let x = -a; x <= a; x += 1) {
        if ((x * x) / (a * a) + (y * y) / (b * b) <= 1.04) this.set(cx + x, cy + y, color);
      }
    }
  }

  eraseDisc(cx, cy, radius) {
    const r = Math.max(0, Math.round(radius));
    for (let y = -r; y <= r; y += 1) {
      for (let x = -r; x <= r; x += 1) {
        if (x * x + y * y <= r * r + r * 0.5) this.set(cx + x, cy + y, null);
      }
    }
  }

  poly(points, color) {
    if (!points.length) return;
    const ys = points.map((p) => p[1]);
    const minY = Math.max(0, Math.floor(Math.min(...ys)));
    const maxY = Math.min(this.h - 1, Math.ceil(Math.max(...ys)));
    for (let y = minY; y <= maxY; y += 1) {
      const crossings = [];
      for (let i = 0; i < points.length; i += 1) {
        const [x0, y0] = points[i];
        const [x1, y1] = points[(i + 1) % points.length];
        if ((y0 <= y && y1 > y) || (y1 <= y && y0 > y)) {
          crossings.push(x0 + ((y - y0) / (y1 - y0)) * (x1 - x0));
        }
      }
      crossings.sort((a, b) => a - b);
      for (let i = 0; i + 1 < crossings.length; i += 2) {
        for (let x = Math.ceil(crossings[i]); x <= Math.floor(crossings[i + 1]); x += 1) {
          this.set(x, y, color);
        }
      }
    }
  }

  strokePoly(points, color) {
    for (let i = 0; i < points.length; i += 1) {
      const [x0, y0] = points[i];
      const [x1, y1] = points[(i + 1) % points.length];
      this.line(x0, y0, x1, y1, color);
    }
  }

  ring(cx, cy, radius, color) {
    const r = Math.max(1, Math.round(radius));
    for (let a = 0; a < 360; a += 2) {
      const rad = (a * Math.PI) / 180;
      this.set(cx + Math.cos(rad) * r, cy + Math.sin(rad) * r, color);
    }
  }

  forEach(callback) {
    for (let y = 0; y < this.h; y += 1) {
      for (let x = 0; x < this.w; x += 1) {
        const color = this.cells[y * this.w + x];
        if (color) callback(x, y, color);
      }
    }
  }
}

export function addOutline(grid, outline = "o") {
  if (grid.noOutline) return;
  const source = grid.cells.slice();
  const solid = (x, y) => {
    if (x < 0 || y < 0 || x >= grid.w || y >= grid.h) return false;
    return Boolean(source[y * grid.w + x]);
  };
  for (let y = 0; y < grid.h; y += 1) {
    for (let x = 0; x < grid.w; x += 1) {
      if (source[y * grid.w + x]) continue;
      let touching = false;
      for (let oy = -1; oy <= 1 && !touching; oy += 1) {
        for (let ox = -1; ox <= 1; ox += 1) {
          if ((ox || oy) && solid(x + ox, y + oy)) {
            touching = true;
            break;
          }
        }
      }
      if (touching) grid.set(x, y, outline);
    }
  }
}

export function addSpeckles(grid, rng, count, color = "h") {
  let tries = 0;
  let placed = 0;
  while (placed < count && tries < 80) {
    tries += 1;
    const x = 2 + Math.floor(rng() * (grid.w - 4));
    const y = 2 + Math.floor(rng() * (grid.h - 4));
    if (grid.get(x, y)) {
      const current = grid.get(x, y);
      if (current === "b" || current === "l" || current === "a") {
        grid.set(x, y, color);
        placed += 1;
      }
    }
  }
}

export function shadePatch(grid, x, y, w, h, color) {
  for (let yy = y; yy < y + h; yy += 1) {
    for (let xx = x; xx < x + w; xx += 1) {
      if (grid.get(xx, yy)) grid.set(xx, yy, color);
    }
  }
}

export function drawSpark(g, x, y, color = "h", accent = "a") {
  g.set(x, y, color);
  g.set(x - 1, y, accent);
  g.set(x + 1, y, accent);
  g.set(x, y - 1, accent);
  g.set(x, y + 1, accent);
}
