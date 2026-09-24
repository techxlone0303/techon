import { useEffect, useRef, useCallback } from 'react';

/**
 * StarfieldCanvas Component
 *
 * A premium interactive starfield background using HTML5 Canvas.
 *
 * Z-INDEX STRATEGY:
 * - Stars render BEHIND the grid pattern (z-0) but IN FRONT of solid background
 * - Content (hero text, buttons) sits on top with z-10
 * - pointer-events: none ensures clicks pass through to content
 *
 * LAYER ORDER (bottom to top):
 * 1. Solid black background
 * 2. StarfieldCanvas (z-index: 0, pointer-events: none)
 * 3. Grid pattern overlay
 * 4. Hero content (z-index: 10)
 */
interface Star {
  x: number;
  y: number;
  radius: number;
  baseOpacity: number;
  opacity: number;
  velocity: { x: number; y: number };
  driftPhase: number;
  driftSpeed: number;
}

export function StarfieldCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const starsRef = useRef<Star[]>([]);
  const animationFrameRef = useRef<number>(0);
  const mouseRef = useRef({ x: -1000, y: -1000 });
  const lastTimeRef = useRef<number>(0);
  const isLowPowerRef = useRef<boolean>(false);

  // Initialize stars with random properties
  const initStars = useCallback((width: number, height: number, count: number) => {
    starsRef.current = [];
    for (let i = 0; i < count; i++) {
      starsRef.current.push({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: Math.random() * 1 + 0.5, // 0.5px - 1.5px radius
        baseOpacity: Math.random() * 0.4 + 0.2, // 0.2 - 0.6 opacity
        opacity: Math.random() * 0.4 + 0.2,
        velocity: {
          x: (Math.random() - 0.5) * 0.02,
          y: (Math.random() - 0.5) * 0.02,
        },
        driftPhase: Math.random() * Math.PI * 2,
        driftSpeed: Math.random() * 0.0003 + 0.0001,
      });
    }
  }, []);

  // Check for reduced motion preference
  const checkReducedMotion = useCallback(() => {
    if (typeof window === 'undefined') return true;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  // Draw a single star with optional glow effect
  const drawStar = useCallback((ctx: CanvasRenderingContext2D, star: Star, isNearCursor: boolean) => {
    // Calculate glow effect when near cursor
    const glowRadius = isNearCursor ? star.radius * 3 : star.radius;
    const glowOpacity = isNearCursor ? star.opacity * 0.5 : 0;

    // Draw glow halo
    if (isNearCursor) {
      const gradient = ctx.createRadialGradient(
        star.x, star.y, 0,
        star.x, star.y, glowRadius
      );
      gradient.addColorStop(0, `rgba(255, 255, 255, ${glowOpacity})`);
      gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.beginPath();
      ctx.arc(star.x, star.y, glowRadius, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();
    }

    // Draw star core
    ctx.beginPath();
    ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity})`;
    ctx.fill();
  }, []);

  // Main animation loop
  const animate = useCallback((timestamp: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Calculate delta time
    const deltaTime = timestamp - lastTimeRef.current;
    lastTimeRef.current = timestamp;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const mouseX = mouseRef.current.x;
    const mouseY = mouseRef.current.y;
    const interactionRadius = 80;

    // Update and draw each star
    starsRef.current.forEach((star) => {
      // Calculate distance to mouse
      const dx = mouseX - star.x;
      const dy = mouseY - star.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      // Determine if star is near cursor
      const isNearCursor = distance < interactionRadius && mouseX >= 0;

      // Idle drift animation
      const driftOffset = Math.sin(timestamp * star.driftSpeed + star.driftPhase) * 0.3;
      star.x += star.velocity.x + driftOffset;
      star.y += star.velocity.y + driftOffset;

      // Wrap around edges
      if (star.x < 0) star.x = canvas.width;
      if (star.x > canvas.width) star.x = 0;
      if (star.y < 0) star.y = canvas.height;
      if (star.y > canvas.height) star.y = 0;

      // Smooth opacity transition
      const targetOpacity = isNearCursor
        ? Math.min(star.baseOpacity * 2, 0.9)
        : star.baseOpacity;
      star.opacity += (targetOpacity - star.opacity) * 0.1;

      // Draw the star
      drawStar(ctx, star, isNearCursor);
    });

    // Continue animation loop
    if (!isLowPowerRef.current) {
      animationFrameRef.current = requestAnimationFrame(animate);
    }
  }, [drawStar]);

  // Handle mouse movement (throttled)
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    mouseRef.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  }, []);

  // Handle mouse leave
  const handleMouseLeave = useCallback(() => {
    mouseRef.current = { x: -1000, y: -1000 };
  }, []);

  // Handle window resize
  const handleResize = useCallback(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const dpr = window.devicePixelRatio || 1;

    // Set actual size in memory
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;

    // Scale down with CSS
    canvas.style.width = `${window.innerWidth}px`;
    canvas.style.height = `${window.innerHeight}px`;

    // Get context and scale
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.scale(dpr, dpr);
    }

    // Reinitialize stars with new dimensions
    const starCount = isLowPowerRef.current ? 100 : 250;
    initStars(window.innerWidth, window.innerHeight, starCount);
  }, [initStars]);

  // Setup effect
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check for reduced motion
    isLowPowerRef.current = checkReducedMotion();

    // Initial setup
    handleResize();

    // Start animation
    if (!isLowPowerRef.current) {
      animationFrameRef.current = requestAnimationFrame(animate);
    }

    // Event listeners
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [animate, handleResize, checkReducedMotion]);

  return (
    <canvas
      ref={canvasRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="fixed inset-0 w-full h-full pointer-events-none z-0"
      aria-hidden="true"
    />
  );
}

export default StarfieldCanvas;

