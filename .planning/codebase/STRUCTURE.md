# Structure

## Directory Layout

```
tweet-print/
├── src/                      # Server-side TypeScript
│   ├── index.ts             # Hono server entry point
│   ├── routes/              # API route handlers
│   │   ├── tweet.ts        # POST /api/tweet - fetch tweet data
│   │   └── pdf.ts          # POST /api/pdf - generate PDF
│   ├── lib/                 # Business logic
│   │   ├── twitter.ts      # Twitter API integration
│   │   └── pdf.ts         # PDF generation & HTML templates
│   └── types/              # TypeScript type definitions
│       └── index.ts        # Interface definitions
├── public/                  # Static frontend assets
│   ├── index.html          # Main HTML page
│   ├── css/
│   │   └── styles.css     # Frontend styles
│   └── js/
│       └── app.js         # Client-side JavaScript
├── tasks/                   # Project documentation
│   └── prd-tweet-to-pdf.md
├── scripts/                 # Development scripts
├── package.json            # Dependencies & scripts
├── tsconfig.json           # TypeScript config
├── biome.json              # Code formatting/linting
└── README.md              # Project overview
```

## Key Locations

| File | Purpose |
|------|---------|
| `src/index.ts` | Server entry point, route mounting |
| `src/routes/tweet.ts` | Tweet fetch endpoint |
| `src/routes/pdf.ts` | PDF generation endpoint |
| `src/lib/twitter.ts` | Twitter API client, URL parsing |
| `src/lib/pdf.ts` | PDF HTML generator, image embedding |
| `src/types/index.ts` | TypeScript interfaces |
| `public/index.html` | Frontend entry |
| `public/js/app.js` | Frontend logic |
| `public/css/styles.css` | Frontend styles |

## Naming Conventions

### Files

- **TypeScript**: kebab-case (`twitter-api.ts`, `pdf-generator.ts`)
- **Frontend**: kebab-case (`tweet-preview.html`, `app.js`)
- **CSS**: kebab-case (`styles.css`)
- **Directories**: kebab-case (`routes/`, `lib/`)

### Code

| Type | Convention | Example |
|------|------------|---------|
| Functions | camelCase, verb prefix | `fetchTweetData()`, `generatePdfHtml()` |
| Interfaces | PascalCase | `TweetData`, `LinkCard` |
| Types | PascalCase | (using interfaces) |
| Constants | SCREAMING_SNAKE_CASE | (none currently) |
| Boolean variables | `is`/`has`/`should` prefix | `isValidTwitterUrl`, `hasVideo` |

## API Routes

| Method | Path | Handler | Description |
|--------|------|---------|-------------|
| GET | `/` | static | Serve frontend HTML |
| POST | `/api/tweet` | `routes/tweet.ts` | Fetch tweet/thread data |
| POST | `/api/pdf` | `routes/pdf.ts` | Generate PDF from tweets |

## Type Definitions

**`src/types/index.ts`** exports:

```typescript
interface LinkCard {
  title: string;
  description: string;
  imageUrl: string;
  url: string;
  domain: string;
}

interface TweetData {
  text: string;
  authorName: string;
  authorHandle: string;
  authorAvatarUrl: string;
  timestamp: string;
  imageUrls: string[];
  hasVideo: boolean;
  videoThumbnailUrl: string | null;
  linkCard: LinkCard | null;
  isReply: boolean;
  parentTweet: TweetData | null;
}
```

## Dependencies

### Runtime

- `hono` - Web framework
- `puppeteer` - PDF generation

### Development

- `bun` - Runtime & package manager
- `typescript` - Type checking
- `@biomejs/biome` - Linting & formatting

## Static Assets

Frontend served from `public/` directory:
- `/` → `public/index.html`
- `/css/styles.css` → `public/css/styles.css`
- `/js/app.js` → `public/js/app.js`
