import React, { useEffect, useRef } from "react";

const WIDTH = 480;
const HEIGHT = 320;
const BRASS = "rgba(213, 160, 91, 0.42)";
const BRASS_DIM = "rgba(213, 160, 91, 0.16)";
const VERDIGRIS = "rgba(108, 184, 163, 0.34)";

const STAR_GLYPHS = [
  [240, 36],
  [84, 146],
  [396, 146],
  [240, 270],
];

function pixel(ctx, x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}

function ring(ctx, cx, cy, radius, color, step = 1.2, thickness = 1) {
  ctx.fillStyle = color;
  for (let angle = 0; angle < 360; angle += step) {
    const rad = (angle * Math.PI) / 180;
    ctx.fillRect(
      Math.round(cx + Math.cos(rad) * radius),
      Math.round(cy + Math.sin(rad) * radius),
      thickness,
      thickness
    );
  }
}

function arc(ctx, cx, cy, radius, start, end, color, step = 1.2, thickness = 1) {
  ctx.fillStyle = color;
  for (let angle = start; angle <= end; angle += step) {
    const rad = (angle * Math.PI) / 180;
    ctx.fillRect(
      Math.round(cx + Math.cos(rad) * radius),
      Math.round(cy + Math.sin(rad) * radius),
      thickness,
      thickness
    );
  }
}

function cross(ctx, x, y, size, color) {
  pixel(ctx, x - size, y, size * 2 + 1, 1, color);
  pixel(ctx, x, y - size, 1, size * 2 + 1, color);
  pixel(ctx, x, y, 1, 1, color);
}

function diamond(ctx, x, y, size, color) {
  for (let i = 0; i <= size; i += 1) {
    pixel(ctx, x - i, y - size + i, i * 2 + 1, 1, color);
    pixel(ctx, x - i, y + size - i, i * 2 + 1, 1, color);
  }
}

function flame(ctx, x, baseY, height, time, intensity) {
  const rows = Math.max(4, Math.floor(height));
  for (let row = 0; row < rows; row += 1) {
    const t = row / rows;
    const flicker = Math.sin(time * 0.012 + row * 0.82 + x) * 1.4;
    const wobble = Math.sin(time * 0.006 + row * 0.35 + x * 0.1) * 1.1;
    const width = Math.max(1, Math.round((1 - t) * (7 + intensity * 4)));
    const px = x + wobble + flicker * t;
    const color = t > 0.68 ? "rgba(238, 108, 61, 0.92)" : t > 0.32 ? "#e9a04c" : "#ffe0a0";
    pixel(ctx, px - width / 2, baseY - row, width, 1, color);
  }
}

