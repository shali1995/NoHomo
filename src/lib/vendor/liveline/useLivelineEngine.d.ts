import type { LivelinePoint, LivelinePalette, Momentum, ReferenceLine, HoverPoint, Padding, OrderbookData, DegenOptions, BadgeVariant, CandlePoint } from './types';
interface EngineConfig {
    data: LivelinePoint[];
    value: number;
    palette: LivelinePalette;
    windowSecs: number;
    lerpSpeed: number;
    showGrid: boolean;
    showBadge: boolean;
    showMomentum: boolean;
    momentumOverride?: Momentum;
    showFill: boolean;
    referenceLine?: ReferenceLine;
    formatValue: (v: number) => string;
    formatTime: (time: number, step?: number) => string;
    padding: Required<Padding>;
    onHover?: (point: HoverPoint | null) => void;
    showPulse: boolean;
    scrub: boolean;
    exaggerate: boolean;
    degenOptions?: DegenOptions;
    badgeTail: boolean;
    badgeVariant: BadgeVariant;
    valueMomentumColor: boolean;
    valueDisplayElement?: HTMLSpanElement | null;
    orderbookData?: OrderbookData;
    loading?: boolean;
    paused?: boolean;
    emptyText?: string;
    mode: 'line' | 'candle';
    candles?: CandlePoint[];
    candleWidth?: number;
    liveCandle?: CandlePoint;
    lineMode?: boolean;
    lineData?: LivelinePoint[];
    lineValue?: number;
    multiSeries?: Array<{
        id: string;
        data: LivelinePoint[];
        value: number;
        palette: LivelinePalette;
        label?: string;
    }>;
    isMultiSeries?: boolean;
    hiddenSeriesIds?: Set<string>;
}
export interface LivelineEngineController {
    update(config: EngineConfig): void;
    destroy(): void;
}
export declare function mountLivelineEngine(canvasElement: HTMLCanvasElement, container: HTMLDivElement, initialConfig: EngineConfig): LivelineEngineController;
export {};
//# sourceMappingURL=useLivelineEngine.d.ts.map