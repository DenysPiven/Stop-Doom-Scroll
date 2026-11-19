const COPY = {
  tiktok: {
    title: "TikTok is off.",
    line: "Completely blocked. Nothing to see here.",
    exit: ["Go somewhere useful", "https://www.google.com/"],
  },
  shorts: {
    title: "No Shorts.",
    line: "YouTube still works. Shorts don't.",
    exit: ["Back to YouTube", "https://www.youtube.com/"],
  },
  reels: {
    title: "No Reels.",
    line: "Instagram still works. Reels don't.",
    exit: ["Back to Instagram", "https://www.instagram.com/"],
  },
  fbreels: {
    title: "No Reels.",
    line: "Facebook still works. Reels don't.",
    exit: ["Back to Facebook", "https://www.facebook.com/"],
  },
};

const what = new URLSearchParams(location.search).get("what");
const copy = COPY[what];

if (copy) {
  document.getElementById("title").textContent = copy.title;
  document.getElementById("line").textContent = copy.line;
  const exit = document.getElementById("exit");
  exit.textContent = copy.exit[0];
  exit.href = copy.exit[1];
}
