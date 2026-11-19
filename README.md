# Stop Doom Scroll

Chrome extension (Manifest V3) that removes short-form video feeds.

| Site | Behaviour |
| --- | --- |
| TikTok | Fully blocked. Any `tiktok.com` page redirects to a block screen; embeds and scripts are blocked too. |
| YouTube | Site works. Shorts are blocked everywhere: direct `/shorts/` links, in-app navigation, sidebar and bottom-bar buttons, shelves, tiles, channel tab, filter chips, and the Shorts player API. |
| Instagram | Site works. Reels are blocked: `/reels/`, `/reel/<id>`, profile Reels tab, nav button, reel posts in the feed, grid tiles, and reels shared in Direct messages. |
| Facebook | Site works. `/reel/` and `/reels/` pages and reel links are blocked. |

## How it works

- `rules.json` — `declarativeNetRequest` rules. Catch full page loads (typed URL, opened link, refresh) and redirect to `blocked.html`.
- `content/common.js` — catches in-app (SPA) navigation via the Navigation API, `popstate` and URL polling; swallows clicks on blocked links; runs a DOM sweep on mutations.
- `content/<site>.css` / `.js` — hides entry points and tiles per site.

## Install

1. Open `chrome://extensions`.
2. Turn on **Developer mode**.
3. Click **Load unpacked** and select this folder.

After editing files, press the reload icon on the extension card. Open YouTube, Instagram, Facebook and TikTok tabs refresh automatically.

`./build.sh` packs the extension into `dist/stop-doom-scroll-<version>.zip`.

## Test checklist

- `https://www.tiktok.com/` → block screen.
- `https://www.youtube.com/shorts/<id>` (paste in address bar) → block screen.
- YouTube home: no Shorts in sidebar, no Shorts shelf, no Shorts chip.
- Click a Shorts tile in search results if one slips through → nothing happens.
- `https://www.instagram.com/reels/` → block screen.
- Instagram nav: no Reels button; feed has no reel posts.
- Open a reel link from Instagram DMs → block screen.
- `https://m.youtube.com/` on a mobile viewport: no Shorts in the bottom bar.
