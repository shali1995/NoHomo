import type { LivelinePoint } from '../types';
/**
 * Compute visible Y range from data points + current value.
 * Returns { min, max } with margin applied.
 */
export declare function computeRange(visible: LivelinePoint[], currentValue: number, referenceValue?: number, exaggerate?: boolean): {
    min: number;
    max: number;
};
//# sourceMappingURL=range.d.ts.map