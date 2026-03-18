import { expect, test } from "@playwright/test";

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
		await expect(page.locator(".preview-author-name")).toContainText(/alvins/i);
		await expect(page.locator(".article-title").first()).toBeVisible();
	});
});
