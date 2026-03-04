# Testing Conventions - TweetPrint

This document outlines the testing patterns, conventions, and best practices for the TweetPrint project.

## Table of Contents

1. [Test Framework](#test-framework)
2. [Current State](#current-state)
3. [Test Structure](#test-structure)
4. [Test Organization](#test-organization)
5. [Mocking Strategies](#mocking-strategies)
6. [Coverage Requirements](#coverage-requirements)
7. [Running Tests](#running-tests)
8. [Test Patterns](#test-patterns)

---

## Test Framework

### Bun Test

The project uses [Bun's built-in test runner](https://bun.sh/docs/test) for running tests. Bun Test provides:

- Fast test execution
- Built-in mocking support
- TypeScript-native testing
- Snapshot testing
- Concurrent test running

### Configuration

Tests are run using the following commands:

```bash
# Run all tests
bun test

# Run a single test file
bun test path/to/test-file.test.ts

# Run tests matching a pattern
bun test --grep "test name"
```

---

## Current State

**Important:** The current codebase has **no tests** implemented. This document outlines the testing patterns that should be adopted as the project grows.

The test infrastructure is in place (Bun Test runner), but test files need to be created following the patterns described below.

---

## Test Structure

### File Naming

Test files should follow the naming convention:

- Test files: `*.test.ts` or `*.spec.ts`
- Place tests alongside the code they test (same directory)
- Use descriptive names that match the module being tested

```
src/
├── lib/
│   ├── twitter.ts
│   ├── twitter.test.ts    # Tests for twitter.ts
│   ├── pdf.ts
│   └── pdf.test.ts        # Tests for pdf.ts
├── routes/
│   ├── tweet.ts
│   ├── tweet.test.ts     # Tests for tweet routes
│   ├── pdf.ts
│   └── pdf.test.ts        # Tests for pdf routes
└── types/
    └── index.ts
```

### Test Organization

Group tests using `describe` blocks:

```typescript
import { describe, it, expect } from "bun:test";
import { isValidTwitterUrl, extractTweetId } from "@/lib/twitter";

describe("twitter", () => {
  describe("isValidTwitterUrl", () => {
    it("should return true for valid twitter.com URLs", () => {
      expect(isValidTwitterUrl("https://twitter.com/user/status/123")).toBe(true);
    });

    it("should return true for valid x.com URLs", () => {
      expect(isValidTwitterUrl("https://x.com/user/status/456")).toBe(true);
    });

    it("should return false for invalid URLs", () => {
      expect(isValidTwitterUrl("https://example.com")).toBe(false);
    });
  });

  describe("extractTweetId", () => {
    it("should extract tweet ID from URL", () => {
      expect(extractTweetId("https://twitter.com/user/status/1234567890")).toBe("1234567890");
    });

    it("should return null for invalid URL", () => {
      expect(extractTweetId("https://example.com")).toBeNull();
    });
  });
});
```

---

## Test Organization

### Unit Tests

Test individual functions and modules in isolation:

```typescript
import { describe, it, expect } from "bun:test";
import { escapeHtml, formatDate } from "@/lib/pdf";

describe("pdf utilities", () => {
  describe("escapeHtml", () => {
    it("should escape HTML special characters", () => {
      expect(escapeHtml("<script>")).toBe("&lt;script&gt;");
    });

    it("should handle empty strings", () => {
      expect(escapeHtml("")).toBe("");
    });
  });

  describe("formatDate", () => {
    it("should format ISO date string", () => {
      const result = formatDate("2024-01-15T10:30:00.000Z");
      expect(result).toContain("January");
      expect(result).toContain("15");
      expect(result).toContain("2024");
    });
  });
});
```

### Integration Tests

Test API routes end-to-end:

```typescript
import { describe, it, expect, beforeAll } from "bun:test";
import { app } from "@/index";

describe("API Routes", () => {
  describe("POST /api/tweet", () => {
    it("should return 400 for invalid URL", async () => {
      const response = await app.request("/api/tweet", {
        method: "POST",
        body: JSON.stringify({ url: "invalid" }),
        headers: { "Content-Type": "application/json" },
      });

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error).toBeDefined();
    });

    it("should return 404 for non-existent tweet", async () => {
      const response = await app.request("/api/tweet", {
        method: "POST",
        body: JSON.stringify({ url: "https://twitter.com/user/status/999999999999999999" }),
        headers: { "Content-Type": "application/json" },
      });

      // Should handle gracefully (404 or empty array)
      expect([404, 200]).toContain(response.status);
    });
  });
});
```

---

## Mocking Strategies

### Mocking External APIs

Use Bun's built-in `mock` to intercept network calls:

```typescript
import { describe, it, expect, beforeEach } from "bun:test";

// Mock fetch for Twitter API
const mockFetch = Bun.mock(fetch);

beforeEach(() => {
  mockFetch.mockClear();
});

describe("fetchTweetData", () => {
  it("should return tweet data on success", async () => {
    const mockTweetData = {
      text: "Hello world",
      user: { name: "Test User", screen_name: "testuser" },
      created_at: "2024-01-15T10:30:00Z",
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockTweetData,
    } as Response);

    const result = await fetchTweetData("1234567890");
    expect(result).toBeDefined();
  });

  it("should return null on 404", async () => {
    mockFetch.mockResolvedValueOnce({
      status: 404,
    } as Response);

    const result = await fetchTweetData("1234567890");
    expect(result).toBeNull();
  });
});
```

### Mocking Modules

Use `bun:test` mock for module-level mocking:

```typescript
import { describe, it, expect, beforeEach, mock } from "bun:test";

// Mock a module
mock.module("@/lib/twitter", () => ({
  isValidTwitterUrl: () => true,
  fetchTweetThread: async () => [{ text: "Mocked tweet" }],
}));

describe("PDF generation with mocked Twitter", () => {
  // Tests will use mocked module
});
```

### Mocking Time

Use fake timers for time-dependent tests:

```typescript
import { describe, it, expect } from "bun:test";

// Use --fake-timers flag or control manually
describe("formatDate", () => {
  it("should format date correctly", () => {
    const date = new Date("2024-01-15T10:30:00Z");
    const result = formatDate(date.toISOString());
    expect(result).toContain("2024");
  });
});
```

---

## Coverage Requirements

### Target Coverage

Strive for the following coverage goals:

- **Overall coverage:** 80%+
- **Business logic (lib/):** 90%+
- **API routes (routes/):** 80%+
- **Types (types/):** Not required (type definitions only)

### Running with Coverage

```bash
# Bun does not have built-in coverage, use bun:test coverage
bun test --coverage

# Or use a third-party tool
bunx bun-test-coverage
```

### Critical Paths to Test

Priority testing areas:

1. **URL validation** (`isValidTwitterUrl`)
   - Valid Twitter URLs
   - Valid X.com URLs
   - Short t.co URLs
   - Invalid URLs

2. **Tweet parsing** (`parseTweetData`)
   - Basic tweet text
   - Tweets with images
   - Tweets with videos
   - Tweets with link cards
   - Replies/parent tweets

3. **PDF generation** (`generatePdfHtml`)
   - Single tweet
   - Thread tweets
   - Tweets with media
   - HTML escaping

4. **API routes**
   - Valid requests
   - Invalid input (400)
   - Not found (404)
   - Rate limiting (429)
   - Server errors (500)

---

## Running Tests

### Basic Commands

```bash
# Run all tests
bun test

# Run specific file
bun test src/lib/twitter.test.ts

# Run tests matching name
bun test --grep "isValidTwitterUrl"

# Watch mode (re-run on file changes)
bun test --watch

# Run with coverage
bun test --coverage
```

### CI/CD Integration

Add to your CI pipeline:

```yaml
# Example GitHub Actions
- name: Run tests
  run: bun test

- name: Type check
  run: bun run typecheck

- name: Lint
  run: bun run lint
```

---

## Test Patterns

### Arrange-Act-Assert

Follow the AAA pattern:

```typescript
it("should validate Twitter URL", () => {
  // Arrange
  const url = "https://twitter.com/user/status/123";

  // Act
  const result = isValidTwitterUrl(url);

  // Assert
  expect(result).toBe(true);
});
```

### Descriptive Test Names

Use descriptive names that explain what is being tested:

```typescript
// Good
it("should return null when tweet data is empty");

// Bad
it("test1");
```

### Test Edge Cases

Always test edge cases:

```typescript
describe("extractTweetId", () => {
  it("should handle URLs without protocol", () => {
    expect(extractTweetId("twitter.com/user/status/123")).toBe("123");
  });

  it("should handle URLs with www", () => {
    expect(extractTweetId("www.twitter.com/user/status/123")).toBe("123");
  });

  it("should handle URLs with query parameters", () => {
    expect(extractTweetId("https://twitter.com/user/status/123?ref=abc")).toBe("123");
  });
});
```

### Error Handling Tests

Test error paths:

```typescript
describe("error handling", () => {
  it("should throw on invalid tweet data", () => {
    expect(() => parseTweetData({})).toThrow();
  });

  it("should handle rate limit errors", async () => {
    mockFetch.mockResolvedValueOnce({
      status: 429,
    } as Response);

    await expect(fetchTweetData("123")).rejects.toThrow("RATE_LIMITED");
  });
});
```

---

## Best Practices

### Do

- Write tests before fixing bugs (TDD approach)
- Keep tests small and focused
- Use descriptive test names
- Test both success and error paths
- Mock external dependencies
- Run tests before committing

### Don't

- Test implementation details
- Write overly complex tests
- Skip edge cases
- Leave commented-out tests
- Use `any` type in tests
- Test third-party libraries

---

## Related Documents

- [CONVENTIONS.md](./CONVENTIONS.md) - Code style and patterns
- [AGENTS.md](../AGENTS.md) - Development guide and commands
