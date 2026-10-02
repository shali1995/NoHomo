import type { ChartLayout, LivelinePalette, CandlePoint } from '../types';
export type { CandlePoint } from '../types';
interface CandleCrosshairOptions {
    hoverX: number;
    opacity: number;
}
export declare const BULL = "#22c55e";
export declare const BEAR = "#ef4444";
/**
 * Draw OHLC candlesticks with live candle glow + scrub dimming.
 * Respects incoming ctx.globalAlpha for cross-fade/reveal support.
 */
export declare function drawCandlesticks(ctx: CanvasRenderingContext2D, layout: ChartLayout, candles: CandlePoint[], { candleWidthSecs, liveTime, now_ms, scrubX, scrubDim, liveAlpha, liveBullBlend, accentColor, accentBlend, }: {
    candleWidthSecs: number;
    liveTime: number;
    now_ms: number;
    scrubX: number;
    scrubDim: number;
    liveAlpha?: number;
    liveBullBlend?: number;
    accentColor?: string;
    accentBlend?: number;
}): void;
/**
 * Draw a dashed horizontal line at the live close price.
 * Dims when scrubbing, uses candle direction color.
 */
export declare function drawClosePrice(ctx: CanvasRenderingContext2D, layout: ChartLayout, liveCandle: CandlePoint, { scrubAmount: scrubDim, liveBullBlend: bullBlend }: {
    scrubAmount: number;
    liveBullBlend?: number;
}): void;
/** Candle crosshair: a vertical line through the hovered candle. */
export declare function drawCandleCrosshair(ctx: CanvasRenderingContext2D, layout: ChartLayout, palette: LivelinePalette, { hoverX, opacity }: CandleCrosshairOptions): void;
/** Line-mode crosshair: the vertical line plus a fainter horizontal one through the value. */
export declare function drawLineModeCrosshair(ctx: CanvasRenderingContext2D, layout: ChartLayout, palette: LivelinePalette, { hoverX, y, opacity }: CandleCrosshairOptions & {
    y: number;
}): void;
//# sourceMappingURL=candlestick.d.ts.map