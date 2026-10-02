/** Get device pixel ratio, clamped to reasonable range. */
export function getDpr() {
    if (typeof window === 'undefined')
        return 1;
    return Math.min(window.devicePixelRatio || 1, 3);
}
/** Apply DPR scaling to canvas context. */
export function applyDpr(ctx, dpr, w, h) {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
}
