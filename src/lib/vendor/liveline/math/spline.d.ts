/**
 * Fritsch-Carlson monotone cubic interpolation.
 * Guarantees no overshoots — the curve never exceeds local min/max.
 * Used by Chart.js (monotone mode) and D3 (curveMonotoneX).
 *
 * Continues from current ctx position — caller must moveTo first point.
 */
export declare function drawSpline(ctx: CanvasRenderingContext2D, pts: [number, number][]): void;
//# sourceMappingURL=spline.d.ts.map