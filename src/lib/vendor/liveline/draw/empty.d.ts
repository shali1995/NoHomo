import type { LivelinePalette, ChartLayout } from '../types';
/**
 * Draw the empty/no-data state: a breathing squiggly line (grey) with
 * a gradient gap in the middle where "No data to display" text sits.
 *
 * skipLine=true skips the squiggly line but still draws the gradient
 * gap + text. Used as an overlay during chart morph so the gap fades
 * in smoothly over the morphing chart line.
 */
export declare function drawEmpty(ctx: CanvasRenderingContext2D, { w, h, pad }: Pick<ChartLayout, 'w' | 'h' | 'pad'>, palette: LivelinePalette, { alpha, now_ms, skipLine, emptyText }?: {
    alpha?: number;
    now_ms?: number;
    skipLine?: boolean;
    emptyText?: string;
}): void;
//# sourceMappingURL=empty.d.ts.map