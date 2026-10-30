// Number that counts up when it appears.
import { useEffect, useState } from 'react';

export default function Stat({ value, suffix = '', label }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    const start = performance.now();
    let raf;
    const tick = (now) => {
      const p = Math.min((now - start) / 1400, 1);
      setN(Math.round(value * (1 - Math.pow(1 - p, 3))));   // ease-out
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return (
    <div className="stat">
      <span className="stat-num">{n}{suffix}</span>
      <span className="stat-label">{label}</span>
    </div>
  );
}
