document.getElementById('authButton').addEventListener('click', () => {
	// Show loading state
	const authButton = document.getElementById('authButton');
	authButton.classList.add('is-loading');
	authButton.disabled = true;

	// Trigger GitHub OAuth flow through background script
	chrome.runtime.sendMessage({ msg: 'start_auth' });
});

// Listen for authentication completion
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
	if (request.msg === 'auth_complete') {
		showSuccess('Authentication successful! You can now use the extension.');
		setTimeout(() => window.close(), 2000);
	} else if (request.msg === 'auth_error') {
		showError(request.error || 'Authentication failed. Please try again.');
		const authButton = document.getElementById('authButton');
		authButton.classList.remove('is-loading');
		authButton.disabled = false;
	}
});

// Show success message
const showSuccess = (message) => {
	const container = document.querySelector('.container');
	const successMsg = document.createElement('div');
	successMsg.className = 'notification is-success mt-4';
	successMsg.innerHTML = `
        <button class="delete" onclick="this.parentElement.remove()"></button>
        ${message}
    `;
	container.appendChild(successMsg);
};

// Show error message
const showError = (message) => {
	const container = document.querySelector('.container');
	const errorMsg = document.createElement('div');
	errorMsg.className = 'notification is-danger mt-4';
	errorMsg.innerHTML = `
        <button class="delete" onclick="this.parentElement.remove()"></button>
        <strong>Error:</strong> ${message}
    `;
	container.appendChild(errorMsg);
};
