import type { LinkCard, TweetData } from "../types/index.ts";
import {
	extractTweetId,
	isShortUrl,
	isValidTwitterUrl,
} from "./shared/url-validation.ts";

const TWITTER_API_TOKEN = process.env.TWITTER_API_TOKEN ?? "0";

export { extractTweetId, isShortUrl, isValidTwitterUrl };

export async function resolveShortUrl(url: string): Promise<string> {
	const fullUrl = url.startsWith("http") ? url : `https://${url}`;
	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), 10000);
	try {
		const response = await fetch(fullUrl, {
			redirect: "follow",
			signal: controller.signal,
		});
		clearTimeout(timeout);
		if (!response.ok) {
			throw new Error(`Failed to resolve short URL: ${response.status}`);
		}
		return response.url;
	} catch (error) {
		clearTimeout(timeout);
		if (error instanceof Error && error.name === "AbortError") {
			throw new Error("Request timed out");
		}
		const message = error instanceof Error ? error.message : "Unknown error";
		throw new Error(`Network error resolving short URL: ${message}`);
	}
}

export async function fetchTweetData(
	tweetId: string,
): Promise<TweetData | null> {
	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), 15000);
	try {
		const response = await fetch(
			`https://cdn.syndication.twimg.com/tweet-result?id=${tweetId}&token=${TWITTER_API_TOKEN}`,
			{ signal: controller.signal },
		);
		clearTimeout(timeout);

		if (response.status === 404) {
			return null;
		}

		if (response.status === 429) {
			throw new Error("RATE_LIMITED");
		}

		if (!response.ok) {
			throw new Error(`HTTP_ERROR_${response.status}`);
		}

		const data = (await response.json()) as Record<string, unknown>;
		return parseTweetData(data);
	} catch (error) {
		clearTimeout(timeout);
		if (error instanceof Error && error.name === "AbortError") {
			throw new Error("Request timed out");
		}
		if (error instanceof Error) {
			if (error.message === "RATE_LIMITED") {
				throw error;
			}
			if (error.message.startsWith("HTTP_ERROR_")) {
				throw error;
			}
			throw new Error(`Network error fetching tweet: ${error.message}`);
		}
		throw new Error("Unknown error fetching tweet");
	}
}

interface RawTweetInfo {
	tweetId: string;
	authorHandle: string;
	inReplyToStatusId: string | null;
	data: Record<string, unknown>;
}

function extractRawTweetInfo(
	data: Record<string, unknown>,
): RawTweetInfo | null {
	if (!data.text && !data.text_html) {
		return null;
	}
	const user = data.user as Record<string, string> | undefined;
	if (!user) {
		return null;
	}
	const authorHandle = user.screen_name || "unknown";
	const tweetId = (data.id_str as string) || "";
	const inReplyToStatusId = (data.in_reply_to_status_id_str as string) || null;
	return { tweetId, authorHandle, inReplyToStatusId, data };
}

function getStringValue(
	obj: Record<string, unknown> | undefined,
	key: string,
): string {
	if (!obj) return "";
	const value = obj[key];
	if (typeof value !== "string") return "";
	return value;
}

function getNestedStringValue(
	obj: Record<string, unknown> | undefined,
	keys: string[],
): string {
	let current: unknown = obj;
	for (const key of keys) {
		if (current === null || current === undefined) return "";
		if (typeof current !== "object") return "";
		current = (current as Record<string, unknown>)[key];
	}
	return typeof current === "string" ? current : "";
}

function getImageUrlsFromPhotos(photos: unknown): string[] {
	if (!Array.isArray(photos)) return [];
	const urls: string[] = [];
	for (const photo of photos) {
		if (photo && typeof photo === "object") {
			const url = getNestedStringValue(photo as Record<string, unknown>, [
				"url",
			]);
			if (url) urls.push(url);
		}
	}
	return urls;
}

