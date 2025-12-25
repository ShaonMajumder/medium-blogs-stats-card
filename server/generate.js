import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  buildLatestJson,
  fetchMediumFeed,
  parseBooleanParam,
  parseLimitParam,
  renderMediumCardSvg,
  resolveFeedUrl,
} from "./medium.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");

async function generate() {
  const feedUrl = resolveFeedUrl({
    rssUrlParam: process.env.RSS_FEED_URL,
    usernameParam: process.env.USERNAME,
    envRssUrl: process.env.RSS_FEED_URL,
  });

  const limit = parseLimitParam(process.env.LIMIT);
  const showDate = parseBooleanParam(process.env.SHOW_DATE, true);
  const showTags = parseBooleanParam(process.env.SHOW_TAGS, true);
  const theme = process.env.THEME === "light" ? "light" : "dark";

  const feed = await fetchMediumFeed(feedUrl);
  const items = feed.items.slice(0, limit);

  const latestJson = buildLatestJson({
    ...feed,
    items,
  });

  const svg = renderMediumCardSvg({
    items,
    username: process.env.USERNAME || "",
    theme,
    showDate,
    showTags,
  });

  await fs.writeFile(path.join(rootDir, "latest.json"), `${JSON.stringify(latestJson, null, 2)}\n`, "utf8");
  await fs.writeFile(path.join(rootDir, "latest.svg"), `${svg.trim()}\n`, "utf8");
}

generate().catch((error) => {
  console.error("Failed to generate Medium blog card:", error);
  process.exit(1);
});
