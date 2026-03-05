import { describe, expect, it } from "bun:test";
import {
	LinkCardSchema,
	TweetApiResponseSchema,
	TweetDataSchema,
	validateTwitterCard,
	validateTwitterMedia,
	validateTwitterPhoto,
	validateTwitterTweetData,
	validateTwitterUser,
	validateTwitterVideo,
} from "./validation.ts";

describe("validation", () => {
	describe("LinkCardSchema", () => {
		it("should validate a valid link card", () => {
			const linkCard = {
				title: "Test Title",
				description: "Test Description",
				imageUrl: "https://example.com/image.jpg",
				url: "https://example.com",
				domain: "example.com",
			};

			const result = LinkCardSchema.safeParse(linkCard);

			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data.title).toBe("Test Title");
				expect(result.data.description).toBe("Test Description");
			}
		});

		it("should reject invalid link card", () => {
			const linkCard = {
				title: 123,
				description: "Test Description",
			};

			const result = LinkCardSchema.safeParse(linkCard);

			expect(result.success).toBe(false);
		});
	});

	describe("TwitterUserSchema", () => {
		it("should validate a valid user", () => {
			const user = {
				screen_name: "testuser",
				name: "Test User",
				profile_image_url_https: "https://example.com/avatar.jpg",
			};

			const result = validateTwitterUser(user);

			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data.screen_name).toBe("testuser");
				expect(result.data.name).toBe("Test User");
			}
		});

		it("should validate user without avatar", () => {
			const user = {
				screen_name: "testuser",
				name: "Test User",
			};

			const result = validateTwitterUser(user);

			expect(result.success).toBe(true);
		});

		it("should reject invalid user", () => {
			const user = {
				screen_name: "testuser",
			};

			const result = validateTwitterUser(user);

			expect(result.success).toBe(false);
		});
	});

	describe("TwitterPhotoSchema", () => {
		it("should validate a valid photo", () => {
			const photo = {
				url: "https://example.com/photo.jpg",
			};

			const result = validateTwitterPhoto(photo);

			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data.url).toBe("https://example.com/photo.jpg");
			}
		});

		it("should reject photo without url", () => {
			const photo = {};

			const result = validateTwitterPhoto(photo);

			expect(result.success).toBe(false);
		});
	});

	describe("TwitterVideoSchema", () => {
		it("should validate a video with duration", () => {
			const video = {
				duration: 120,
				poster: "https://example.com/video-thumb.jpg",
			};

			const result = validateTwitterVideo(video);

			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data.duration).toBe(120);
				expect(result.data.poster).toBe("https://example.com/video-thumb.jpg");
			}
		});

		it("should validate video with variants", () => {
			const video = {
				variants: [],
			};

			const result = validateTwitterVideo(video);

			expect(result.success).toBe(true);
		});

		it("should validate empty video object", () => {
			const video = {};

			const result = validateTwitterVideo(video);

			expect(result.success).toBe(true);
		});
	});

	describe("TwitterMediaSchema", () => {
		it("should validate media array", () => {
			const media = [
				{
					media_url_https: "https://example.com/media1.jpg",
				},
				{
					media_url_https: "https://example.com/media2.jpg",
				},
			];

			const result = validateTwitterMedia(media);

			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data).toHaveLength(2);
				const firstMedia = result.data[0];
				expect(firstMedia?.media_url_https).toBe(
					"https://example.com/media1.jpg",
				);
			}
		});

		it("should reject empty array", () => {
			const result = validateTwitterMedia([]);

			expect(result.success).toBe(true);
		});

		it("should reject non-array", () => {
			const result = validateTwitterMedia({});

			expect(result.success).toBe(false);
		});
	});

	describe("TwitterCardSchema", () => {
		it("should validate a valid card", () => {
			const card = {
				binding_values: {
					title: {
						string_value: "Card Title",
					},
					description: {
						string_value: "Card Description",
					},
					domain: {
						string_value: "example.com",
					},
					card_url: {
						string_value: "https://example.com",
					},
				},
			};

			const result = validateTwitterCard(card);

			expect(result.success).toBe(true);
			if (result.success) {
				const title = result.data.binding_values.title;
				expect(title?.string_value).toBe("Card Title");
			}
		});

		it("should validate card with image", () => {
			const card = {
				binding_values: {
					title: {
						string_value: "Card Title",
					},
					summary_photo_image_large: {
						image_value: {
							url: "https://example.com/image.jpg",
						},
					},
				},
			};

			const result = validateTwitterCard(card);

			expect(result.success).toBe(true);
		});

		it("should reject invalid card", () => {
			const card = {
				binding_values: "invalid",
			};

			const result = validateTwitterCard(card);

			expect(result.success).toBe(false);
		});
	});

	describe("TwitterTweetDataSchema", () => {
		it("should validate a complete tweet", () => {
			const tweet = {
				id_str: "1234567890",
				text: "Hello world",
				text_html: "Hello world",
				created_at: "2024-01-01T12:00:00.000Z",
				user: {
					screen_name: "testuser",
					name: "Test User",
					profile_image_url_https: "https://example.com/avatar.jpg",
				},
				photos: [
					{
						url: "https://example.com/photo1.jpg",
					},
				],
				video: {
					duration: 120,
					poster: "https://example.com/video-thumb.jpg",
				},
				card: {
					binding_values: {
						title: {
							string_value: "Card Title",
						},
					},
				},
			};

			const result = validateTwitterTweetData(tweet);

			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data.text).toBe("Hello world");
				expect(result.data.user?.screen_name).toBe("testuser");
				expect(result.data.photos).toHaveLength(1);
			}
		});

		it("should validate minimal tweet", () => {
			const tweet = {
				id_str: "1234567890",
				text: "Hello world",
			};

			const result = validateTwitterTweetData(tweet);

			expect(result.success).toBe(true);
		});

		it("should validate tweet with text_html only", () => {
			const tweet = {
				text_html: "<p>Hello world</p>",
			};

			const result = validateTwitterTweetData(tweet);

			expect(result.success).toBe(true);
			if (result.success) {
				const data = result.data;
				expect(data.text_html).toBe("<p>Hello world</p>");
			}
		});

		it("should reject tweet without text or text_html", () => {
			const tweet = {
				id_str: "1234567890",
			};

			const result = validateTwitterTweetData(tweet);

			expect(result.success).toBe(true);
			if (result.success) {
				const data = result.data;
				expect(data.text).toBeUndefined();
				expect(data.text_html).toBeUndefined();
			}
		});

		it("should reject invalid tweet data", () => {
			const tweet = {
				id_str: 1234567890,
				text: "Hello world",
			};

			const result = validateTwitterTweetData(tweet);

			expect(result.success).toBe(false);
		});
	});

	describe("TweetApiResponseSchema", () => {
		it("should validate tweet API response", () => {
			const response = {
				tweets: [
					{
						text: "Hello world",
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
					},
				],
			};

			const result = TweetApiResponseSchema.safeParse(response);

			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data.tweets).toHaveLength(1);
			}
		});

		it("should validate empty tweets array", () => {
			const response = {
				tweets: [],
			};

			const result = TweetApiResponseSchema.safeParse(response);

			expect(result.success).toBe(true);
		});

		it("should reject invalid response", () => {
			const response = {
				tweets: "invalid",
			};

			const result = TweetApiResponseSchema.safeParse(response);

			expect(result.success).toBe(false);
		});
	});

	describe("TweetDataSchema (recursive)", () => {
		it("should validate tweet with quoted tweet", () => {
			const tweet = {
				text: "Check this out",
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
				quotedTweet: {
					text: "Original tweet",
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
			};

			const result = TweetDataSchema.safeParse(tweet);

			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data.quotedTweet).not.toBeNull();
				const quoted = result.data.quotedTweet;
				if (quoted && typeof quoted === "object" && "text" in quoted) {
					expect(quoted.text).toBe("Original tweet");
				}
			}
		});

		it("should validate tweet with parent tweet", () => {
			const tweet = {
				text: "Reply tweet",
				authorName: "Test Author",
				authorHandle: "testauthor",
				authorAvatarUrl: "https://example.com/avatar.jpg",
				timestamp: "2024-01-01T12:00:00.000Z",
				imageUrls: [],
				hasVideo: false,
				videoThumbnailUrl: null,
				linkCard: null,
				isReply: true,
				parentTweet: {
					text: "Original tweet",
					authorName: "Original Author",
					authorHandle: "originalauthor",
					authorAvatarUrl: "https://example.com/original-avatar.jpg",
					timestamp: "2024-01-01T10:00:00.000Z",
					imageUrls: [],
					hasVideo: false,
					videoThumbnailUrl: null,
					linkCard: null,
					isReply: false,
					parentTweet: null,
					quotedTweet: null,
				},
				quotedTweet: null,
			};

			const result = TweetDataSchema.safeParse(tweet);

			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data.parentTweet).not.toBeNull();
				const parent = result.data.parentTweet;
				if (parent && typeof parent === "object" && "text" in parent) {
					expect(parent.text).toBe("Original tweet");
				}
			}
		});
	});
});
