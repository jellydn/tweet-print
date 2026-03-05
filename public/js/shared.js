const TWITTER_HOSTNAMES = new Set([
	"twitter.com",
	"x.com",
	"www.twitter.com",
	"www.x.com",
]);

function parseUrl(input) {
	try {
		const urlStr = input.startsWith("http") ? input : `https://${input}`;
		return new URL(urlStr);
	} catch {
		return null;
	}
}

function isValidTwitterUrl(url) {
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

function isShortUrl(url) {
	const parsed = parseUrl(url);
	if (!parsed) {
		return false;
	}
	return parsed.hostname === "t.co" && parsed.pathname.length > 1;
}

function extractTweetId(url) {
	const parsed = parseUrl(url);
	if (!parsed) {
		const match = url.match(/\/status\/(\d+)/);
		return match ? match[1] : null;
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

function escapeHtml(text) {
	const div = document.createElement("div");
	div.textContent = text;
	return div.innerHTML;
}

function linkifyText(text) {
	// First escape HTML to prevent XSS
	let escaped = escapeHtml(text);

	// Convert URLs to clickable links
	// Match http://, https://, or www. URLs
	const urlRegex = /(https?:\/\/[^\s]+)|(www\.[^\s]+)/g;
	escaped = escaped.replace(urlRegex, (match, httpUrl, wwwUrl) => {
		const url = httpUrl || `https://${wwwUrl}`;
		const display = match;
		return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="tweet-link">${display}</a>`;
	});

	// Convert @mentions to Twitter profile links
	const mentionRegex = /@(\w+)/g;
	escaped = escaped.replace(mentionRegex, (match, username) => {
		return `<a href="https://x.com/${username}" target="_blank" rel="noopener noreferrer" class="tweet-link">${match}</a>`;
	});

	// Convert #hashtags to Twitter search links
	const hashtagRegex = /#(\w+)/g;
	escaped = escaped.replace(hashtagRegex, (match, tag) => {
		return `<a href="https://x.com/hashtag/${tag}" target="_blank" rel="noopener noreferrer" class="tweet-link">${match}</a>`;
	});

	return escaped;
}

function formatDate(isoString) {
	const date = new Date(isoString);
	return date.toLocaleDateString("en-US", {
		year: "numeric",
		month: "long",
		day: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	});
}

export {
	isValidTwitterUrl,
	isShortUrl,
	extractTweetId,
	escapeHtml,
	formatDate,
	TWITTER_HOSTNAMES,
	parseUrl,
	linkifyText,
};
