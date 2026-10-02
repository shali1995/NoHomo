import type { LivelinePalette, ChartLayout, LivelinePoint } from '../types';
export declare function drawLine(ctx: CanvasRenderingContext2D, layout: ChartLayout, palette: LivelinePalette, { visible, smoothValue, now, showFill, hoverX, scrubAmount, chartReveal, now_ms, colorBlend, skipDashLine, fillScale, }: {
    visible: LivelinePoint[];
    smoothValue: number;
    now: number;
    showFill: boolean;
    hoverX: number | null;
    scrubAmount?: number;
    chartReveal?: number;
    now_ms?: number;
    colorBlend?: number;
    skipDashLine?: boolean;
    fillScale?: number;
}): [number, number][] | undefined;
//# sourceMappingURL=line.d.ts.map