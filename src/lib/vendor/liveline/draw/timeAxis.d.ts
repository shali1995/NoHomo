import type { LivelinePalette, ChartLayout } from '../types';
import type { DrawOptions } from './index';
export interface TimeAxisState {
    labels: Map<number, {
        alpha: number;
        text: string;
    }>;
}
export declare function drawTimeAxis(ctx: CanvasRenderingContext2D, layout: ChartLayout, palette: LivelinePalette, { targetWindowSecs, formatTime, timeAxisState: state, dt, }: Pick<DrawOptions, 'targetWindowSecs' | 'formatTime' | 'timeAxisState' | 'dt'>): void;
//# sourceMappingURL=timeAxis.d.ts.map