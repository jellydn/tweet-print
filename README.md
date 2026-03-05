<p align="center">
  <img src="public/logo-readme.svg" alt="TweetPrint Logo" width="200">
</p>

<h1 align="center">TweetPrint</h1>

<p align="center">
  Paste a Twitter/X link → preview → download as a clean PDF.
</p>

<p align="center">
  <a href="https://github.com/jellydn/tweet-print/blob/main/LICENSE">
    <img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="License">
  </a>
  <img src="https://img.shields.io/badge/Bun-1.x-000000?logo=bun&logoColor=white" alt="Bun">
  <img src="https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white" alt="TypeScript">
  <img src="https://img.shields.io/badge/Hono-4.x-E36002?logo=hono&logoColor=white" alt="Hono">
</p>

<p align="center">
  <a href="https://twt-print.itman.fyi/" target="_blank">
    <strong>🚀 Live Demo: twt-print.itman.fyi</strong>
  </a>
</p>

## ✨ Features

- **Convert tweets to PDF** — Single tweets or full threads into print-friendly PDFs
- **Preserves everything** — Text, images, author info, timestamps, and quoted tweets
- **HTML preview** — See exactly how it will look before downloading
- **Clickable links** — URLs, @mentions, and #hashtags are clickable in the preview
- **No authentication** — No login or API keys required
- **Free & open source** — Uses Twitter's syndication API (free, no auth)

## 🧱 Tech Stack

| Layer           | Stack                             |
| --------------- | --------------------------------- |
| **Runtime**     | Bun 1.x                           |
| **Server**      | Hono (TypeScript)                 |
| **PDF Engine**  | Puppeteer                         |
| **Frontend**    | Static HTML/CSS/JS (no framework) |
| **Data Source** | Twitter syndication API           |
| **Styling**     | Vanilla CSS with CSS variables    |

## 🚀 Getting Started

### Prerequisites

- [Bun](https://bun.sh/) 1.x or later
- Chrome/Chromium (for Puppeteer PDF generation)

### Installation

```bash
# Clone the repository
git clone https://github.com/jellydn/tweet-print.git
cd tweet-print

# Install dependencies
bun install

# Start development server
bun run dev
```

Open http://localhost:8008

### Using Just (recommended)

```bash
# Show all available commands
just

# Development
just dev          # Start dev server with hot reload
just check        # Run typecheck and lint

# Testing
just test         # Run unit tests
just test-e2e     # Run E2E tests with Playwright

# Quality
just typecheck    # TypeScript type checking
just lint         # Lint and format code
```

## 🛠️ Available Commands

| Command             | Description                              |
| ------------------- | ---------------------------------------- |
| `bun run dev`       | Start development server with hot reload |
| `bun run typecheck` | Run TypeScript type checking             |
| `bun run lint`      | Run Biome linter and formatter           |
| `bun test`          | Run unit tests                           |
| `bun run test:e2e`  | Run E2E tests with Playwright            |

## 🐳 Docker Deployment

### Build and run locally

```bash
# Build Docker image
docker build -t tweet-print .

# Run container
docker run -p 3000:3000 tweet-print
```

### Deploy to Dokku

```bash
# On your Dokku server
dokku apps:create tweet-print
dokku config:set tweet-print NODE_ENV=production

# From your local machine
git remote add dokku dokku@your-server:tweet-print
git push dokku main
```

## 📖 How It Works

1. **Paste URL** — Enter a `twitter.com` or `x.com` post URL
2. **Fetch Data** — App fetches tweet data via Twitter's syndication API
3. **Preview** — See an HTML preview of the tweet/thread with clickable links
4. **Download** — Click **Download PDF** to get a clean, printable PDF

## 📦 Project Structure

```
tweet-print/
├── src/
│   ├── index.ts           # Hono server entry point
│   ├── routes/            # API routes (tweet, pdf)
│   ├── lib/               # Business logic (twitter, pdf)
│   └── types/             # TypeScript type definitions
├── public/                # Static frontend assets
│   ├── index.html         # Main landing page
│   ├── css/               # Stylesheets
│   └── js/                # Client-side JavaScript
├── e2e/                   # Playwright E2E tests
├── justfile               # Task runner commands
├── Dockerfile             # Docker configuration
└── README.md
```

## 🔧 Environment Variables

| Variable   | Required | Description                                            |
| ---------- | -------- | ------------------------------------------------------ |
| `NODE_ENV` | No       | Environment mode (`development` or `production`)       |
| `PORT`     | No       | Server port (default: `8008` in dev, `3000` in Docker) |

## 🧪 Running Tests

```bash
# Unit tests
bun test

# E2E tests (requires dev server running)
bun run test:e2e

# E2E tests with UI
bun run test:e2e:ui
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👤 Author

**Dung Huynh**

- Website: [productsway.com](https://productsway.com)
- Twitter: [@jellydn](https://twitter.com/jellydn)
- GitHub: [@jellydn](https://github.com/jellydn)

## ⭐ Show Your Support

Give a ⭐️ if this project helped you!

[![Ko-fi](https://img.shields.io/badge/Ko--fi-F16061?style=for-the-badge&logo=ko-fi&logoColor=white)](https://ko-fi.com/dunghd)
[![PayPal](https://img.shields.io/badge/PayPal-00457C?style=for-the-badge&logo=paypal&logoColor=white)](https://paypal.me/dunghd)
[![Buy Me A Coffee](https://img.shields.io/badge/Buy_Me_A_Coffee-FFDD00?style=for-the-badge&logo=buy-me-a-coffee&logoColor=black)](https://www.buymeacoffee.com/dunghd)

---

<p align="center">
  Built with ❤️ using <a href="https://bun.sh">Bun</a>, <a href="https://hono.dev">Hono</a>, and <a href="https://pptr.dev">Puppeteer</a>
</p>
