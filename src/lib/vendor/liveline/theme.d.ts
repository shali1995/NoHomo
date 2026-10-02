import type { ThemeMode, LivelinePalette, LivelineSeries } from './types';
/** Parse any CSS color string to [r, g, b]. Handles hex (#rgb, #rrggbb), rgb(), rgba(). */
export declare function parseColorRgb(color: string): [number, number, number];
/**
 * Derive a full palette from a single accent color + theme mode.
 * Momentum colors are always semantic green/red regardless of accent.
 */
export declare function resolveTheme(color: string, mode: ThemeMode): LivelinePalette;
/** Default color palette for multi-series when no colors specified. */
export declare const SERIES_COLORS: string[];
/** Derive per-series palettes from series definitions. */
export declare function resolveSeriesPalettes(series: LivelineSeries[], mode: ThemeMode): Map<string, LivelinePalette>;
//# sourceMappingURL=theme.d.ts.map