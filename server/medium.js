import { XMLParser } from "fast-xml-parser";

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0 Safari/537.36";

const DEFAULT_LIMIT = 1;
const MAX_LIMIT = 10;

const parser = new XMLParser({
  ignoreAttributes: false,
  cdataPropName: "__cdata",
  allowBooleanAttributes: true,
});

export function resolveFeedUrl({ rssUrlParam, usernameParam, envRssUrl }) {
  const rss = typeof rssUrlParam === "string" ? rssUrlParam.trim() : "";
  if (rss) {
    return ensureUrl(rss, "Invalid RSS URL");
  }

  const username = typeof usernameParam === "string" ? usernameParam.trim() : "";
  if (username) {
    const handle = username.startsWith("@") ? username : `@${username}`;
    return `https://medium.com/feed/${handle}`;
  }

  const envUrl = typeof envRssUrl === "string" ? envRssUrl.trim() : "";
  if (envUrl) {
    return ensureUrl(envUrl, "Invalid RSS_FEED_URL");
  }

  throw createError(400, "RSS feed URL or username is required");
}

export function parseLimitParam(value) {
  const raw = typeof value === "string" ? value.trim() : "";
  if (!raw) return DEFAULT_LIMIT;
  const parsed = Number.parseInt(raw, 10);
  if (Number.isNaN(parsed) || parsed <= 0) {
    throw createError(400, "Limit must be a positive integer");
  }
  return Math.min(parsed, MAX_LIMIT);
}

export function parseBooleanParam(value, defaultValue) {
  if (typeof value !== "string") return defaultValue;
  const normalized = value.trim().toLowerCase();
  if (["true", "1", "yes", "y"].includes(normalized)) return true;
  if (["false", "0", "no", "n"].includes(normalized)) return false;
  return defaultValue;
}

export async function fetchMediumFeed(feedUrl) {
  const response = await fetch(feedUrl, { headers: { "User-Agent": USER_AGENT } });
  if (!response.ok) {
    throw createError(502, `Failed to fetch RSS feed (${response.status})`);
  }

  const xml = await response.text();
  let parsed;
  try {
    parsed = parser.parse(xml);
  } catch (error) {
    throw createError(400, "Invalid RSS feed");
  }

  const channel = parsed?.rss?.channel ?? parsed?.feed ?? null;
  if (!channel) {
    throw createError(400, "Invalid RSS feed");
  }

  const rawItems = channel.item ?? channel.entry ?? [];
  const itemsArray = Array.isArray(rawItems) ? rawItems : rawItems ? [rawItems] : [];

  const feedTitle = cleanText(getText(channel.title)) || "Medium RSS Feed";
  const lastBuildDate = cleanText(getText(channel.lastBuildDate || channel.updated)) || "";

  const items = itemsArray.map((item) => {
    const title = cleanText(getText(item.title)) || "Untitled";
    const link = sanitizeLink(resolveItemLink(item));
    const pubDateRaw = cleanText(getText(item.pubDate || item.published || item.updated));
    const date = pubDateRaw ? formatDate(pubDateRaw) : "";
    const tags = normalizeTags(item.category);

    return {
      title,
      link,
      pubDate: pubDateRaw,
      date,
      tags,
    };
  });

  return { feedTitle, lastBuildDate, items };
}

export function buildLatestJson({ feedTitle, lastBuildDate, items }) {
  return {
    feedTitle,
    lastBuildDate,
    items: items.map((item) => ({
      title: item.title,
      link: item.link,
      date: item.date,
      tags: item.tags,
    })),
  };
}

