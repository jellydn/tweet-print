const URL_PATTERN =
	/^(https?:\/\/)?(www\.)?(twitter\.com|x\.com)\/.+\/status\/\d+/;
const SHORT_URL_PATTERN = /^(https?:\/\/)?t\.co\/\w+/;

const _form = document.getElementById("url-form");
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

function isValidTwitterUrl(url) {
	return URL_PATTERN.test(url) || SHORT_URL_PATTERN.test(url);
}

function showError(message) {
	urlInput.classList.add("error");
	errorMessage.textContent = message;
	errorMessage.classList.add("visible");
}

function clearError() {
	urlInput.classList.remove("error");
	errorMessage.classList.remove("visible");
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

function escapeHtml(text) {
	const div = document.createElement("div");
	div.textContent = text;
	return div.innerHTML;
}

function renderTweet(tweet) {
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
			${videoHtml}
			<div class="tweet-timestamp">${formatDate(tweet.timestamp)}</div>
		</div>
	`;
}

function renderPreview(data) {
	const tweets = data.tweets || [data];
	const authorHandle = tweets[0].authorHandle;
	const authorName = tweets[0].authorName;

	let html = "";
	if (tweets.length === 1) {
		html = renderTweet(tweets[0]);
	} else {
		html = `
			<div class="thread-header">
				<span class="thread-count">${tweets.length} tweets</span>
			</div>
			${tweets.map((tweet) => renderTweet(tweet)).join("")}
		`;
	}

	return `
		<div class="preview">
			<div class="preview-author">
				<span class="preview-author-name">${escapeHtml(authorName)}</span>
				<span class="preview-author-handle">@${escapeHtml(authorHandle)}</span>
			</div>
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
	const response = await fetch("/api/tweet", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({ url }),
	});

	if (!response.ok) {
		const data = await response.json();
		const error = data.error || "Failed to fetch tweet";
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

urlInput.addEventListener("keypress", (e) => {
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
				tweets: currentTweetData.tweets,
				url: currentUrl,
			}),
		});

		if (!response.ok) {
			const data = await response.json();
			showError(data.error || "Failed to generate PDF");
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
