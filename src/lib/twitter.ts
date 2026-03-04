import type { LinkCard, TweetData } from "../types/index.ts";

export function isValidTwitterUrl(url: string): boolean {
	return /^(https?:\/\/)?(www\.)?(twitter\.com|x\.com)\/.+\/status\/\d+/.test(
		url,
	);
}

export function isShortUrl(url: string): boolean {
	return /^(https?:\/\/)?t\.co\/\w+/.test(url);
}

export async function resolveShortUrl(url: string): Promise<string> {
	const fullUrl = url.startsWith("http") ? url : `https://${url}`;
	const response = await fetch(fullUrl, { redirect: "follow" });
	if (!response.ok) {
		throw new Error(`Failed to resolve short URL: ${response.status}`);
	}
	return response.url;
}

export function extractTweetId(url: string): string | null {
	const match = url.match(/\/status\/(\d+)/);
	return match?.[1] ?? null;
}

export async function fetchTweetData(
	tweetId: string,
): Promise<TweetData | null> {
	const response = await fetch(
		`https://cdn.syndication.twimg.com/tweet-result?id=${tweetId}&token=0`,
	);

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
	const authorHandle = user?.screen_name || "unknown";
	const tweetId = (data.id_str as string) || "";
	const inReplyToStatusId = (data.in_reply_to_status_id_str as string) || null;
	return { tweetId, authorHandle, inReplyToStatusId, data };
}

export function parseTweetData(
	data: Record<string, unknown>,
): TweetData | null {
	if (!data.text && !data.text_html) {
		return null;
	}

	const imageUrls: string[] = [];

	if (Array.isArray(data.photos)) {
		for (const photo of data.photos as Array<Record<string, unknown>>) {
			const url = photo.url as string | undefined;
			if (url) imageUrls.push(url);
		}
	}

	if (imageUrls.length === 0) {
		const entities = data.entities as Record<string, unknown> | undefined;
		if (entities && Array.isArray(entities.media)) {
			for (const m of entities.media as Array<Record<string, string>>) {
				if (m.media_url_https) {
					imageUrls.push(m.media_url_https);
				}
			}
		}
	}

	const video = data.video as Record<string, unknown> | undefined;
	const hasVideo = !!video;
	const videoThumbnailUrl = (video?.poster as string) || null;

	let text = (data.text as string) || "";
	if (!text && typeof data.text_html === "string") {
		text = data.text_html.replace(/<[^>]*>/g, "").trim();
	}
	text = text
		.replace(/&amp;/g, "&")
		.replace(/&lt;/g, "<")
		.replace(/&gt;/g, ">")
		.replace(/&quot;/g, '"')
		.replace(/&#39;/g, "'");

	const user = data.user as Record<string, string> | undefined;
	const authorName = user?.name || "Unknown";
	const authorHandle = user?.screen_name || "unknown";
	const authorAvatarUrl =
		user?.profile_image_url_https ||
		"https://abs.twimg.com/sticky/default_profile_images/default_profile_normal.png";
	const timestamp = (data.created_at as string) || new Date().toISOString();

	let linkCard: LinkCard | null = null;
	const card = data.card as Record<string, unknown> | undefined;
	if (card) {
		const bindings = card.binding_values as
			| Record<string, Record<string, unknown>>
			| undefined;
		if (bindings) {
			const title = (bindings.title?.string_value as string) || "";
			const description = (bindings.description?.string_value as string) || "";
			const domain = (bindings.domain?.string_value as string) || "";
			const cardUrl = (bindings.card_url?.string_value as string) || "";
			const imgVal = bindings.summary_photo_image_large?.image_value as
				| Record<string, unknown>
				| undefined;
			const imageUrl = (imgVal?.url as string) || "";
			if (title) {
				linkCard = { title, description, imageUrl, url: cardUrl, domain };
			}
		}
	}

	const isReply = !!data.in_reply_to_status_id_str;
	let parentTweet: TweetData | null = null;
	const parent = data.parent as Record<string, unknown> | undefined;
	if (parent) {
		parentTweet = parseTweetData(parent);
	}

	let quotedTweet: TweetData | null = null;
	const quoted = data.quoted_tweet as Record<string, unknown> | undefined;
	if (quoted) {
		quotedTweet = parseTweetData(quoted);
	}

	return {
		text,
		authorName,
		authorHandle,
		authorAvatarUrl,
		timestamp,
		imageUrls,
		hasVideo,
		videoThumbnailUrl,
		linkCard,
		isReply,
		parentTweet,
		quotedTweet,
	};
}

function unflattenSelfReplyChain(tweet: TweetData): TweetData[] {
	const chain: TweetData[] = [];
	let current: TweetData | null = tweet;
	const authorHandle = tweet.authorHandle;

	while (current) {
		chain.push({ ...current, parentTweet: null, isReply: false });
		if (
			current.parentTweet &&
			current.parentTweet.authorHandle === authorHandle
		) {
			current = current.parentTweet;
		} else {
			break;
		}
	}

	chain.reverse();
	return chain;
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

	// Walk up the reply chain to find the thread root by the same author
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

	// Walk down from root, collecting consecutive self-replies by the same author
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

async function fetchTweetAsThread(tweetId: string): Promise<TweetData[]> {
	const tweet = await fetchTweetData(tweetId);
	if (!tweet) return [];
	if (
		tweet.parentTweet &&
		tweet.parentTweet.authorHandle === tweet.authorHandle
	) {
		const chain = unflattenSelfReplyChain(tweet);
		if (chain.length > 1) return chain;
	}
	return [tweet];
}

export async function fetchTweetThread(tweetId: string): Promise<TweetData[]> {
	const conversationUrl = `https://syndication.twitter.com/timeline/conversation/${tweetId}`;
	const response = await fetch(conversationUrl);

	if (response.status === 404 || response.status === 403) {
		return fetchTweetAsThread(tweetId);
	}

	if (response.status === 429) {
		throw new Error("RATE_LIMITED");
	}

	if (!response.ok) {
		return fetchTweetAsThread(tweetId);
	}

	let data: Record<string, unknown>;
	try {
		const text = await response.text();
		if (!text) {
			return fetchTweetAsThread(tweetId);
		}
		data = JSON.parse(text) as Record<string, unknown>;
	} catch {
		return fetchTweetAsThread(tweetId);
	}

	const timeline = data.timeline as Record<string, unknown> | undefined;

	if (!timeline) {
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
		return fetchTweetAsThread(tweetId);
	}

	// Filter to only the self-reply thread by the same author
	const filtered = filterSelfReplyThread(rawTweets, tweetId);

	const tweets: TweetData[] = [];
	for (const raw of filtered) {
		const parsed = parseTweetData(raw.data);
		if (parsed) {
			tweets.push(parsed);
		}
	}

	if (tweets.length === 0) {
		return fetchTweetAsThread(tweetId);
	}

	// If we still have a single tweet with self-reply parents, unflatten the chain
	if (
		tweets.length === 1 &&
		tweets[0]?.parentTweet &&
		tweets[0].parentTweet.authorHandle === tweets[0].authorHandle
	) {
		const chain = unflattenSelfReplyChain(tweets[0]);
		if (chain.length > 1) {
			return chain;
		}
	}

	tweets.sort(
		(a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
	);

	return tweets;
}
