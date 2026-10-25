import { expect, test } from "@playwright/test";

test.describe("Direct detail URLs", () => {
	const tweetUrl = "https://x.com/testuser/status/123456789?s=46&t=example";
	const detailPath = `/?${new URLSearchParams({ url: tweetUrl })}`;
	const tweet = {
		id: "123456789",
		text: "A directly linked tweet",
		authorName: "Test User",
		authorHandle: "testuser",
		authorAvatarUrl: "/logo.svg",
		timestamp: "2026-03-06T17:35:41.000Z",
		imageUrls: [],
		hasVideo: false,
	};

	test.beforeEach(async ({ page }) => {
		await page.route("**/api/tweet", async (route) => {
			expect(route.request().postDataJSON()).toEqual({ url: tweetUrl });
			await route.fulfill({ json: { tweets: [tweet] } });
		});
	});

	test("opens and reloads a shared detail link and downloads its PDF", async ({
		page,
	}) => {
		await page.goto(detailPath);
		await expect(page.locator(".tweet-body")).toHaveText(tweet.text);
		await page.reload();
		await expect(page.locator(".tweet-body")).toHaveText(tweet.text);
		await page.route("**/api/pdf", async (route) => {
			expect(route.request().postDataJSON()).toEqual({ url: tweetUrl });
			await route.fulfill({
				contentType: "application/pdf",
				body: "%PDF-1.4\n%%EOF",
			});
		});
		const download = page.waitForEvent("download");
		await page.getByRole("button", { name: "Download PDF" }).click();
		expect((await download).suggestedFilename()).toMatch(/^testuser-.*\.pdf$/);
	});

	test("keeps form submissions, reset, Back and Forward in sync with the URL", async ({
		page,
	}) => {
		await page.goto("/");
		await page.locator("#url-input").fill(tweetUrl);
		await page.locator("#url-input").press("Enter");
		await expect(page).toHaveURL(detailPath);
		await expect(page.locator(".tweet-body")).toHaveText(tweet.text);
		await page.goBack();
		await expect(page.locator("#form-container")).toBeVisible();
		await page.goForward();
		await expect(page.locator(".tweet-body")).toHaveText(tweet.text);
		await page.getByRole("button", { name: "Convert Another" }).click();
		await expect(page).toHaveURL("/");
		await expect(page.locator("#url-input")).toHaveValue("");
		await page.goBack();
		await expect(page.locator(".tweet-body")).toHaveText(tweet.text);
	});

	test("shows invalid and unavailable direct links in the editable form", async ({
		page,
	}) => {
		await page.goto("/?url=https%3A%2F%2Fexample.com");
		await expect(page.locator("#error-message")).toContainText("Invalid URL");
		await expect(page.locator("#url-input")).toHaveValue("https://example.com");
		await page.route("**/api/tweet", (route) =>
			route.fulfill({ status: 404, json: { error: "Tweet not found" } }),
		);
		await page.goto(detailPath);
		await expect(page.locator("#form-container")).toBeVisible();
		await expect(page.locator("#error-message")).toContainText(
			"Tweet not found",
		);
		await expect(page.locator("#url-input")).toHaveValue(tweetUrl);
	});

	test("does not restore a stale preview after Back during loading", async ({
		page,
	}) => {
		let finishRequest: () => void = () => {};
		const pending = new Promise<void>((resolve) => {
			finishRequest = resolve;
		});
		await page.route("**/api/tweet", async (route) => {
			await pending;
			await route.fulfill({ json: { tweets: [tweet] } });
		});
		await page.goto("/");
		await page.evaluate(`{
			history.pushState(null, "", ${JSON.stringify(detailPath)});
			dispatchEvent(new PopStateEvent("popstate"));
		}`);
		await expect(page.locator("#generate-btn")).toHaveText("Loading...");
		await page.goBack();
		finishRequest();
		await expect(page.locator("#preview-container")).toBeHidden();
		await expect(page.locator("#generate-btn")).toHaveText("Generate PDF");
		await expect(page.locator("#generate-btn")).toBeDisabled();
		await expect(page.locator("#error-message")).toBeHidden();
	});
});

