import type { Momentum, LivelinePoint } from '../types';
/**
 * Auto-detect momentum from recent data points.
 * Only triggers during active movement — checks the last few points,
 * not the total delta over the full lookback window.
 */
export declare function detectMomentum(points: LivelinePoint[], lookback?: number): Momentum;
//# sourceMappingURL=momentum.d.ts.map