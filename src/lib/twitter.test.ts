import { describe, expect, it } from "bun:test";
import { parseTweetData } from "./twitter.ts";

describe("parseTweetData", () => {
	it("should parse a basic tweet", () => {
		const data = {
			id_str: "1234567890",
			text: "Hello world",
			user: {
				screen_name: "testuser",
				name: "Test User",
				profile_image_url_https: "https://example.com/avatar.jpg",
			},
			created_at: "2024-01-01T12:00:00.000Z",
		};

		const result = parseTweetData(data);

		expect(result).not.toBeNull();
		expect(result?.text).toBe("Hello world");
		expect(result?.authorHandle).toBe("testuser");
		expect(result?.authorName).toBe("Test User");
		expect(result?.authorAvatarUrl).toBe("https://example.com/avatar.jpg");
		expect(result?.timestamp).toBe("2024-01-01T12:00:00.000Z");
	});

	it("should return null for empty data", () => {
		expect(parseTweetData({})).toBeNull();
		expect(
			parseTweetData(null as unknown as Record<string, unknown>),
		).toBeNull();
	});

	it("should extract photos from data.photos", () => {
		const data = {
			id_str: "1234567890",
			text: "Check out these photos",
			user: {
				screen_name: "testuser",
				name: "Test User",
				profile_image_url_https: "https://example.com/avatar.jpg",
			},
			created_at: "2024-01-01T12:00:00.000Z",
			photos: [
				{ url: "https://example.com/photo1.jpg" },
				{ url: "https://example.com/photo2.jpg" },
			],
		};

		const result = parseTweetData(data);

		expect(result?.imageUrls).toEqual([
			"https://example.com/photo1.jpg",
			"https://example.com/photo2.jpg",
		]);
	});

	it("should parse video info", () => {
		const data = {
			id_str: "1234567890",
			text: "Check out this video",
			user: {
				screen_name: "testuser",
				name: "Test User",
				profile_image_url_https: "https://example.com/avatar.jpg",
			},
			created_at: "2024-01-01T12:00:00.000Z",
			video: {
				duration: 120,
				poster: "https://example.com/video-thumb.jpg",
			},
		};

		const result = parseTweetData(data);

		expect(result?.hasVideo).toBe(true);
		expect(result?.videoThumbnailUrl).toBe(
			"https://example.com/video-thumb.jpg",
		);
	});

	it("should parse link card", () => {
		const data = {
			id_str: "1234567890",
			text: "Check out this link",
			user: {
				screen_name: "testuser",
				name: "Test User",
				profile_image_url_https: "https://example.com/avatar.jpg",
			},
			created_at: "2024-01-01T12:00:00.000Z",
			card: {
				binding_values: {
					title: { string_value: "Link Title" },
					description: { string_value: "Link Description" },
					domain: { string_value: "example.com" },
					card_url: { string_value: "https://example.com/link" },
					summary_photo_image_large: {
						image_value: { url: "https://example.com/link-image.jpg" },
					},
				},
			},
		};

		const result = parseTweetData(data);

		expect(result?.linkCard).not.toBeNull();
		expect(result?.linkCard?.title).toBe("Link Title");
		expect(result?.linkCard?.description).toBe("Link Description");
		expect(result?.linkCard?.domain).toBe("example.com");
		expect(result?.linkCard?.imageUrl).toBe(
			"https://example.com/link-image.jpg",
		);
	});

	it("should handle HTML entities in text", () => {
		const data = {
			id_str: "1234567890",
			text: "Hello &amp; world &lt;test&gt; &quot;quoted&quot; &#39;apostrophe&#39;",
			user: {
				screen_name: "testuser",
				name: "Test User",
				profile_image_url_https: "https://example.com/avatar.jpg",
			},
			created_at: "2024-01-01T12:00:00.000Z",
		};

		const result = parseTweetData(data);

		expect(result?.text).toBe("Hello & world <test> \"quoted\" 'apostrophe'");
	});

	it("should use text_html when text is missing", () => {
		const data = {
			id_str: "1234567890",
			text_html: "<p>HTML content</p>",
			user: {
				screen_name: "testuser",
				name: "Test User",
				profile_image_url_https: "https://example.com/avatar.jpg",
			},
			created_at: "2024-01-01T12:00:00.000Z",
		};

		const result = parseTweetData(data);

		expect(result?.text).toBe("HTML content");
	});

	it("should handle default avatar when not provided", () => {
		const data = {
			id_str: "1234567890",
			text: "Hello world",
			user: {
				screen_name: "testuser",
				name: "Test User",
			},
			created_at: "2024-01-01T12:00:00.000Z",
		};

		const result = parseTweetData(data);

		expect(result?.authorAvatarUrl).toBe(
			"https://abs.twimg.com/sticky/default_profile_images/default_profile_normal.png",
		);
	});

	it("should parse quoted tweet", () => {
		const data = {
			id_str: "1234567890",
			text: "This is a tweet with a quote",
			user: {
				screen_name: "testuser",
				name: "Test User",
				profile_image_url_https: "https://example.com/avatar.jpg",
			},
			created_at: "2024-01-01T12:00:00.000Z",
			quoted_tweet: {
				id_str: "9876543210",
				text: "This is the quoted tweet",
				user: {
					screen_name: "quoteduser",
					name: "Quoted User",
					profile_image_url_https: "https://example.com/quoted-avatar.jpg",
				},
				created_at: "2024-01-01T10:00:00.000Z",
			},
		};

		const result = parseTweetData(data);

		expect(result?.quotedTweet).not.toBeNull();
		expect(result?.quotedTweet?.text).toBe("This is the quoted tweet");
		expect(result?.quotedTweet?.authorHandle).toBe("quoteduser");
	});
});
