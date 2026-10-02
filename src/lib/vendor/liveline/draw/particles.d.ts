import type { DrawOptions } from './index';
interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;
    size: number;
    color: string;
}
export interface ParticleState {
    particles: Particle[];
    cooldown: number;
    burstCount: number;
}
export declare function createParticleState(): ParticleState;
/**
 * Spawn particles on large upward swings. Returns the burst intensity
 * (0 = didn't fire, 0-1 = falloff) so the caller can scale shake.
 *
 * Small, fast-moving dots that disperse widely from the live dot position.
 * Accent-colored with alpha fade.
 */
export declare function spawnOnSwing(state: ParticleState, [dotX, dotY]: [number, number], accentColor: string, { momentum, swingMagnitude, dt, particleOptions: options, }: Pick<DrawOptions, 'momentum' | 'swingMagnitude' | 'dt' | 'particleOptions'>): number;
/**
 * Update and draw particles.
 */
export declare function drawParticles(ctx: CanvasRenderingContext2D, state: ParticleState, dt: number): void;
export {};
//# sourceMappingURL=particles.d.ts.map