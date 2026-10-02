import type { LivelinePalette, ChartLayout, OrderbookData } from '../types';
interface StreamLabel {
    y: number;
    text: string;
    green: boolean;
    life: number;
    maxLife: number;
    intensity: number;
}
export interface OrderbookState {
    labels: StreamLabel[];
    spawnTimer: number;
    smoothSpeed: number;
    prevBidTotal: number;
    prevAskTotal: number;
    churnRate: number;
}
export declare function createOrderbookState(): OrderbookState;
/**
 * Kalshi-style orderbook: left-aligned column spanning full chart height.
 * Labels decelerate as they rise — fast entry at bottom, slow drift at top.
 * Speed driven by two signals:
 *   1. swingMagnitude — price momentum (proxy for activity)
 *   2. orderbook churn — how much the bid/ask data itself is changing
 * Whichever signal is stronger wins. Works with both demo and production data.
 */
export declare function drawOrderbook(ctx: CanvasRenderingContext2D, layout: ChartLayout, palette: LivelinePalette, { orderbook, dt, state, swingMagnitude }: {
    orderbook: OrderbookData;
    dt: number;
    state: OrderbookState;
    swingMagnitude: number;
}): void;
export {};
//# sourceMappingURL=orderbook.d.ts.map