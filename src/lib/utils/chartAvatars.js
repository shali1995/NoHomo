import { tc } from "./chartTheme.js";
import { drawChefHat } from "./chartPrimitives.js";

/**
 * How many faces a candle shows before the rest are counted instead. A busy candle in a fast
 * timeframe otherwise turns into a row of twenty bubbles.
 */
export const MAX_AVATARS = 3;

/** The stand-in drawn for a marker whose owner has no picture of their own. */
const FALLBACK_MARK = "/images/nohomo-eyes.png";

/** In-flight image cache. The chart redraws on every frame, so avatars are loaded once. */
const imgCache = new Map();
let onImageLoad = null;

/** Tell the host to redraw once a newly requested avatar finishes loading. */
export function setAvatarLoadHook(fn) {
  onImageLoad = fn;
}

function loadImg(url) {
  const cached = imgCache.get(url);
  if (cached) return cached.complete && cached.naturalWidth > 0 ? cached : null;
  const img = new Image();
  img.crossOrigin = "anonymous";
  img.src = url;
  img.onload = () => onImageLoad?.();
  imgCache.set(url, img);
  return null;
}

function markerRingColor(kind, isBuy) {
  if (kind === "call") return tc("--t-yel");
  if (kind === "thesis") return tc("--t-blu");
  if (kind === "tweet") return tc("--t-wh");
  if (kind === "kol") return isBuy === false ? tc("--t-red") : tc("--t-grn");
  return tc("--t-s0");
}
export class CallAvatarPrimitive {
  _data = [];
  _series = null;
  _chart = null;
  _requestUpdate;
  _hover = null;
  _focusWallet = null;
  setData(data) {
    this._data = data;
    this._requestUpdate?.();
  }
  setHover(h) {
    const same = h === null && this._hover === null || h !== null && this._hover !== null && h.time === this._hover.time && h.idx === this._hover.idx;
    if (same) return;
    this._hover = h;
    this._requestUpdate?.();
  }
  setFocus(wallet) {
    if (this._focusWallet === wallet) return;
    this._focusWallet = wallet;
    this._requestUpdate?.();
  }
  attached({ series, chart, requestUpdate }) {
    this._series = series;
    this._chart = chart;
    this._requestUpdate = requestUpdate;
  }
  detached() {
    this._series = null;
    this._chart = null;
    this._requestUpdate = void 0;
  }
  paneViews() {
    return [new CallAvatarPaneView(this)];
  }
}
class CallAvatarPaneView {
  _primitive;
  constructor(primitive) {
    this._primitive = primitive;
  }
  zOrder() {
    return "top";
  }
  renderer() {
    return new CallAvatarRenderer(this._primitive);
  }
}
class CallAvatarRenderer {
  _primitive;
  constructor(primitive) {
    this._primitive = primitive;
  }
  /** The label a hovered bubble carries, above its enlarged circle. */
  _drawChip(ctx, cx, cy, b, ratio, vRatio, label) {
    const fontPx = Math.round(10 * ratio);
    ctx.font = `600 ${fontPx}px sans-serif`;
    const tw = ctx.measureText(label).width;
    const px = Math.round(6 * ratio);
    const ph = Math.round(18 * vRatio);
    const lx = cx - tw / 2 - px;
    const ly = cy - b / 2 - ph - Math.round(4 * vRatio);
    ctx.fillStyle = tc("--t-s5");
    ctx.strokeStyle = tc("--t-bd");
    ctx.lineWidth = Math.max(1, ratio);
    ctx.beginPath();
    ctx.roundRect(lx, ly, tw + px * 2, ph, Math.round(4 * ratio));
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = tc("--t-tx");
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(label, cx, ly + ph / 2);
  }

