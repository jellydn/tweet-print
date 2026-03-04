import { Hono } from "hono";
import puppeteer from "puppeteer";
import { embedImages, generatePdfHtml } from "../lib/pdf.ts";
import { isValidTwitterUrl } from "../lib/twitter.ts";
import type { TweetData } from "../types/index.ts";

const app = new Hono();

app.post("/", async (c) => {
	const body = await c.req.json<{ tweets: TweetData[]; url: string }>();
	const { tweets, url } = body;

	if (!tweets || tweets.length === 0) {
		return c.json({ error: "No tweet data provided" }, 400);
	}

	if (!url || !isValidTwitterUrl(url)) {
		return c.json({ error: "Invalid URL format" }, 400);
	}

	try {
		const embeddedTweets = await embedImages(tweets);
		const html = generatePdfHtml(embeddedTweets, url);
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

export default app;
