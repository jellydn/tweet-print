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

function validateAndSubmit() {
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

	console.log("URL submitted:", url);
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
