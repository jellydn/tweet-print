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

export function parseTweetData(
	data: Record<string, unknown>,
): TweetData | null {
	if (!data.text && !data.text_html) {
		return null;
	}

	const imageUrls: string[] = [];

	const photos = data.photos as Array<Record<string, unknown>> | undefined;
	if (photos) {
		for (const photo of photos) {
			const url = photo.url as string | undefined;
			if (url) imageUrls.push(url);
		}
	}

	if (imageUrls.length === 0) {
		const entities = data.entities as Record<string, unknown> | undefined;
		if (entities?.media) {
			const media = entities.media as Array<Record<string, string>>;
			for (const m of media) {
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
	if (!text && data.text_html) {
		text = (data.text_html as string).replace(/<[^>]*>/g, "").trim();
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
	};
}

export async function fetchTweetThread(tweetId: string): Promise<TweetData[]> {
	const conversationUrl = `https://syndication.twitter.com/timeline/conversation/${tweetId}`;
	const response = await fetch(conversationUrl);

	if (response.status === 404 || response.status === 403) {
		const singleTweet = await fetchTweetData(tweetId);
		return singleTweet ? [singleTweet] : [];
	}

	if (response.status === 429) {
		throw new Error("RATE_LIMITED");
	}

	if (!response.ok) {
		const singleTweet = await fetchTweetData(tweetId);
		return singleTweet ? [singleTweet] : [];
	}

	let data: Record<string, unknown>;
	try {
		const text = await response.text();
		if (!text) {
			const singleTweet = await fetchTweetData(tweetId);
			return singleTweet ? [singleTweet] : [];
		}
		data = JSON.parse(text) as Record<string, unknown>;
	} catch {
		const singleTweet = await fetchTweetData(tweetId);
		return singleTweet ? [singleTweet] : [];
	}

	const timeline = data.timeline as Record<string, unknown> | undefined;

	if (!timeline) {
		const singleTweet = await fetchTweetData(tweetId);
		return singleTweet ? [singleTweet] : [];
	}

	const tweets: TweetData[] = [];
	const items = timeline.items as Array<Record<string, unknown>> | undefined;

	if (items) {
		for (const item of items) {
			const tweet = item.tweet as Record<string, unknown> | undefined;
			if (tweet) {
				const parsed = parseTweetData(tweet);
				if (parsed) {
					tweets.push(parsed);
				}
			}
		}
	}

	if (tweets.length === 0) {
		const singleTweet = await fetchTweetData(tweetId);
		return singleTweet ? [singleTweet] : [];
	}

	tweets.sort(
		(a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
	);

	return tweets;
}
