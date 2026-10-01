const routes = [];

export function defineRoute(pattern, resolve) {
  const names = [];
  const regexSource = pattern
    .replace(/[.+*?^${}()|[\]\\]/g, "\\$&")
    .replace(/:([A-Za-z_][A-Za-z0-9_]*)/g, (_match, name) => {
      names.push(name);
      return "([^/]+)";
    });
  routes.push({ pattern, regex: new RegExp(`^${regexSource}/?$`), names, resolve });
  return pattern;
}

export function matchRoute(pathname) {
  for (const route of routes) {
    const match = route.regex.exec(pathname);
    if (!match) continue;
    const params = {};
    route.names.forEach((name, i) => {
      params[name] = decodeURIComponent(match[i + 1]);
    });
    return { pattern: route.pattern, params, ...route.resolve(params) };
  }
  return null;
}

export function navigate(to, { replace = false } = {}) {
  const url = new URL(to, window.location.origin);
  if (url.pathname + url.search === window.location.pathname + window.location.search) return;
  if (replace) window.history.replaceState(null, "", url);
  else window.history.pushState(null, "", url);
  window.dispatchEvent(new PopStateEvent("popstate"));
}

/**
 * Navigate from a control that is not an anchor — a row the capture drew as a button, or a
 * div standing in for a link. The same modifiers the delegated click handler honours:
 * a modified click is the browser's, not ours.
 *
 * @param {MouseEvent | KeyboardEvent} event
 * @param {string} href
 */
export function followLink(event, href) {
  if (!href) return;
  if ("button" in event && event.button !== 0) return;
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  event.preventDefault();
  navigate(href);
}

/** `followLink` for a div that is standing in for a link: Enter and Space activate it. */
export function followLinkKey(event, href) {
  if (event.key !== "Enter" && event.key !== " ") return;
  followLink(event, href);
}

export function startRouter() {
  const onClick = (event) => {
    if (event.defaultPrevented || event.button !== 0) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const anchor = event.target instanceof Element ? event.target.closest("a[href]") : null;
    if (!anchor) return;
    const href = anchor.getAttribute("href");
    if (!href || anchor.target === "_blank" || anchor.hasAttribute("download")) return;
    let url;
    try {
      url = new URL(href, window.location.origin);
    } catch {
      return;
    }
    if (url.origin !== window.location.origin) return;
    if (anchor.getAttribute("rel")?.includes("external")) return;
    event.preventDefault();
    navigate(url.pathname + url.search + url.hash);
  };
  document.addEventListener("click", onClick);
  return () => document.removeEventListener("click", onClick);
}
