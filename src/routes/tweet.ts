import { Hono } from "hono";

import {
	extractTweetId,
	fetchTweetThread,
	isShortUrl,
	isValidTwitterUrl,
	resolveShortUrl,
} from "../lib/twitter.ts";

const app = new Hono();

app.post("/", async (c) => {
	const body = await c.req.json<{ url: string }>();
	let url = body.url;

	if (!url) {
		return c.json({ error: "Invalid URL format" }, 400);
	}

	if (isShortUrl(url)) {
		try {
			url = await resolveShortUrl(url);
		} catch {
			return c.json({ error: "Could not resolve short URL" }, 400);
		}
	}

	if (!isValidTwitterUrl(url)) {
		return c.json(
			{
				error:
					"URL does not point to a tweet. Only tweet status URLs are supported.",
			},
			400,
		);
	}

	const tweetId = extractTweetId(url);
	if (!tweetId) {
		return c.json({ error: "Invalid URL format" }, 400);
	}

	try {
		const tweets = await fetchTweetThread(tweetId);
		if (tweets.length === 0) {
			return c.json({ error: "Tweet not found" }, 404);
		}
		return c.json({ tweets });
	} catch (error) {
		const errorMessage =
			error instanceof Error ? error.message : "Unknown error";
		if (errorMessage === "RATE_LIMITED") {
			return c.json({ error: "Rate limited. Please try again later." }, 429);
		}
		return c.json({ error: "Failed to fetch tweet" }, 500);
	}
});

export default app;
