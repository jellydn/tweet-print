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
# Run all tests
bun test

# Run a single test file
bun test path/to/test-file.test.ts

# Run tests matching a pattern
bun test --grep "test name"
```

### Biome (Code Formatting & Linting)

Biome is configured with:

- **Indentation:** Tabs
- **Quotes:** Double quotes
- **Imports organization:** Auto-organizes on save (runs with `bun run lint`)

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
- Key tsconfig settings:
  - `strict: true` - all strict checks enabled
  - `noUncheckedIndexedAccess: true` - arrays/tuples include undefined
  - `noImplicitOverride: true` - must use override keyword
  - `verbatimModuleSyntax: true` - type imports required
  - Path alias: `@/` maps to `src/`

### Imports

- Use path aliases from `tsconfig.json` (e.g., `@/utils`, `@/lib/twitter`)
- Order: external libs → internal aliases → relative paths
- Use `import type` for types only

```typescript
import { Hono } from "hono";
import { getTweet } from "@/lib/twitter";
import type { Tweet } from "@/types";
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
- Return user-friendly error messages to API clients

```typescript
class TweetNotFoundError extends Error {
  constructor(tweetId: string) {
    super(`Tweet not found: ${tweetId}`);
    this.name = "TweetNotFoundError";
  }
}
```

### API Routes (Hono)

- Use Hono's built-in validation with `zod` for request validation
- Return consistent JSON response structure
- Use proper HTTP status codes (200, 400, 404, 500)

### Frontend (Static HTML/CSS/JS)

- Keep JavaScript minimal - vanilla JS only
- Use semantic HTML5 elements
- CSS: use CSS variables for theming, keep it minimal
- No external CSS frameworks (KISS)

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

- Commit message format: `feat: [Story ID] - [Description]`
- Run typecheck and lint before committing
- Test locally before pushing

## Quality Requirements

- All code must pass `bun run typecheck`
- All code must pass `bun run lint`
- All tests must pass (`bun test`)
- Verify frontend changes in browser before committing
