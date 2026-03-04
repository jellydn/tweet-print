import { readFileSync } from "node:fs";
import { Hono } from "hono";
import { serveStatic } from "hono/bun";

import pdfApp from "./routes/pdf.ts";
import tweetApp from "./routes/tweet.ts";

const app = new Hono();

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
