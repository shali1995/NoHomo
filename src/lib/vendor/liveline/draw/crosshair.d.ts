import type { LivelinePalette, ChartLayout } from '../types';
export interface CrosshairPoint {
    y: number;
    color: string;
}
/**
 * Vertical line through the hovered time, with a solid dot where it meets
 * each series. The values themselves live in the readout above the plot.
 */
export declare function drawCrosshair(ctx: CanvasRenderingContext2D, layout: ChartLayout, palette: LivelinePalette, { hoverX, points, opacity }: {
    hoverX: number;
    points: CrosshairPoint[];
    opacity: number;
}): void;
//# sourceMappingURL=crosshair.d.ts.map