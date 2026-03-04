import { readFileSync } from "node:fs";
import { Hono } from "hono";
import { serveStatic } from "hono/bun";

import pdfApp from "./routes/pdf.ts";
import tweetApp from "./routes/tweet.ts";

const app = new Hono();

app.route("/api/tweet", tweetApp);
app.route("/api/pdf", pdfApp);

app.get("/", (c) => {
	const html = readFileSync("./public/index.html", "utf-8");
	return c.html(html);
});

app.use("/*", serveStatic({ root: "./public" }));

export default {
	port: 3000,
	fetch: app.fetch,
};
