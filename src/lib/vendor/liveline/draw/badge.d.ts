/**
 * Generate SVG path data for the badge pill + curved tail shape.
 *
 * Coordinate system: (0,0) is top-left of the shape bounding box.
 * Total size: (tailLen + pillW) × pillH.
 * The tail tip points left at (0, pillH/2).
 */
export declare function badgeSvgPath(pillW: number, pillH: number, tailLen: number, tailSpread: number): string;
/**
 * Simple pill (no tail) — a rounded rect.
 */
export declare function badgePillOnly(pillW: number, pillH: number): string;
/** Badge geometry constants */
export declare const BADGE_PAD_X = 10;
export declare const BADGE_PAD_Y = 3;
export declare const BADGE_TAIL_LEN = 5;
export declare const BADGE_TAIL_SPREAD = 2.5;
export declare const BADGE_LINE_H = 16;
//# sourceMappingURL=badge.d.ts.map