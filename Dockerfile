FROM oven/bun:1 AS base
WORKDIR /app

# Install Chromium dependencies for Puppeteer
RUN apt-get update && apt-get install -y \
	ca-certificates \
	fonts-liberation \
	libasound2 \
	libatk-bridge2.0-0 \
	libatk1.0-0 \
	libcups2 \
	libdbus-1-3 \
	libdrm2 \
	libgbm1 \
	libgtk-3-0 \
	libnspr4 \
	libnss3 \
	libx11-xcb1 \
	libxcomposite1 \
	libxdamage1 \
	libxrandr2 \
	wget \
	xdg-utils \
	--no-install-recommends \
	&& rm -rf /var/lib/apt/lists/*

# Install dependencies
FROM base AS install
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --production

# Final stage
FROM base AS release
COPY --from=install /app/node_modules node_modules
COPY src src
COPY public public

ENV NODE_ENV=production
EXPOSE 3000

USER bun
ENTRYPOINT ["bun", "run", "src/index.ts"]