export function renderMediumCardSvg({
  items,
  username,
  theme,
  showDate,
  showTags,
  headerLabel,
}) {
  const themeTokens = getThemeTokens(theme);
  const safeItems = Array.isArray(items) ? items : [];
  const headerText = headerLabel || (safeItems.length > 1 ? "Latest Medium Posts" : "Latest Medium Post");

  const headerHeight = 110;
  const titleLineHeight = 18;
  const maxTitleChars = 52;

  const itemsWithLayout = safeItems.map((item) => {
    const titleLines = wrapText(item.title || "Untitled", maxTitleChars);
    const titleHeight = titleLines.length * titleLineHeight;
    const dateHeight = showDate && item.date ? 16 : 0;
    const tagsHeight = showTags && item.tags.length > 0 ? 20 : 0;
    const contentHeight = titleHeight + dateHeight + tagsHeight + 14;
    return { ...item, titleLines, titleHeight, contentHeight };
  });

  const totalHeight =
    headerHeight + itemsWithLayout.reduce((sum, item) => sum + item.contentHeight + 14, 0) + 20;

  let cursorY = headerHeight;
  const svgItems = itemsWithLayout
    .map((item) => {
      const y = cursorY;
      cursorY += item.contentHeight + 14;

      const safeLink = escapeXml(item.link || "#");
      const titleTspans = item.titleLines
        .map(
          (line, i) =>
            `<tspan x="0" dy="${i === 0 ? 0 : titleLineHeight}">${escapeXml(line)}</tspan>`,
        )
        .join("");

      const dateY = item.titleHeight + 10;
      const tagsY = dateY + (showDate && item.date ? 16 : 0) + 6;
      const dateLine = showDate && item.date ? renderDateLine(item.date, themeTokens, dateY) : "";
      const tagsLine = showTags && item.tags.length > 0 ? renderTags(item.tags, themeTokens, tagsY) : "";

      const cardHeight = item.contentHeight + 4;

      const safeTitle = escapeXml(item.title || "Untitled");
      return `
        <g transform="translate(70, ${y})">
          <rect x="-12" y="-18" width="510" height="${cardHeight}" rx="12" fill="${themeTokens.cardAccent}" opacity="0.45" />
          <a xlink:href="${safeLink}" target="_blank">
            <text x="0" y="0" font-family="'Sora', 'Segoe UI', sans-serif" font-size="14.5" font-weight="600" fill="${themeTokens.link}">
              ${titleTspans}
            </text>
          </a>
          ${dateLine}
          ${tagsLine}
        </g>
      `;
    })
    .join("");

  const footer = username
    ? `
      <text x="520" y="${totalHeight - 18}" font-family="'Segoe UI', sans-serif" font-size="10" fill="${themeTokens.accent}" text-anchor="end" opacity="0.7">
        by ${escapeXml(username)}
      </text>
    `
    : "";

  return `
    <svg width="550" height="${totalHeight}" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
      <defs>
        <linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" style="stop-color:${themeTokens.accent};stop-opacity:1" />
          <stop offset="100%" style="stop-color:${themeTokens.accentSoft};stop-opacity:1" />
        </linearGradient>
        <pattern id="grain" x="0" y="0" width="4" height="4" patternUnits="userSpaceOnUse">
          <rect width="4" height="4" fill="${themeTokens.base}" />
          <circle cx="1" cy="1" r="0.4" fill="${themeTokens.grain}" />
          <circle cx="3" cy="2" r="0.35" fill="${themeTokens.grain}" />
        </pattern>
      </defs>

      <rect width="550" height="${totalHeight}" rx="16" fill="url(#grain)" />
      <rect x="18" y="16" width="514" height="${totalHeight - 32}" rx="18" fill="${themeTokens.card}" stroke="${themeTokens.border}" stroke-width="1.5"/>
      <rect x="34" y="34" width="8" height="${totalHeight - 68}" rx="6" fill="${themeTokens.rail}" opacity="0.6" />

      <g transform="translate(70, 50)">
        <text x="0" y="0" font-family="'Playfair Display', 'Georgia', serif" font-size="24" font-weight="600" fill="${themeTokens.text}">
          ${escapeXml(headerText)}
        </text>
        <text x="0" y="22" font-family="'Sora', 'Segoe UI', sans-serif" font-size="12" fill="${themeTokens.muted}">
          Curated from your Medium RSS feed
        </text>
      </g>

      ${svgItems}

      <g transform="translate(0, ${totalHeight - 12})">
        <text x="70" y="0" font-family="'Sora', 'Segoe UI', sans-serif" font-size="10" fill="${themeTokens.muted}" opacity="0.7">
          Medium Blog Stats Card
        </text>
        ${footer}
      </g>
    </svg>
  `;
}

function ensureUrl(value, errorMessage) {
  try {
    return new URL(value).toString();
  } catch (error) {
    throw createError(400, errorMessage);
  }
}

