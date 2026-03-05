# Architecture

## Overview

TweetPrint is a lightweight web application that converts Twitter/X URLs into clean, printable PDFs. It follows a **layered architecture** with clear separation between frontend, API routes, and business logic.

## Architectural Pattern

The application uses a **route-based modular architecture** with Hono as the web framework. The architecture is:

- **Monolithic** in simplicity - all server code runs in a single Bun process
- **Layered** - routes → business logic (lib) → types
- **Client-server** - static frontend communicates with REST API

## Layers

```
┌─────────────────────────────────────────────┐
│           Frontend (public/)                │
│   Static HTML/CSS/JS - No frameworks       │
└─────────────────┬───────────────────────────┘
                  │ HTTP JSON
┌─────────────────▼───────────────────────────┐
│         API Layer (src/routes/)             │
│   Hono route handlers - Request/Response   │
│   - POST /api/tweet                        │
│   - POST /api/pdf                          │
└─────────────────┬───────────────────────────┘
                  │ Function calls
┌─────────────────▼───────────────────────────┐
│       Business Logic (src/lib/)            │
│   - twitter.ts: URL parsing, API fetching  │
│   - pdf.ts: HTML generation, image embed  │
└─────────────────┬───────────────────────────┘
                  │ Type imports
┌─────────────────▼───────────────────────────┐
│          Types (src/types/)                │
│   TypeScript interfaces only               │
└─────────────────────────────────────────────┘
```

## Data Flow

### Tweet Preview Flow

1. **User** pastes Twitter/X URL in frontend form
2. **Frontend** validates URL format client-side (regex)
3. **Frontend** POSTs to `/api/tweet` with JSON body `{ url }`
4. **Route** (`routes/tweet.ts`):
   - Validates URL format
   - Resolves short URLs (t.co) if needed
   - Extracts tweet ID from URL
5. **Twitter Lib** (`lib/twitter.ts`):
   - Fetches tweet data from Twitter syndication API
   - Handles single tweets and threads
   - Parses raw API response into `TweetData`
6. **Route** returns `{ tweets: TweetData[] }` to frontend
7. **Frontend** renders preview with tweet content

### PDF Generation Flow

1. **User** clicks "Download PDF" button
2. **Frontend** POSTs to `/api/pdf` with `{ tweets, url }`
3. **Route** (`routes/pdf.ts`):
   - Validates input data
4. **PDF Lib** (`lib/pdf.ts`):
   - Embeds images as base64 data URIs
   - Generates HTML with embedded styles
5. **Puppeteer**:
   - Launches headless browser
   - Renders HTML to PDF
6. **Route** returns PDF binary as response with proper headers

## Key Abstractions

### Twitter URL Validation

```typescript
// Validates twitter.com/*/status/* or x.com/*/status/*
isValidTwitterUrl(url: string): boolean

// Detects t.co short URLs
isShortUrl(url: string): boolean

// Resolves short URL to full URL
resolveShortUrl(url: string): Promise<string>

// Extracts numeric tweet ID from URL
extractTweetId(url: string): string | null
```

### Tweet Data Fetching

```typescript
// Fetches single tweet by ID
fetchTweetData(tweetId: string): Promise<TweetData | null>

// Fetches entire thread (conversation)
fetchTweetThread(tweetId: string): Promise<TweetData[]>

// Parses raw API response
parseTweetData(data: Record<string, unknown>): TweetData | null
```

### PDF Generation

```typescript
// Embeds remote images as base64 data URIs
embedImages(tweets: TweetData[]): Promise<TweetData[]>

// Generates complete HTML document for PDF
generatePdfHtml(tweets: TweetData[], url: string): string
```

## Entry Points

### Server Entry

**`src/index.ts`**
- Creates Hono application instance
- Mounts route modules: `/api/tweet` and `/api/pdf`
- Serves static frontend from `/` and `/public`
- Exports Bun-compatible fetch handler

```typescript
export default {
  port: 3000,
  fetch: app.fetch,
};
```

### Frontend Entry

**`public/index.html`**
- Single page application (no routing)
- Form for URL input → preview → download PDF
- Loads `public/js/app.js` for interactivity

## External Integrations

### Twitter Syndication API

- **Endpoint**: `https://cdn.syndication.twimg.com/tweet-result`
- **Thread endpoint**: `https://syndication.twitter.com/timeline/conversation/{id}`
- **Auth**: None (public, rate-limited)
- **Response format**: JSON with tweet data

### Puppeteer (PDF Rendering)

- **Purpose**: Convert HTML to PDF
- **Mode**: Headless Chrome
- **Config**: A4 format, print background, 20px margins

## Error Handling

- **Route level**: Returns JSON errors with appropriate HTTP status codes
- **Frontend**: Displays user-friendly error messages
- **Rate limiting**: Caught and shown as "Please try again later"

## Configuration

No external config files. All settings are hardcoded:
- Server port: 3000
- PDF format: A4
- Twitter API endpoints (constant in code)
