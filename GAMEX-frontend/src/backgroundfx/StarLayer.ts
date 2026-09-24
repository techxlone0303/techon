import { Star, LayerConfig, MousePoint } from "./types";

export class StarLayer {
  stars: Star[] = [];
  cfg: LayerConfig;
  w = 0;
  h = 0;

  constructor(cfg: LayerConfig, w: number, h: number) {
    this.cfg = cfg;
    this.w = w;
    this.h = h;
    this.generateStars();
  }

  generateStars() {
    this.stars = new Array(this.cfg.count).fill(0).map(() => {
      const r = 0.5 + Math.random() * 1.3; // 0.5 - 1.8
      const baseOpacity = 0.3 + Math.random() * 0.5; // 0.3 - 0.8
      return {
        x: Math.random() * this.w,
        y: Math.random() * this.h,
        r,
        baseOpacity,
        opacity: baseOpacity,
        twinklePhase: Math.random() * Math.PI * 2,
      } as Star;
    });
  }

  resize(w: number, h: number) {
    this.w = w;
    this.h = h;
    // reposition stars proportionally to avoid popping
    this.stars.forEach((s) => {
      s.x = Math.min(s.x, w - 1);
      s.y = Math.min(s.y, h - 1);
    });
  }

  // update stars; dt in seconds, scrollVel vertical px/s, mouse for glow
  update(dt: number, scrollVel: number, mouse: MousePoint, prefersReducedMotion: boolean) {
    if (prefersReducedMotion) return;

    const drift = this.cfg.speed * dt * 60; // normalize across frame rate
    for (const s of this.stars) {
      // vertical drift plus small horizontal jitter
      s.y += drift + scrollVel * this.cfg.parallaxFactor * dt;
      s.x += Math.sin((s.y + s.x) * 0.0005) * 0.2 * this.cfg.parallaxFactor;

      // wrap
      if (s.y > this.h + 10) s.y = -10;
      if (s.y < -10) s.y = this.h + 10;

      // twinkle
      s.twinklePhase += dt * (0.5 + Math.random() * 0.5);
      s.opacity = s.baseOpacity + Math.sin(s.twinklePhase) * 0.08;

      // mouse glow: if mouse close, boost opacity (handled in draw more precisely)
    }
  }

  draw(ctx: CanvasRenderingContext2D, devicePixelRatio: number, mouse: MousePoint) {
    ctx.save();
    ctx.scale(devicePixelRatio, devicePixelRatio);
    ctx.fillStyle = "white";
    for (const s of this.stars) {
      const { x, y, r } = s as Star;
      // compute extra glow from mouse
      let localOpacity = s.opacity;
      if (mouse) {
        const dx = x - mouse.x;
        const dy = y - mouse.y;
        const d2 = dx * dx + dy * dy;
        const radius = 100; // 100px effect radius
        if (d2 < radius * radius) {
          const dist = Math.sqrt(d2);
          const t = 1 - dist / radius; // 0..1
          // smooth falloff
          localOpacity = Math.min(1, localOpacity + t * 0.9);
        }
      }

      ctx.globalAlpha = Math.max(0, Math.min(1, localOpacity));
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}

export default StarLayer;
