import express from "express";
import {
  buildLatestJson,
  fetchMediumFeed,
  parseBooleanParam,
  parseLimitParam,
  renderMediumCardSvg,
  resolveFeedUrl,
} from "./medium.js";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Origin, X-Requested-With, Content-Type, Accept",
  "Access-Control-Allow-Methods": "GET,OPTIONS",
};

const app = express();

app.use((_, res, next) => {
  Object.entries(corsHeaders).forEach(([key, value]) => {
    res.setHeader(key, value);
  });
  next();
});

app.options("*", (_, res) => {
  res.status(204).end();
});

const handleMediumCard = async (req, res) => {
  const rssParam = typeof req.query.rss === "string" ? req.query.rss.trim() : "";
  const username = typeof req.query.username === "string" ? req.query.username.trim() : "";
  const theme = typeof req.query.theme === "string" ? req.query.theme.trim().toLowerCase() : "dark";

  try {
    const limit = parseLimitParam(req.query.limit);
    const showDate = parseBooleanParam(req.query.show_date, true);
    const showTags = parseBooleanParam(req.query.show_tags, true);

    const feedUrl = resolveFeedUrl({
      rssUrlParam: rssParam,
      usernameParam: username,
      envRssUrl: process.env.RSS_FEED_URL,
    });

    const feed = await fetchMediumFeed(feedUrl);
    const items = feed.items.slice(0, limit);
    const svg = renderMediumCardSvg({
      items,
      username: username || process.env.USERNAME || "",
      theme: theme === "light" ? "light" : "dark",
      showDate,
      showTags,
    });

    res.setHeader("Content-Type", "image/svg+xml");
    res.setHeader("Cache-Control", "public, max-age=3600");
    return res.status(200).send(svg);
  } catch (error) {
    console.error("medium-card error:", error);
    const status = typeof error.status === "number" ? error.status : 500;
    const message = status === 400 ? error.message : "Internal server error";
    return res.status(status).json({ error: message });
  }
};

app.get("/api/medium-blog-card", handleMediumCard);
app.get("/api/medium-card", handleMediumCard);

app.get("/api/medium-json", async (req, res) => {
  try {
    const feedUrl = resolveFeedUrl({
      rssUrlParam: req.query.rss,
      usernameParam: req.query.username,
      envRssUrl: process.env.RSS_FEED_URL,
    });
    const feed = await fetchMediumFeed(feedUrl);
    const json = buildLatestJson(feed);
    res.setHeader("Cache-Control", "public, max-age=3600");
    return res.status(200).json(json);
  } catch (error) {
    console.error("medium-json error:", error);
    const status = typeof error.status === "number" ? error.status : 500;
    const message = status === 400 ? error.message : "Internal server error";
    return res.status(status).json({ error: message });
  }
});

app.get("/", (_, res) => {
  res.json({
    ok: true,
    message: "Medium blog card API is running",
    endpoint: "/api/medium-blog-card?username=<handle>&limit=<optional number>",
  });
});

export default app;
