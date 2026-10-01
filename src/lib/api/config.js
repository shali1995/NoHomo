const env = import.meta.env;

export const API_BASE = (env?.VITE_API_BASE ?? "").replace(/\/$/, "");

export const API_PROXY = /^(1|true|yes)$/i.test(env?.VITE_API_PROXY ?? "");

export function apiOrigin() {
  return API_PROXY ? "" : API_BASE;
}

export function apiUrl(path) {
  return `${apiOrigin()}${path}`;
}

export function tokenImage(chain, address, size) {
  const url = apiUrl(`/v2/token/image/${chain}/${address}`);
  return size ? `${url}?h=${size}&w=${size}` : url;
}

export function avatarUrl(photoId) {
  if (!photoId) return null;
  return apiUrl(`/v2/avatar/${photoId}`);
}

export function wsBase() {
  if (API_PROXY) {
    const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
    return `${proto}//${window.location.host}`;
  }
  return API_BASE.replace(/^http/, "ws");
}
