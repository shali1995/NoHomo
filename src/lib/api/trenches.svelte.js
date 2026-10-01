import { platformName } from "../platforms.js";
import { createCoalescer } from "../utils/coalesce.js";
import { isCursorRecoveryReason, subscribe, unsubscribe } from "../ws/client.js";
import { api } from "./client.js";
import {
  discoveryRowFromToken,
  formatUsdCompact,
  mergeScannerFrame,
  spacerStyleForCount
} from "./trending.svelte.js";

/**
 * The two trench views behind the left panel's Bonding and Graduated pills.
 *
 * They are one scanner read in two phases: the pill that reads "Bonding" is the
 * backend's `graduating` phase, "Graduated" is `graduated`. A REST page seeds each
 * phase, then the `scanner:trenches` socket patches it — `SCANNER_TOKENS` carries a
 * replacement snapshot for the subscribed phase and `SCANNER_UPDATE` changed tokens,
 * which are the same frames the trending list merges, so `mergeScannerFrame` is shared
 * with src/lib/api/trending.svelte.js. One socket per phase, the way Ombra's memescope
 * subscribes one per column.
 *
 * The subscribe params carry no cursor, so the default `resubscribe` recovery is the
 * right one here: a reconnect re-reads the same phase window.
 */

export const BONDING_PHASE = "graduating";
export const GRADUATED_PHASE = "graduated";

const TOPIC = "scanner:trenches";

/** The route is registered per phase, not as a `{phase}` template. */
const ENDPOINT = {
  [BONDING_PHASE]: "/v2/scanner/trenches/graduating",
  [GRADUATED_PHASE]: "/v2/scanner/trenches/graduated"
};

/** `ScannerItem`s are replaced wholesale and must never be deep-proxied. */
let bondingTokens = $state.raw([]);
let graduatedTokens = $state.raw([]);
let bondingLoading = $state(false);
let graduatedLoading = $state(false);
/** The caution banner is dismissible per view, and stays dismissed across a pill switch. */
let bondingCaution = $state(true);
let graduatedCaution = $state(true);

/**
 * Per-phase plumbing. Only the tokens, the loading flag and the banner are rendered, so
 * only those are reactive; the socket key, retry timer and coalescer live beside them.
 */
const PHASE = {
  [BONDING_PHASE]: {
    read: () => bondingTokens,
    write: (list) => {
      bondingTokens = list;
    },
    loading: () => bondingLoading,
    setLoading: (value) => {
      bondingLoading = value;
    },
    caution: () => bondingCaution,
    hideCaution: () => {
      bondingCaution = false;
    },
    wsKey: null,
    retryTimer: null,
    frames: null
  },
  [GRADUATED_PHASE]: {
    read: () => graduatedTokens,
    write: (list) => {
      graduatedTokens = list;
    },
    loading: () => graduatedLoading,
    setLoading: (value) => {
      graduatedLoading = value;
    },
    caution: () => graduatedCaution,
    hideCaution: () => {
      graduatedCaution = false;
    },
    wsKey: null,
    retryTimer: null,
    frames: null
  }
};

/** `4198` -> `1h`. `ageFromSeconds` in src/lib/api/token.svelte.js stops at days, and
 * the capture's chips read `1mo` for a token past thirty. */
function rowAge(seconds) {
  if (seconds === undefined || seconds === null) return "";
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return days < 30 ? `${days}d` : `${Math.floor(days / 30)}mo`;
}

let timestampFormatter = null;

/** The chip's `title`: the capture prints the token's birth in full local time. */
function rowAgeTitle(timestamp) {
  if (!timestamp) return "";
  timestampFormatter ??= new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  });
  return timestampFormatter.format(new Date(timestamp));
}

/**
 * A trench row is the trending row with the fields these pills swap in: the second line
 * shows 24h volume instead of the price, the token's age rides on the first line, and the
 * right column shows the bonding progress on Bonding in place of the change.
 */
