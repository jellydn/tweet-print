import { describe, expect, it } from "bun:test";
import {
	extractTweetId,
	isShortUrl,
	isValidTwitterUrl,
} from "./url-validation.ts";

describe("url-validation", () => {
	describe("isValidTwitterUrl", () => {
		it("should validate correct twitter.com URLs", () => {
			expect(
				isValidTwitterUrl("https://twitter.com/user/status/1234567890"),
			).toBe(true);
			expect(
				isValidTwitterUrl("http://www.twitter.com/user/status/1234567890"),
			).toBe(true);
			expect(isValidTwitterUrl("twitter.com/user/status/1234567890")).toBe(
				true,
			);
		});

		it("should validate correct x.com URLs", () => {
			expect(isValidTwitterUrl("https://x.com/user/status/1234567890")).toBe(
				true,
			);
			expect(isValidTwitterUrl("http://www.x.com/user/status/1234567890")).toBe(
				true,
			);
			expect(isValidTwitterUrl("x.com/user/status/1234567890")).toBe(true);
		});

		it("should validate short URLs", () => {
			expect(isValidTwitterUrl("https://t.co/abc123")).toBe(true);
			expect(isValidTwitterUrl("http://t.co/abc123")).toBe(true);
			expect(isValidTwitterUrl("t.co/abc123")).toBe(true);
		});

		it("should reject invalid URLs", () => {
			expect(isValidTwitterUrl("https://facebook.com/user/status/123")).toBe(
				false,
			);
			expect(isValidTwitterUrl("https://youtube.com/watch?v=123")).toBe(false);
			expect(isValidTwitterUrl("not a url")).toBe(false);
			expect(isValidTwitterUrl("")).toBe(false);
		});
	});

	describe("isShortUrl", () => {
		it("should identify t.co URLs as short URLs", () => {
			expect(isShortUrl("https://t.co/abc123")).toBe(true);
			expect(isShortUrl("http://t.co/xyz")).toBe(true);
			expect(isShortUrl("t.co/abc123")).toBe(true);
		});

		it("should reject non-t.co URLs", () => {
			expect(isShortUrl("https://twitter.com/user/status/123")).toBe(false);
			expect(isShortUrl("https://bit.ly/abc")).toBe(false);
		});
	});

	describe("extractTweetId", () => {
		it("should extract tweet ID from twitter.com URLs", () => {
			expect(extractTweetId("https://twitter.com/user/status/1234567890")).toBe(
				"1234567890",
			);
			expect(
				extractTweetId("http://www.twitter.com/user/status/9876543210"),
			).toBe("9876543210");
		});

		it("should extract tweet ID from x.com URLs", () => {
			expect(extractTweetId("https://x.com/user/status/1234567890")).toBe(
				"1234567890",
			);
		});

		it("should return null for URLs without status", () => {
			expect(extractTweetId("https://twitter.com/user")).toBe(null);
			expect(extractTweetId("https://twitter.com/user/photo/123")).toBe(null);
		});
	});
});
