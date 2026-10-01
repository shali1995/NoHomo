import { getAuthToken } from "../auth.svelte.js";
import { wsBase } from "../api/config.js";
import { addToast as toast } from "../toast.svelte.js";

const WS_PROBE_INTERVAL_MS = 5_000;
const dev = import.meta.env.DEV;

// A dropped feed is a notice, the way ombra surfaces it — the port's own store now.
function addToast(type, title, message) {
  toast(type, title, message);
}
function isCursorRecoveryReason(reason) {
  return reason === "CURSOR_EXPIRED" || reason === "CURSOR_KEY_MISMATCH" || reason === "CURSOR_INVALID";
}
let socket = null;
let subscriptions = /* @__PURE__ */ new Map();
let serverSubscriptions = /* @__PURE__ */ new Map();
let pendingAcks = /* @__PURE__ */ new Map();
let subCounter = 0;
let requestCounter = 0;
let pingInterval = null;
let reconnectTimeout = null;
let intentionalClose = false;
let closeTimeout = null;
let currentAuthToken = null;
let currentUserId = null;
let connectionGeneration = 0;
let reconnectAttempt = 0;
let inboundQueue = [];
let inboundQueueHead = 0;
let inboundQueueBytes = 0;
let hiddenDroppedFrames = 0;
let drainScheduled = false;
let drainChannel = null;
let outstandingPing = null;
let recoveryWatchdog = null;
let lifecycleInstalled = false;
let connectionState = "closed";
let processedMessages = 0;
let lastRecoveryMs;
let lastPongRttMs;
let lastPongAtMs;
let lastServerTimestampMs;
let reconnectCount = 0;
let lastCloseCode;
let lastCloseReason;
const diagnosticsListeners = /* @__PURE__ */ new Set();
const PROCESSING_SLICE_MS = 8;
const PROCESSING_SLICE_MESSAGES = 100;
const PROCESSING_SLICE_MS_BUSY = 12;
const PROCESSING_SLICE_MESSAGES_BUSY = 400;
const BACKLOG_BUSY_THRESHOLD = 200;
const MAX_INBOUND_QUEUE_MESSAGES = 2e4;
const MAX_INBOUND_QUEUE_BYTES = 32 * 1024 * 1024;
const RECOVERY_STALL_MS = 3e4;
const MAX_HIDDEN_QUEUE_MESSAGES = 2e3;
function isDocHidden() {
  return typeof document !== "undefined" && document.visibilityState === "hidden";
}
function getWsUrl() {
  return `${wsBase()}/v2/ws`;
}
function safeSend(data) {
  try {
    if (socket?.readyState === WebSocket.OPEN) {
      socket.send(data);
    }
  } catch {
  }
}
function paramsKeys(params) {
  return params ? Object.keys(params).sort() : [];
}
const WS_DEBUG_LOGS = false;
function wsLog(event, details) {
  if (dev && WS_DEBUG_LOGS) console.debug(`[WS] ${event}`, details);
}
function notifyDiagnostics() {
  const diagnostics = getWsDiagnostics();
  for (const listener of diagnosticsListeners) {
    try {
      listener(diagnostics);
    } catch (error) {
      wsLog("diagnostics:listener-error", { error: String(error) });
    }
  }
}
function setConnectionState(next) {
  if (connectionState === next) return;
  connectionState = next;
  notifyDiagnostics();
}
function clearRecoveryWatchdog() {
  if (recoveryWatchdog) clearTimeout(recoveryWatchdog);
  recoveryWatchdog = null;
}
function resetRecoveryWatchdog() {
  clearRecoveryWatchdog();
  const ping = outstandingPing;
  if (!ping || document.visibilityState === "hidden") return;
  recoveryWatchdog = setTimeout(() => {
    if (!outstandingPing || outstandingPing.requestId !== ping.requestId || outstandingPing.generation !== ping.generation) return;
    wsLog("recovery:stalled", { requestId: ping.requestId, generation: ping.generation });
    forceReconnect("application pong made no progress");
  }, RECOVERY_STALL_MS);
}
function noteRecoveryProgress() {
  if (outstandingPing) resetRecoveryWatchdog();
}
function inboundQueueSize() {
  return inboundQueue.length - inboundQueueHead;
}
function resetInboundQueue() {
  inboundQueue = [];
  inboundQueueHead = 0;
  hiddenDroppedFrames = 0;
  inboundQueueBytes = 0;
}
function compactInboundQueue() {
  if (inboundQueueHead === inboundQueue.length) {
    resetInboundQueue();
  } else if (inboundQueueHead >= 1024 && inboundQueueHead * 2 >= inboundQueue.length) {
    inboundQueue = inboundQueue.slice(inboundQueueHead);
    inboundQueueHead = 0;
  }
}
function scheduleInboundDrain() {
  if (drainScheduled || inboundQueueSize() === 0 || isDocHidden()) return;
  drainScheduled = true;
  if (!drainChannel && typeof MessageChannel !== "undefined") {
    drainChannel = new MessageChannel();
    drainChannel.port1.onmessage = drainInboundQueue;
  }
  if (drainChannel) drainChannel.port2.postMessage(void 0);
  else setTimeout(drainInboundQueue, 0);
}
function drainInboundQueue() {
  drainScheduled = false;
  const busy = inboundQueueSize() >= BACKLOG_BUSY_THRESHOLD;
  const msgBudget = busy ? PROCESSING_SLICE_MESSAGES_BUSY : PROCESSING_SLICE_MESSAGES;
  const msBudget = busy ? PROCESSING_SLICE_MS_BUSY : PROCESSING_SLICE_MS;
  const startedAt = performance.now();
  let processed = 0;
  let sinceTimeCheck = 0;
  while (inboundQueueHead < inboundQueue.length && processed < msgBudget) {
    const item = inboundQueue[inboundQueueHead++];
    inboundQueueBytes = Math.max(0, inboundQueueBytes - item.raw.length);
    if (item.generation === connectionGeneration) {
      try {
        item.process(item.raw);
      } catch (error) {
        wsLog("message:handler-error", { error: String(error), generation: item.generation });
      }
      processedMessages++;
      noteRecoveryProgress();
    }
    processed++;
    if (++sinceTimeCheck >= 32) {
      sinceTimeCheck = 0;
      if (performance.now() - startedAt >= msBudget) break;
    }
  }
  compactInboundQueue();
  if (inboundQueueSize() > 0) scheduleInboundDrain();
}
function enqueueInbound(generation, raw, process) {
  if (generation !== connectionGeneration) return;
  if (isDocHidden()) {
    inboundQueue.push({ generation, raw, process });
    inboundQueueBytes += raw.length;
    while (inboundQueueSize() > MAX_HIDDEN_QUEUE_MESSAGES) {
      const dropped = inboundQueue[inboundQueueHead++];
      inboundQueueBytes = Math.max(0, inboundQueueBytes - dropped.raw.length);
      hiddenDroppedFrames++;
    }
    if (inboundQueueHead >= MAX_HIDDEN_QUEUE_MESSAGES) {
      inboundQueue = inboundQueue.slice(inboundQueueHead);
      inboundQueueHead = 0;
    }
    return;
  }
  if (inboundQueueSize() >= MAX_INBOUND_QUEUE_MESSAGES || inboundQueueBytes >= MAX_INBOUND_QUEUE_BYTES) {
    wsLog("inbound:overflow", { queued: inboundQueueSize(), bytes: inboundQueueBytes });
    forceReconnect("inbound queue overflow");
    return;
  }
  inboundQueue.push({ generation, raw, process });
  inboundQueueBytes += raw.length;
  noteRecoveryProgress();
  scheduleInboundDrain();
}
function sendKeepalive() {
  if (!socket || socket.readyState !== WebSocket.OPEN) return;
  safeSend(JSON.stringify({ type: "ping", requestId: `ws_keepalive_${connectionGeneration}_${++requestCounter}` }));
}
function startApplicationProbe(reason) {
  if (!socket || socket.readyState !== WebSocket.OPEN || document.visibilityState === "hidden") return;
  if (outstandingPing?.generation === connectionGeneration) return;
  const requestId = `ws_ping_${connectionGeneration}_${++requestCounter}`;
  outstandingPing = { requestId, generation: connectionGeneration, sentAt: performance.now() };
  setConnectionState("recovering");
  wsLog("recovery:start", { reason, requestId, generation: connectionGeneration, queuedMessages: inboundQueueSize() });
  safeSend(JSON.stringify({ type: "ping", requestId }));
  resetRecoveryWatchdog();
}
function handleApplicationPong(requestId, generation, serverTimestampMs) {
  const ping = outstandingPing;
  if (!ping || typeof requestId !== "string" || requestId !== ping.requestId || generation !== ping.generation) return;
  const elapsed = performance.now() - ping.sentAt;
  lastPongRttMs = elapsed;
  lastRecoveryMs = elapsed;
  lastPongAtMs = Date.now();
  if (typeof serverTimestampMs === "number" && Number.isFinite(serverTimestampMs)) {
    lastServerTimestampMs = serverTimestampMs;
  }
  outstandingPing = null;
  clearRecoveryWatchdog();
  notifyDiagnostics();
  requestAnimationFrame(() => {
    if (generation !== connectionGeneration) return;
    reconnectAttempt = 0;
    setConnectionState("open");
    wsLog("recovery:complete", { requestId, generation, elapsedMs: elapsed, queuedMessages: inboundQueueSize() });
  });
}
function reconnectDelay(closeCode) {
  if (closeCode === 1013) return 250 + Math.floor(Math.random() * 501);
  const base = Math.min(1e4, 500 * 2 ** Math.min(reconnectAttempt, 5));
  const jitter = base * (Math.random() * 0.4 - 0.2);
  return Math.max(0, Math.round(base + jitter));
}
function scheduleReconnect(closeCode) {
  if (intentionalClose || subscriptions.size === 0 || reconnectTimeout) return;
  const delay = reconnectDelay(closeCode);
  reconnectAttempt++;
  reconnectCount++;
  wsLog("reconnect:scheduled", { delay, closeCode, attempt: reconnectAttempt });
  reconnectTimeout = setTimeout(() => {
    reconnectTimeout = null;
    notifyDiagnostics();
    connect();
  }, delay);
  notifyDiagnostics();
}
function forceReconnect(reason) {
  const staleSocket = socket;
  connectionGeneration++;
  outstandingPing = null;
  clearRecoveryWatchdog();
  resetInboundQueue();
  socket = null;
  if (pingInterval) {
    clearInterval(pingInterval);
    pingInterval = null;
  }
  setConnectionState("closed");
  serverSubscriptions.forEach((serverSub) => {
    serverSub.subId = void 0;
    serverSub.displayTopic = void 0;
    serverSub.pendingRequestId = void 0;
    serverSub.windows = void 0;
    serverSub.failed = false;
  });
  pendingAcks.clear();
  wsLog("reconnect:forced", { reason, generation: connectionGeneration });
  try {
    staleSocket?.close();
  } catch {
  }
  scheduleReconnect();
}
function handleVisibilityChange() {
  if (document.visibilityState === "hidden") {
    clearRecoveryWatchdog();
    return;
  }
  if (socket?.readyState === WebSocket.OPEN) {
    if (hiddenDroppedFrames > 0) {
      wsLog("resume:reseed", { droppedWhileHidden: hiddenDroppedFrames });
      resetInboundQueue();
      forceReconnect("resume after dropping hidden-tab frames");
    } else {
      startApplicationProbe("resume");
      scheduleInboundDrain();
    }
  } else {
    resetInboundQueue();
    ensureConnected();
  }
}
function installLifecycleHandlers() {
  if (lifecycleInstalled || typeof window === "undefined") return;
  window.__wsDiag = getWsDiagnostics;
  document.addEventListener("visibilitychange", handleVisibilityChange);
  window.addEventListener("pageshow", handleVisibilityChange);
  window.addEventListener("online", handleVisibilityChange);
  lifecycleInstalled = true;
}
function removeLifecycleHandlers() {
  if (!lifecycleInstalled || typeof window === "undefined") return;
  document.removeEventListener("visibilitychange", handleVisibilityChange);
  window.removeEventListener("pageshow", handleVisibilityChange);
  window.removeEventListener("online", handleVisibilityChange);
  lifecycleInstalled = false;
}
function getWsDiagnostics() {
  return {
    generation: connectionGeneration,
    state: connectionState,
    queuedMessages: inboundQueueSize(),
    queuedBytes: inboundQueueBytes,
    processedMessages,
    lastRecoveryMs,
    outstandingPingId: outstandingPing?.requestId,
    lastPongRttMs,
    lastPongAtMs,
    lastServerTimestampMs,
    reconnectCount,
    reconnectAttempt,
    reconnectScheduled: reconnectTimeout !== null,
    lastCloseCode,
    lastCloseReason,
    topics: Object.fromEntries([...topicDelivery.entries()].map(([k, v]) => [k, { ...v }]))
  };
}
if (typeof window !== "undefined") {
  globalThis.__wsDiag = getWsDiagnostics;
}
function observeWsDiagnostics(listener) {
  diagnosticsListeners.add(listener);
  listener(getWsDiagnostics());
  return () => diagnosticsListeners.delete(listener);
}
function isScannerTopic(topic) {
  return typeof topic === "string" && topic.startsWith("scanner:");
}
function scannerWsTrace(event, details) {
  if (!dev || !WS_DEBUG_LOGS) return;
  console.info(`[SCANNER-WS-TRACE] ${event}`, {
    at: (/* @__PURE__ */ new Date()).toISOString(),
    ...details
  });
}
function isUserTopic(topic) {
  return topic === "user";
}
function serverKeyFor(topic, params) {
  return params ? `${topic}
${JSON.stringify(params)}` : topic;
}
function topicBase(topic) {
  const q = topic.indexOf("?");
  return q === -1 ? topic : topic.slice(0, q);
}
function topicFilterSuffix(topic) {
  const q = topic.indexOf("?");
  return q === -1 ? void 0 : topic.slice(q + 1);
}
function topicMatches(expected, actual) {
  const expectedBase = topicBase(expected);
  const actualBase = topicBase(actual);
  const baseMatches = expectedBase === actualBase || actualBase.startsWith(expectedBase + ":") || expectedBase.startsWith(actualBase + ":");
  if (!baseMatches) return false;
  const expectedSuffix = topicFilterSuffix(expected);
  const actualSuffix = topicFilterSuffix(actual);
  if (expectedSuffix === void 0 || actualSuffix === void 0) return true;
  return expectedSuffix === actualSuffix;
}
function frameWindowId(meta) {
  const direct = meta?.windowId;
  if (typeof direct === "string") return direct;
  const nested = meta?.window?.windowId;
  return typeof nested === "string" ? nested : void 0;
}
function frameEndCursor(meta) {
  const direct = meta?.endCursor;
  if (typeof direct === "string") return direct;
  const nested = meta?.window?.endCursor;
  return typeof nested === "string" ? nested : void 0;
}
function hasAcknowledgedWindow(serverSub, msgTopic, windowId, endCursor) {
  if (!serverSub.windows) return false;
  return Object.entries(serverSub.windows).some(([topic, window2]) => {
    return window2.windowId === windowId && topicMatches(topic, msgTopic) && (!endCursor || !window2.endCursor || window2.endCursor === endCursor);
  });
}
function hasLocalSubscribers(serverKey) {
  for (const sub of subscriptions.values()) {
    if (sub.serverKey === serverKey) return true;
  }
  return false;
}
function deliverToSubscription(sub, event, data, topic, meta) {
  try {
    sub.handler(event, data, topic, meta);
  } catch (error) {
    wsLog("subscription:handler-error", { topic: sub.topic, event, error: String(error) });
  }
}
function takePendingServerKey(requestId) {
  if (requestId) {
    const serverKey = pendingAcks.get(requestId);
    if (serverKey) pendingAcks.delete(requestId);
    return serverKey;
  }
  for (const [serverKey, sub] of serverSubscriptions) {
    if (sub.pendingRequestId) {
      pendingAcks.delete(sub.pendingRequestId);
      return serverKey;
    }
  }
}
const topicDelivery = /* @__PURE__ */ new Map();
function noteTopicDelivery(topic, delivered, rejectedWindow) {
  const key = topicBase(topic);
  let entry = topicDelivery.get(key);
  if (!entry) {
    entry = { received: 0, delivered: 0, rejectedWindow: 0, unmatched: 0 };
    topicDelivery.set(key, entry);
  }
  const now = Date.now();
  entry.received++;
  entry.lastReceivedAtMs = now;
  entry.rejectedWindow += rejectedWindow;
  if (delivered > 0) {
    entry.delivered++;
    entry.lastDeliveredAtMs = now;
  } else if (rejectedWindow === 0) {
    entry.unmatched++;
  }
}
const DROP_REASON_TEXT = {
  backpressure: "the server could not keep up with this feed"
};
const recentDropToasts = /* @__PURE__ */ new Map();
const DROP_TOAST_COOLDOWN_MS = 3e4;
function handleTopicDropped(topic, reason) {
  const topicName = typeof topic === "string" && topic ? topic : "a live feed";
  const reasonKey = typeof reason === "string" ? reason : "";
  wsLog("topic:dropped", { topic: topicName, reason: reasonKey });
  for (const serverSub of serverSubscriptions.values()) {
    if (topicMatches(serverSub.topic, topicName) || serverSub.displayTopic === topicName) {
      serverSub.failed = true;
      serverSub.subId = void 0;
    }
  }
  const now = Date.now();
  const last = recentDropToasts.get(topicName);
  if (last !== void 0 && now - last < DROP_TOAST_COOLDOWN_MS) return;
  recentDropToasts.set(topicName, now);
  const detail = DROP_REASON_TEXT[reasonKey] ?? (reasonKey ? `reason: ${reasonKey}` : void 0);
  addToast(
    "warning",
    "Live updates stopped",
    detail ? `${topicName} \u2014 ${detail}. Reload to resume.` : `${topicName}. Reload to resume.`
  );
}
function dispatchMessage(msgTopic, event, data, meta) {
  let delivered = 0;
  let rejectedWindow = 0;
  const windowId = frameWindowId(meta);
  const endCursor = frameEndCursor(meta);
  subscriptions.forEach((sub) => {
    if (isUserTopic(sub.topic)) {
      if (currentUserId && (msgTopic === `user:${currentUserId}` || msgTopic === "user:favourites")) {
        delivered++;
        deliverToSubscription(sub, event, data, msgTopic, meta);
      }
      return;
    }
    const serverSub = sub.serverKey ? serverSubscriptions.get(sub.serverKey) : void 0;
    if (serverSub && !serverSub.pendingRequestId && !serverSub.failed) {
      const roomTopic = sub.topic.startsWith("twitter:") || sub.topic.startsWith("wallets:");
      const strictAckRouting = roomTopic && !!serverSub.displayTopic;
      const displayMatch = serverSub.displayTopic ? strictAckRouting ? serverSub.displayTopic === msgTopic : topicMatches(serverSub.displayTopic, msgTopic) : false;
      const requestedMatch = strictAckRouting ? false : topicMatches(sub.topic, msgTopic);
      if (displayMatch || requestedMatch) {
        if (windowId && !hasAcknowledgedWindow(serverSub, msgTopic, windowId, endCursor)) {
          rejectedWindow++;
          return;
        }
        delivered++;
        deliverToSubscription(sub, event, data, msgTopic, meta);
      }
    }
  });
  if (dev && isScannerTopic(msgTopic)) {
    const now = Date.now();
    let matched = 0;
    serverSubscriptions.forEach((serverSub) => {
      if (!isScannerTopic(serverSub.topic) || serverSub.pendingRequestId || serverSub.failed) return;
      if (!topicMatches(serverSub.displayTopic ?? serverSub.topic, msgTopic)) return;
      if (windowId && !hasAcknowledgedWindow(serverSub, msgTopic, windowId, endCursor)) return;
      matched++;
      const common = {
        requestId: serverSub.traceRequestId,
        subId: serverSub.subId,
        topic: serverSub.topic,
        eventTopic: msgTopic,
        event,
        windowId,
        endCursor,
        delivered,
        rejectedWindow,
        tokenCount: Array.isArray(data?.tokens) ? data.tokens.length : Array.isArray(data?.snapshot?.tokens) ? data.snapshot.tokens.length : void 0,
        msSinceSend: serverSub.traceSentAtMs === void 0 ? void 0 : now - serverSub.traceSentAtMs,
        msSinceAck: serverSub.traceAckAtMs === void 0 ? void 0 : now - serverSub.traceAckAtMs
      };
      if (serverSub.traceFirstFrameAtMs === void 0) {
        serverSub.traceFirstFrameAtMs = now;
        scannerWsTrace("first-frame", common);
      }
      if (event === "SCANNER_UPDATE" && serverSub.traceFirstUpdateAtMs === void 0) {
        serverSub.traceFirstUpdateAtMs = now;
        scannerWsTrace("first-update", common);
      }
    });
    if (matched === 0) {
      scannerWsTrace("unmatched-frame", {
        eventTopic: msgTopic,
        event,
        windowId,
        endCursor,
        delivered,
        rejectedWindow
      });
    }
  }
  noteTopicDelivery(msgTopic, delivered, rejectedWindow);
  wsLog("event:dispatch", { eventTopic: msgTopic, event, delivered, rejectedWindow, windowId, endCursor });
}
function notifyServerSubscriptionError(serverKey, error) {
  if (!serverKey) return;
  const serverSub = serverSubscriptions.get(serverKey);
  const enriched = {
    ...error,
    topic: serverSub?.topic,
    params: serverSub?.params
  };
  for (const sub of subscriptions.values()) {
    if (sub.serverKey === serverKey) {
      sub.onError?.(enriched);
    }
  }
}
function retryServerSubscription(serverKey, delayMs) {
  const generation = connectionGeneration;
  setTimeout(() => {
    if (generation !== connectionGeneration) return;
    const serverSub = serverSubscriptions.get(serverKey);
    if (!serverSub || !hasLocalSubscribers(serverKey) || serverSub.pendingRequestId || serverSub.subId) return;
    serverSub.failed = false;
    sendSubscribe(serverKey, serverSub);
  }, delayMs);
}
function refetchSubscribers(serverKey) {
  return Array.from(subscriptions.values()).filter((sub) => sub.serverKey === serverKey && sub.recovery === "refetch");
}
function connect() {
  if (socket?.readyState === WebSocket.OPEN || socket?.readyState === WebSocket.CONNECTING) return;
  intentionalClose = false;
  const generation = ++connectionGeneration;
  const ws = new WebSocket(getWsUrl());
  socket = ws;
  setConnectionState("connecting");
  ws.onopen = () => {
    if (generation !== connectionGeneration || socket !== ws) return;
    setConnectionState("open");
    if (!currentAuthToken) {
      const stored = getAuthToken();
      if (stored) currentAuthToken = stored;
    }
    wsLog("connected", { authToken: currentAuthToken ? "present" : "none" });
    if (currentAuthToken) {
      wsLog("auth:send", {});
      safeSend(JSON.stringify({ type: "auth", token: currentAuthToken }));
    }
    serverSubscriptions.forEach((serverSub, key) => {
      const refetch = refetchSubscribers(key);
      if (refetch.length > 0) {
        queueMicrotask(() => {
          if (generation !== connectionGeneration) return;
          for (const sub of refetch) sub.onReconnect?.();
        });
        return;
      }
      if (!serverSub.subId) sendSubscribe(key, serverSub);
    });
    if (pingInterval) clearInterval(pingInterval);
    pingInterval = setInterval(() => {
      if (isDocHidden()) sendKeepalive();
      else startApplicationProbe("periodic");
    }, WS_PROBE_INTERVAL_MS);
    startApplicationProbe("open");
  };
  const processMessage = (raw) => {
    if (generation !== connectionGeneration) return;
    let msg;
    try {
      msg = JSON.parse(raw);
    } catch {
      return;
    }
    if (msg.type === "subscribed") {
      if (typeof msg.topic === "string" && msg.topic.startsWith("user:")) {
        wsLog("subscribe:ack:user-topic", {
          requestId: msg.requestId,
          ackTopic: msg.topic
        });
        return;
      }
      const requestId = typeof msg.requestId === "string" ? msg.requestId : "";
      const serverKey = takePendingServerKey(requestId);
      if (serverKey) {
        const serverSub = serverSubscriptions.get(serverKey);
        wsLog("subscribe:ack", {
          requestId,
          topic: serverSub?.topic,
          paramsKeys: paramsKeys(serverSub?.params),
          ackTopic: msg.topic
        });
        if (serverSub) {
          const ackAtMs = Date.now();
          serverSub.subId = msg.subId;
          serverSub.displayTopic = msg.topic;
          serverSub.pendingRequestId = void 0;
          serverSub.windows = msg.windows && typeof msg.windows === "object" ? msg.windows : void 0;
          serverSub.failed = false;
          serverSub.traceAckAtMs = ackAtMs;
          subscriptions.forEach((sub) => {
            if (sub.serverKey === serverKey && sub.onSubscribed) {
              try {
                sub.onSubscribed();
              } catch {
              }
            }
          });
          if (isScannerTopic(serverSub.topic)) {
            scannerWsTrace("subscribe-ack", {
              requestId,
              subId: msg.subId,
              topic: serverSub.topic,
              ackTopic: msg.topic,
              windows: msg.windows,
              msSinceSend: serverSub.traceSentAtMs === void 0 ? void 0 : ackAtMs - serverSub.traceSentAtMs
            });
          }
        } else {
          safeSend(JSON.stringify({ type: "unsubscribe", subId: msg.subId }));
        }
      } else if (msg.subId) {
        safeSend(JSON.stringify({ type: "unsubscribe", subId: msg.subId }));
      }
      return;
    }
    if (msg.type === "auth_success") {
      wsLog("auth:success", { userId: msg.userId });
      currentUserId = msg.userId ?? null;
      return;
    }
    if (msg.type === "auth_error") {
      wsLog("auth:error", { message: msg.message });
      return;
    }
    if (msg.type === "error") {
      const requestId = typeof msg.requestId === "string" ? msg.requestId : "";
      const serverKey = requestId ? pendingAcks.get(requestId) : void 0;
      if (requestId) pendingAcks.delete(requestId);
      if (serverKey) {
        const serverSub = serverSubscriptions.get(serverKey);
        wsLog("error", {
          requestId,
          topic: serverSub?.topic,
          paramsKeys: paramsKeys(serverSub?.params),
          reason: msg.reason,
          message: msg.message
        });
        if (serverSub && serverSub.pendingRequestId === requestId) {
          serverSub.pendingRequestId = void 0;
          serverSub.failed = true;
        }
        const reason = typeof msg.reason === "string" ? msg.reason : void 0;
        notifyServerSubscriptionError(serverKey, {
          message: typeof msg.message === "string" ? msg.message : void 0,
          reason,
          requestId
        });
        if (reason === "SEED_TIMEOUT" || reason === "INTERNAL") {
          retryServerSubscription(serverKey, 3e3);
        } else if (reason === "UNAUTHORIZED" && currentAuthToken) {
          safeSend(JSON.stringify({ type: "auth", token: currentAuthToken }));
          retryServerSubscription(serverKey, 500);
        }
      }
      return;
    }
    if (msg.type === "pong") {
      handleApplicationPong(msg.requestId, generation, msg.serverTimestampMs);
      return;
    }
    if (msg.type === "unsubscribed") {
      return;
    }
    if (msg.type === "topic_dropped") {
      handleTopicDropped(msg.topic, msg.reason);
      return;
    }
    if (msg.topic && msg.event !== void 0) {
      dispatchMessage(msg.topic, msg.event, msg.data, msg.meta);
    }
  };
  ws.onmessage = (event) => {
    const raw = typeof event.data === "string" ? event.data : String(event.data);
    enqueueInbound(generation, raw, processMessage);
  };
  ws.onclose = (event) => {
    if (generation !== connectionGeneration || socket !== ws) return;
    socket = null;
    lastCloseCode = event.code;
    lastCloseReason = event.reason;
    outstandingPing = null;
    clearRecoveryWatchdog();
    inboundQueue = inboundQueue.slice(inboundQueueHead).filter((item) => item.generation !== generation);
    inboundQueueHead = 0;
    inboundQueueBytes = inboundQueue.reduce((total, item) => total + item.raw.length, 0);
    if (pingInterval) clearInterval(pingInterval);
    pingInterval = null;
    setConnectionState("closed");
    serverSubscriptions.forEach((serverSub) => {
      serverSub.subId = void 0;
      serverSub.displayTopic = void 0;
      serverSub.pendingRequestId = void 0;
      serverSub.windows = void 0;
      serverSub.failed = false;
    });
    pendingAcks.clear();
    scheduleReconnect(event.code);
  };
  ws.onerror = () => {
    if (generation === connectionGeneration) wsLog("socket:error", { generation });
  };
}
function sendSubscribe(serverKey, sub) {
  if (sub.pendingRequestId || socket?.readyState !== WebSocket.OPEN) return;
  const requestId = `ws_sub_${++requestCounter}`;
  sub.pendingRequestId = requestId;
  sub.failed = false;
  const msg = { type: "subscribe", topic: sub.topic, requestId };
  if (sub.params) msg.params = sub.params;
  if (isScannerTopic(sub.topic)) {
    sub.traceRequestId = requestId;
    sub.traceSentAtMs = Date.now();
    sub.traceAckAtMs = void 0;
    sub.traceFirstFrameAtMs = void 0;
    sub.traceFirstUpdateAtMs = void 0;
    scannerWsTrace("subscribe-send", {
      requestId,
      topic: sub.topic,
      params: sub.params
    });
  }
  safeSend(JSON.stringify(msg));
  pendingAcks.set(requestId, serverKey);
  wsLog("subscribe:send", {
    requestId,
    topic: sub.topic,
    paramsKeys: paramsKeys(sub.params)
  });
}
function ensureConnected() {
  if (typeof window === "undefined") return;
  if (closeTimeout) {
    clearTimeout(closeTimeout);
    closeTimeout = null;
  }
  if (!socket || socket.readyState === WebSocket.CLOSED || socket.readyState === WebSocket.CLOSING) {
    connect();
  }
}
function scheduleClose() {
  if (closeTimeout) clearTimeout(closeTimeout);
  closeTimeout = setTimeout(() => {
    if (subscriptions.size === 0 && socket) {
      intentionalClose = true;
      connectionGeneration++;
      socket.close();
      socket = null;
      if (pingInterval) clearInterval(pingInterval);
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
        reconnectTimeout = null;
        notifyDiagnostics();
      }
      setConnectionState("closed");
      removeLifecycleHandlers();
    }
    closeTimeout = null;
  }, 2e3);
}
function subscribe(topic, handler, params, options) {
  if (options?.recovery === "refetch" && !options.onReconnect) {
    throw new Error("WebSocket refetch recovery requires onReconnect");
  }
  const key = `sub_${++subCounter}`;
  const localOnly = isUserTopic(topic);
  const sub = {
    topic,
    handler,
    params,
    localOnly,
    onError: options?.onError,
    onSubscribed: options?.onSubscribed,
    recovery: options?.recovery ?? "resubscribe",
    onReconnect: options?.onReconnect
  };
  if (!localOnly) {
    const serverKey = serverKeyFor(topic, params);
    sub.serverKey = serverKey;
    if (!serverSubscriptions.has(serverKey)) {
      serverSubscriptions.set(serverKey, { topic, params });
    }
  }
  subscriptions.set(key, sub);
  installLifecycleHandlers();
  wsLog("subscribe", {
    key,
    topic,
    localOnly,
    paramsKeys: paramsKeys(params)
  });
  ensureConnected();
  if (sub.serverKey) {
    const serverSub = serverSubscriptions.get(sub.serverKey);
    if (socket?.readyState === WebSocket.OPEN) {
      sendSubscribe(sub.serverKey, serverSub);
    }
  }
  return key;
}
function getSubscriptionWindows(key) {
  const sub = subscriptions.get(key);
  if (!sub?.serverKey) return void 0;
  return serverSubscriptions.get(sub.serverKey)?.windows;
}
function getTopicWindows(topic, params) {
  return serverSubscriptions.get(serverKeyFor(topic, params))?.windows;
}
function unsubscribe(key) {
  const sub = subscriptions.get(key);
  if (!sub) return;
  subscriptions.delete(key);
  if (sub.serverKey && !hasLocalSubscribers(sub.serverKey)) {
    const serverSub = serverSubscriptions.get(sub.serverKey);
    if (serverSub?.pendingRequestId) pendingAcks.delete(serverSub.pendingRequestId);
    if (serverSub?.subId) {
      safeSend(JSON.stringify({ type: "unsubscribe", subId: serverSub.subId }));
    }
    serverSubscriptions.delete(sub.serverKey);
  }
  if (subscriptions.size === 0) {
    scheduleClose();
  }
}
function authenticate(token) {
  currentAuthToken = token;
  if (!token) {
    currentUserId = null;
    return;
  }
  if (socket?.readyState === WebSocket.OPEN) {
    safeSend(JSON.stringify({ type: "auth", token }));
  }
}
function disconnect() {
  intentionalClose = true;
  connectionGeneration++;
  subscriptions.clear();
  serverSubscriptions.clear();
  pendingAcks.clear();
  currentUserId = null;
  outstandingPing = null;
  resetInboundQueue();
  clearRecoveryWatchdog();
  removeLifecycleHandlers();
  if (pingInterval) clearInterval(pingInterval);
  if (reconnectTimeout) {
    clearTimeout(reconnectTimeout);
    reconnectTimeout = null;
  }
  if (closeTimeout) clearTimeout(closeTimeout);
  if (socket) {
    socket.close();
    socket = null;
  }
  setConnectionState("closed");
  notifyDiagnostics();
}
export {
  authenticate,
  disconnect,
  getSubscriptionWindows,
  getTopicWindows,
  getWsDiagnostics,
  isCursorRecoveryReason,
  observeWsDiagnostics,
  subscribe,
  topicMatches,
  unsubscribe
};
