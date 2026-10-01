import createClient from "openapi-fetch";
import { getAuthToken, disconnect, refreshToken } from "../auth.svelte.js";
import { apiOrigin } from "./config.js";

export const api = createClient({ baseUrl: apiOrigin() });

const REFRESH_PATH = "/v2/auth/refresh";

const authMiddleware = {
  async onRequest({ request }) {
    const token = getAuthToken();
    if (token) request.headers.set("Authorization", `Bearer ${token}`);
    return request;
  },
  async onResponse({ request, response }) {
    if (response.status !== 401 || !getAuthToken()) return response;
    const url = new URL(request.url);
    if (url.pathname.endsWith(REFRESH_PATH) || request.headers.get("x-auth-retry")) {
      disconnect();
      return response;
    }
    const next = await refreshToken();
    if (!next) return response;
    const retry = request.clone();
    retry.headers.set("Authorization", `Bearer ${next}`);
    retry.headers.set("x-auth-retry", "1");
    try {
      return await fetch(retry);
    } catch {
      return response;
    }
  }
};

api.use(authMiddleware);
