# AGENTS.md - TweetPrint Development Guide

## Project Overview

- **Tech Stack:** Bun, Hono (TypeScript), Puppeteer, Static HTML/CSS/JS
- **Purpose:** Convert Twitter/X URLs to clean, printable PDFs
- **Key APIs:** Twitter syndication API (`syndication.twitter.com`)

## Commands

### Development

```bash
# Install dependencies
bun install

# Run development server (with hot reload)
bun run dev

# Typecheck (required before commit)
bun run typecheck

# Lint and format code
bun run lint
```

### Testing

```bash
# Run all unit tests
bun test

# Run a single test file
bun test src/lib/twitter.test.ts

# Run tests matching a pattern
bun test --grep "fetchTweet"

# Run E2E tests
bun test:e2e

# Run E2E tests with UI
bun test:e2e:ui

# Debug E2E tests
bun test:e2e:debug
```

## Code Style

### Biome Configuration

- **Indentation:** Tabs
- **Quotes:** Double quotes
- **Auto-format on save:** Runs with `bun run lint`

### TypeScript (Strict Mode)

- Explicit types for function parameters and return types
- Use `interface` for object shapes, `type` for unions/aliases
- Avoid `any` - use `unknown` when type is truly unknown
- Key tsconfig settings:
  - `strict: true`, `noUncheckedIndexedAccess: true`
  - `noImplicitOverride: true`, `verbatimModuleSyntax: true`
- Path alias: `@/` maps to `src/`

### Imports

Order: external libs → internal aliases → relative paths. Use `import type` for types only.

```typescript
import { Hono } from "hono";
import { getTweet } from "@/lib/twitter";
import type { Tweet } from "@/types";
```

### Naming Conventions

| Type                | Convention                 | Example                              |
| ------------------- | -------------------------- | ------------------------------------ |
| Files               | kebab-case                 | `twitter-api.ts`, `pdf-generator.ts` |
| Frontend components | kebab-case                 | `tweet-preview.html`                 |
| Functions           | camelCase, verb prefix     | `getTweetData`, `validateUrl`        |
| Types/Interfaces    | PascalCase                 | `TweetData`, `AuthorInfo`            |
| Constants           | SCREAMING_SNAKE_CASE       | `MAX_RETRIES`, `API_BASE_URL`        |
| Booleans            | `is`/`has`/`should` prefix | `isLoading`, `hasError`              |

### Error Handling

Use custom error classes for domain-specific errors. Return user-friendly messages.

```typescript
class TweetNotFoundError extends Error {
  constructor(tweetId: string) {
    super(`Tweet not found: ${tweetId}`);
    this.name = "TweetNotFoundError";
  }
}
```

### API Routes (Hono)

- Use Hono's validation with `zod` for request validation
- Return consistent JSON responses with proper HTTP status codes (200, 400, 404, 500)

### Guard Clauses

Use early returns to avoid nested conditions.

```typescript
// Avoid
function processUser(user) {
  if (user) {
    if (user.isActive) {
      if (user.hasPermission) {
        // main logic
      }
    }
  }
}

// Prefer
function processUser(user) {
  if (!user) return;
  if (!user.isActive) return;
  if (!user.hasPermission) return;
  // main logic
}
```

### Frontend (Static HTML/CSS/JS)

- Vanilla JS only, minimal JavaScript
- Semantic HTML5 elements
- CSS variables for theming, no external frameworks

### PDF Generation (Puppeteer)

- Render PDF from custom HTML template (not Twitter widget)
- Download images locally before rendering
- Include footer with source URL and timestamp

## Project Structure

```
src/
  index.ts    # Hono server entrypoint
  routes/     # API route handlers
  lib/        # Business logic (twitter, pdf)
  types/      # TypeScript types
public/
  index.html  # Main frontend page
  css/        # Stylesheets
  js/         # Client-side JavaScript
```

## Key Patterns

- **URL Validation:** `twitter.com/*/status/*` and `x.com/*/status/*`
- **Thread Fetching:** `syndication.twitter.com/timeline/conversation/{id}`
- **File Naming:** `{handle}-YYYY-MM-DD.pdf`

```typescript
function isValidTwitterUrl(url: string): boolean {
  return /^(https?:\/\/)?(www\.)?(twitter\.com|x\.com)\/.+\/status\/\d+/.test(
    url,
  );
}
```

## Git Conventions

- Commit format: `feat: [Story ID] - [Description]`
- Run typecheck and lint before committing
- Test locally before pushing

## Quality Requirements

All code must pass:

- `bun run typecheck`
- `bun run lint`
- `bun test`
