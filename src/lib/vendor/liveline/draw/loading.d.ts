import type { LivelinePalette, ChartLayout } from '../types';
/**
 * Draw the loading state: a gently undulating line in accent color at
 * breathing alpha. Uses drawSpline (same renderer as the chart line)
 * through evenly-spaced samples of loadingY — guarantees the loading
 * line and chart morph base produce visually identical curves.
 */
export declare function drawLoading(ctx: CanvasRenderingContext2D, { w, h, pad }: Pick<ChartLayout, 'w' | 'h' | 'pad'>, palette: LivelinePalette, { now_ms, alpha, strokeColor }: {
    now_ms: number;
    alpha?: number;
    strokeColor?: string;
}): void;
//# sourceMappingURL=loading.d.ts.map