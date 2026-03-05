import { Hono } from "hono";
import puppeteer from "puppeteer";
import { z } from "zod";
import { embedImages, generatePdfHtml } from "../lib/pdf.ts";
import {
	extractTweetId,
	fetchTweetThread,
	isValidTwitterUrl,
} from "../lib/twitter.ts";

const urlSchema = z.object({
	url: z
		.string()
		.url()
		.refine(
			(val) => isValidTwitterUrl(val),
			"URL must be a valid Twitter/X status URL",
		),
});

const app = new Hono();

app.post("/", async (c) => {
	let body: unknown;
	try {
		body = await c.req.json();
	} catch {
		return c.json({ error: "Invalid JSON body" }, 400);
	}

	const parsed = urlSchema.safeParse(body);
	if (!parsed.success) {
		return c.json({ error: "Invalid URL format" }, 400);
	}

	const { url } = parsed.data;

	const tweetId = extractTweetId(url);
	if (!tweetId) {
		return c.json({ error: "Invalid tweet URL" }, 400);
	}

	let browser: Awaited<ReturnType<typeof puppeteer.launch>> | null = null;
	try {
		const tweets = await fetchTweetThread(tweetId);
		if (tweets.length === 0) {
			return c.json({ error: "Tweet not found" }, 404);
		}

		const embeddedTweets = await embedImages(tweets);
		const html = generatePdfHtml(embeddedTweets, url);
		browser = await puppeteer.launch({
			headless: true,
			args: [
				"--no-sandbox",
				"--disable-setuid-sandbox",
				"--disable-dev-shm-usage",
				"--disable-gpu",
				"--no-first-run",
				"--no-zygote",
				"--single-process",
			],
		});

		const page = await browser.newPage();
		await page.setContent(html, { waitUntil: "networkidle2" });

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
	} catch (error) {
		console.error("PDF generation error:", error);
		return c.json({ error: "Failed to generate PDF" }, 500);
	} finally {
		if (browser) {
			await browser.close();
		}
	}
});

export default app;
