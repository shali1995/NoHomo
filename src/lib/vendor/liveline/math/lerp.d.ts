/**
 * Frame-rate-independent exponential lerp.
 * `speed` is the fraction approached per 16.67ms (60fps frame).
 * At lower frame rates, dt is larger so we approach more per frame.
 */
export declare function lerp(current: number, target: number, speed: number, dt?: number): number;
//# sourceMappingURL=lerp.d.ts.map