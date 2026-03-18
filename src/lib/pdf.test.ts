import { describe, expect, it } from "bun:test";
import type { TweetData } from "../types/index.ts";
import { generatePdfHtml } from "./pdf.ts";

describe("generatePdfHtml", () => {
	const createMockTweet = (overrides: Partial<TweetData> = {}): TweetData => ({
		id: "1234567890",
		text: "Test tweet content",
		authorName: "Test Author",
		authorHandle: "testauthor",
		authorAvatarUrl: "https://example.com/avatar.jpg",
		timestamp: "2024-01-01T12:00:00.000Z",
		imageUrls: [],
		hasVideo: false,
		videoThumbnailUrl: null,
		linkCard: null,
		isReply: false,
		parentTweet: null,
		quotedTweet: null,
		...overrides,
	});

	it("should generate HTML for a single tweet", () => {
		const tweet = createMockTweet();
		const html = generatePdfHtml(
			[tweet],
			"https://twitter.com/user/status/123",
		);

		expect(html).toContain("<!DOCTYPE html>");
		expect(html).toContain("Test tweet content");
		expect(html).toContain("Test Author");
		expect(html).toContain("@testauthor");
	});

	it("should throw error for empty tweets array", () => {
		expect(() =>
			generatePdfHtml([], "https://twitter.com/user/status/123"),
		).toThrow();
	});

	it("should include images in HTML when present", () => {
		const tweet = createMockTweet({
			imageUrls: [
				"https://example.com/image1.jpg",
				"https://example.com/image2.jpg",
			],
		});

		const html = generatePdfHtml(
			[tweet],
			"https://twitter.com/user/status/123",
		);

		expect(html).toContain("tweet-images");
		expect(html).toContain("https://example.com/image1.jpg");
		expect(html).toContain("https://example.com/image2.jpg");
	});

	it("should include video when present", () => {
		const tweet = createMockTweet({
			hasVideo: true,
			videoThumbnailUrl: "https://example.com/video-thumb.jpg",
		});

		const html = generatePdfHtml(
			[tweet],
			"https://twitter.com/user/status/123",
		);

		expect(html).toContain("tweet-video");
		expect(html).toContain("Video");
	});

	it("should include link card when present", () => {
		const tweet = createMockTweet({
			linkCard: {
				title: "Link Title",
				description: "Link Description",
				imageUrl: "https://example.com/link-image.jpg",
				url: "https://example.com",
				domain: "example.com",
			},
		});

		const html = generatePdfHtml(
			[tweet],
			"https://twitter.com/user/status/123",
		);

		expect(html).toContain("link-card");
		expect(html).toContain("Link Title");
		expect(html).toContain("Link Description");
	});

	it("should include quoted tweet when present", () => {
		const tweet = createMockTweet({
			quotedTweet: {
				id: "9876543210",
				text: "Quoted tweet text",
				authorName: "Quoted Author",
				authorHandle: "quotedauthor",
				authorAvatarUrl: "https://example.com/quoted-avatar.jpg",
				timestamp: "2024-01-01T10:00:00.000Z",
				imageUrls: [],
				hasVideo: false,
				videoThumbnailUrl: null,
				linkCard: null,
				isReply: false,
				parentTweet: null,
				quotedTweet: null,
			},
		});

		const html = generatePdfHtml(
			[tweet],
			"https://twitter.com/user/status/123",
		);

		expect(html).toContain("quoted-tweet");
		expect(html).toContain("Quoted tweet text");
	});

	it("should include source URL in footer", () => {
		const tweet = createMockTweet();
		const sourceUrl = "https://twitter.com/user/status/1234567890";

		const html = generatePdfHtml([tweet], sourceUrl);

		expect(html).toContain(sourceUrl);
		expect(html).toContain("footer");
	});

	it("should handle multiple tweets (thread)", () => {
		const tweets = [
			createMockTweet({
				text: "First tweet",
				timestamp: "2024-01-01T10:00:00.000Z",
			}),
			createMockTweet({
				text: "Second tweet",
				timestamp: "2024-01-01T11:00:00.000Z",
			}),
			createMockTweet({
				text: "Third tweet",
				timestamp: "2024-01-01T12:00:00.000Z",
			}),
		];

		const html = generatePdfHtml(tweets, "https://twitter.com/user/status/123");

		expect(html).toContain("3 tweets");
		expect(html).toContain("First tweet");
		expect(html).toContain("Second tweet");
		expect(html).toContain("Third tweet");
	});

	it("should escape HTML in tweet content", () => {
		const tweet = createMockTweet({
			text: "<script>alert('xss')</script>",
			authorName: '<img src="x" onerror="alert(1)">',
		});

		const html = generatePdfHtml(
			[tweet],
			"https://twitter.com/user/status/123",
		);

		expect(html).toContain("&lt;script&gt;");
		expect(html).toContain("&lt;img");
	});

	it("should include article title when present", () => {
		const tweet = createMockTweet({ articleTitle: "My X Article" });
		const html = generatePdfHtml(
			[tweet],
			"https://twitter.com/user/status/123",
		);

		expect(html).toContain("article-title");
		expect(html).toContain("My X Article");
	});

	it("should escape HTML in article title", () => {
		const tweet = createMockTweet({
			articleTitle: '<script>alert("xss")</script>',
		});
		const html = generatePdfHtml(
			[tweet],
			"https://twitter.com/user/status/123",
		);

		expect(html).toContain("&lt;script&gt;");
		expect(html).not.toContain("<script>alert");
	});

	it("should not include article title element when articleTitle is absent", () => {
		const tweet = createMockTweet();
		const html = generatePdfHtml(
			[tweet],
			"https://twitter.com/user/status/123",
		);

		expect(html).not.toContain('class="article-title"');
	});
});
