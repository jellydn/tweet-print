const URL_PATTERN =
	/^(https?:\/\/)?(www\.)?(twitter\.com|x\.com)\/.+\/status\/\d+/;

const _form = document.getElementById("url-form");
const urlInput = document.getElementById("url-input");
const generateBtn = document.getElementById("generate-btn");
const errorMessage = document.getElementById("error-message");

function isValidTwitterUrl(url) {
	return URL_PATTERN.test(url);
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
		console.log("Tweet data:", tweetData);
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
