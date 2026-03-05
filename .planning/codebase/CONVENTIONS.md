# Code Conventions - TweetPrint

This document outlines the coding conventions, patterns, and best practices used in the TweetPrint codebase.

## Table of Contents

1. [Code Formatting](#code-formatting)
2. [TypeScript Conventions](#typescript-conventions)
3. [Naming Conventions](#naming-conventions)
4. [Import Organization](#import-organization)
5. [Error Handling](#error-handling)
6. [API Route Patterns](#api-route-patterns)
7. [Frontend Patterns](#frontend-patterns)
8. [Project Structure](#project-structure)

---

## Code Formatting

### Biome Configuration

The project uses [Biome](https://biomejs.dev/) for code formatting and linting. The configuration is defined in `biome.json`.

```json
{
  "formatter": {
    "enabled": true,
    "indentStyle": "tab"
  },
  "javascript": {
    "formatter": {
      "quoteStyle": "double"
    }
  }
}
```

**Key formatting rules:**

- **Indentation:** Tabs (not spaces)
- **Quotes:** Double quotes for strings (`"string"`, not `'string'`)
- **Line endings:** LF (managed by Git)
- **Maximum line width:** Not enforced, but keep lines readable

### Running Formatters

```bash
# Format and lint all files
bun run lint

# Type check (required before commit)
bun run typecheck
```

---

## TypeScript Conventions

### Strict Mode

The project enforces strict TypeScript checks via `tsconfig.json`:

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "verbatimModuleSyntax": true
  }
}
```

**Key strict settings:**

- `strict: true` - Enables all strict type checking options
- `noUncheckedIndexedAccess: true` - Arrays/tuples include `undefined` in their type
- `noImplicitOverride: true` - Requires `override` keyword when overriding methods
- `verbatimModuleSyntax: true` - Requires `import type` for type-only imports

### Type Annotations

**Always use explicit types for function parameters and return types:**

```typescript
// Good
function isValidTwitterUrl(url: string): boolean {
  return /^(https?:\/\/)?(www\.)?(twitter\.com|x\.com)\/.+\/status\/\d+/.test(url);
}

// Bad - missing return type
function isValidTwitterUrl(url: string) {
  return /^(https?:\/\/)?(www\.)?(twitter\.com|x\.com)\/.+\/status\/\d+/.test(url);
}
```

### Interface vs Type

- Use `interface` for object shapes and types that may be extended
- Use `type` for unions, aliases, and primitives

```typescript
// Interface for object shapes
interface TweetData {
  text: string;
  authorName: string;
  authorHandle: string;
}

// Type for unions
type HttpMethod = "GET" | "POST" | "PUT" | "DELETE";
```

### Avoid `any`

Use `unknown` when the type is truly unknown. Use type guards for type narrowing.

```typescript
// Good - using unknown with type guard
function parseResponse(data: unknown): TweetData | null {
  if (!data || typeof data !== "object") return null;
  // ...
}

// Bad - using any
function parseResponse(data: any): any {
  // ...
}
```

---

## Naming Conventions

### Files

- **TypeScript files:** kebab-case (`twitter-api.ts`, `pdf-generator.ts`)
- **Frontend components:** kebab-case (`tweet-preview.html`, `app.js`)
- **CSS files:** kebab-case (`styles.css`, `components.css`)

### Functions

- Use **camelCase**
- Use verb prefix (`get`, `fetch`, `validate`, `parse`, `generate`)

```typescript
// Good
function getTweetData() {}
function fetchTweetThread() {}
function isValidTwitterUrl() {}

// Bad
function tweetData() {}
function TwitterURL() {}
```

### Types and Interfaces

- Use **PascalCase**

```typescript
interface TweetData {}
interface LinkCard {}
type ApiResponse<T> = {};
```

### Constants

- Use **SCREAMING_SNAKE_CASE**

```typescript
const MAX_RETRIES = 3;
const API_BASE_URL = "https://cdn.syndication.twimg.com";
const RATE_LIMIT_STATUS = 429;
```

### Boolean Variables

- Prefix with `is`, `has`, `should`, `can`

```typescript
const isLoading = false;
const hasError = true;
const shouldRetry = false;
```

---

## Import Organization

### Path Aliases

The project uses path aliases from `tsconfig.json`. The `@/` alias maps to the `src/` directory.

```typescript
// Good - using path alias
import { getTweet } from "@/lib/twitter";
import type { TweetData } from "@/types/index.ts";

// Bad - using relative paths
import { getTweet } from "../../lib/twitter";
```

### Import Order

Organize imports in the following order:

1. External libraries (Hono, Puppeteer, etc.)
2. Internal path aliases (@/...)
3. Relative paths (./, ../)

```typescript
// 1. External libraries
import { Hono } from "hono";
import puppeteer from "puppeteer";

// 2. Internal path aliases
import { isValidTwitterUrl } from "@/lib/twitter";
import { generatePdfHtml } from "@/lib/pdf";
import type { TweetData } from "@/types/index.ts";

// 3. Relative paths (if any)
import { localHelper } from "./helpers.ts";
```

### Type-Only Imports

Use `import type` when importing only types to enable `verbatimModuleSyntax`.

```typescript
// Good - type-only import
import type { TweetData } from "@/types/index.ts";

// Bad - regular import for type
import { TweetData } from "@/types/index.ts";
```

---

## Error Handling

### Custom Error Classes

Create custom error classes for domain-specific errors:

```typescript
class TweetNotFoundError extends Error {
  constructor(tweetId: string) {
    super(`Tweet not found: ${tweetId}`);
    this.name = "TweetNotFoundError";
  }
}

class RateLimitError extends Error {
  constructor() {
    super("Rate limited by Twitter API");
    this.name = "RateLimitError";
  }
}
```

### API Error Responses

Return consistent JSON error responses with appropriate HTTP status codes:

```typescript
app.post("/", async (c) => {
  // Validation error - 400
  if (!isValidTwitterUrl(url)) {
    return c.json({ error: "Invalid URL format" }, 400);
  }

  // Not found - 404
  if (tweets.length === 0) {
    return c.json({ error: "Tweet not found" }, 404);
  }

  // Rate limited - 429
  if (errorMessage === "RATE_LIMITED") {
    return c.json({ error: "Rate limited. Please try again later." }, 429);
  }

  // Server error - 500
  return c.json({ error: "Failed to fetch tweet" }, 500);
});
```

### Error Message Handling

Extract user-friendly error messages from caught exceptions:

```typescript
try {
  const tweets = await fetchTweetThread(tweetId);
} catch (error) {
  const errorMessage = error instanceof Error ? error.message : "Unknown error";
  // Handle specific error types
}
```

---

## API Route Patterns

### Hono Router Setup

Use Hono's router pattern for defining API routes:

```typescript
import { Hono } from "hono";

const app = new Hono();

app.post("/", async (c) => {
  // Handle POST request
});

app.get("/:id", async (c) => {
  const id = c.req.param("id");
  // Handle GET request
});

export default app;
```

### Request Validation

Validate incoming request data:

```typescript
app.post("/", async (c) => {
  const body = await c.req.json<{ url: string }>();
  const { url } = body;

  if (!url) {
    return c.json({ error: "Invalid URL format" }, 400);
  }
  // ...
});
```

### Response Types

Return proper response types:

```typescript
// JSON response
return c.json({ tweets: tweetData });

// PDF binary response
return new Response(pdf, {
  headers: {
    "Content-Type": "application/pdf",
    "Content-Disposition": `attachment; filename="${filename}.pdf"`,
  },
});
```

---

## Frontend Patterns

### Vanilla JavaScript

Keep JavaScript minimal - use vanilla JS only, no frameworks:

```javascript
// Good - vanilla JS
const urlInput = document.getElementById("url-input");

function isValidTwitterUrl(url) {
  return URL_PATTERN.test(url);
}

// Bad - using framework
import { useState } from "react";
```

### Semantic HTML

Use semantic HTML5 elements:

```html
<!-- Good -->
<header>
  <h1>TweetPrint</h1>
</header>
<main>
  <form id="url-form">
    <input type="text" id="url-input">
  </form>
</main>
<footer>
  <p>Generated by TweetPrint</p>
</footer>
```

### CSS Organization

- Use CSS variables for theming
- Keep CSS minimal
- No external CSS frameworks

```css
:root {
  --primary-color: #1da1f2;
  --error-color: #e0245e;
  --text-color: #333;
}

.btn-primary {
  background: var(--primary-color);
}
```

---

## Project Structure

```
src/
├── index.ts          # Hono server entrypoint
├── routes/
│   ├── tweet.ts      # Tweet API endpoints
│   └── pdf.ts        # PDF generation endpoints
├── lib/
│   ├── twitter.ts    # Twitter API integration
│   └── pdf.ts        # PDF generation logic
└── types/
    └── index.ts      # TypeScript type definitions

public/
├── index.html        # Main frontend page
├── css/
│   └── styles.css    # Stylesheets
└── js/
    └── app.js        # Client-side JavaScript
```

---

## Quality Requirements

All code must pass the following checks before committing:

```bash
# Type check
bun run typecheck

# Lint and format
bun run lint

# Run tests
bun test
```

---

## Related Documents

- [TESTING.md](./TESTING.md) - Testing patterns and conventions
- [AGENTS.md](../AGENTS.md) - Development guide and commands
