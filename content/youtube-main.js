// Runs in the page's own JS world before YouTube's scripts.
// Strips Shorts out of YouTube's data (initial page data and API responses)
// so they are never rendered, instead of being hidden after they appear.
(() => {
  if (window.__sdsYouTubeData) return;
  window.__sdsYouTubeData = true;

  // Renderers that are always Shorts.
  const SHORTS_KEYS = new Set([
    "reelShelfRenderer",
    "reelItemRenderer",
    "shortsLockupViewModel",
    "reelWatchEndpoint",
  ]);

  // Item-level wrappers that are removed when they point at a Short.
  const ITEM_KEYS = new Set([
    "richItemRenderer",
    "richSectionRenderer",
    "videoRenderer",
    "gridVideoRenderer",
    "compactVideoRenderer",
    "lockupViewModel",
    "gridShelfViewModel",
    "shelfRenderer",
    "guideEntryRenderer",
    "pivotBarItemRenderer",
    "chipCloudChipRenderer",
    "chipViewModel",
    "tabRenderer",
    "expandableTabRenderer",
    "videoWithContextRenderer",
    "compactAutoplayRenderer",
  ]);

  const SHORTS_MARKERS = [
    '"reelWatchEndpoint"',
    '"shortsLockupViewModel"',
    '"reelShelfRenderer"',
    '"reelItemRenderer"',
    '"url":"/shorts',
    '"isShorts":true',
    '"browseId":"FEshorts"',
    '"iconType":"TAB_SHORTS"',
  ];

  const SHORTS_LABELS = new Set(["shorts", "шортси", "шорты"]);

  const textOf = (t) =>
    (t?.simpleText ?? t?.content ?? t?.runs?.map((r) => r.text).join("") ?? "")
      .trim()
      .toLowerCase();

  const isShortsLabel = (v) =>
    SHORTS_LABELS.has(textOf(v.title)) ||
    SHORTS_LABELS.has(textOf(v.text)) ||
    SHORTS_LABELS.has(textOf(v.formattedTitle)) ||
    SHORTS_LABELS.has((v.title && typeof v.title === "string" ? v.title : "").trim().toLowerCase());

  const isShortsItem = (item) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) return false;
    const keys = Object.keys(item);
    if (keys.length !== 1) return false;
    const key = keys[0];
    if (SHORTS_KEYS.has(key)) return true;
    if (!ITEM_KEYS.has(key)) return false;
    const value = item[key];
    if (value && typeof value === "object" && isShortsLabel(value)) return true;
    if (value?.content?.richShelfRenderer?.isShorts) return true;
    const json = JSON.stringify(value);
    return SHORTS_MARKERS.some((m) => json.includes(m));
  };

  // Bottom-up walk: prune children first, then filter arrays.
  const prune = (node) => {
    if (Array.isArray(node)) {
      for (let i = node.length - 1; i >= 0; i--) {
        prune(node[i]);
        if (isShortsItem(node[i])) node.splice(i, 1);
      }
    } else if (node && typeof node === "object") {
      for (const k in node) {
        const v = node[k];
        if (v && typeof v === "object") prune(v);
      }
    }
    return node;
  };

  const safePrune = (data) => {
    try { prune(data); } catch {}
    return data;
  };

  // 1. Initial page data: `var ytInitialData = ...` assigns through this setter.
  for (const name of ["ytInitialData"]) {
    let value;
    try {
      Object.defineProperty(window, name, {
        configurable: true,
        get: () => value,
        set: (v) => { value = safePrune(v); },
      });
    } catch {}
  }

  // 2. API responses fetched while navigating or scrolling.
  const API = /\/youtubei\/v1\/(search|browse|next|guide|reel)/;
  const origFetch = window.fetch;
  window.fetch = async function (input, init) {
    const response = await origFetch.apply(this, arguments);
    try {
      const url = typeof input === "string" ? input : input?.url || String(input);
      if (!API.test(url) || !response.ok) return response;
      const data = safePrune(await response.clone().json());
      const headers = new Headers(response.headers);
      headers.delete("content-length");
      headers.delete("content-encoding");
      const filtered = new Response(JSON.stringify(data), {
        status: response.status,
        statusText: response.statusText,
        headers,
      });
      Object.defineProperty(filtered, "url", { value: response.url });
      return filtered;
    } catch {
      return response;
    }
  };

  // 3. Same for XMLHttpRequest, used by some YouTube builds.
  const xhrOpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function (method, url) {
    this.__sdsApi = API.test(String(url));
    return xhrOpen.apply(this, arguments);
  };
  const desc = (name) => Object.getOwnPropertyDescriptor(XMLHttpRequest.prototype, name);
  const responseDesc = desc("response");
  const textDesc = desc("responseText");
  const filteredBody = (xhr) => {
    if (xhr.__sdsFiltered !== undefined) return xhr.__sdsFiltered;
    const raw = textDesc.get.call(xhr);
    try { xhr.__sdsFiltered = JSON.stringify(safePrune(JSON.parse(raw))); }
    catch { xhr.__sdsFiltered = raw; }
    return xhr.__sdsFiltered;
  };
  Object.defineProperty(XMLHttpRequest.prototype, "responseText", {
    configurable: true,
    get() {
      if (!this.__sdsApi || this.readyState !== 4) return textDesc.get.call(this);
      return filteredBody(this);
    },
  });
  Object.defineProperty(XMLHttpRequest.prototype, "response", {
    configurable: true,
    get() {
      const type = this.responseType;
      if (!this.__sdsApi || this.readyState !== 4 || (type && type !== "text" && type !== "json")) {
        return responseDesc.get.call(this);
      }
      if (type === "json") {
        if (this.__sdsJson === undefined) this.__sdsJson = safePrune(responseDesc.get.call(this));
        return this.__sdsJson;
      }
      return filteredBody(this);
    },
  });
})();
