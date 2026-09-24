import { useEffect, useRef, useCallback } from 'react';

interface Star {
  x: number;
  y: number;
  baseX: number;
  baseY: number;
  size: number;
  opacity: number;
  baseOpacity: number;
  speed: number;
  phase: number;
}

// Type for Network Information API (may not be available in all browsers)
interface NetworkInformation {
  effectiveType?: string;
}

// Extend Navigator type for connection property
interface NavigatorWithConnection extends Navigator {
  connection?: NetworkInformation;
}

/**
 * StarfieldBackground Component
 *
 * A subtle, premium starfield effect for the hero section.
 * Uses Canvas for optimal performance with GPU acceleration.
 *
 * Features:
 * - 100+ stars with pseudo-random distribution
 * - Slow idle floating animation
 * - Interactive cursor proximity effect
 * - Smooth repulsion and glow on cursor approach
 * - FPS-optimized with requestAnimationFrame
 * - Graceful degradation on mobile/low-power devices
 */
export function StarfieldBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const starsRef = useRef<Star[]>([]);
  const animationFrameRef = useRef<number>(0);
  const mouseRef = useRef({ x: -1000, y: -1000 });
  const lastTimeRef = useRef<number>(0);
  const isLowPowerRef = useRef<boolean>(false);

  // Generate a single star with pseudo-random properties
  const createStar = useCallback((width: number, height: number): Star => {
    return {
      // Base position for repulsion calculations
      baseX: Math.random() * width,
      baseY: Math.random() * height,
      // Current position
      x: Math.random() * width,
      y: Math.random() * height,
      // Visual properties: 1-2px size, 0.15-0.35 opacity
      size: Math.random() * 1 + 1,
      baseOpacity: Math.random() * 0.2 + 0.15,
      opacity: Math.random() * 0.2 + 0.15,
      // Animation properties: different speeds and phases for natural feel
      speed: Math.random() * 0.0003 + 0.0001,
      phase: Math.random() * Math.PI * 2,
    };
  }, []);

  // Initialize stars array
  const initStars = useCallback((width: number, height: number, count: number) => {
    starsRef.current = [];
    for (let i = 0; i < count; i++) {
      starsRef.current.push(createStar(width, height));
    }
  }, [createStar]);

  // Check for low-power devices (mobile, reduced motion preference, etc.)
  const checkLowPower = useCallback(() => {
    if (typeof window === 'undefined') return false;

    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Check for mobile device
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );

    // Check for connection speed (if available)
    const nav = navigator as NavigatorWithConnection;
    const connection = nav.connection;
    const isSlowConnection = connection &&
      (connection.effectiveType === 'slow-2g' ||
       connection.effectiveType === '2g');

    return prefersReducedMotion || isMobile || isSlowConnection;
  }, []);

  // Draw a single star with optional glow effect
  const drawStar = useCallback((
    ctx: CanvasRenderingContext2D,
    star: Star,
    isNearCursor: boolean
  ) => {
    ctx.beginPath();
    ctx.arc(star.x, star.y, star.size / 2, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity})`;
    ctx.fill();

    // Add subtle glow for stars near cursor
    if (isNearCursor && star.opacity > star.baseOpacity) {
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.size * 2, 0, Math.PI * 2);
      const gradient = ctx.createRadialGradient(
        star.x, star.y, 0,
        star.x, star.y, star.size * 2
      );
      gradient.addColorStop(0, `rgba(255, 255, 255, ${star.opacity * 0.3})`);
      gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = gradient;
      ctx.fill();
    }
  }, []);

  // Main animation loop
  const animate = useCallback((timestamp: number) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');

    if (!canvas || !ctx) return;

    // Calculate delta time for smooth animations
    const deltaTime = timestamp - lastTimeRef.current;
    lastTimeRef.current = timestamp;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Mouse proximity threshold
    const proximityThreshold = 100;
    const repulsionStrength = 8;

    // Update and draw each star
    starsRef.current.forEach((star) => {
      // Calculate distance to mouse
      const dx = mouseRef.current.x - star.baseX;
      const dy = mouseRef.current.y - star.baseY;
      const distance = Math.sqrt(dx * dx + dy * dy);

      // Determine if star is near cursor
      const isNearCursor = distance < proximityThreshold && mouseRef.current.x > 0;

      // Idle floating animation using sine wave
      const time = timestamp * star.speed;
      const floatOffset = Math.sin(time + star.phase) * 2;

      // Calculate repulsion from cursor
      let repulsionX = 0;
      let repulsionY = 0;
      if (isNearCursor) {
        const force = (1 - distance / proximityThreshold) * repulsionStrength;
        repulsionX = -(dx / distance) * force;
        repulsionY = -(dy / distance) * force;
      }

      // Apply smooth easing to opacity
      const targetOpacity = isNearCursor
        ? Math.min(star.baseOpacity * 2.5, 0.6)
        : star.baseOpacity;
      star.opacity += (targetOpacity - star.opacity) * 0.1;

      // Update position with smooth easing
      star.x += ((star.baseX + floatOffset + repulsionX) - star.x) * 0.08;
      star.y += ((star.baseY + floatOffset + repulsionY) - star.y) * 0.08;

      // Draw the star
      drawStar(ctx, star, isNearCursor);
    });

    // Continue animation loop
    if (!isLowPowerRef.current) {
      animationFrameRef.current = requestAnimationFrame(animate);
    }
  }, [drawStar]);

  // Handle mouse movement
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
    if (!canvasRef.current || !containerRef.current) return;

    const canvas = canvasRef.current;
    const container = containerRef.current;
    const dpr = window.devicePixelRatio || 1;

    // Set actual size in memory
    canvas.width = container.clientWidth * dpr;
    canvas.height = container.clientHeight * dpr;

    // Scale down with CSS
    canvas.style.width = `${container.clientWidth}px`;
    canvas.style.height = `${container.clientHeight}px`;

    // Get context and scale
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.scale(dpr, dpr);
    }

    // Reinitialize stars with new dimensions
    const starCount = isLowPowerRef.current ? 50 : 120;
    initStars(container.clientWidth, container.clientHeight, starCount);
  }, [initStars]);

  // Setup effect
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check for low-power devices
    isLowPowerRef.current = checkLowPower();

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
  }, [animate, handleResize, checkLowPower]);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 z-0 overflow-hidden pointer-events-none"
      aria-hidden="true"
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      />
    </div>
  );
}

export default StarfieldBackground;