export function CrucibleCanvas({ selectedCount = 0, fusing = false, reducedMotion = false }) {
  const canvasRef = useRef(null);
  const live = useRef({ selectedCount, fusing });
  const started = useRef(false);

  useEffect(() => {
    live.current = { selectedCount, fusing };
  }, [selectedCount, fusing]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    canvas.width = WIDTH;
    canvas.height = HEIGHT;
    const ctx = canvas.getContext("2d");
    let raf = 0;
    let elapsed = 0;
    let last = 0;
    let fuseStart = -1;

    const draw = (time) => {
      const { selectedCount: count, fusing: isFusing } = live.current;
      if (isFusing && !started.current) {
        fuseStart = time;
        started.current = true;
      }
      if (!isFusing) started.current = false;
      ctx.clearRect(0, 0, WIDTH, HEIGHT);
      const cx = 240;
      const cy = 146;

      // faint outer nebula
      const glow = ctx.createRadialGradient(cx, 210, 10, cx, 210, 190);
      glow.addColorStop(0, count > 0 ? "rgba(221, 107, 67, 0.13)" : "rgba(108, 184, 163, 0.055)");
      glow.addColorStop(0.6, "rgba(213, 160, 91, 0.028)");
      glow.addColorStop(1, "rgba(8, 19, 22, 0)");
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, WIDTH, HEIGHT);

      // stars
      for (let i = 0; i < 34; i += 1) {
        const x = (i * 97 + 31) % WIDTH;
        const y = (i * 61 + 17) % 260;
        ctx.globalAlpha = 0.12 + ((i * 17) % 20) / 100;
        pixel(ctx, x, y, i % 9 === 0 ? 2 : 1, 1, i % 6 === 0 ? "#7fc6b2" : "#e7d5ae");
      }
      ctx.globalAlpha = 1;

      // astrolabe rings
      ring(ctx, cx, cy, 148, "rgba(213, 160, 91, 0.1)", 1.5, 1);
      ring(ctx, cx, cy, 128, BRASS_DIM, 0.8, 1);
      arc(ctx, cx, cy, 136, 210, 330, "rgba(108, 184, 163, 0.2)", 0.8, 1);
      arc(ctx, cx, cy, 136, 30, 150, "rgba(221, 107, 67, 0.16)", 0.8, 1);
      for (let angle = 0; angle < 360; angle += 15) {
        const rad = (angle * Math.PI) / 180;
        const inner = angle % 45 === 0 ? 128 : 133;
        pixel(
          ctx,
          cx + Math.cos(rad) * inner,
          cy + Math.sin(rad) * inner,
          angle % 45 === 0 ? 3 : 1,
          1,
          angle % 45 === 0 ? BRASS : "rgba(213, 160, 91, 0.17)"
        );
      }
      STAR_GLYPHS.forEach(([x, y], index) => {
        cross(ctx, x, y, 5, index === 0 ? "rgba(231, 213, 174, 0.3)" : BRASS_DIM);
        diamond(ctx, x, y, 2, BRASS_DIM);
      });

      // connecting rays toward selected slots
      if (count > 0) {
        const lineAlpha = 0.1 + count * 0.06;
        ctx.fillStyle = `rgba(213, 160, 91, ${lineAlpha})`;
        for (let x = 120; x < 235; x += 7) pixel(ctx, x, 152, 4, 1, ctx.fillStyle);
        for (let x = 245; x < 360; x += 7) pixel(ctx, x, 152, 4, 1, ctx.fillStyle);
      }

      // cauldron feet and body
      pixel(ctx, 196, 258, 88, 4, "rgba(5, 14, 16, 0.85)");
      pixel(ctx, 204, 262, 6, 14, "#253a37");
      pixel(ctx, 270, 262, 6, 14, "#253a37");
      pixel(ctx, 201, 274, 12, 3, "#172723");
      pixel(ctx, 267, 274, 12, 3, "#172723");
      pixel(ctx, 190, 224, 100, 8, "#20312e");
      pixel(ctx, 194, 230, 92, 30, "#2f4a42");
      pixel(ctx, 198, 232, 8, 26, "#3f5d51");
      pixel(ctx, 270, 232, 8, 26, "#253b35");
      pixel(ctx, 200, 250, 80, 10, "#1b2e29");
      pixel(ctx, 188, 226, 12, 4, "#3a5147");
      pixel(ctx, 280, 226, 12, 4, "#3a5147");
      pixel(ctx, 180, 230, 6, 10, "#283d37");
      pixel(ctx, 294, 230, 6, 10, "#283d37");
      pixel(ctx, 190, 225, 100, 2, "#56715f");

      // handles
      arc(ctx, cx, 238, 57, 205, 335, "#4f6a5b", 1.4, 2);
      arc(ctx, cx, 238, 62, 205, 335, "rgba(213, 160, 91, 0.25)", 1.4, 1);
      pixel(ctx, 181, 232, 4, 12, "#3d574c");
      pixel(ctx, 295, 232, 4, 12, "#3d574c");

      // brew
      const brewGlow = 0.55 + Math.sin(time * 0.004) * 0.12;
      pixel(ctx, 198, 225, 84, 5, `rgba(85, 178, 150, ${brewGlow * 0.7})`);
      pixel(ctx, 201, 226, 78, 2, count > 0 ? `rgba(240, 177, 82, ${brewGlow})` : "rgba(130, 206, 180, 0.6)");
      for (let i = 0; i < 5; i += 1) {
        const bubbleX = 207 + ((i * 37 + time * 0.006) % 66);
        const bubbleY = 225 - ((time * 0.012 + i * 13) % 18);
        pixel(ctx, bubbleX, bubbleY, 1 + (i % 2), 1 + (i % 2), i % 2 ? "#9bd4bd" : "#f2c279");
      }

      // fire
      const intensity = count + (isFusing ? 3 : 0);
      for (let i = 0; i < 5; i += 1) {
        const x = 208 + i * 15;
        const height = 30 + Math.sin(time * 0.009 + i * 1.7) * 8 + intensity * 5;
        flame(ctx, x, 300, height, time + i * 41, intensity);
      }
      pixel(ctx, 196, 300, 88, 3, "rgba(255, 178, 94, 0.2)");
      pixel(ctx, 207, 298, 66, 2, "rgba(255, 210, 130, 0.3)");

      // rising embers
      for (let i = 0; i < 22; i += 1) {
        const speed = 0.00013 + (i % 5) * 0.00002;
        const progress = ((time * speed + i * 0.083) % 1);
        const x = 200 + ((i * 31) % 80) + Math.sin(time * 0.003 + i) * 7;
        const y = 294 - progress * 150;
        ctx.globalAlpha = Math.max(0, (1 - progress) * 0.55);
        pixel(ctx, x, y, i % 7 === 0 ? 2 : 1, 1, i % 3 === 0 ? "#f5c87e" : "#d96a43");
      }
      ctx.globalAlpha = 1;

      // smoke curls
      for (let i = 0; i < 4; i += 1) {
        const phase = (time * 0.00018 + i * 0.25) % 1;
        const x = 238 + Math.sin(time * 0.002 + i * 2.4) * (10 + phase * 24);
        const y = 216 - phase * 95;
        ctx.globalAlpha = (1 - phase) * 0.12;
        pixel(ctx, x, y, 4 + i, 2, "#d5c6a4");
        pixel(ctx, x + 3, y - 2, 3, 2, "#d5c6a4");
      }
      ctx.globalAlpha = 1;

      // fusion flash
      if (isFusing && fuseStart >= 0) {
        const t = Math.min(1, (time - fuseStart) / 950);
        const radius = 20 + t * 170;
        ring(ctx, cx, 190, radius, `rgba(245, 200, 126, ${(1 - t) * 0.55})`, 1.4, 2);
        const flash = ctx.createRadialGradient(cx, 205, 4, cx, 205, 120);
        flash.addColorStop(0, `rgba(255, 228, 160, ${(1 - t) * 0.4})`);
        flash.addColorStop(1, "rgba(255, 228, 160, 0)");
        ctx.fillStyle = flash;
        ctx.fillRect(0, 0, WIDTH, HEIGHT);
      }
    };

    const loop = (time) => {
      if (!last || time - last > 33) {
        elapsed = time;
        draw(elapsed);
        last = time;
      }
      raf = requestAnimationFrame(loop);
    };

    if (reducedMotion) {
      draw(4200);
    } else {
      raf = requestAnimationFrame(loop);
    }
    return () => cancelAnimationFrame(raf);
  }, [reducedMotion]);

  return <canvas ref={canvasRef} className="crucible-canvas" aria-hidden="true" />;
}
