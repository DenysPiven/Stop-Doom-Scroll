(() => {
  const { install, hide } = window.__stopDoomScroll;

  const isBlockedUrl = (url) => /^\/(reel|reels)(\/|$)/i.test(url.pathname);

  const sweep = () => {
    document.querySelectorAll('a[href*="/reel/"], a[href*="/reels/"]').forEach((a) => {
      hide(a.closest('[role="article"], [role="listitem"], li') || a);
    });
  };

  install({ what: "fbreels", isBlockedUrl, sweep });
})();
