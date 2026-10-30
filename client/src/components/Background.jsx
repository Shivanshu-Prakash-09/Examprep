// Animated page background: rows of fine lines that roll like a signal trace and lift toward the cursor.
// Drawn on one canvas (cheap: ~50 lines), paused when the tab is hidden, a still frame if the user prefers reduced motion.
import { useEffect, useRef } from 'react';

// smooth pseudo-noise from a few sines (no library needed)
const wave = (x, y, t) =>
  Math.sin(x * 1.3 + t * 0.9 + Math.sin(y * 0.7 + t * 0.5) * 1.6) * 0.5 +
  Math.sin(x * 2.7 - t * 0.6 + y * 1.9) * 0.25 +
  Math.sin(x * 0.55 + y * 2.3 + t * 0.35) * 0.25;

export default function Background() {
  const ref = useRef(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas.getContext('2d');
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
    const mouse = { x: -9999, y: -9999, tx: -9999, ty: -9999 };
    const colors = { bg: '#F2F4F7', line: 'rgba(36,56,240,.2)' };
    let w = 0, h = 0, t = 3, raf = 0, frame = 0;

    const readColors = () => {
      const s = getComputedStyle(document.documentElement);
      colors.bg = s.getPropertyValue('--bg').trim() || colors.bg;
      colors.line = s.getPropertyValue('--field').trim() || colors.line;
    };
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth; h = window.innerHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      draw();
    };

    function draw() {
      ctx.fillStyle = colors.bg;
      ctx.fillRect(0, 0, w, h);
      const spacing = Math.max(13, h / 46);
      const top = h * 0.2;
      const count = Math.ceil((h - top) / spacing) + 4;
      ctx.lineWidth = 1;
      ctx.strokeStyle = colors.line;
      for (let i = 0; i < count; i++) {
        const base = top + i * spacing;
        const depth = i / count;                       // 0 far (top) .. 1 near (bottom)
        const amp = 5 + 40 * depth;
        const pts = [];
        for (let x = -8; x <= w + 8; x += 7) {
          const ridge = Math.exp(-Math.pow(x / w - 0.7, 2) / 0.07);   // a swell on the right side
          let y = base + wave(x / 140, i * 0.35, t) * amp * (0.3 + ridge * 1.1);
          const dx = x - mouse.x, dy = base - mouse.y;
          y -= 46 * Math.exp(-(dx * dx + dy * dy) / (2 * 130 * 130));  // lifts near the cursor
          pts.push(x, y);
        }
        ctx.beginPath();                 // 1) filled shape: each row hides the rows behind it
        ctx.moveTo(-8, h + 6);
        for (let k = 0; k < pts.length; k += 2) ctx.lineTo(pts[k], pts[k + 1]);
        ctx.lineTo(w + 8, h + 6);
        ctx.closePath();
        ctx.fillStyle = colors.bg;
        ctx.fill();
        ctx.beginPath();                 // 2) only the top edge is stroked (no side/bottom lines)
        ctx.moveTo(pts[0], pts[1]);
        for (let k = 2; k < pts.length; k += 2) ctx.lineTo(pts[k], pts[k + 1]);
        ctx.stroke();
      }
    }

    const loop = () => {
      t += 0.0042;
      mouse.x += (mouse.tx - mouse.x) * 0.06;
      mouse.y += (mouse.ty - mouse.y) * 0.06;
      if (++frame % 120 === 0) readColors();   // follows light/dark changes
      draw();
      raf = requestAnimationFrame(loop);
    };
    const start = () => { cancelAnimationFrame(raf); if (!reduce.matches) raf = requestAnimationFrame(loop); else draw(); };
    const onMove = (e) => { mouse.tx = e.clientX; mouse.ty = e.clientY; if (mouse.x < -999) { mouse.x = e.clientX; mouse.y = e.clientY; } };
    const onLeave = () => { mouse.tx = mouse.ty = -9999; };

    readColors(); resize(); start();
    window.addEventListener('resize', resize);
    window.addEventListener('pointermove', onMove, { passive: true });
    document.addEventListener('pointerleave', onLeave);
    reduce.addEventListener('change', start);
    const dark = window.matchMedia('(prefers-color-scheme: dark)');
    const onScheme = () => { readColors(); draw(); };
    dark.addEventListener('change', onScheme);
    window.addEventListener('themechange', onScheme);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerleave', onLeave);
      reduce.removeEventListener('change', start);
      dark.removeEventListener('change', onScheme);
      window.removeEventListener('themechange', onScheme);
    };
  }, []);

  return <canvas ref={ref} className="bg-canvas" aria-hidden="true" />;
}