test.describe("TweetPrint E2E", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto("http://localhost:8008/");
	});

	test("should load the homepage", async ({ page }) => {
		await expect(page).toHaveTitle(/TweetPrint/);
		await expect(page.locator("h1")).toContainText("TweetPrint");
		await expect(page.locator(".subtitle")).toContainText(
			"Convert Twitter/X links to clean, printable PDFs",
		);
	});

	test("should enable/disable button based on input", async ({ page }) => {
		const urlInput = page.locator("#url-input");
		const generateBtn = page.locator("#generate-btn");
		await expect(generateBtn).toBeDisabled();

		await urlInput.fill("test");
		await expect(generateBtn).toBeEnabled();

		await urlInput.fill("");
		await expect(generateBtn).toBeDisabled();
	});

	test("should show error for invalid URL", async ({ page }) => {
		const urlInput = page.locator("#url-input");
		const generateBtn = page.locator("#generate-btn");

		await urlInput.fill("https://example.com/not-a-tweet");
		await generateBtn.click();

		await expect(page.locator("#error-message")).toBeVisible();
		await expect(page.locator("#error-message")).toContainText("Invalid URL");
	});

	test("should show error for tweet not found", async ({ page }) => {
		const urlInput = page.locator("#url-input");
		const generateBtn = page.locator("#generate-btn");

		await urlInput.fill("https://x.com/test/status/123456789");
		await generateBtn.click();

		await expect(page.locator("#error-message")).toBeVisible();
		await expect(page.locator("#error-message")).toContainText(
			/Tweet not found/i,
		);
	});

	test("should load and preview a valid tweet", async ({ page }) => {
		test.setTimeout(60_000);
		const urlInput = page.locator("#url-input");
		const generateBtn = page.locator("#generate-btn");
		const testUrl = "https://x.com/zeddotdev/status/2028603111862862190";

		await urlInput.fill(testUrl);
		await generateBtn.click();

		await expect(page.locator("#preview-container")).toBeVisible({
			timeout: 30_000,
		});
		await expect(page.locator("#form-container")).not.toBeVisible();

		await expect(page.locator("#tweet-preview")).toBeVisible();
		await expect(page.locator(".tweet")).toBeVisible();
		await expect(page.locator(".preview-author-name")).toContainText(/zed/i);
	});

	test("should allow converting another tweet", async ({ page }) => {
		test.setTimeout(60_000);
		const urlInput = page.locator("#url-input");
		const generateBtn = page.locator("#generate-btn");
		const convertAnotherBtn = page.locator("#convert-another-btn");
		const testUrl = "https://x.com/zeddotdev/status/2028603111862862190";

		await urlInput.fill(testUrl);
		await generateBtn.click();

		await expect(page.locator("#preview-container")).toBeVisible({
			timeout: 30_000,
		});

		await convertAnotherBtn.click();

		await expect(page.locator("#form-container")).toBeVisible();
		await expect(page.locator("#preview-container")).not.toBeVisible();
		await expect(page.locator("#url-input")).toHaveValue("");
		await expect(generateBtn).toBeDisabled();
	});

	test("should handle Enter key to submit", async ({ page }) => {
		test.setTimeout(60_000);
		const urlInput = page.locator("#url-input");
		const testUrl = "https://x.com/zeddotdev/status/2028603111862862190";

		await urlInput.fill(testUrl);
		await urlInput.press("Enter");

		await expect(page.locator("#preview-container")).toBeVisible({
			timeout: 30_000,
		});
	});

	test("should load example tweet 1 (zeddotdev)", async ({ page }) => {
		test.setTimeout(60_000);

		await page
			.locator(".example-link", { hasText: "📝 Example Tweet 1" })
			.click();

		await expect(page.locator("#preview-container")).toBeVisible({
			timeout: 30_000,
		});
		await expect(page.locator("#form-container")).not.toBeVisible();
		await expect(page.locator("#tweet-preview")).toBeVisible();
		await expect(page.locator(".tweet")).toBeVisible();
		await expect(page.locator(".preview-author-name")).toContainText(/zed/i);
	});

	test("should load example tweet 2 (trq212)", async ({ page }) => {
		test.setTimeout(60_000);

		await page
			.locator(".example-link", { hasText: "🔧 Example Tweet 2" })
			.click();

		await expect(page.locator("#preview-container")).toBeVisible({
			timeout: 30_000,
		});
		await expect(page.locator("#form-container")).not.toBeVisible();
		await expect(page.locator("#tweet-preview")).toBeVisible();
		await expect(page.locator(".tweet")).toBeVisible();
		await expect(page.locator(".preview-author-name")).toContainText(/trq|t/i);
	});

	test("should load example article (alvinsng) and show article title", async ({
		page,
	}) => {
		test.setTimeout(60_000);

		await page
			.locator(".example-link", { hasText: "📰 Example Article" })
			.click();

		await expect(page.locator("#preview-container")).toBeVisible({
			timeout: 30_000,
		});
		await expect(page.locator("#form-container")).not.toBeVisible();
		await expect(page.locator("#tweet-preview")).toBeVisible();
		await expect(page.locator(".tweet")).toBeVisible();
		await expect(page.locator(".preview-author-name")).toContainText(/alvin/i);
		await expect(page.locator(".article-title").first()).toBeVisible();
	});
});
