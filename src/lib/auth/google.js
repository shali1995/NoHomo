/**
 * Google sign-in, which is not ours to draw: the auth backend runs the whole OAuth dance and hands
 * the session back to a route of ours.
 *
 * Two things are needed to start it. The **org id**, which is the first label of the API host —
 * every backend this app talks to is addressed as `<org-uuid>.…`, and that label is what the auth
 * backend keys an organization's SSO settings on. And a **redirect URI** back into this app, which
 * the backend sends the browser to with `?token=…&wallet=…` once Google has answered.
 */
import { API_BASE } from "../api/config.js";

/** The auth service, when it is a different origin from the API. Otherwise the API's own host. */
function authBackend() {
  const configured = String(import.meta.env?.VITE_AUTH_BACKEND_URL ?? "").replace(/\/$/, "");
  return configured || API_BASE;
}

/** The organization this build belongs to: the UUID label on the API host, or null. */
export function orgIdFromApiBase() {
  if (!API_BASE) return null;
  try {
    const id = new URL(API_BASE).hostname.split(".")[0];
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id) ? id : null;
  } catch {
    return null;
  }
}

/** Where this app comes back to: the route below reads the session out of the query. */
export const GOOGLE_CALLBACK_PATH = "/auth/google/callback";

/** The backend's own start URL. Navigating to it is the whole flow from this side. */
export function googleStartUrl() {
  const orgId = orgIdFromApiBase();
  if (!orgId) return null;
  const url = new URL(`${authBackend()}/sso/google/start`);
  url.searchParams.set("orgId", orgId);
  url.searchParams.set("redirectUri", `${window.location.origin}${GOOGLE_CALLBACK_PATH}`);
  return url.toString();
}

/** Leave for Google. Returns false when this build cannot start it, so a caller can say so. */
export function startGoogleLogin() {
  const url = googleStartUrl();
  if (!url) return false;
  window.location.href = url;
  return true;
}
