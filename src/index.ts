import { readFileSync } from "node:fs";
import { Hono } from "hono";
import { serveStatic } from "hono/bun";
import { rateLimiter } from "hono-rate-limiter";

import pdfApp from "./routes/pdf.ts";
import tweetApp from "./routes/tweet.ts";

const app = new Hono();

if (!process.env.DISABLE_RATE_LIMIT) {
	app.use(
		"*",
		rateLimiter({
			limit: 30,
			windowMs: 60 * 1000,
			keyGenerator: (c) =>
				c.req.header("cf-connecting-ip") ??
				c.req.header("x-forwarded-for") ??
				c.req.header("x-real-ip") ??
				"unknown",
		}),
	);
}

app.use("*", async (c, next) => {
	await next();
	c.res.headers.set(
		"Content-Security-Policy",
		"default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https://pbs.twimg.com https://abs.twimg.com; font-src 'self';",
	);
	c.res.headers.set("X-Content-Type-Options", "nosniff");
	c.res.headers.set("X-Frame-Options", "DENY");
	c.res.headers.set("X-XSS-Protection", "1; mode=block");
});

const indexHtml = readFileSync("./public/index.html", "utf-8");

app.route("/api/tweet", tweetApp);
app.route("/api/pdf", pdfApp);

app.get("/", (c) => {
	return c.html(indexHtml);
});

app.use("/*", serveStatic({ root: "./public" }));

export default {
	port: 8008,
	fetch: app.fetch,
};
