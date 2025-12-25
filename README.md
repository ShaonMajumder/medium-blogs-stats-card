# Medium Blog Stats Card

Generate beautiful, always-up-to-date SVG cards for any Medium RSS feed. This project mirrors the HackerRank Stats Card UX with a polished React/Tailwind UI and a lightweight Express API (deployed as a Netlify Function) that reads RSS data and renders the SVG server-side.

**Live demo:** https://medium-blog-stats-card.netlify.app/  
![Latest Medium Post](https://medium-blog-stats-card.netlify.app/api/medium-blog-card?username=shaonmajumder)

## Features
- **Medium RSS powered** - Fetches your latest Medium posts and turns them into a clean, portfolio-ready card.
- **Customizable output** - Limit posts, switch theme, and toggle date/tags per request.
- **Serverless-friendly API** - One Express app runs locally and on Netlify Functions via `serverless-http`.
- **Copy-ready embeds** - Generate Markdown/HTML/direct URL snippets from the UI.

## Project Structure
```
MediumBlogPosts/
|-- src/
|   |-- components/
|   `-- pages/Index.tsx
|-- server/
|   |-- app.js
|   |-- generate.js
|   `-- medium.js
|-- netlify/
|   `-- functions/
|       `-- medium-blog-posts.js
|-- netlify.toml
|-- package.json
|-- README.md
|-- latest.json
`-- latest.svg
```

## Getting Started
```bash
cd MediumBlogPosts
npm install
```

### Environment
Create a `.env` based on `.env.example`:
```
RSS_FEED_URL=https://medium.com/feed/@shaonmajumder
USERNAME=shaonmajumder
VITE_API_BASE_URL=
```

### Local Development
```bash
npm run dev
```

### Generate SVG/JSON locally
```bash
npm run generate
```

## API Usage
### `GET /api/medium-blog-card`
Returns an SVG card.

Query params:
| Param       | Type   | Required | Description |
|-------------|--------|----------|-------------|
| `username`  | string | No       | Medium username (`@` optional) used to build RSS URL and show footer. |
| `rss`       | string | No       | Full RSS feed URL. Takes priority over `username`. |
| `limit`     | number | No       | Number of posts (default `1`, max `5`). |
| `theme`     | string | No       | `light` or `dark`. |
| `show_date` | bool   | No       | Toggle date display (`true`/`false`). |
| `show_tags` | bool   | No       | Toggle tag display (`true`/`false`). |

Responses:
- `200 OK` - SVG card.
- `400 Bad Request` - `{ error: "RSS feed URL or username is required" }`
- `502 Bad Gateway` - `{ error: "Failed to fetch RSS feed (status)" }`

### Embed in GitHub README
```md
## Latest Medium Post
![Latest Medium Post](MediumBlogPosts/latest.svg)
```

Optional raw API usage:
```md
![Latest Medium Posts](https://<your-domain>/api/medium-card?limit=3&show_tags=true&theme=dark)
```

**Note:** Medium RSS feeds typically include only the most recent posts (often 10-20). This tool always renders the latest items first.

## Deployment Notes
Because `netlify.toml` redirects `/api/*` to `/.netlify/functions/medium-blog-posts`, the front-end can call `/api/medium-blog-card` in both local and hosted environments. When deploying elsewhere, set `VITE_API_BASE_URL` accordingly.

## Credits
Built by [Shaon Majumder](https://shaonresume.netlify.app). Feel free to open an issue or PR if you build something cool with the Medium Blog Stats Card.
