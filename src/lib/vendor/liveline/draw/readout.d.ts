import type { LivelinePalette } from '../types';
/** One entry of the readout: an optional series dot and label, then the value. */
export interface ReadoutItem {
    value: string;
    label?: string;
    /** Series colour, drawn as a dot before the text. */
    dot?: string;
    /** Text colour of the value (default: the tooltip text colour). */
    color?: string;
}
interface PlacedItem {
    item: ReadoutItem;
    x: number;
    row: number;
    labelWidth: number;
}
export interface ReadoutLayout {
    items: PlacedItem[];
    rows: number;
    /** Width each item took, in order. */
    widths: number[];
}
/** Height the readout band takes above the plot for `rows` rows. */
export declare function readoutHeight(rows: number): number;
/**
 * Flows the items left to right, starting a new row when one would not fit.
 * `minWidths` holds each item's slot open at least that wide, so a value
 * that narrows does not pull the items after it back and forth.
 */
export declare function layoutReadout(ctx: CanvasRenderingContext2D, palette: LivelinePalette, items: ReadoutItem[], { maxWidth, minWidths }: {
    maxWidth: number;
    minWidths?: number[];
}): ReadoutLayout;
export declare function drawReadout(ctx: CanvasRenderingContext2D, palette: LivelinePalette, layout: ReadoutLayout, { x: left, y: top, alpha }: {
    x: number;
    y: number;
    alpha: number;
}): void;
export {};
//# sourceMappingURL=readout.d.ts.map