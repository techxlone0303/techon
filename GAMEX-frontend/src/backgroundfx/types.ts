export type Star = {
  x: number;
  y: number;
  r: number; // radius
  baseOpacity: number;
  opacity: number;
  twinklePhase: number;
};

export type LayerConfig = {
  count: number;
  speed: number; // base vertical speed multiplier
  parallaxFactor: number; // how much scroll velocity affects this layer
};

export type MousePoint = { x: number; y: number } | null;
