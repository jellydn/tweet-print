import { describe, expect, it } from "bun:test";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { testClient } from "hono/testing";
import type { StatusCode } from "hono/utils/http-status";
import pdfRoutes from "./pdf.ts";
import tweetRoutes from "./tweet.ts";

const app = new Hono();
app.use("/*", cors());
app.route("/api/tweet", tweetRoutes);
app.route("/api/pdf", pdfRoutes);

const client = testClient(app) as {
	api: {
		tweet: {
			index: {
				$post: (args: { json: unknown }) => { status: StatusCode };
			};
		};
		pdf: {
			index: {
				$post: (args: { json: unknown }) => { status: StatusCode };
			};
		};
	};
};

describe("Tweet API Route", () => {
	it("should return 400 for missing JSON body", async () => {
		const response = await client.api.tweet.index.$post({
			json: undefined,
		});

		expect(response.status).toBe(400);
	});

	it("should return 400 for empty URL", async () => {
		const response = await client.api.tweet.index.$post({
			json: { url: "" },
		});

		expect(response.status).toBe(400);
	});

	it("should return 400 for invalid URL format", async () => {
		const response = await client.api.tweet.index.$post({
			json: { url: "not-a-url" },
		});

		expect(response.status).toBe(400);
	});

	it("should return 400 for non-Twitter URL", async () => {
		const response = await client.api.tweet.index.$post({
			json: { url: "https://facebook.com/user/status/123" },
		});

		expect(response.status).toBe(400);
	});

	it("should return 400 for Twitter URL without status", async () => {
		const response = await client.api.tweet.index.$post({
			json: { url: "https://twitter.com/user" },
		});

		expect(response.status).toBe(400);
	});

	it("should return 400 for Twitter URL without valid status ID", async () => {
		const response = await client.api.tweet.index.$post({
			json: { url: "https://twitter.com/user/status/abc" },
		});

		expect(response.status).toBe(400);
	});
});

describe("PDF API Route", () => {
	it("should return 400 for missing JSON body", async () => {
		const response = await client.api.pdf.index.$post({
			json: undefined,
		});

		expect(response.status).toBe(400);
	});

	it("should return 400 for invalid URL", async () => {
		const response = await client.api.pdf.index.$post({
			json: { url: "not-a-url" },
		});

		expect(response.status).toBe(400);
	});

	it("should return 400 for non-Twitter URL", async () => {
		const response = await client.api.pdf.index.$post({
			json: { url: "https://facebook.com/user/status/123" },
		});

		expect(response.status).toBe(400);
	});
});
