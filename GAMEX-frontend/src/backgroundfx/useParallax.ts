import { useEffect, useRef, useState } from "react";

// Returns smoothed scroll velocity (px per second) and raw scrollY
export function useParallax() {
  const lastY = useRef(window.scrollY || 0);
  const lastT = useRef(performance.now());
  const vel = useRef(0);
  const raf = useRef<number | null>(null);
  const [velocity, setVelocity] = useState(0);

  useEffect(() => {
    const loop = (t: number) => {
      const y = window.scrollY || 0;
      const dt = Math.max(1e-3, (t - lastT.current) / 1000);
      const raw = (y - lastY.current) / dt; // px/s
      // smooth the velocity
      vel.current = vel.current * 0.9 + raw * 0.1;
      lastY.current = y;
      lastT.current = t;
      setVelocity(vel.current);
      raf.current = requestAnimationFrame(loop);
    };
    raf.current = requestAnimationFrame(loop);
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, []);

  return { velocity };
}

export default useParallax;
