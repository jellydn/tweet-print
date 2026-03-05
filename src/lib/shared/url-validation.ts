const TWITTER_HOSTNAMES = new Set([
	"twitter.com",
	"x.com",
	"www.twitter.com",
	"www.x.com",
]);

function parseUrl(input: string): URL | null {
	try {
		const urlStr = input.startsWith("http") ? input : `https://${input}`;
		return new URL(urlStr);
	} catch {
		return null;
	}
}

export function isValidTwitterUrl(url: string): boolean {
	if (!url || typeof url !== "string") {
		return false;
	}
	if (isShortUrl(url)) {
		return true;
	}
	const parsed = parseUrl(url);
	if (!parsed) {
		return false;
	}
	if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
		return false;
	}
	if (!TWITTER_HOSTNAMES.has(parsed.hostname)) {
		return false;
	}
	const pathParts = parsed.pathname.split("/").filter(Boolean);
	if (pathParts.length < 2) {
		return false;
	}
	const statusIndex = pathParts.indexOf("status");
	if (statusIndex === -1) {
		return false;
	}
	const tweetId = pathParts[statusIndex + 1];
	if (!tweetId || !/^\d+$/.test(tweetId)) {
		return false;
	}
	return true;
}

export function isShortUrl(url: string): boolean {
	const parsed = parseUrl(url);
	if (!parsed) {
		return false;
	}
	return parsed.hostname === "t.co" && parsed.pathname.length > 1;
}

export function extractTweetId(url: string): string | null {
	const parsed = parseUrl(url);
	if (!parsed) {
		const match = url.match(/\/status\/(\d+)/);
		return match?.[1] ?? null;
	}
	const pathParts = parsed.pathname.split("/").filter(Boolean);
	const statusIndex = pathParts.indexOf("status");
	if (statusIndex === -1) {
		return null;
	}
	const tweetId = pathParts[statusIndex + 1];
	if (tweetId && /^\d+$/.test(tweetId)) {
		return tweetId;
	}
	return null;
}

export function normalizeTwitterUrl(url: string): string {
	const trimmed = url.trim();
	if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
		return trimmed;
	}
	return `https://${trimmed}`;
}
