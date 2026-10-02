/**
 * Frame-rate-independent exponential lerp.
 * `speed` is the fraction approached per 16.67ms (60fps frame).
 * At lower frame rates, dt is larger so we approach more per frame.
 */
export function lerp(current, target, speed, dt = 16.67) {
    // Convert per-frame speed to continuous decay factor
    const factor = 1 - Math.pow(1 - speed, dt / 16.67);
    return current + (target - current) * factor;
}
