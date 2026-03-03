import { readFileSync } from "node:fs";
import { Hono } from "hono";
import { serveStatic } from "hono/bun";
import puppeteer from "puppeteer";

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

function escapeHtml(text: string): string {
	return text
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#039;");
}

function formatDate(isoString: string): string {
	const date = new Date(isoString);
	return date.toLocaleDateString("en-US", {
		year: "numeric",
		month: "long",
		day: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	});
}

function generatePdfHtml(tweets: TweetData[], url: string): string {
	const firstTweet = tweets[0];
	if (!firstTweet) {
		throw new Error("No tweets provided");
	}
	const authorHandle = firstTweet.authorHandle;
	const authorName = firstTweet.authorName;
	const isThread = tweets.length > 1;

	const tweetsHtml = tweets
		.map((tweet) => {
			const imagesHtml =
				tweet.imageUrls && tweet.imageUrls.length > 0
					? `<div class="tweet-images">
						${tweet.imageUrls
							.map(
								(img) =>
									`<img src="${escapeHtml(img)}" alt="Tweet image" class="tweet-image" loading="lazy">`,
							)
							.join("")}
					</div>`
					: "";

			return `
			<div class="tweet">
				<div class="tweet-header">
					<img src="${escapeHtml(tweet.authorAvatarUrl)}" alt="${escapeHtml(tweet.authorName)}" class="tweet-avatar">
					<div class="tweet-author-info">
						<span class="tweet-author-name">${escapeHtml(tweet.authorName)}</span>
						<span class="tweet-author-handle">@${escapeHtml(tweet.authorHandle)}</span>
					</div>
				</div>
				<div class="tweet-body">${escapeHtml(tweet.text).replace(/\n/g, "<br>")}</div>
				${imagesHtml}
				<div class="tweet-timestamp">${formatDate(tweet.timestamp)}</div>
			</div>
		`;
		})
		.join("");

	const threadHeader = isThread
		? `<div class="thread-header">
			<span class="thread-count">${tweets.length} tweets</span>
		</div>`
		: "";

	return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; line-height: 1.6; color: #333; padding: 40px; }
    .container { max-width: 700px; margin: 0 auto; }
    .preview-author { margin-bottom: 1.5rem; padding-bottom: 1rem; border-bottom: 2px solid #e1e8ed; }
    .preview-author-name { font-weight: 700; font-size: 1.25rem; margin-right: 0.5rem; }
    .preview-author-handle { color: #666; font-size: 1rem; }
    .thread-header { margin-bottom: 1rem; padding-bottom: 0.5rem; border-bottom: 1px solid #e1e8ed; }
    .thread-count { color: #666; font-size: 0.875rem; }
    .tweet { padding: 1.25rem 0; border-bottom: 1px solid #e1e8ed; page-break-inside: avoid; }
    .tweet:first-child { padding-top: 0; }
    .tweet:last-child { border-bottom: none; padding-bottom: 0; }
    .tweet-header { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.75rem; }
    .tweet-avatar { width: 48px; height: 48px; border-radius: 50%; object-fit: cover; }
    .tweet-author-info { display: flex; flex-direction: column; }
    .tweet-author-name { font-weight: 700; }
    .tweet-author-handle { color: #666; font-size: 0.875rem; }
    .tweet-body { margin-bottom: 0.75rem; white-space: pre-wrap; word-wrap: break-word; font-size: 1rem; }
    .tweet-images { display: flex; flex-direction: column; gap: 0.5rem; margin-bottom: 0.75rem; }
    .tweet-image { max-width: 100%; border-radius: 12px; border: 1px solid #e1e8ed; }
    .tweet-timestamp { color: #666; font-size: 0.875rem; }
    .footer { margin-top: 2rem; padding-top: 1rem; border-top: 1px solid #e1e8ed; color: #666; font-size: 0.75rem; text-align: center; }
  </style>
</head>
<body>
  <div class="container">
    <div class="preview-author">
      <span class="preview-author-name">${escapeHtml(authorName)}</span>
      <span class="preview-author-handle">@${escapeHtml(authorHandle)}</span>
    </div>
    ${threadHeader}
    ${tweetsHtml}
    <div class="footer">
      Source: ${escapeHtml(url)} | Generated: ${formatDate(new Date().toISOString())}
    </div>
  </div>
</body>
</html>`;
}

app.post("/api/pdf", async (c) => {
	const body = await c.req.json<{ tweets: TweetData[]; url: string }>();
	const { tweets, url } = body;

	if (!tweets || tweets.length === 0) {
		return c.json({ error: "No tweet data provided" }, 400);
	}

	if (!url || !isValidTwitterUrl(url)) {
		return c.json({ error: "Invalid URL format" }, 400);
	}

	try {
		const html = generatePdfHtml(tweets, url);
		const browser = await puppeteer.launch({
			headless: true,
			args: ["--no-sandbox", "--disable-setuid-sandbox"],
		});

		const page = await browser.newPage();
		await page.setContent(html, { waitUntil: "networkidle0" });

		const pdf = await page.pdf({
			format: "A4",
			printBackground: true,
			margin: {
				top: "20px",
				bottom: "20px",
				left: "20px",
				right: "20px",
			},
		});

		await browser.close();

		const firstTweet = tweets[0];
		if (!firstTweet) {
			return c.json({ error: "No tweet data provided" }, 400);
		}

		return new Response(pdf, {
			headers: {
				"Content-Type": "application/pdf",
				"Content-Disposition": `attachment; filename="${firstTweet.authorHandle}-${new Date().toISOString().split("T")[0]}.pdf"`,
			},
		});
	} catch (error) {
		console.error("PDF generation error:", error);
		return c.json({ error: "Failed to generate PDF" }, 500);
	}
});

export default {
	port: 3000,
	fetch: app.fetch,
};
