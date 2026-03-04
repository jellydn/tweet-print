import type { TweetData } from "../types/index.ts";

async function fetchImageAsBase64(url: string): Promise<string> {
	try {
		const response = await fetch(url);
		if (!response.ok) return url;
		const buffer = await response.arrayBuffer();
		const base64 = Buffer.from(buffer).toString("base64");
		const contentType = response.headers.get("content-type") || "image/jpeg";
		return `data:${contentType};base64,${base64}`;
	} catch {
		return url;
	}
}

async function embedTweetImages(tweet: TweetData): Promise<TweetData> {
	const avatarDataUri = await fetchImageAsBase64(tweet.authorAvatarUrl);
	const imageDataUris = await Promise.all(
		tweet.imageUrls.map((url) => fetchImageAsBase64(url)),
	);
	const videoThumbDataUri = tweet.videoThumbnailUrl
		? await fetchImageAsBase64(tweet.videoThumbnailUrl)
		: null;
	const linkCard = tweet.linkCard
		? {
				...tweet.linkCard,
				imageUrl: tweet.linkCard.imageUrl
					? await fetchImageAsBase64(tweet.linkCard.imageUrl)
					: "",
			}
		: null;
	const parentTweet = tweet.parentTweet
		? await embedTweetImages(tweet.parentTweet)
		: null;
	const quotedTweet = tweet.quotedTweet
		? await embedTweetImages(tweet.quotedTweet)
		: null;
	return {
		...tweet,
		authorAvatarUrl: avatarDataUri,
		imageUrls: imageDataUris,
		videoThumbnailUrl: videoThumbDataUri,
		linkCard,
		parentTweet,
		quotedTweet,
	};
}

export async function embedImages(tweets: TweetData[]): Promise<TweetData[]> {
	const result: TweetData[] = [];
	for (const tweet of tweets) {
		result.push(await embedTweetImages(tweet));
	}
	return result;
}

export function escapeHtml(text: string): string {
	return text
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#039;");
}

export function formatDate(isoString: string): string {
	const date = new Date(isoString);
	return date.toLocaleDateString("en-US", {
		year: "numeric",
		month: "long",
		day: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	});
}

