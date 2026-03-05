# PRD: Twitter/X Link → PDF Converter

## Introduction

A lightweight web tool that converts a public Twitter/X post URL into a clean, shareable PDF. Users paste a tweet link, the app fetches the tweet content (including full threads), shows an HTML preview, and allows one-click PDF download. No login or API keys required.

## Goals

- Convert a single tweet or full thread into a clean, print-friendly PDF
- Preserve formatting: text, images, author info (avatar, name, handle), and timestamps
- Provide a simple UX: paste link → preview → download (≤10 seconds)
- No login or API keys required (use free oEmbed API)
- Run locally for development (no deployment target for MVP)

## User Stories

### US-001: Project Setup

**Description:** As a developer, I need the project scaffolded so I can start building features.

**Acceptance Criteria:**

- [x] Bun + Hono server with TypeScript
- [x] Static HTML/CSS/JS frontend served from `public/`
- [x] Puppeteer installed for PDF generation
- [x] Project runs locally with `bun run dev`
- [x] Typecheck passes

### US-002: URL Input & Validation

**Description:** As a user, I want to paste a Twitter/X URL so the app knows which tweet to convert.

**Acceptance Criteria:**

- [x] Landing page with a text input and "Generate PDF" button
- [x] Accepts URLs matching `twitter.com/*/status/*` and `x.com/*/status/*`
- [x] Shows inline error for invalid URLs
- [x] Button is disabled while input is empty or invalid
- [x] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-003: Fetch Tweet Data via Syndication API

**Description:** As a user, I want the app to fetch tweet content so I can see it before downloading.

**Acceptance Criteria:**

- [x] `POST /api/tweet` accepts a valid Twitter/X URL
- [x] Calls Twitter syndication API (`syndication.twitter.com`) to fetch structured tweet data
- [x] Returns JSON with: text, author name, handle, avatar URL, timestamp, image URLs
- [x] Returns appropriate error (404, invalid URL, rate limit) with user-friendly message
- [x] Typecheck passes

### US-004: Fetch Full Thread

**Description:** As a user, I want the app to always fetch the full thread so I get complete context.

**Acceptance Criteria:**

- [x] Use syndication conversation endpoint (`syndication.twitter.com/timeline/conversation/{id}`) to fetch thread
- [x] Thread tweets are ordered chronologically (oldest first)
- [x] Each tweet includes: text, author, timestamp, images
- [x] Single tweets (not part of a thread) work normally
- [x] Typecheck passes

### US-005: HTML Preview

**Description:** As a user, I want to see a preview of the tweet before downloading so I can verify the content.

**Acceptance Criteria:**

- [x] After fetching, display an HTML preview of the tweet/thread
- [x] Preview shows: author info, tweet body with preserved line breaks, embedded images
- [x] Preview has a clean, minimal layout matching the PDF output
- [x] "Download PDF" button appears below the preview
- [x] "Convert Another" button to reset and start over
- [x] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-006: PDF Generation & Download

**Description:** As a user, I want to download the tweet as a PDF so I can archive or share it.

**Acceptance Criteria:**

- [x] `POST /api/pdf` accepts tweet data and returns a PDF file stream
- [x] PDF uses Puppeteer to render HTML → PDF
- [x] PDF layout includes:
  - Author section (name, handle)
  - Tweet body with preserved line breaks
  - Embedded images
  - Footer with original URL + generation timestamp
- [x] File downloads with name format: `handle-YYYY-MM-DD.pdf`
- [x] Typecheck passes

### US-007: Loading & Error States

**Description:** As a user, I want clear feedback during processing and when errors occur.

**Acceptance Criteria:**

- [x] Loading spinner/skeleton shown while fetching tweet data
- [x] Loading state shown while generating PDF
- [x] Error messages displayed for: invalid URL, tweet not found, protected tweet, network error
- [x] User can retry after an error
- [x] Typecheck passes
- [ ] Verify in browser using dev-browser skill

## Functional Requirements

- FR-1: Accept Twitter/X URLs in formats `twitter.com/{user}/status/{id}` and `x.com/{user}/status/{id}`
- FR-2: Validate URL format client-side before making API call
- FR-3: Fetch tweet data using Twitter syndication API (`syndication.twitter.com`)
- FR-4: Fetch full threads using syndication conversation endpoint chronologically
- FR-5: Render HTML preview with clean, minimal styling matching PDF output
- FR-6: Generate PDF using Puppeteer with print-friendly layout
- FR-7: PDF includes: author name/handle, tweet body, images, footer with source URL and timestamp
- FR-8: Download PDF with filename format `handle-YYYY-MM-DD.pdf`
- FR-9: Show loading states during fetch and PDF generation
- FR-10: Display user-friendly error messages for all failure cases

## Non-Goals

- Editing tweet content before PDF generation
- Converting private/protected tweets
- Batch conversions (multiple URLs at once)
- Analytics or usage tracking
- User accounts or login
- Custom themes (dark/light mode)
- Deployment to production (local dev only for MVP)

## Technical Considerations

- **Framework:** Bun + Hono server with static HTML/CSS/JS frontend (no framework, KISS)
- **Tweet Data:** Twitter syndication API (`syndication.twitter.com`) — free, no auth, returns structured JSON with full tweet data (text, author, avatar, images, timestamps)
- **Thread Data:** Syndication conversation endpoint (`syndication.twitter.com/timeline/conversation/{id}`) for fetching full threads
- **PDF Rendering:** Build a custom HTML template from structured data (no Twitter widget JS) → render with Puppeteer to PDF
- **Media:** Download and embed images directly into the HTML template; skip polls and video (display placeholder text instead)
- **Rate Limits:** Syndication API has undocumented rate limits; add basic error handling for 429 responses

## Success Metrics

- Users can convert a public tweet into a PDF in under 10 seconds
- PDF output is clean enough for presentations, research, or documentation
- Thread tweets are fully captured in chronological order
- Zero API cost (free oEmbed endpoint)

## Open Questions

- Syndication API is undocumented — response format may change without notice
- How to handle quoted tweets in the PDF? (KISS: render as a nested block with text only)
