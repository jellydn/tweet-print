# Technology Stack

## Languages

- **TypeScript** (^5) - Primary language, with strict mode enabled
- **JavaScript** - Frontend code (vanilla, no frameworks)
- **HTML/CSS** - Frontend markup and styling

## Runtime

- **Bun** - JavaScript runtime and package manager
  - Used as the primary runtime for development and production
  - Handles package management (`bun install`)
  - Runs development server with hot reload (`bun run dev`)

## Frameworks

- **Hono** (^4.12.4) - Web framework for building the API server
  - Lightweight, high-performance framework
  - Used for REST API routes (`/api/tweet`, `/api/pdf`)
  - Serves static frontend files

- **Puppeteer** (^24.37.5) - Browser automation for PDF generation
  - Launches headless Chrome to render HTML to PDF
  - Configured with `--no-sandbox` and `--disable-setuid-sandbox` flags

## Frontend

- **Plain HTML5** - Semantic markup, no templating engines
- **Vanilla JavaScript** - Client-side interactivity, no frameworks
- **CSS3** - Custom styles with CSS variables for theming
  - No external CSS frameworks (KISS principle)

## Dependencies

### Production Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| hono | ^4.12.4 | Web framework for API server |
| puppeteer | ^24.37.5 | Headless browser for PDF generation |

### Development Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| @biomejs/biome | ^2.4.5 | Linting and code formatting |
| @types/bun | latest | TypeScript types for Bun runtime |
| @types/node | ^25.3.3 | TypeScript types for Node.js APIs |
| typescript | ^5 (peer) | TypeScript compiler |

## Configuration

### TypeScript (tsconfig.json)

Strict TypeScript configuration with:
- `strict: true` - All strict type checks enabled
- `verbatimModuleSyntax: true` - Type imports required
- `noUncheckedIndexedAccess: true` - Arrays include undefined
- `noImplicitOverride: true` - Override keyword required
- Path alias: `@/` maps to `src/`

### Biome (biome.json)

Code quality tools:
- **Formatter:** Tabs for indentation, double quotes
- **Linter:** Enabled with recommended rules
- **Import organization:** Auto-organizes on save
- **VCS:** Git integration enabled

### Package (package.json)

- `"type": "module"` - ES modules
- `"private": true` - Not published to npm

## Project Structure

```
src/
├── index.ts          # Hono server entrypoint
├── routes/          # API route handlers
│   ├── tweet.ts     # Tweet fetching endpoints
│   └── pdf.ts       # PDF generation endpoints
├── lib/             # Business logic
│   ├── twitter.ts   # Twitter API client
│   └── pdf.ts       # PDF generation utilities
└── types/           # TypeScript type definitions

public/
├── index.html       # Main frontend page
├── css/
│   └── styles.css   # Stylesheets
└── js/
    └── app.js       # Client-side JavaScript
```

## Key Libraries & Patterns

- **URL Validation:** Regex for Twitter/X URL patterns
- **Thread Fetching:** Twitter syndication API for conversation threads
- **Image Embedding:** Fetch images and convert to base64 data URIs
- **PDF Templates:** Custom HTML generation with inline CSS

## Testing

- **Test Runner:** Bun test (`bun test`)
- No test framework explicitly listed (Bun's built-in test runner)
