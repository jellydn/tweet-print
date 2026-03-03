# AGENTS.md - TweetPrint Development Guide

## Project Overview

- **Tech Stack:** Bun, Hono (TypeScript), Puppeteer, Static HTML/CSS/JS
- **Purpose:** Convert Twitter/X URLs to clean, printable PDFs
- **Key APIs:** Twitter syndication API (`syndication.twitter.com`)

---

## Commands

### Development

```bash
# Install dependencies
bun install

# Run development server
bun run dev

# Typecheck (required before commit)
bun run typecheck

# Lint code
bun run lint
```

### Testing

```bash
# Run all tests
bun test

# Run a single test file
bun test path/to/test-file.test.ts

# Run tests matching a pattern
bun test --grep "test name"
```

---

## Code Style Guidelines

### General Principles

- **KISS:** Keep It Simple - no unnecessary complexity
- **No framework for frontend:** Plain HTML/CSS/JS only
- **TypeScript strict mode:** Enable all strict type checks

### TypeScript

- Always use explicit types for function parameters and return types
- Use `interface` for object shapes, `type` for unions/aliases
- Avoid `any` - use `unknown` when type is truly unknown
- Enable strict null checks

### Imports

- Use path aliases configured in `tsconfig.json` (e.g., `@/utils`)
- Order imports: external libs → internal aliases → relative paths
- Prefer named exports over default exports

```typescript
// Good
import { Hono } from "hono";
import { getTweet, getThread } from "@/lib/twitter";
import type { Tweet } from "@/types";

// Avoid
import hono from "hono";
import * as twitter from "@/lib/twitter";
```

### Naming Conventions

- **Files:** kebab-case (`twitter-api.ts`, `pdf-generator.ts`)
- **Components (frontend):** kebab-case (`tweet-preview.html`)
- **Functions:** camelCase, verb prefix (`getTweetData`, `validateUrl`)
- **Types/Interfaces:** PascalCase (`TweetData`, `AuthorInfo`)
- **Constants:** SCREAMING_SNAKE_CASE (`MAX_RETRIES`, `API_BASE_URL`)
- **Boolean variables:** prefix with `is`, `has`, `should` (`isLoading`, `hasError`)

### Error Handling

- Use custom error classes for domain-specific errors
- Always return user-friendly error messages to API clients
- Log errors with appropriate context for debugging

```typescript
// Good
class TweetNotFoundError extends Error {
  constructor(tweetId: string) {
    super(`Tweet not found: ${tweetId}`);
    this.name = "TweetNotFoundError";
  }
}

// API error response
return c.json({ error: "Tweet not found. It may be private or deleted." }, 404);
```

### API Routes (Hono)

- Use Hono's built-in validation with `zod` for request validation
- Return consistent JSON response structure
- Use proper HTTP status codes (200, 400, 404, 500)

```typescript
// Good
app.post("/api/tweet", async (c) => {
  const { url } = c.req.json();
  if (!url || !isValidTwitterUrl(url)) {
    return c.json({ error: "Invalid Twitter URL" }, 400);
  }
  // ...
});
```

### Frontend (Static HTML/CSS/JS)

- Keep JavaScript minimal - vanilla JS only
- Use semantic HTML5 elements
- CSS: use CSS variables for theming, keep it minimal
- No external CSS frameworks (KISS)

### PDF Generation (Puppeteer)

- Render PDF from custom HTML template (not Twitter widget)
- Download images locally before rendering
- Include footer with source URL and timestamp

### Git Conventions

- Commit message format: `feat: [Story ID] - [Description]`
- Run typecheck and lint before committing
- Test locally before pushing

---

## Project Structure

```
src/
  index.ts          # Hono server entrypoint
  routes/           # API route handlers
  lib/              # Business logic (twitter, pdf)
  types/            # TypeScript types
public/
  index.html        # Main frontend page
  css/              # Stylesheets
  js/               # Client-side JavaScript
```

---

## Key Patterns

### URL Validation

Accept: `twitter.com/*/status/*` and `x.com/*/status/*`

```typescript
function isValidTwitterUrl(url: string): boolean {
  return /^(https?:\/\/)?(www\.)?(twitter\.com|x\.com)\/.+\/status\/\d+/.test(
    url,
  );
}
```

### Thread Fetching

Use conversation endpoint: `syndication.twitter.com/timeline/conversation/{id}`

### File Naming for Downloads

Format: `{handle}-YYYY-MM-DD.pdf`

---

## Quality Requirements

- All code must pass `bun run typecheck`
- All code must pass `bun run lint`
- All tests must pass (`bun test`)
- Verify frontend changes in browser before committing
