import { escapeHtml, formatDate, isValidTwitterUrl } from "./shared.js";

const urlInput = document.getElementById("url-input");
const generateBtn = document.getElementById("generate-btn");
const errorMessage = document.getElementById("error-message");
const formContainer = document.getElementById("form-container");
const previewContainer = document.getElementById("preview-container");
const tweetPreview = document.getElementById("tweet-preview");
const downloadPdfBtn = document.getElementById("download-pdf-btn");
const convertAnotherBtn = document.getElementById("convert-another-btn");

let currentTweetData = null;
let currentUrl = null;

function showError(message) {
	urlInput.classList.add("error");
	errorMessage.textContent = message;
	errorMessage.classList.add("visible");
}

function clearError() {
	urlInput.classList.remove("error");
	errorMessage.classList.remove("visible");
}

function renderTweet(tweet, showHeader = true, showTimestamp = true) {
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
				${tweet.linkCard.imageUrl ? `<img src="${escapeHtml(tweet.linkCard.imageUrl)}" alt="" class="link-card-image" loading="lazy">` : ""}
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
				${tweet.quotedTweet.imageUrls && tweet.quotedTweet.imageUrls.length > 0 ? `<div class="tweet-images">${tweet.quotedTweet.imageUrls.map((img) => `<img src="${escapeHtml(img)}" alt="Tweet image" class="tweet-image" loading="lazy">`).join("")}</div>` : ""}
				${tweet.quotedTweet.hasVideo && tweet.quotedTweet.videoThumbnailUrl ? `<div class="tweet-video"><img src="${escapeHtml(tweet.quotedTweet.videoThumbnailUrl)}" alt="Video thumbnail" class="tweet-image" loading="lazy"><div class="video-label">▶ Video</div></div>` : ""}
				<div class="tweet-timestamp">${formatDate(tweet.quotedTweet.timestamp)}</div>
			</div>`
		: "";

	const headerHtml = showHeader
		? `<div class="tweet-header">
				<img src="${escapeHtml(tweet.authorAvatarUrl)}" alt="${escapeHtml(tweet.authorName)}" class="tweet-avatar">
				<div class="tweet-author-info">
					<span class="tweet-author-name">${escapeHtml(tweet.authorName)}</span>
					<span class="tweet-author-handle">@${escapeHtml(tweet.authorHandle)}</span>
				</div>
			</div>`
		: "";

	const timestampHtml = showTimestamp
		? `<div class="tweet-timestamp">${formatDate(tweet.timestamp)}</div>`
		: "";

	return `
		<div class="tweet">
			${headerHtml}
			<div class="tweet-body">${escapeHtml(tweet.text).replace(/\n/g, "<br>")}</div>
			${imagesHtml}
			${videoHtml}
			${linkCardHtml}
			${quotedTweetHtml}
			${timestampHtml}
		</div>
	`;
}

function renderParentTweet(parent) {
	return `
		<div class="parent-tweet">
			<div class="tweet-header">
				<img src="${escapeHtml(parent.authorAvatarUrl)}" alt="${escapeHtml(parent.authorName)}" class="tweet-avatar">
				<div class="tweet-author-info">
					<span class="tweet-author-name">${escapeHtml(parent.authorName)}</span>
					<span class="tweet-author-handle">@${escapeHtml(parent.authorHandle)}</span>
				</div>
			</div>
			<div class="tweet-body">${escapeHtml(parent.text).replace(/\n/g, "<br>")}</div>
			<div class="tweet-timestamp">${formatDate(parent.timestamp)}</div>
		</div>
	`;
}

function renderPreview(data) {
	const tweets = data.tweets || [data];
	const authorHandle = tweets[0].authorHandle;
	const authorName = tweets[0].authorName;
	const firstTweet = tweets[0];

	const parentHtml = firstTweet.parentTweet
		? `<div class="reply-label">Replying to @${escapeHtml(firstTweet.parentTweet.authorHandle)}</div>
				${renderParentTweet(firstTweet.parentTweet)}`
		: "";

	const isSingle = tweets.length === 1;
	let html = "";
	if (isSingle) {
		html = renderTweet(tweets[0], false);
	} else {
		html = `
			<div class="thread-header">
				<span class="thread-count">${tweets.length} tweets</span>
			</div>
			${tweets.map((tweet, index) => renderTweet(tweet, false, index === tweets.length - 1)).join("")}
		`;
	}

	const avatarHtml = `<img src="${escapeHtml(tweets[0].authorAvatarUrl)}" alt="${escapeHtml(authorName)}" class="tweet-avatar">`;

	return `
		<div class="preview">
			<div class="preview-author">
				${avatarHtml}
				<div>
					<span class="preview-author-name">${escapeHtml(authorName)}</span>
					<span class="preview-author-handle">@${escapeHtml(authorHandle)}</span>
				</div>
			</div>
			${parentHtml}
			${html}
		</div>
	`;
}

function showPreview(data) {
	currentTweetData = data;
	previewContainer.style.display = "block";
	formContainer.style.display = "none";
	tweetPreview.innerHTML = renderPreview(data);
}

function hidePreview() {
	previewContainer.style.display = "none";
	formContainer.style.display = "block";
	currentTweetData = null;
	currentUrl = null;
	urlInput.value = "";
	generateBtn.disabled = true;
}

async function fetchTweetData(url) {
	let response;
	try {
		response = await fetch("/api/tweet", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ url }),
		});
	} catch {
		showError("Network error. Please check your connection and try again.");
		return null;
	}

	if (!response.ok) {
		let error = "Failed to fetch tweet";
		try {
			const data = await response.json();
			error = data.error || error;
		} catch {
			// Response body is not JSON
		}
		if (response.status === 400) {
			showError(error);
		} else if (response.status === 404) {
			showError("Tweet not found. It may be deleted or protected.");
		} else if (response.status === 429) {
			showError("Rate limited. Please try again later.");
		} else {
			showError(error);
		}
		return null;
	}

	return response.json();
}

async function validateAndSubmit() {
	const url = urlInput.value.trim();

	if (!url) {
		showError("Please enter a URL");
		return;
	}

	if (!isValidTwitterUrl(url)) {
		showError(
			"Invalid URL. Please enter a valid Twitter/X link (twitter.com/*/status/* or x.com/*/status/*)",
		);
		return;
	}

	clearError();
	generateBtn.disabled = true;
	generateBtn.innerHTML = '<span class="spinner"></span>Loading...';

	const tweetData = await fetchTweetData(url);

	generateBtn.disabled = false;
	generateBtn.innerHTML = "Generate PDF";

	if (tweetData) {
		currentUrl = url;
		showPreview(tweetData);
	}
}

urlInput.addEventListener("input", () => {
	if (urlInput.value.trim() === "") {
		generateBtn.disabled = true;
	} else {
		generateBtn.disabled = false;
		clearError();
	}
});

urlInput.addEventListener("keydown", (e) => {
	if (e.key === "Enter") {
		e.preventDefault();
		validateAndSubmit();
	}
});

generateBtn.addEventListener("click", validateAndSubmit);

convertAnotherBtn.addEventListener("click", () => {
	hidePreview();
});

downloadPdfBtn.addEventListener("click", async () => {
	if (!currentTweetData || !currentUrl) {
		return;
	}

	downloadPdfBtn.disabled = true;
	downloadPdfBtn.innerHTML = '<span class="spinner"></span>Generating PDF...';

	try {
		const response = await fetch("/api/pdf", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				url: currentUrl,
			}),
		});

		if (!response.ok) {
			let errorMsg = "Failed to generate PDF";
			try {
				const data = await response.json();
				errorMsg = data.error || errorMsg;
			} catch {
				// Response body is not JSON
			}
			showError(errorMsg);
			hidePreview();
			return;
		}

		const blob = await response.blob();
		const downloadUrl = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = downloadUrl;
		const fileName =
			currentTweetData.tweets[0].authorHandle +
			"-" +
			new Date().toISOString().split("T")[0] +
			".pdf";
		a.download = fileName;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(downloadUrl);
	} catch (_error) {
		showError("Failed to generate PDF. Please try again.");
		hidePreview();
	} finally {
		downloadPdfBtn.disabled = false;
		downloadPdfBtn.innerHTML = "Download PDF";
	}
});

document.querySelectorAll(".example-link").forEach((link) => {
	link.addEventListener("click", (e) => {
		e.preventDefault();
		const url = link.getAttribute("href");
		hidePreview();
		urlInput.value = url;
		generateBtn.disabled = false;
		validateAndSubmit();
	});
});
