import { readFileSync } from "node:fs";
import { Hono } from "hono";
import { serveStatic } from "hono/bun";

const app = new Hono();

app.use("/static/*", serveStatic({ root: "./public" }));

app.get("/", (c) => {
	const html = readFileSync("./public/index.html", "utf-8");
	return c.html(html);
});

export default {
	port: 3000,
	fetch: app.fetch,
};
