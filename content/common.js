// Shared guard: catches SPA navigation, intercepts clicks on blocked links,
// and runs a DOM sweep for elements CSS alone cannot target.
(() => {
  if (window.__stopDoomScroll) return;

  const blockedPage = (what) =>
    chrome.runtime.getURL(`blocked.html?what=${encodeURIComponent(what)}`);

  function install({ what, isBlockedUrl, sweep }) {
    let redirected = false;

    const check = (href = location.href) => {
      if (redirected) return true;
      if (!isBlockedUrl(new URL(href, location.href))) return false;
      redirected = true;
      // Stop any media that may already be playing before we leave.
      document.querySelectorAll("video, audio").forEach((m) => {
        try { m.pause(); m.removeAttribute("src"); m.load(); } catch {}
      });
      location.replace(blockedPage(what));
      return true;
    };

    // 1. Current URL at load.
    check();

    // 2. Navigation API sees pushState / replaceState / link navigations.
    if (window.navigation) {
      navigation.addEventListener("navigate", (e) => {
        try {
          if (isBlockedUrl(new URL(e.destination.url))) {
            if (e.cancelable) e.preventDefault();
            check(e.destination.url);
          }
        } catch {}
      });
    }

    // 3. Fallbacks: history events and polling.
    window.addEventListener("popstate", () => check());
    let last = location.href;
    setInterval(() => {
      if (location.href !== last) {
        last = location.href;
        check();
      }
    }, 250);

    // 4. Swallow clicks on blocked links before the site's router sees them.
    const onPointer = (e) => {
      const a = e.target instanceof Element ? e.target.closest("a[href]") : null;
      if (!a) return;
      let url;
      try { url = new URL(a.getAttribute("href"), location.href); } catch { return; }
      if (url.origin === location.origin && isBlockedUrl(url)) {
        e.preventDefault();
        e.stopImmediatePropagation();
      }
    };
    for (const type of ["click", "auxclick", "mousedown", "pointerdown", "touchstart", "keydown"]) {
      window.addEventListener(type, (e) => {
        if (type === "keydown" && e.key !== "Enter") return;
        onPointer(e);
      }, { capture: true, passive: false });
    }

    // 5. DOM sweep for text-based elements (localized tabs, chips, etc.).
    if (sweep) {
      let scheduled = false;
      const run = () => {
        scheduled = false;
        try { sweep(); } catch {}
      };
      const schedule = () => {
        if (scheduled) return;
        scheduled = true;
        requestAnimationFrame(run);
      };
      const start = () => {
        new MutationObserver(schedule).observe(document.documentElement, {
          childList: true,
          subtree: true,
        });
        schedule();
      };
      if (document.documentElement) start();
      else document.addEventListener("DOMContentLoaded", start, { once: true });
    }
  }

  const hide = (el) => {
    if (el && !el.hasAttribute("data-sds-hidden")) {
      el.setAttribute("data-sds-hidden", "");
      el.style.setProperty("display", "none", "important");
    }
  };

  window.__stopDoomScroll = { install, hide };
})();
