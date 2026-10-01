function createCoalescer(flush, options = {}) {
  const DEFAULT_MAX_BATCH = 2e3;
  const maxBatch = Number.isFinite(options.maxBatch) ? Math.max(1, Math.floor(options.maxBatch)) : DEFAULT_MAX_BATCH;
  const hiddenDelayMs = options.hiddenDelayMs ?? 250;
  const delayMs = options.delayMs;
  let buffer = [];
  let bufferHead = 0;
  let bufferSize = 0;
  let rafId = 0;
  let timeoutId = null;
  let disposed = false;
  function isHidden() {
    return typeof document !== "undefined" && document.visibilityState === "hidden";
  }
  function doFlush() {
    rafId = 0;
    timeoutId = null;
    if (bufferSize === 0) return;
    let batch;
    if (bufferHead === 0 && bufferSize === buffer.length) {
      batch = buffer;
    } else {
      batch = new Array(bufferSize);
      for (let i = 0; i < bufferSize; i++) batch[i] = buffer[(bufferHead + i) % maxBatch];
    }
    clearBuffer();
    flush(batch);
  }
  function schedule() {
    if (disposed || rafId || timeoutId) return;
    if (delayMs != null && delayMs > 0) {
      timeoutId = setTimeout(doFlush, delayMs);
      return;
    }
    if (isHidden() || typeof requestAnimationFrame === "undefined") {
      timeoutId = setTimeout(doFlush, hiddenDelayMs);
    } else {
      rafId = requestAnimationFrame(doFlush);
    }
  }
  function append(item) {
    if (bufferSize < maxBatch) {
      buffer[(bufferHead + bufferSize) % maxBatch] = item;
      bufferSize++;
    } else {
      buffer[bufferHead] = item;
      bufferHead = (bufferHead + 1) % maxBatch;
    }
  }
  function clearBuffer() {
    buffer = [];
    bufferHead = 0;
    bufferSize = 0;
  }
  return {
    push(item) {
      if (disposed) return;
      append(item);
      schedule();
    },
    pushMany(items) {
      if (disposed) return;
      for (const item of items) append(item);
      schedule();
    },
    flushNow() {
      cancel();
      doFlush();
    },
    clear() {
      clearBuffer();
    },
    dispose() {
      disposed = true;
      cancel();
      clearBuffer();
    },
    size() {
      return bufferSize;
    }
  };
  function cancel() {
    if (rafId) {
      cancelAnimationFrame(rafId);
      rafId = 0;
    }
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  }
}
export {
  createCoalescer
};
