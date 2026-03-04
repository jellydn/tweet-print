import { Hono } from "hono";
import puppeteer from "puppeteer";
import { embedImages, generatePdfHtml } from "../lib/pdf.ts";
import {
	extractTweetId,
	fetchTweetThread,
	isValidTwitterUrl,
} from "../lib/twitter.ts";

const app = new Hono();

app.post("/", async (c) => {
	let body: { url: string };
	try {
		body = await c.req.json<{ url: string }>();
	} catch {
		return c.json({ error: "Invalid JSON body" }, 400);
	}

	const { url } = body;

	if (!url || !isValidTwitterUrl(url)) {
		return c.json({ error: "Invalid URL format" }, 400);
	}

	const tweetId = extractTweetId(url);
	if (!tweetId) {
		return c.json({ error: "Invalid tweet URL" }, 400);
	}

	try {
		const tweets = await fetchTweetThread(tweetId);
		if (tweets.length === 0) {
			return c.json({ error: "Tweet not found" }, 404);
		}

		const embeddedTweets = await embedImages(tweets);
		const html = generatePdfHtml(embeddedTweets, url);
		const browser = await puppeteer.launch({
			headless: true,
			args: ["--no-sandbox", "--disable-setuid-sandbox"],
		});

		try {
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
		} finally {
			await browser.close();
		}
	} catch (error) {
		console.error("PDF generation error:", error);
		return c.json({ error: "Failed to generate PDF" }, 500);
	}
});

export default app;
