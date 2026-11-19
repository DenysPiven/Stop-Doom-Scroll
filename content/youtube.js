(() => {
  const { install, hide } = window.__stopDoomScroll;

  const isBlockedUrl = (url) => /^\/shorts(\/|$)/i.test(url.pathname);

  // Labels YouTube uses for the Shorts tab / chip across common locales.
  const SHORTS_LABELS = new Set(["shorts", "шортси", "шорты", "short", "courts métrages"]);
  const isShortsLabel = (text) => SHORTS_LABELS.has((text || "").trim().toLowerCase());

  const sweep = () => {
    // Channel page "Shorts" tab.
    document
      .querySelectorAll("yt-tab-shape, tp-yt-paper-tab, ytm-tab-renderer, .yt-tab-shape-wiz__tab")
      .forEach((tab) => {
        if (isShortsLabel(tab.getAttribute("tab-title") || tab.textContent)) hide(tab);
      });

    // Filter chips ("Shorts" on home, search, subscriptions).
    document
      .querySelectorAll("yt-chip-cloud-chip-renderer, ytm-chip-cloud-chip-renderer, chip-shape")
      .forEach((chip) => {
        if (isShortsLabel(chip.textContent)) hide(chip);
      });

    // Sidebar / mini sidebar / mobile pivot bar entries.
    document
      .querySelectorAll(
        "ytd-guide-entry-renderer, ytd-mini-guide-entry-renderer, ytm-pivot-bar-item-renderer"
      )
      .forEach((entry) => {
        const label =
          entry.getAttribute("aria-label") ||
          entry.querySelector("[title]")?.getAttribute("title") ||
          entry.textContent;
        if (isShortsLabel(label)) hide(entry);
      });

    // Any shelf/section whose header says "Shorts".
    document
      .querySelectorAll("ytd-rich-section-renderer, ytd-item-section-renderer, ytd-shelf-renderer")
      .forEach((section) => {
        const title = section.querySelector("#title, h2, .yt-shelf-header-layout__title")?.textContent;
        if (isShortsLabel(title)) hide(section);
      });

    // Any remaining tile that links to /shorts/.
    document.querySelectorAll('a[href^="/shorts"], a[href*="youtube.com/shorts"]').forEach((a) => {
      hide(
        a.closest(
          [
            "ytd-rich-item-renderer",
            "ytd-video-renderer",
            "ytd-grid-video-renderer",
            "ytd-compact-video-renderer",
            "ytd-reel-item-renderer",
            "ytm-shorts-lockup-view-model",
            "ytm-shorts-lockup-view-model-v2",
            "ytm-video-with-context-renderer",
            "ytm-compact-video-renderer",
            "yt-lockup-view-model",
          ].join(",")
        ) || a
      );
    });
  };

  install({ what: "shorts", isBlockedUrl, sweep });

  // YouTube's own router event fires before the URL changes.
  document.addEventListener(
    "yt-navigate-start",
    (e) => {
      const url = e.detail?.url;
      if (url && isBlockedUrl(new URL(url, location.href))) {
        location.replace(chrome.runtime.getURL("blocked.html?what=shorts"));
      }
    },
    true
  );
})();