function getImageUrlsFromEntities(entities: unknown): string[] {
	if (!entities || typeof entities !== "object") return [];
	const media = (entities as Record<string, unknown>).media;
	if (!Array.isArray(media)) return [];
	const urls: string[] = [];
	for (const m of media) {
		if (m && typeof m === "object") {
			const url = getNestedStringValue(m as Record<string, unknown>, [
				"media_url_https",
			]);
			if (url) urls.push(url);
		}
	}
	return urls;
}

function parseVideoInfo(video: unknown): {
	hasVideo: boolean;
	thumbnailUrl: string | null;
} {
	if (!video || typeof video !== "object") {
		return { hasVideo: false, thumbnailUrl: null };
	}
	const videoObj = video as Record<string, unknown>;
	const hasVideo = "duration" in videoObj || "variants" in videoObj;
	const thumbnailUrl = getNestedStringValue(videoObj, ["poster"]);
	return {
		hasVideo,
		thumbnailUrl: thumbnailUrl || null,
	};
}

function getBindingStringValue(
	obj: Record<string, Record<string, unknown>> | undefined,
	key: string,
): string {
	if (!obj) return "";
	const binding = obj[key];
	if (!binding || typeof binding !== "object") return "";
	const value = binding.string_value;
	return typeof value === "string" ? value : "";
}

function parseLinkCard(card: unknown): LinkCard | null {
	if (!card || typeof card !== "object") return null;
	const cardObj = card as Record<string, unknown>;
	const bindings = cardObj.binding_values;
	if (!bindings || typeof bindings !== "object") return null;
	const bindingsObj = bindings as Record<string, Record<string, unknown>>;

	const title = getBindingStringValue(bindingsObj, "title");
	const description = getBindingStringValue(bindingsObj, "description");
	const domain = getBindingStringValue(bindingsObj, "domain");
	const cardUrl = getBindingStringValue(bindingsObj, "card_url");

	if (!title) return null;

	const imageLarge = bindingsObj.summary_photo_image_large;
	let imageUrl = "";
	if (imageLarge && typeof imageLarge === "object") {
		const imageValue = imageLarge.image_value;
		if (imageValue && typeof imageValue === "object") {
			imageUrl = getNestedStringValue(imageValue as Record<string, unknown>, [
				"url",
			]);
		}
	}

	return { title, description, imageUrl, url: cardUrl, domain };
}

