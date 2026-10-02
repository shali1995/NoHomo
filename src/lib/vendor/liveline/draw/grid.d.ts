import type { LivelinePalette, ChartLayout } from '../types';
import type { DrawOptions } from './index';
/** Persistent state — interval hysteresis + per-label alpha smoothing. */
export interface GridState {
    interval: number;
    labels: Map<number, number>;
}
export declare function drawGrid(ctx: CanvasRenderingContext2D, layout: ChartLayout, palette: LivelinePalette, { formatValue, gridState: state, dt }: Pick<DrawOptions, 'formatValue' | 'gridState' | 'dt'>): void;
//# sourceMappingURL=grid.d.ts.map