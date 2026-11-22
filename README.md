# Stop Doom Scroll

Chrome extension (Manifest V3) that removes short-form video feeds.

| Site | Behaviour |
| --- | --- |
| TikTok | Fully blocked. Any `tiktok.com` page redirects to a block screen; embeds and scripts are blocked too. |
| Threads | Fully blocked (`threads.net`, `threads.com`), including embeds. |
| X | Fully blocked (`x.com`, `twitter.com`), including embedded posts. `t.co` short links still resolve. |
| YouTube | Site works. Shorts are blocked everywhere: direct `/shorts/` links, in-app navigation, sidebar and bottom-bar buttons, shelves, tiles, channel tab, filter chips, and the Shorts player API. |
| Instagram | Site works. Reels are blocked: `/reels/`, `/reel/<id>`, profile Reels tab, nav button, reel posts in the feed, grid tiles, and reels shared in Direct messages. |
| Facebook | Site works. `/reel/` and `/reels/` pages and reel links are blocked. |

## How it works

- `rules.json` — `declarativeNetRequest` rules. Catch full page loads (typed URL, opened link, refresh) and redirect to `blocked.html`.
- `content/youtube-main.js` — runs in the page before YouTube's scripts and strips Shorts from `ytInitialData` and `youtubei` API responses, so they are never rendered.
- `content/common.js` — catches in-app (SPA) navigation via the Navigation API, `popstate` and URL polling; swallows clicks on blocked links; runs a DOM sweep on mutations.
- `content/<site>.css` / `.js` — hides entry points and tiles per site.

## Install

1. Download `stop-doom-scroll-<version>.zip` from the [latest release](https://github.com/DenysPiven/Stop-Doom-Scroll/releases/latest) and unzip it to a folder you'll keep (Chrome loads the extension from there).
2. Open `chrome://extensions` and turn on **Developer mode** in the top-right corner.
3. Click **Load unpacked** and select the unzipped `stop-doom-scroll` folder.
4. Pin the extension icon to the toolbar.

You can also `git clone` the repository and load that folder instead. After editing files, press the reload icon on the extension card; open tabs on covered sites refresh automatically.

## Test checklist

- `https://www.tiktok.com/` → block screen.
- `https://www.threads.com/` and `https://x.com/` → block screen.
- `https://www.youtube.com/shorts/<id>` (paste in address bar) → block screen.
- YouTube home: no Shorts in sidebar, no Shorts shelf, no Shorts chip.
- Click a Shorts tile in search results if one slips through → nothing happens.
- `https://www.instagram.com/reels/` → block screen.
- Instagram nav: no Reels button; feed has no reel posts.
- Open a reel link from Instagram DMs → block screen.
- `https://m.youtube.com/` on a mobile viewport: no Shorts in the bottom bar.
