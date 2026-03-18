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

	it("should parse note_tweet field for X Notes / long-form posts", () => {
		const data = {
			id_str: "2033969062834045089",
			text: "Short description...",
			user: {
				screen_name: "alvinsng",
				name: "Alvin Sng",
				profile_image_url_https: "https://example.com/avatar.jpg",
			},
			created_at: "2024-06-15T10:00:00.000Z",
			note_tweet: {
				text: "This is the full long-form note content that exceeds 280 characters and contains the complete article text.",
			},
		};

		const result = parseTweetData(data);

		expect(result).not.toBeNull();
		expect(result?.text).toBe(
			"This is the full long-form note content that exceeds 280 characters and contains the complete article text.",
		);
		expect(result?.articleTitle).toBeUndefined();
	});

	it("should parse article field for X Articles with title", () => {
		const data = {
			id_str: "2033969062834045089",
			text: "",
			user: {
				screen_name: "alvinsng",
				name: "Alvin Sng",
				profile_image_url_https: "https://example.com/avatar.jpg",
			},
			created_at: "2024-06-15T10:00:00.000Z",
			article: {
				title: "My X Article Title",
				text: "This is the full article body content.",
			},
		};

		const result = parseTweetData(data);

		expect(result).not.toBeNull();
		expect(result?.articleTitle).toBe("My X Article Title");
		expect(result?.text).toBe("This is the full article body content.");
	});

	it("should prefer article.text over regular text for article content", () => {
		const data = {
			id_str: "2033969062834045089",
			text: "Short tweet text linking to article",
			user: {
				screen_name: "alvinsng",
				name: "Alvin Sng",
				profile_image_url_https: "https://example.com/avatar.jpg",
			},
			created_at: "2024-06-15T10:00:00.000Z",
			article: {
				title: "My X Article Title",
				text: "Full article body content.",
			},
		};

		const result = parseTweetData(data);

		expect(result).not.toBeNull();
		expect(result?.articleTitle).toBe("My X Article Title");
		expect(result?.text).toBe("Full article body content.");
	});

	it("should prefer note_tweet.text over regular text for long-form content", () => {
		const data = {
			id_str: "2033969062834045089",
			text: "Short truncated text...",
			user: {
				screen_name: "alvinsng",
				name: "Alvin Sng",
				profile_image_url_https: "https://example.com/avatar.jpg",
			},
			created_at: "2024-06-15T10:00:00.000Z",
			note_tweet: {
				text: "This is the complete untruncated text from the note_tweet field.",
			},
		};

		const result = parseTweetData(data);

		expect(result).not.toBeNull();
		expect(result?.text).toBe(
			"This is the complete untruncated text from the note_tweet field.",
		);
	});

	it("should parse article without text field using article.text", () => {
		const data = {
			id_str: "2033969062834045089",
			user: {
				screen_name: "alvinsng",
				name: "Alvin Sng",
				profile_image_url_https: "https://example.com/avatar.jpg",
			},
			created_at: "2024-06-15T10:00:00.000Z",
			article: {
				title: "Article Title",
				text: "Article body text here.",
			},
		};

		const result = parseTweetData(data);

		expect(result).not.toBeNull();
		expect(result?.articleTitle).toBe("Article Title");
		expect(result?.text).toBe("Article body text here.");
		expect(result?.authorHandle).toBe("alvinsng");
	});

	it("should parse article with preview_text and cover_media", () => {
		const data = {
			id_str: "2033969062834045089",
			text: "https://t.co/vgBH7h8JZO",
			user: {
				screen_name: "alvinsng",
				name: "Alvin Sng",
				profile_image_url_https: "https://example.com/avatar.jpg",
			},
			created_at: "2026-03-17T18:09:48.000Z",
			article: {
				rest_id: "2028641821728161792",
				title: "Why we banned React's useEffect",
				preview_text:
					"At Factory, we have a simple, yet important frontend rule: no useEffect.",
				cover_media: {
					media_info: {
						original_img_url: "https://pbs.twimg.com/media/HDkC8hvbYAA24kk.jpg",
					},
				},
			},
		};

		const result = parseTweetData(data);

		expect(result).not.toBeNull();
		expect(result?.articleTitle).toBe("Why we banned React's useEffect");
		expect(result?.text).toBe(
			"At Factory, we have a simple, yet important frontend rule: no useEffect.",
		);
		expect(result?.articleCoverImageUrl).toBe(
			"https://pbs.twimg.com/media/HDkC8hvbYAA24kk.jpg",
		);
		expect(result?.articleUrl).toBe(
			"https://x.com/i/article/2028641821728161792",
		);
	});

	it("should return null when no text, text_html, note_tweet, or article content", () => {
		const data = {
			id_str: "1234567890",
			user: {
				screen_name: "testuser",
				name: "Test User",
			},
			created_at: "2024-01-01T12:00:00.000Z",
		};

		expect(parseTweetData(data)).toBeNull();
	});
});
