// After install or reload of the extension, refresh open tabs on covered sites
// so the new content scripts take effect without manual page refreshes.
const COVERED = [
  "*://*.tiktok.com/*",
  "*://*.youtube.com/*",
  "*://*.instagram.com/*",
  "*://*.facebook.com/*",
];

chrome.runtime.onInstalled.addListener(async () => {
  const tabs = await chrome.tabs.query({ url: COVERED });
  for (const tab of tabs) {
    chrome.tabs.reload(tab.id).catch(() => {});
  }
});
