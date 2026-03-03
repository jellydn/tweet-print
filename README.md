# TweetPrint

Paste a Twitter/X link → preview → download as a clean PDF.

## Features

- Convert single tweets or full threads into print-friendly PDFs
- Preserves text, images, author info, and timestamps
- HTML preview before download
- No login or API keys required

## Tech Stack

- **Runtime:** Bun
- **Server:** Hono
- **PDF:** Puppeteer
- **Frontend:** Static HTML/CSS/JS (no framework)
- **Data:** Twitter syndication API (free, no auth)

## Getting Started

```bash
bun install
bun run dev
```

Open http://localhost:3000

## How It Works

1. Paste a `twitter.com` or `x.com` post URL
2. App fetches tweet data via Twitter's syndication API
3. Preview the tweet/thread
4. Click **Download PDF** — Puppeteer renders a clean HTML template to PDF

## Project Structure

```
src/
  index.ts          # Hono server
public/
  index.html        # Landing page
tasks/
  prd-tweet-to-pdf.md
```

## License

MIT
