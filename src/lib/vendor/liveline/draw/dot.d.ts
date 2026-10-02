import type { Momentum, LivelinePalette } from '../types';
import type { ArrowState } from './index';
/** Draw the live dot: expanding ring pulse, white outer circle, colored inner dot. */
export declare function drawDot(ctx: CanvasRenderingContext2D, [x, y]: [number, number], palette: LivelinePalette, { pulse, scrubAmount, now_ms }?: {
    pulse?: boolean;
    scrubAmount?: number;
    now_ms?: number;
}): void;
/** Draw a multi-series endpoint dot with optional pulse ring (colored ring + solid dot, no white outer, no shadow). */
export declare function drawMultiDot(ctx: CanvasRenderingContext2D, [x, y]: [number, number], color: string, { pulse, now_ms, radius }?: {
    pulse?: boolean;
    now_ms?: number;
    radius?: number;
}): void;
/** Draw a small colored dot for multi-series endpoints (no ring, no pulse, no shadow). */
export declare function drawSimpleDot(ctx: CanvasRenderingContext2D, [x, y]: [number, number], color: string, radius?: number): void;
/** Draw momentum arrows (chevrons) next to the dot. */
export declare function drawArrows(ctx: CanvasRenderingContext2D, [x, y]: [number, number], palette: LivelinePalette, { momentum, arrowState: arrows, dt, now_ms }: {
    momentum: Momentum;
    arrowState: ArrowState;
    dt: number;
    now_ms?: number;
}): void;
//# sourceMappingURL=dot.d.ts.map