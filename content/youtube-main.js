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

  // Item-level wrappers: removed when anything inside points at a Short
  // (checked before their children are pruned, so empty shelves go too).
  const MARKER_KEYS = new Set([
    "richItemRenderer",
    "richSectionRenderer",
    "videoRenderer",
    "gridVideoRenderer",
    "compactVideoRenderer",
    "lockupViewModel",
    "gridShelfViewModel",
    "guideEntryRenderer",
    "pivotBarItemRenderer",
    "videoWithContextRenderer",
    "compactAutoplayRenderer",
  ]);

  // Containers that may mix Shorts with other content: removed only when
  // their own label or header says "Shorts"; otherwise their children are pruned.
  const LABEL_KEYS = new Set([
    ...MARKER_KEYS,
    "shelfRenderer",
    "itemSectionRenderer",
    "chipCloudChipRenderer",
    "chipViewModel",
    "tabRenderer",
    "expandableTabRenderer",
    "searchFilterRenderer",
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
  const SHORTS_HEADER = /"(content|simpleText|text|title)":"(shorts|шортси|шорты)"/i;

  const textOf = (t) =>
    (typeof t === "string"
      ? t
      : t?.simpleText ?? t?.content ?? t?.runs?.map((r) => r.text).join("") ?? ""
    )
      .trim()
      .toLowerCase();

  const isShortsLabel = (v) =>
    ["title", "text", "formattedTitle", "label"].some((k) => SHORTS_LABELS.has(textOf(v[k]))) ||
    (v.header != null && SHORTS_HEADER.test(JSON.stringify(v.header)));

  const isShortsItem = (item) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) return false;
    const keys = Object.keys(item);
    if (keys.length !== 1) return false;
    const key = keys[0];
    if (SHORTS_KEYS.has(key)) return true;
    if (!LABEL_KEYS.has(key)) return false;
    const value = item[key];
    if (!value || typeof value !== "object") return false;
    if (isShortsLabel(value)) return true;
    if (!MARKER_KEYS.has(key)) return false;
    if (value.content?.richShelfRenderer?.isShorts) return true;
    const json = JSON.stringify(value);
    return SHORTS_MARKERS.some((m) => json.includes(m));
  };

  const prune = (node) => {
    if (Array.isArray(node)) {
      for (let i = node.length - 1; i >= 0; i--) {
        if (isShortsItem(node[i])) node.splice(i, 1);
        else prune(node[i]);
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
  // New searches default to the "Videos" filter, so Shorts aren't even requested.
  // Searches that already carry a filter (params) are left alone.
  const SEARCH = /\/youtubei\/v1\/search/;
  const VIDEOS_FILTER = "EgIQAQ%3D%3D";
  const withVideosFilter = (body) => {
    try {
      const data = JSON.parse(body);
      if (!data.query || data.params || data.continuation) return null;
      data.params = VIDEOS_FILTER;
      return JSON.stringify(data);
    } catch {
      return null;
    }
  };

  window.fetch = async function (input, init) {
    let args = arguments;
    try {
      const reqUrl = typeof input === "string" ? input : input?.url || String(input);
      if (SEARCH.test(reqUrl)) {
        if (typeof init?.body === "string") {
          const body = withVideosFilter(init.body);
          if (body) args = [input, { ...init, body }];
        } else if (input instanceof Request && !init) {
          const body = withVideosFilter(await input.clone().text());
          if (body) args = [new Request(input, { body })];
        }
      }
    } catch {}
    const response = await origFetch.apply(this, args);
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
    this.__sdsSearch = SEARCH.test(String(url));
    return xhrOpen.apply(this, arguments);
  };
  const xhrSend = XMLHttpRequest.prototype.send;
  XMLHttpRequest.prototype.send = function (body) {
    if (this.__sdsSearch && typeof body === "string") {
      const filtered = withVideosFilter(body);
      if (filtered) return xhrSend.call(this, filtered);
    }
    return xhrSend.apply(this, arguments);
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
