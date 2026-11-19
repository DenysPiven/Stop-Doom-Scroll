(() => {
  const { install, hide } = window.__stopDoomScroll;

  // /reels/, /reel/<id>/, /<username>/reels/, /<username>/reel/<id>/
  const isBlockedUrl = (url) => /^\/([^/]+\/)?reels?(\/|$)/i.test(url.pathname);

  const REEL_LINK = 'a[href*="/reel/"], a[href*="/reels/"], a[href$="/reels"]';

  const sweep = () => {
    document.querySelectorAll(REEL_LINK).forEach((a) => {
      // Feed post that is a reel → remove the whole post.
      const article = a.closest("article");
      if (article) return hide(article);
      // Sidebar / bottom nav item, profile tab, explore or grid tile.
      hide(a.closest('[role="listitem"], li') || a);
    });

    // Feed videos can be reels without a visible /reel/ link: hide posts
    // whose video sits under the reels audio attribution.
    document.querySelectorAll('article a[href*="/reels/audio/"]').forEach((a) => {
      hide(a.closest("article"));
    });

    // Reels shared in Direct messages: a message bubble with the reels icon
    // and no link (Instagram opens them via a click handler).
    document.querySelectorAll(DM_REEL_ICON).forEach((icon) => {
      hide(icon.closest('[role="article"]') || icon.closest('[role="button"]'));
    });
  };

  // aria-label of the reels icon across locales.
  const DM_REEL_ICON = ["Clip", "Reel", "Reels", "Рілс", "Рілси", "Reels-відео"]
    .map((l) => `[role="main"] svg[aria-label="${l}"]`)
    .join(", ");

  // Block clicks on DM reel bubbles even if hiding fails.
  for (const type of ["click", "mousedown", "pointerdown", "touchstart", "keydown"]) {
    window.addEventListener(
      type,
      (e) => {
        if (type === "keydown" && e.key !== "Enter" && e.key !== " ") return;
        const target = e.target instanceof Element ? e.target : null;
        const bubble = target?.closest('[role="button"], [role="article"]');
        if (bubble && bubble.querySelector(DM_REEL_ICON.replaceAll('[role="main"] ', ""))) {
          e.preventDefault();
          e.stopImmediatePropagation();
        }
      },
      { capture: true, passive: false }
    );
  }

  install({ what: "reels", isBlockedUrl, sweep });
})();