function getThemeTokens(theme) {
  if (theme === "light") {
    return {
      base: "#f7f7f5",
      grain: "#d7d7d2",
      card: "#ffffff",
      cardAccent: "#f2f2ee",
      border: "#d8d8d2",
      rail: "#111111",
      accent: "#00ab6c",
      accentSoft: "#4fd08a",
      text: "#111111",
      muted: "#5e5e5e",
      link: "#111111",
    };
  }

  return {
      base: "#0b0b0b",
      grain: "#1b1b1b",
      card: "#101010",
      cardAccent: "#181818",
      border: "#2f2f2f",
      rail: "#ffffff",
      accent: "#00ab6c",
      accentSoft: "#4fd08a",
      text: "#ffffff",
      muted: "#b3b3b3",
      link: "#ffffff",
  };
}

function resolveItemLink(item) {
  const linkValue = item?.link;
  if (!linkValue) return "";

  if (typeof linkValue === "string") return linkValue;
  if (typeof linkValue === "object") {
    if (typeof linkValue["@_href"] === "string") return linkValue["@_href"];
    if (typeof linkValue.href === "string") return linkValue.href;
    if (typeof linkValue.__cdata === "string") return linkValue.__cdata;
  }
  return "";
}

function sanitizeLink(link) {
  if (!link) return "";
  try {
    const url = new URL(link);
    if (url.searchParams.has("source")) {
      url.searchParams.delete("source");
    }
    return url.toString();
  } catch (error) {
    const idx = link.indexOf("?source=");
    return idx > -1 ? link.slice(0, idx) : link;
  }
}

function normalizeTags(raw) {
  if (!raw) return [];
  const list = Array.isArray(raw) ? raw : [raw];
  const tags = list
    .map((entry) => {
      if (typeof entry === "string") return entry;
      if (typeof entry?.["@_term"] === "string") return entry["@_term"];
      return getText(entry);
    })
    .map((tag) => cleanText(tag))
    .filter(Boolean);

  return Array.from(new Set(tags)).slice(0, 3);
}

function getText(value) {
  if (value == null) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  if (typeof value === "object") {
    if (typeof value.__cdata === "string") return value.__cdata;
    if (typeof value["#text"] === "string") return value["#text"];
  }
  return "";
}

function cleanText(value) {
  return String(value ?? "")
    .replace(/\s+/g, " ")
    .trim();
}

function formatDate(value) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    timeZone: "UTC",
  });
}

function truncate(value, maxLength) {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength - 3)}...`;
}

function wrapText(text, maxChars) {
  const rawWords = String(text).split(/\s+/).filter(Boolean);
  const words = rawWords.flatMap((word) => {
    if (word.length <= maxChars) return [word];
    const chunks = [];
    for (let i = 0; i < word.length; i += maxChars) {
      chunks.push(word.slice(i, i + maxChars));
    }
    return chunks;
  });
  if (words.length === 0) return [""];

  const lines = [];
  let current = "";

  words.forEach((word) => {
    if (!current) {
      current = word;
      return;
    }

    if ((current + " " + word).length <= maxChars) {
      current = `${current} ${word}`;
      return;
    }

    lines.push(current);
    current = word;
  });

  if (current) lines.push(current);

  return lines;
}

function renderDateLine(date, themeTokens, y) {
  return `
    <text x="0" y="${y}" font-family="'Sora', 'Segoe UI', sans-serif" font-size="11" fill="${themeTokens.muted}">
      ${escapeXml(date)}
    </text>
  `;
}

function renderTags(tags, themeTokens, y) {
  let x = 0;
  const pills = [];

  tags.slice(0, 3).forEach((tag) => {
    const text = truncate(tag, 14);
    const width = Math.max(36, text.length * 7 + 16);
    if (x + width > 470) return;

    pills.push(`
      <g transform="translate(${x}, ${y})">
        <rect width="${width}" height="16" rx="8" fill="${themeTokens.border}" />
        <text x="${width / 2}" y="12" font-family="'Sora', 'Segoe UI', sans-serif" font-size="9" fill="${themeTokens.muted}" text-anchor="middle">
          ${escapeXml(text)}
        </text>
      </g>
    `);

    x += width + 6;
  });

  return pills.join("");
}

function escapeXml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function createError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}
