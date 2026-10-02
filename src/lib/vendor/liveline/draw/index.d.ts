import type { LivelinePalette, ChartLayout, LivelinePoint, Momentum, ReferenceLine, OrderbookData, DegenOptions, CandlePoint } from '../types';
import { type GridState } from './grid';
import { type TimeAxisState } from './timeAxis';
import { type OrderbookState } from './orderbook';
import { type ParticleState } from './particles';
export declare const FADE_EDGE_WIDTH = 40;
export interface MultiSeriesHoverEntry {
    color: string;
    label: string;
    value: number;
}
export interface ArrowState {
    up: number;
    down: number;
}
export interface ShakeState {
    amplitude: number;
}
export declare function createShakeState(): ShakeState;
export interface DrawOptions {
    visible: LivelinePoint[];
    smoothValue: number;
    now: number;
    momentum: Momentum;
    arrowState: ArrowState;
    showGrid: boolean;
    showMomentum: boolean;
    showPulse: boolean;
    showFill: boolean;
    referenceLine?: ReferenceLine;
    hoverX: number | null;
    hoverValue: number | null;
    hoverTime: number | null;
    scrubAmount: number;
    formatValue: (v: number) => string;
    formatTime: (time: number, step?: number) => string;
    gridState: GridState;
    timeAxisState: TimeAxisState;
    dt: number;
    targetWindowSecs: number;
    /** Scrub amount once the crosshair has yielded to the badge near the live dot. */
    crosshairOpacity: number;
    orderbookData?: OrderbookData;
    orderbookState?: OrderbookState;
    particleState?: ParticleState;
    particleOptions?: DegenOptions;
    swingMagnitude: number;
    shakeState?: ShakeState;
    chartReveal: number;
    pauseProgress: number;
    now_ms: number;
}
/**
 * Master draw function — calls each draw module in order.
 * Mutates arrowState in place.
 */
export declare function drawFrame(ctx: CanvasRenderingContext2D, layout: ChartLayout, palette: LivelinePalette, opts: DrawOptions): void;
export interface MultiSeriesEntry {
    id: string;
    visible: LivelinePoint[];
    smoothValue: number;
    palette: LivelinePalette;
    label?: string;
    alpha?: number;
    momentum?: Momentum;
    swingMagnitude?: number;
}
export interface MultiSeriesDrawOptions {
    series: MultiSeriesEntry[];
    now: number;
    showGrid: boolean;
    showPulse: boolean;
    referenceLine?: ReferenceLine;
    hoverX: number | null;
    hoverTime: number | null;
    hoverEntries: MultiSeriesHoverEntry[];
    scrubAmount: number;
    formatValue: (v: number) => string;
    formatTime: (time: number, step?: number) => string;
    gridState: GridState;
    timeAxisState: TimeAxisState;
    dt: number;
    targetWindowSecs: number;
    /** Scrub amount once the crosshair has yielded to the badge near the live dot. */
    crosshairOpacity: number;
    chartReveal: number;
    pauseProgress: number;
    now_ms: number;
    /** Primary palette (from first series) for grid/axis/crosshair colors */
    primaryPalette: LivelinePalette;
    /** One emitter per series id, present when particles are on */
    particleStates?: Map<string, ParticleState>;
    particleOptions?: DegenOptions;
    shakeState?: ShakeState;
}
/**
 * Multi-series draw function — draws multiple overlapping lines sharing the same axes.
 * No fill, no momentum arrows, no badge (those are per-chart concerns handled by the engine).
 */
export declare function drawMultiFrame(ctx: CanvasRenderingContext2D, layout: ChartLayout, opts: MultiSeriesDrawOptions): void;
export interface CandleDrawOptions {
    candles: CandlePoint[];
    displayCandleWidth: number;
    oldCandles: CandlePoint[];
    oldWidth: number;
    morphT: number;
    liveCandle?: CandlePoint;
    /** Pre-blend live candle for the dashed close-price line (unaffected by line mode morph) */
    closePriceCandle?: CandlePoint;
    liveTime: number;
    liveBirthAlpha: number;
    liveBullBlend: number;
    lineModeProg: number;
    chartReveal: number;
    now_ms: number;
    now: number;
    pauseProgress: number;
    showGrid: boolean;
    scrubAmount: number;
    hoverX: number | null;
    hoverValue: number | null;
    hoverTime: number | null;
    hoveredCandle: CandlePoint | null;
    formatValue: (v: number) => string;
    formatTime: (time: number, step?: number) => string;
    gridState: GridState;
    timeAxisState: TimeAxisState;
    dt: number;
    targetWindowSecs: number;
    /** Scrub amount once the crosshair has yielded to the badge near the live dot. */
    crosshairOpacity: number;
    lineVisible: LivelinePoint[];
    lineSmoothValue: number;
    emptyText?: string;
    loadingAlpha: number;
    showEmptyOverlay: boolean;
}
/**
 * Candlestick draw orchestrator — calls each draw module in the correct
 * order for candle mode. Pure drawing function, no state management.
 */
export declare function drawCandleFrame(ctx: CanvasRenderingContext2D, layout: ChartLayout, palette: LivelinePalette, opts: CandleDrawOptions): void;
//# sourceMappingURL=index.d.ts.map