/// <reference types="vite/client" />

// `canvas-confetti` não publica seus próprios tipos e não há pacote
// `@types/canvas-confetti`. Declaração mínima só com a API usada em
// StoreRankingDisplay (celebração ao bater meta).
declare module "canvas-confetti" {
  interface ConfettiOptions {
    particleCount?: number;
    angle?: number;
    spread?: number;
    startVelocity?: number;
    decay?: number;
    gravity?: number;
    ticks?: number;
    origin?: { x?: number; y?: number };
    colors?: string[];
    scalar?: number;
    zIndex?: number;
    disableForReducedMotion?: boolean;
  }

  type ConfettiFn = (options?: ConfettiOptions) => Promise<null> | null;

  const confetti: ConfettiFn;
  export default confetti;
}