export function generatePdfHtml(tweets: TweetData[], url: string): string {
	const firstTweet = tweets[0];
	if (!firstTweet) {
		throw new Error("No tweets provided");
	}
	const authorHandle = firstTweet.authorHandle;
	const authorName = firstTweet.authorName;
	const isThread = tweets.length > 1;

	const isSingle = tweets.length === 1;

	const tweetsHtml = tweets
		.map((tweet) => {
			const imagesHtml =
				tweet.imageUrls && tweet.imageUrls.length > 0
					? `<div class="tweet-images">
						${tweet.imageUrls
							.map(
								(img) =>
									`<img src="${escapeHtml(img)}" alt="Tweet image" class="tweet-image" loading="lazy">`,
							)
							.join("")}
					</div>`
					: "";

			const videoHtml =
				tweet.hasVideo && tweet.videoThumbnailUrl
					? `<div class="tweet-video">
						<img src="${escapeHtml(tweet.videoThumbnailUrl)}" alt="Video thumbnail" class="tweet-image" loading="lazy">
						<div class="video-label">▶ Video</div>
					</div>`
					: tweet.hasVideo
						? `<div class="video-label">▶ Video (thumbnail unavailable)</div>`
						: "";

			const linkCardHtml = tweet.linkCard
				? `<div class="link-card">
					${tweet.linkCard.imageUrl ? `<img src="${escapeHtml(tweet.linkCard.imageUrl)}" alt="" class="link-card-image">` : ""}
					<div class="link-card-content">
						<div class="link-card-title">${escapeHtml(tweet.linkCard.title)}</div>
						<div class="link-card-description">${escapeHtml(tweet.linkCard.description)}</div>
						<div class="link-card-domain">${escapeHtml(tweet.linkCard.domain)}</div>
					</div>
				</div>`
				: "";

			const quotedTweetHtml = tweet.quotedTweet
				? `<div class="quoted-tweet">
					<div class="tweet-header">
						<img src="${escapeHtml(tweet.quotedTweet.authorAvatarUrl)}" alt="${escapeHtml(tweet.quotedTweet.authorName)}" class="tweet-avatar">
						<div class="tweet-author-info">
							<span class="tweet-author-name">${escapeHtml(tweet.quotedTweet.authorName)}</span>
							<span class="tweet-author-handle">@${escapeHtml(tweet.quotedTweet.authorHandle)}</span>
						</div>
					</div>
					<div class="tweet-body">${escapeHtml(tweet.quotedTweet.text).replace(/\n/g, "<br>")}</div>
					${tweet.quotedTweet.imageUrls.length > 0 ? `<div class="tweet-images">${tweet.quotedTweet.imageUrls.map((img) => `<img src="${escapeHtml(img)}" alt="Tweet image" class="tweet-image" loading="lazy">`).join("")}</div>` : ""}
					${tweet.quotedTweet.hasVideo && tweet.quotedTweet.videoThumbnailUrl ? `<div class="tweet-video"><img src="${escapeHtml(tweet.quotedTweet.videoThumbnailUrl)}" alt="Video thumbnail" class="tweet-image" loading="lazy"><div class="video-label">▶ Video</div></div>` : ""}
					<div class="tweet-timestamp">${formatDate(tweet.quotedTweet.timestamp)}</div>
				</div>`
				: "";

			const headerHtml = isSingle
				? ""
				: `<div class="tweet-header">
					<img src="${escapeHtml(tweet.authorAvatarUrl)}" alt="${escapeHtml(tweet.authorName)}" class="tweet-avatar">
					<div class="tweet-author-info">
						<span class="tweet-author-name">${escapeHtml(tweet.authorName)}</span>
						<span class="tweet-author-handle">@${escapeHtml(tweet.authorHandle)}</span>
					</div>
				</div>`;

			return `
			<div class="tweet">
				${headerHtml}
				<div class="tweet-body">${escapeHtml(tweet.text).replace(/\n/g, "<br>")}</div>
				${imagesHtml}
				${videoHtml}
				${linkCardHtml}
				${quotedTweetHtml}
				<div class="tweet-timestamp">${formatDate(tweet.timestamp)}</div>
			</div>
		`;
		})
		.join("");

	const threadHeader = isThread
		? `<div class="thread-header">
			<span class="thread-count">${tweets.length} tweets</span>
		</div>`
		: "";

	const parentHtml = firstTweet.parentTweet
		? `<div class="reply-label">Replying to @${escapeHtml(firstTweet.parentTweet.authorHandle)}</div>
			<div class="parent-tweet">
				<div class="tweet-header">
					<img src="${escapeHtml(firstTweet.parentTweet.authorAvatarUrl)}" alt="${escapeHtml(firstTweet.parentTweet.authorName)}" class="tweet-avatar">
					<div class="tweet-author-info">
						<span class="tweet-author-name">${escapeHtml(firstTweet.parentTweet.authorName)}</span>
						<span class="tweet-author-handle">@${escapeHtml(firstTweet.parentTweet.authorHandle)}</span>
					</div>
				</div>
				<div class="tweet-body">${escapeHtml(firstTweet.parentTweet.text).replace(/\n/g, "<br>")}</div>
				<div class="tweet-timestamp">${formatDate(firstTweet.parentTweet.timestamp)}</div>
			</div>`
		: "";

	return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; line-height: 1.6; color: #333; padding: 40px; }
    .container { max-width: 700px; margin: 0 auto; }
    .preview-author { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1.5rem; padding-bottom: 1rem; border-bottom: 2px solid #e1e8ed; }
    .preview-author-name { font-weight: 700; font-size: 1.25rem; margin-right: 0.5rem; }
    .preview-author-handle { color: #666; font-size: 1rem; }
    .thread-header { margin-bottom: 1rem; padding-bottom: 0.5rem; border-bottom: 1px solid #e1e8ed; }
    .thread-count { color: #666; font-size: 0.875rem; }
    .tweet { padding: 1.25rem 0; border-bottom: 1px solid #e1e8ed; page-break-inside: avoid; }
    .tweet:first-child { padding-top: 0; }
    .tweet:last-child { border-bottom: none; padding-bottom: 0; }
    .tweet-header { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.75rem; }
    .tweet-avatar { width: 48px; height: 48px; border-radius: 50%; object-fit: cover; }
    .tweet-author-info { display: flex; flex-direction: column; }
    .tweet-author-name { font-weight: 700; }
    .tweet-author-handle { color: #666; font-size: 0.875rem; }
    .tweet-body { margin-bottom: 0.75rem; white-space: pre-wrap; word-wrap: break-word; font-size: 1rem; }
    .tweet-images { display: flex; flex-direction: column; gap: 0.5rem; margin-bottom: 0.75rem; }
    .tweet-image { max-width: 100%; border-radius: 12px; border: 1px solid #e1e8ed; }
    .tweet-video { position: relative; margin-bottom: 0.75rem; }
    .video-label { display: inline-block; background: rgba(0,0,0,0.6); color: #fff; padding: 0.25rem 0.75rem; border-radius: 6px; font-size: 0.8rem; margin-top: 0.5rem; }
    .tweet-timestamp { color: #666; font-size: 0.875rem; }
    .link-card { border: 1px solid #e1e8ed; border-radius: 12px; overflow: hidden; margin-bottom: 0.75rem; }
    .link-card-image { width: 100%; display: block; }
    .link-card-content { padding: 0.75rem; }
    .link-card-title { font-weight: 700; font-size: 0.9375rem; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; margin-bottom: 0.25rem; }
    .link-card-description { color: #666; font-size: 0.875rem; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; margin-bottom: 0.25rem; }
    .link-card-domain { color: #999; font-size: 0.8125rem; }
    .parent-tweet { border-left: 3px solid #ccd6dd; padding-left: 1rem; margin-bottom: 1rem; font-size: 0.9375rem; color: #555; }
    .parent-tweet .tweet-header { margin-bottom: 0.5rem; }
    .parent-tweet .tweet-avatar { width: 36px; height: 36px; }
    .parent-tweet .tweet-timestamp { font-size: 0.8125rem; }
    .quoted-tweet { border: 1px solid #ccd6dd; border-radius: 12px; padding: 0.75rem; margin-bottom: 0.75rem; font-size: 0.9375rem; }
    .quoted-tweet .tweet-avatar { width: 20px; height: 20px; }
    .quoted-tweet .tweet-author-info { flex-direction: row; gap: 0.25rem; align-items: center; }
    .quoted-tweet .tweet-header { margin-bottom: 0.5rem; }
    .quoted-tweet .tweet-timestamp { font-size: 0.8125rem; }
    .reply-label { color: #999; font-size: 0.8125rem; margin-bottom: 0.5rem; }
    .footer { margin-top: 2rem; padding-top: 1rem; border-top: 1px solid #e1e8ed; color: #666; font-size: 0.75rem; text-align: center; }
  </style>
</head>
<body>
  <div class="container">
    <div class="preview-author">
      ${isSingle ? `<img src="${escapeHtml(firstTweet.authorAvatarUrl)}" alt="${escapeHtml(authorName)}" class="tweet-avatar">` : ""}
      <div>
        <span class="preview-author-name">${escapeHtml(authorName)}</span>
        <span class="preview-author-handle">@${escapeHtml(authorHandle)}</span>
      </div>
    </div>
    ${parentHtml}
    ${threadHeader}
    ${tweetsHtml}
    <div class="footer">
      Source: ${escapeHtml(url)} | Generated: ${formatDate(new Date().toISOString())}
    </div>
  </div>
</body>
</html>`;
}
