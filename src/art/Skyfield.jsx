import React, { useEffect, useRef } from "react";

const STARS = Array.from({ length: 96 }, (_, index) => {
  const seed = Math.sin(index * 127.1) * 43758.5453;
  const fraction = seed - Math.floor(seed);
  const second = Math.sin(index * 311.7 + 1.3) * 12543.12;
  const secondFraction = second - Math.floor(second);
  return {
    x: fraction,
    y: secondFraction * 0.82,
    size: index % 11 === 0 ? 2 : 1,
    phase: (index % 17) / 17,
    speed: 0.18 + (index % 5) * 0.07,
    tone: index % 7 === 0 ? "teal" : index % 13 === 0 ? "ember" : "bone",
  };
});

const EMBERS = Array.from({ length: 16 }, (_, index) => ({
  x: 0.08 + ((index * 0.618) % 0.84),
  offset: (index * 0.137) % 1,
  speed: 0.008 + (index % 4) * 0.004,
  drift: (index % 2 ? 1 : -1) * (0.004 + (index % 3) * 0.002),
  size: index % 5 === 0 ? 2 : 1,
}));

export function Skyfield({ reducedMotion = false }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const width = 320;
    const height = 180;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    let frame = 0;
    let raf = 0;
    let last = 0;

    const draw = (time) => {
      ctx.clearRect(0, 0, width, height);
      for (const star of STARS) {
        const twinkle = reducedMotion ? 0.6 : 0.45 + 0.4 * Math.sin(time * 0.001 * star.speed + star.phase * 8);
        ctx.globalAlpha = Math.max(0.08, twinkle * 0.7);
        ctx.fillStyle =
          star.tone === "teal" ? "#7fc6b2" : star.tone === "ember" ? "#dca15f" : "#eadbb8";
        ctx.fillRect(Math.floor(star.x * width), Math.floor(star.y * height), star.size, star.size);
      }
      if (!reducedMotion) {
        for (const ember of EMBERS) {
          const t = (time * 0.00001 * ember.speed + ember.offset) % 1;
          const x = Math.floor((ember.x + Math.sin(t * 9 + ember.offset * 8) * ember.drift * 8) * width);
          const y = Math.floor((1 - t) * height);
          ctx.globalAlpha = Math.sin(t * Math.PI) * 0.36;
          ctx.fillStyle = t > 0.6 ? "#dd6b43" : "#d5a05b";
          ctx.fillRect(x, y, ember.size, ember.size);
        }
      }
      ctx.globalAlpha = 1;
    };

    const loop = (time) => {
      if (!last || time - last > 45) {
        draw(time);
        last = time;
      }
      frame = requestAnimationFrame(loop);
    };

    if (reducedMotion) {
      draw(1200);
    } else {
      frame = requestAnimationFrame(loop);
    }

    return () => cancelAnimationFrame(frame);
  }, [reducedMotion]);

  return <canvas ref={canvasRef} className="skyfield" aria-hidden="true" />;
}
