import React, { useEffect, useRef } from "react";
import StarLayer from "./StarLayer";
import { LayerConfig } from "./types";
import useParallax from "./useParallax";
import useMouseGlow from "./useMouseGlow";

// BackgroundFX: single full-screen canvas with layered stars, parallax, hover glow, and data pulses.
// Layering / z-index: we explicitly set `zIndex: 10` inline to ensure this canvas sits above
// site grid overlays (z-1) and background, but below interactive content (z-20+).
// pointerEvents: 'none' ensures it never blocks user interaction.

const BackgroundFX: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const layersRef = useRef<StarLayer[]>([]);
  const rafRef = useRef<number | null>(null);
  const lastT = useRef(performance.now());
  const { velocity } = useParallax();
  const { mouse } = useMouseGlow();

  // Respect reduced motion preference
  const prefersReducedMotion = typeof window !== "undefined" &&
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  useEffect(() => {
    const canvas = canvasRef.current!;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;

    const resize = () => {
      const dpr = Math.max(1, window.devicePixelRatio || 1);
      const w = Math.max(1, window.innerWidth);
      const h = Math.max(1, window.innerHeight);
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;

      // Initialize or resize layers
      if (layersRef.current.length === 0) {
        // each layer between 150-250 stars
        const layerA: LayerConfig = { count: 180, speed: 0.02, parallaxFactor: 0.2 };
        const layerB: LayerConfig = { count: 200, speed: 0.04, parallaxFactor: 0.5 };
        const layerC: LayerConfig = { count: 220, speed: 0.08, parallaxFactor: 1.0 };
        layersRef.current = [
          new StarLayer(layerA, w, h),
          new StarLayer(layerB, w, h),
          new StarLayer(layerC, w, h),
        ];
      } else {
        layersRef.current.forEach((L) => L.resize(w, h));
      }
    };

    resize();
    window.addEventListener("resize", resize);

    // draw initial static frame so stars are visible immediately
    const drawInitial = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "black";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      const dpr = Math.max(1, window.devicePixelRatio || 1);
      for (const L of layersRef.current) L.draw(ctx, dpr, mouse);
      // draw faint data pulses once
      drawPulses(ctx, canvas.width, canvas.height, dpr, 0);
    };

    drawInitial();

    const animate = (t: number) => {
      const dt = Math.min(0.05, (t - lastT.current) / 1000);
      lastT.current = t;

      const dpr = Math.max(1, window.devicePixelRatio || 1);
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // faint background is intentionally left black so stars pop on pure black
      // draw star layers back -> front
      for (let i = 0; i < layersRef.current.length; i++) {
        const L = layersRef.current[i];
        L.update(dt, velocity, mouse, prefersReducedMotion);
        L.draw(ctx, dpr, mouse);
      }

      // data pulses
      drawPulses(ctx, canvas.width, canvas.height, dpr, t);

      if (!prefersReducedMotion) rafRef.current = requestAnimationFrame(animate);
    };

    if (!prefersReducedMotion) rafRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("resize", resize);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // draw pulses: very faint horizontal sine-wave bands moving upward slowly
  function drawPulses(ctx: CanvasRenderingContext2D, cw: number, ch: number, dpr: number, t: number) {
    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.globalCompositeOperation = "source-over";
    ctx.lineWidth = 1;
    ctx.strokeStyle = "rgba(255,255,255,0.03)"; // <= 0.04 opacity

    const now = t / 1000 || 0;
    const bands = 3;
    for (let b = 0; b < bands; b++) {
      ctx.beginPath();
      const amplitude = 6 + b * 4;
      const freq = 0.002 + b * 0.001;
      const yOffset = ((now * 6) % (ch / dpr)) * (0.2 + b * 0.05) + (b * 120);
      for (let x = 0; x < cw / dpr; x += 8) {
        const y = (Math.sin((x * freq) + now * 0.2 * (b + 1)) * amplitude) + (yOffset % (ch / dpr));
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    ctx.restore();
  }

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      // inline styles enforce placement + stacking without touching global CSS
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        pointerEvents: "none", // never block interactions
        zIndex: 10, // explicitly set to sit above grid overlays but below main content
        mixBlendMode: "normal",
      }}
    />
  );
};

export default BackgroundFX;
