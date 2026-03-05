# External Integrations

## Twitter/X APIs

### 1. Tweet Data API (cdn.syndication.twimg.com)

**Endpoint:**
```
GET https://cdn.syndication.twimg.com/tweet-result?id={tweetId}&token=0
```

**Purpose:** Fetch individual tweet data by tweet ID

**Features:**
- Returns tweet text, author info, media (images/videos)
- Provides link card data (OpenGraph metadata)
- Returns parent tweet for replies
- Rate limiting support (HTTP 429)

**Authentication:** None required (uses public syndication API)

**Error Handling:**
- 404: Tweet not found or deleted
- 429: Rate limited
- Other: HTTP error

---

### 2. Timeline Conversation API (syndication.twitter.com)

**Endpoint:**
```
GET https://syndication.twitter.com/timeline/conversation/{tweetId}
```

**Purpose:** Fetch entire tweet threads/conversations

**Features:**
- Returns all tweets in a thread ordered by time
- Falls back to single tweet if thread unavailable
- Rate limiting support (HTTP 429)

**Authentication:** None required (public syndication API)

---

### 3. URL Resolution

**Purpose:** Handle short URLs (t.co) and resolve to full Twitter/X URLs

**Implementation:**
- Detects `t.co/*` short URLs via regex pattern
- Uses fetch with `redirect: "follow"` to resolve final URL
- Extracts tweet ID from resolved URL

---

## Browser/PDF Generation

### Puppeteer (Headless Chrome)

**Purpose:** Convert HTML to PDF

**Configuration:**
```javascript
{
  headless: true,
  args: ["--no-sandbox", "--disable-setuid-sandbox"]
}
```

**PDF Options:**
- Format: A4
- Print background: enabled
- Margins: 20px all sides

**Workflow:**
1. Launch headless Chrome browser
2. Create new page and set HTML content
3. Wait for network idle (images loaded)
4. Generate PDF from rendered page
5. Close browser

**Output:**
- Content-Type: application/pdf
- Filename: `{authorHandle}-{YYYY-MM-DD}.pdf`

---

## Data Flow

```
User Input (URL)
       │
       ▼
┌──────────────────┐
│  Frontend (JS)   │ ──► Validate URL format
└────────┬─────────┘
         │
         ▼ (POST /api/tweet)
┌──────────────────┐
│  Hono Server     │
│  (tweet.ts)      │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐     ┌──────────────────────┐
│  Resolve t.co    │────►│ Twitter Syndication   │
│  Short URL       │     │ API (cdn.syndication) │
└────────┬─────────┘     └──────────────────────┘
         │
         ▼
┌──────────────────┐     ┌──────────────────────┐
│  Extract Tweet   │────►│ Timeline API         │
│  ID              │     │ (syndication.twitter)│
└──────────────────┘     └──────────────────────┘
         │
         ▼
┌──────────────────┐
│  Parse Tweet    │
│  Data            │
└────────┬─────────┘
         │
         ▼ (Response to frontend)
┌──────────────────┐
│  User Clicks     │
│  Download PDF    │
└────────┬─────────┘
         ▼ (POST /api/pdf)
┌──────────────────┐
│  Hono Server     │
│  (pdf.ts)        │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐     ┌──────────────────────┐
│  Embed Images    │────►│ External Image URLs  │
│  (Base64)        │     │ (Twitter CDN)         │
└────────┬─────────┘     └──────────────────────┘
         │
         ▼
┌──────────────────┐
│  Generate HTML  │
│  Template        │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  Puppeteer      │
│  (Headless)     │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  PDF Response   │
└──────────────────┘
```

---

## External Resources

### Twitter CDN URLs (Fetched at Runtime)

- **Profile Images:** `https://abs.twimg.com/...` or `https://pbs.twimg.com/...`
- **Tweet Images:** Media uploaded to Twitter
- **Video Thumbnails:** Video poster images
- **Default Avatar:** `https://abs.twimg.com/sticky/default_profile_images/default_profile_normal.png`

---

## No External Integrations

This codebase does **not** include:

- ❌ Databases (SQL, NoSQL)
- ❌ Authentication providers (OAuth, JWT, sessions)
- ❌ Webhooks or event-driven integrations
- ❌ Third-party APIs beyond Twitter syndication
- ❌ Cloud services or serverless platforms
- ❌ Analytics or tracking services
- ❌ Payment processors
- ❌ Email services

---

## Rate Limiting

The application handles Twitter API rate limiting:

- **HTTP 429** responses from syndication APIs
- User-facing error: "Rate limited. Please try again later."
- No retry mechanism implemented (relies on user retry)

---

## Error Codes

| Code | Source | Message |
|------|--------|---------|
| 400 | Application | Invalid URL format |
| 400 | Application | Could not resolve short URL |
| 400 | Application | URL does not point to a tweet |
| 404 | Twitter API | Tweet not found |
| 429 | Twitter API | Rate limited |
| 500 | Application | Failed to fetch tweet / generate PDF |
