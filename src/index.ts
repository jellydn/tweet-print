import { readFileSync } from "node:fs";
import { Hono } from "hono";
import { serveStatic } from "hono/bun";

interface TweetData {
	text: string;
	authorName: string;
	authorHandle: string;
	authorAvatarUrl: string;
	timestamp: string;
	imageUrls: string[];
}

function isValidTwitterUrl(url: string): boolean {
	return /^(https?:\/\/)?(www\.)?(twitter\.com|x\.com)\/.+\/status\/\d+/.test(
		url,
	);
}

function extractTweetId(url: string): string | null {
	const match = url.match(/\/status\/(\d+)/);
	return match?.[1] ?? null;
}

async function fetchTweetData(tweetId: string): Promise<TweetData | null> {
	const response = await fetch(
		`https://cdn.syndication.twimg.com/tweet-result?id=${tweetId}`,
	);

	if (response.status === 404) {
		return null;
	}

	if (response.status === 429) {
		throw new Error("RATE_LIMITED");
	}

	if (!response.ok) {
		throw new Error(`HTTP_ERROR_${response.status}`);
	}

	const data = (await response.json()) as Record<string, unknown>;
	return parseTweetData(data);
}

function parseTweetData(data: Record<string, unknown>): TweetData | null {
	if (!data.text && !data.text_html) {
		return null;
	}

	const imageUrls: string[] = [];
	const entities = data.entities as Record<string, unknown> | undefined;
	if (entities?.media) {
		const media = entities.media as Array<Record<string, string>>;
		for (const m of media) {
			if (m.media_url_https) {
				imageUrls.push(m.media_url_https);
			}
		}
	}

	const text = (data.text as string) || "";
	const user = data.user as Record<string, string> | undefined;
	const authorName = user?.name || "Unknown";
	const authorHandle = user?.screen_name || "unknown";
	const authorAvatarUrl =
		user?.profile_image_url_https ||
		"https://abs.twimg.com/sticky/default_profile_images/default_profile_normal.png";
	const timestamp = (data.created_at as string) || new Date().toISOString();

	return {
		text,
		authorName,
		authorHandle,
		authorAvatarUrl,
		timestamp,
		imageUrls,
	};
}

async function fetchTweetThread(tweetId: string): Promise<TweetData[]> {
	const conversationUrl = `https://syndication.twitter.com/timeline/conversation/${tweetId}`;
	const response = await fetch(conversationUrl);

	if (response.status === 404 || response.status === 403) {
		const singleTweet = await fetchTweetData(tweetId);
		return singleTweet ? [singleTweet] : [];
	}

	if (response.status === 429) {
		throw new Error("RATE_LIMITED");
	}

	if (!response.ok) {
		const singleTweet = await fetchTweetData(tweetId);
		return singleTweet ? [singleTweet] : [];
	}

	const data = (await response.json()) as Record<string, unknown>;
	const timeline = data.timeline as Record<string, unknown> | undefined;

	if (!timeline) {
		const singleTweet = await fetchTweetData(tweetId);
		return singleTweet ? [singleTweet] : [];
	}

	const tweets: TweetData[] = [];
	const items = timeline.items as Array<Record<string, unknown>> | undefined;

	if (items) {
		for (const item of items) {
			const tweet = item.tweet as Record<string, unknown> | undefined;
			if (tweet) {
				const parsed = parseTweetData(tweet);
				if (parsed) {
					tweets.push(parsed);
				}
			}
		}
	}

	if (tweets.length === 0) {
		const singleTweet = await fetchTweetData(tweetId);
		return singleTweet ? [singleTweet] : [];
	}

	tweets.sort(
		(a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
	);

	return tweets;
}

const app = new Hono();

app.use("/static/*", serveStatic({ root: "./public" }));

app.get("/", (c) => {
	const html = readFileSync("./public/index.html", "utf-8");
	return c.html(html);
});

app.post("/api/tweet", async (c) => {
	const body = await c.req.json<{ url: string }>();
	const url = body.url;

	if (!url || !isValidTwitterUrl(url)) {
		return c.json({ error: "Invalid URL format" }, 400);
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

export default {
	port: 3000,
	fetch: app.fetch,
};