function trenchRowFromToken(token, phase, index) {
  const progress = token.launchPad?.bondingCurve?.progressPct;
  return {
    ...discoveryRowFromToken(token, index),
    volume: formatUsdCompact(token.stats?.timeframes?.["24h"]?.volumeStr),
    age: rowAge(token.createdAtAgeSeconds),
    ageTitle: rowAgeTitle(token.createdAtTimestamp),
    launchpadLogo: token.platformAddress ? `/images/nohomo-eyes.png` : "",
    launchpadName: platformName(token.platformType),
    bondedPct: phase === BONDING_PHASE && typeof progress === "number" ? Math.round(progress) : null
  };
}

export function bondingRows() {
  return bondingTokens.map((token, index) => trenchRowFromToken(token, BONDING_PHASE, index));
}

export function graduatedRows() {
  return graduatedTokens.map((token, index) => trenchRowFromToken(token, GRADUATED_PHASE, index));
}

export function isTrenchesLoading(phase) {
  return PHASE[phase].loading();
}

export function trenchesSpacerStyle(phase) {
  return spacerStyleForCount(PHASE[phase].read().length);
}

/** Whether the phase's caution banner is still up. */
export function trenchesCaution(phase) {
  return PHASE[phase].caution();
}

export function dismissTrenchesCaution(phase) {
  PHASE[phase].hideCaution();
}

/** Frames are merged into one write per animation frame, per phase. */
function makeCoalescer(phase) {
  return createCoalescer(
    (batch) => {
      const state = PHASE[phase];
      let working = state.read();
      for (const { event, data } of batch) {
        working = mergeScannerFrame(event, data, working);
      }
      state.write(working);
    },
    { maxBatch: 40 }
  );
}

for (const phase of [BONDING_PHASE, GRADUATED_PHASE]) {
  PHASE[phase].frames = makeCoalescer(phase);
}

function openSubscription(phase) {
  const state = PHASE[phase];
  if (state.wsKey) unsubscribe(state.wsKey);
  state.frames.clear();
  state.wsKey = subscribe(
    TOPIC,
    (event, data) => {
      if (event === "SCANNER_TOKENS" || event === "SCANNER_UPDATE") {
        state.frames.push({ event, data });
      }
    },
    { phase },
    {
      onError: (error) => {
        if (isCursorRecoveryReason(error?.reason)) void seed(phase);
      }
    }
  );
}

/** How long to wait before asking for the phase again after a failed page. */
const RETRY_MS = 3_000;

async function seed(phase) {
  const state = PHASE[phase];
  if (state.retryTimer) {
    clearTimeout(state.retryTimer);
    state.retryTimer = null;
  }
  try {
    const { data, error } = await api.POST(ENDPOINT[phase], { body: { tokenFilter: {} } });
    if (error) throw new Error(`trenches ${phase} request failed`);
    state.write(data?.tokens ?? []);
    state.setLoading(false);
    openSubscription(phase);
    return;
  } catch {
    // The page failed, so leave the socket on whatever it already holds and try the
    // page again — the list recovers on its own once the API answers.
  }
  state.retryTimer = setTimeout(() => {
    state.retryTimer = null;
    void seed(phase);
  }, RETRY_MS);
}

export async function startTrenches() {
  await Promise.all(
    [BONDING_PHASE, GRADUATED_PHASE].map(async (phase) => {
      if (PHASE[phase].wsKey) return;
      PHASE[phase].setLoading(true);
      await seed(phase);
    })
  );
}

export function stopTrenches() {
  for (const phase of [BONDING_PHASE, GRADUATED_PHASE]) {
    const state = PHASE[phase];
    if (state.wsKey) unsubscribe(state.wsKey);
    state.wsKey = null;
    if (state.retryTimer) clearTimeout(state.retryTimer);
    state.retryTimer = null;
    state.frames.clear();
  }
}
