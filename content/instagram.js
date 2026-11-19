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
  };

  install({ what: "reels", isBlockedUrl, sweep });
})();