export function parseTweetData(
	data: Record<string, unknown>,
): TweetData | null {
	if (!data || typeof data !== "object") {
		return null;
	}
	if (!("text" in data) && !("text_html" in data)) {
		return null;
	}

	const imageUrls: string[] = getImageUrlsFromPhotos(data.photos);

	if (imageUrls.length === 0) {
		const entities = data.entities as Record<string, unknown> | undefined;
		if (entities && typeof entities === "object") {
			const entityUrls = getImageUrlsFromEntities(entities);
			if (entityUrls.length > 0) {
				imageUrls.push(...entityUrls);
			}
		}
	}

	const videoInfo = parseVideoInfo(data.video);

	let text = getStringValue(data, "text");
	if (!text && typeof data.text_html === "string") {
		text = data.text_html.replace(/<[^>]*>/g, "").trim();
	}
	text = text
		.replace(/&amp;/g, "&")
		.replace(/&lt;/g, "<")
		.replace(/&gt;/g, ">")
		.replace(/&quot;/g, '"')
		.replace(/&#39;/g, "'");

	const user = data.user as Record<string, unknown> | undefined;
	const authorName =
		user && typeof user === "object" && typeof user.name === "string"
			? user.name
			: "Unknown";
	const authorHandle =
		user && typeof user === "object" && typeof user.screen_name === "string"
			? user.screen_name
			: "unknown";
	const authorAvatarUrl =
		user &&
		typeof user === "object" &&
		typeof user.profile_image_url_https === "string"
			? user.profile_image_url_https
			: "https://abs.twimg.com/sticky/default_profile_images/default_profile_normal.png";
	const timestamp =
		getStringValue(data, "created_at") || new Date().toISOString();

	const card = data.card as Record<string, unknown> | undefined;
	const linkCard =
		card && typeof card === "object" ? parseLinkCard(card) : null;

	const isReply =
		typeof data.in_reply_to_status_id_str === "string" &&
		data.in_reply_to_status_id_str.length > 0;
	let parentTweet: TweetData | null = null;
	const parent = data.parent as Record<string, unknown> | undefined;
	if (parent && typeof parent === "object") {
		parentTweet = parseTweetData(parent);
	}

	let quotedTweet: TweetData | null = null;
	const quoted = data.quoted_tweet as Record<string, unknown> | undefined;
	if (quoted && typeof quoted === "object") {
		quotedTweet = parseTweetData(quoted);
	}

	const id = getStringValue(data, "id_str");

	return {
		id,
		text,
		authorName,
		authorHandle,
		authorAvatarUrl,
		timestamp,
		imageUrls,
		hasVideo: videoInfo.hasVideo,
		videoThumbnailUrl: videoInfo.thumbnailUrl,
		linkCard,
		isReply,
		parentTweet,
		quotedTweet,
	};
}


function filterSelfReplyThread(
	rawTweets: RawTweetInfo[],
	targetTweetId: string,
): RawTweetInfo[] {
	const tweetMap = new Map<string, RawTweetInfo>();
	for (const t of rawTweets) {
		if (t.tweetId) {
			tweetMap.set(t.tweetId, t);
		}
	}

	const target = tweetMap.get(targetTweetId);
	if (!target) {
		return rawTweets;
	}

	const authorHandle = target.authorHandle;

	let rootId = targetTweetId;
	const visited = new Set<string>();
	while (true) {
		const current = tweetMap.get(rootId);
		if (!current?.inReplyToStatusId) break;
		const parentId = current.inReplyToStatusId;
		if (visited.has(parentId)) break;
		visited.add(parentId);
		const parent = tweetMap.get(parentId);
		if (!parent || parent.authorHandle !== authorHandle) break;
		rootId = parentId;
	}

	const threadTweets: RawTweetInfo[] = [];
	const replyIndex = new Map<string, RawTweetInfo[]>();
	for (const t of rawTweets) {
		if (t.inReplyToStatusId && t.authorHandle === authorHandle) {
			const replies = replyIndex.get(t.inReplyToStatusId) ?? [];
			replies.push(t);
			replyIndex.set(t.inReplyToStatusId, replies);
		}
	}

	const root = tweetMap.get(rootId);
	if (root) {
		threadTweets.push(root);
		let currentId = rootId;
		while (true) {
			const replies = replyIndex.get(currentId);
			if (!replies || replies.length === 0) break;
			const next = replies[0];
			if (!next) break;
			threadTweets.push(next);
			currentId = next.tweetId;
		}
	}

	return threadTweets.length > 1 ? threadTweets : rawTweets;
}

async function fetchParentChain(
	tweet: TweetData,
	maxDepth = 5,
): Promise<TweetData[]> {
	const chain: TweetData[] = [{ ...tweet, parentTweet: null, isReply: false }];
	let current: TweetData | null = tweet;
	const authorHandle = tweet.authorHandle;
	let depth = 0;

	while (
		current?.parentTweet &&
		current.parentTweet.authorHandle === authorHandle &&
		depth < maxDepth
	) {
		const parentId = current.parentTweet.id;
		if (!parentId) break;

		const parentTweet = await fetchTweetData(parentId);
		if (!parentTweet) break;

		chain.push({ ...parentTweet, parentTweet: null, isReply: false });
		current = parentTweet;
		depth++;
	}

	chain.reverse();
	return chain;
}

async function fetchTweetAsThread(tweetId: string): Promise<TweetData[]> {
	const tweet = await fetchTweetData(tweetId);
	if (!tweet) return [];

	if (
		tweet.parentTweet &&
		tweet.parentTweet.authorHandle === tweet.authorHandle
	) {
		const chain = await fetchParentChain(tweet);
		if (chain.length > 1) return chain;
	}

	return [tweet];
}

export async function fetchTweetThread(tweetId: string): Promise<TweetData[]> {
	const conversationUrl = `https://syndication.twitter.com/timeline/conversation/${tweetId}`;
	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), 15000);

	let response: globalThis.Response;
	try {
		response = await fetch(conversationUrl, { signal: controller.signal });
		clearTimeout(timeout);
	} catch (error) {
		clearTimeout(timeout);
		if (error instanceof Error && error.name === "AbortError") {
			console.warn(
				"Thread fetch timed out, falling back to single tweet fetch",
			);
			return fetchTweetAsThread(tweetId);
		}
		const message = error instanceof Error ? error.message : "Unknown error";
		console.warn(
			`Thread fetch network error: ${message}, falling back to single tweet fetch`,
		);
		return fetchTweetAsThread(tweetId);
	}

	if (response.status === 404 || response.status === 403) {
		console.info(
			`Thread not found (${response.status}), falling back to single tweet fetch`,
		);
		return fetchTweetAsThread(tweetId);
	}

	if (response.status === 429) {
		throw new Error("RATE_LIMITED");
	}

	if (!response.ok) {
		console.warn(
			`Thread fetch failed (${response.status}), falling back to single tweet fetch`,
		);
		return fetchTweetAsThread(tweetId);
	}

	let data: Record<string, unknown>;
	try {
		const text = await response.text();
		if (!text) {
			console.warn("Thread response empty, falling back to single tweet fetch");
			return fetchTweetAsThread(tweetId);
		}
		data = JSON.parse(text) as Record<string, unknown>;
	} catch {
		console.warn(
			"Thread response JSON parse failed, falling back to single tweet fetch",
		);
		return fetchTweetAsThread(tweetId);
	}

	const timeline = data.timeline as Record<string, unknown> | undefined;

	if (!timeline) {
		console.warn("Thread timeline missing, falling back to single tweet fetch");
		return fetchTweetAsThread(tweetId);
	}

	const rawTweets: RawTweetInfo[] = [];
	const items = timeline.items as Array<Record<string, unknown>> | undefined;

	if (items) {
		for (const item of items) {
			const tweet = item.tweet as Record<string, unknown> | undefined;
			if (tweet) {
				const info = extractRawTweetInfo(tweet);
				if (info) {
					rawTweets.push(info);
				}
			}
		}
	}

	if (rawTweets.length === 0) {
		console.warn("Thread has no tweets, falling back to single tweet fetch");
		return fetchTweetAsThread(tweetId);
	}

	const filtered = filterSelfReplyThread(rawTweets, tweetId);

	const tweets: TweetData[] = [];
	for (const raw of filtered) {
		const parsed = parseTweetData(raw.data);
		if (parsed) {
			tweets.push(parsed);
		}
	}

	if (tweets.length === 0) {
		console.warn(
			"Failed to parse any tweets from thread, falling back to single tweet fetch",
		);
		return fetchTweetAsThread(tweetId);
	}

	tweets.sort(
		(a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
	);

	// Extend the chain backwards if the earliest tweet still has a parent from
	// the same author, meaning the conversation API returned only a partial
	// thread (e.g. navigating to a later tweet in a long thread).
	const firstTweet = tweets[0];
	if (
		firstTweet?.parentTweet &&
		firstTweet.parentTweet.authorHandle === firstTweet.authorHandle
	) {
		try {
			const chain = await fetchParentChain(firstTweet);
			if (chain.length > 1) {
				const existingIds = new Set(tweets.map((t) => t.id));
				const olderTweets = chain.filter((t) => !existingIds.has(t.id));
				if (olderTweets.length > 0) {
					return [...olderTweets, ...tweets];
				}
			}
		} catch (error) {
			if (error instanceof Error && error.message === "RATE_LIMITED") {
				throw error;
			}
			const message = error instanceof Error ? error.message : "Unknown error";
			console.warn(
				`Failed to extend thread chain backwards (${message}), returning partial chain`,
			);
		}
	}

	return tweets;
}
