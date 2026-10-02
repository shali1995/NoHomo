import type { LivelinePoint } from '../types';
/** Copy the inclusive time range from points sorted by ascending time. */
export declare function sliceTimeRange<T extends {
    time: number;
}>(points: readonly T[], from: number, to: number): T[];
/**
 * Binary search to find interpolated value at a given time.
 * Clamps outside the data range; returns null for empty data.
 */
export declare function interpolateAtTime(points: LivelinePoint[], time: number): number | null;
//# sourceMappingURL=interpolate.d.ts.map