  /** The `+N` bubble: the same circle and ring, with the remainder where a face would be. */
  _drawCount(ctx, cx, cy, b, ratio, extra) {
    // `--t-bd` is the theme's solid surface: the translucent one let the row show through
    ctx.fillStyle = tc("--t-bd");
    ctx.beginPath();
    ctx.arc(cx, cy, b / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = tc("--t-tx");
    ctx.font = `bold ${Math.round(b * 0.45)}px sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(`+${extra}`, cx, cy + Math.round(0.5 * ratio));
    ctx.strokeStyle = tc("--t-g7");
    ctx.lineWidth = Math.max(1.5, 2.5 * ratio);
    ctx.beginPath();
    ctx.arc(cx, cy, b / 2, 0, Math.PI * 2);
    ctx.stroke();
  }

  _drawAvatar(ctx, c, cx, cy, b, ratio) {
    if (c.isDev) {
      const fill = c.isBuy ? tc("--t-grn") : tc("--t-red");
      ctx.fillStyle = fill;
      ctx.beginPath();
      ctx.arc(cx, cy, b / 2, 0, Math.PI * 2);
      ctx.fill();
      drawChefHat(ctx, cx, cy, b * 0.62, tc("--t-s0"));
      ctx.strokeStyle = tc("--t-s0");
      ctx.lineWidth = Math.max(1.5, 2.5 * ratio);
      ctx.beginPath();
      ctx.arc(cx, cy, b / 2, 0, Math.PI * 2);
      ctx.stroke();
      if ((c.count ?? 1) > 1) {
        const badgeR = Math.round(b * 0.28);
        const bxp = cx + b / 2 - badgeR * 0.5;
        const byp = cy - b / 2 + badgeR * 0.5;
        ctx.fillStyle = fill;
        ctx.beginPath();
        ctx.arc(bxp, byp, badgeR, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = tc("--t-s0");
        ctx.lineWidth = Math.max(1, ratio);
        ctx.beginPath();
        ctx.arc(bxp, byp, badgeR, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = tc("--t-s0");
        ctx.font = `bold ${Math.round(badgeR * 1.2)}px sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(String(c.count), bxp, byp + Math.round(0.5 * ratio));
      }
      return;
    }
    /**
     * Most callers have no profile photo, and drawing nothing inside the ring reads as a broken
     * bubble rather than a person without a picture — so the app's own mark stands in for them.
     */
    const img = loadImg(c.photoUrl || FALLBACK_MARK);
    if (img) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, b / 2, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      /**
       * The stand-in mark gets the theme's solid surface behind it, so it reads as a card the
       * way the count bubble does — the translucent one let the row show through. A real photo
       * needs nothing behind it.
       */
      if (!c.photoUrl) {
        ctx.fillStyle = tc("--t-bd");
        ctx.fill();
      }
      ctx.drawImage(img, cx - b / 2, cy - b / 2, b, b);
      ctx.restore();
    } else if (!c.photoUrl && !c.walletAddress) {
      ctx.fillStyle = tc("--t-s7");
      ctx.beginPath();
      ctx.arc(cx, cy, b / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = tc("--t-g11");
      ctx.font = `bold ${Math.round(b * 0.5)}px sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(c.name[0]?.toUpperCase() ?? "?", cx, cy);
    }
    const ringColor = markerRingColor(c.sourceKind, c.isBuy);
    ctx.strokeStyle = ringColor;
    ctx.lineWidth = Math.max(1.5, 2.5 * ratio);
    ctx.beginPath();
    ctx.arc(cx, cy, b / 2, 0, Math.PI * 2);
    ctx.stroke();
    if ((c.count ?? 1) > 1) {
      const badgeR = Math.round(b * 0.28);
      const bxp = cx + b / 2 - badgeR * 0.5;
      const byp = cy - b / 2 + badgeR * 0.5;
      ctx.fillStyle = ringColor === tc("--t-s0") ? tc("--t-s5") : ringColor;
      ctx.beginPath();
      ctx.arc(bxp, byp, badgeR, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = tc("--t-s0");
      ctx.lineWidth = Math.max(1, ratio);
      ctx.beginPath();
      ctx.arc(bxp, byp, badgeR, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = tc("--t-s0");
      ctx.font = `bold ${Math.round(badgeR * 1.2)}px sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(String(c.count), bxp, byp + Math.round(0.5 * ratio));
    }
  }
  draw(target) {
    const p = this._primitive;
    if (!p._series || !p._chart || p._data.length === 0) return;
    target.useBitmapCoordinateSpace((scope) => {
      const ctx = scope.context;
      const ratio = scope.horizontalPixelRatio;
      const vRatio = scope.verticalPixelRatio;
      const ts = p._chart.timeScale();
      const sz = 18;
      const overlap = 0.55;
      const bsz = Math.round(sz * ratio);
      const step = Math.round(bsz * overlap);
      const pad = Math.round(4 * vRatio);
      let hovered = null;
      let hoveredCount = null;
      for (const d of p._data) {
        const x = ts.timeToCoordinate(d.time);
        if (x === null) continue;
        const priceY = p._series.priceToCoordinate(d.high);
        if (priceY === null) continue;
        const n = d.callers.length;
        const shown = Math.min(n, MAX_AVATARS);
        const extra = n > MAX_AVATARS ? n - MAX_AVATARS : 0;
        // three faces and, when there are more, one bubble carrying the count
        const total = shown + (extra > 0 ? 1 : 0);
        const totalW = bsz + step * (total - 1);
        const startX = Math.round(x * ratio) - totalW / 2;
        const by = Math.round(priceY * vRatio) - bsz - pad;
        for (let i = shown - 1; i >= 0; i--) {
          const cx = startX + i * step + bsz / 2;
          const cy = by + bsz / 2;
          const c = d.callers[i];
          if (p._hover && p._hover.time === d.time && p._hover.idx === i) {
            hovered = { c, cx, cy };
            continue;
          }
          const dimmed = p._focusWallet !== null && c.walletAddress !== p._focusWallet;
          if (dimmed) ctx.globalAlpha = 0.12;
          this._drawAvatar(ctx, c, cx, cy, bsz, ratio);
          if (dimmed) ctx.globalAlpha = 1;
        }
        /**
         * Drawn after the faces, so the row overlaps it from behind rather than over it — the
         * count is the thing you need to read.
         */
        if (extra > 0) {
          const ccx = startX + MAX_AVATARS * step + bsz / 2;
          const ccy = by + bsz / 2;
          this._drawCount(ctx, ccx, ccy, bsz, ratio, extra);
          if (p._hover && p._hover.time === d.time && p._hover.idx === -1) {
            hoveredCount = { cx: ccx, cy: ccy, extra };
          }
        }
      }
      if (hovered) {
        const b2 = Math.round(bsz * 2);
        this._drawAvatar(ctx, hovered.c, hovered.cx, hovered.cy, b2, ratio);
        const sideStr = hovered.c.isBuy === void 0 ? "" : hovered.c.isBuy ? " \xB7 bought" : " \xB7 sold";
        const countStr = (hovered.c.count ?? 1) > 1 ? ` \xD7${hovered.c.count}` : "";
        this._drawChip(ctx, hovered.cx, hovered.cy, b2, ratio, vRatio, `${hovered.c.name}${sideStr}${countStr}`);
      }
      /** The count bubble answers a hover the same way a face does: bigger, with its own chip. */
      if (hoveredCount) {
        const b2 = Math.round(bsz * 2);
        this._drawCount(ctx, hoveredCount.cx, hoveredCount.cy, b2, ratio, hoveredCount.extra);
        this._drawChip(ctx, hoveredCount.cx, hoveredCount.cy, b2, ratio, vRatio, `+${hoveredCount.extra} more`);
      }
    });
  }
}
