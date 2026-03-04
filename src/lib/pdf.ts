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

export async function embedImages(tweets: TweetData[]): Promise<TweetData[]> {
	const result: TweetData[] = [];
	for (const tweet of tweets) {
		const avatarDataUri = await fetchImageAsBase64(tweet.authorAvatarUrl);
		const imageDataUris = await Promise.all(
			tweet.imageUrls.map((url) => fetchImageAsBase64(url)),
		);
		result.push({
			...tweet,
			authorAvatarUrl: avatarDataUri,
			imageUrls: imageDataUris,
		});
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

			return `
			<div class="tweet">
				<div class="tweet-header">
					<img src="${escapeHtml(tweet.authorAvatarUrl)}" alt="${escapeHtml(tweet.authorName)}" class="tweet-avatar">
					<div class="tweet-author-info">
						<span class="tweet-author-name">${escapeHtml(tweet.authorName)}</span>
						<span class="tweet-author-handle">@${escapeHtml(tweet.authorHandle)}</span>
					</div>
				</div>
				<div class="tweet-body">${escapeHtml(tweet.text).replace(/\n/g, "<br>")}</div>
				${imagesHtml}
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

	return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; line-height: 1.6; color: #333; padding: 40px; }
    .container { max-width: 700px; margin: 0 auto; }
    .preview-author { margin-bottom: 1.5rem; padding-bottom: 1rem; border-bottom: 2px solid #e1e8ed; }
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
    .tweet-timestamp { color: #666; font-size: 0.875rem; }
    .footer { margin-top: 2rem; padding-top: 1rem; border-top: 1px solid #e1e8ed; color: #666; font-size: 0.75rem; text-align: center; }
  </style>
</head>
<body>
  <div class="container">
    <div class="preview-author">
      <span class="preview-author-name">${escapeHtml(authorName)}</span>
      <span class="preview-author-handle">@${escapeHtml(authorHandle)}</span>
    </div>
    ${threadHeader}
    ${tweetsHtml}
    <div class="footer">
      Source: ${escapeHtml(url)} | Generated: ${formatDate(new Date().toISOString())}
    </div>
  </div>
</body>
</html>`;
}
