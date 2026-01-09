const btnSubmit = document.getElementById('btnSubmit');
const btnLogout = document.getElementById('btnLogout');
const chkBox = document.getElementById('checkBox');
const publicCheckbox = document.getElementById('publicCheckbox');
let t = null;

// Check for stored authentication token when the popup is opened
chrome.storage.sync.get('gistJotToken', ({ gistJotToken }) => {
	if (gistJotToken) {
		// Token exists, initialize UI for creating a Gist
		t = gistJotToken;

		// Check if we're on a restricted page
		chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
			const currentUrl = tabs[0]?.url || '';
			const isRestricted = currentUrl.startsWith('chrome://') ||
				currentUrl.startsWith('chrome-extension://') ||
				currentUrl.startsWith('edge://') ||
				currentUrl.startsWith('about:') ||
				currentUrl.includes('chrome.google.com/webstore');

			if (isRestricted) {
				document.getElementById('noteScreen').style.display = 'flex';
				showError('This extension cannot access this page. Navigate to a regular webpage to save content.');
				return;
			}

			initValues();
			document.getElementById('noteScreen').style.display = 'flex';
		});
	} else {
		// No token found, open the welcome page for authentication
		chrome.tabs.create({ url: 'welcome.html' });
		window.close(); // Close the popup after opening the welcome page
	}
});

// Handle logout
btnLogout.onclick = () => {
	if (confirm('Are you sure you want to logout? You will need to authenticate again.')) {
		chrome.storage.sync.remove('gistJotToken', () => {
			chrome.tabs.create({ url: 'welcome.html' });
			window.close();
		});
	}
};

// Initialize UI fields with selected text and page details
const initValues = () => {
	// Check for context menu selection first
	chrome.storage.local.get(['tempSelection', 'tempUrl', 'tempTitle'], (data) => {
		if (data.tempSelection) {
			document.getElementById('txtContent').value = data.tempSelection;
			if (data.tempTitle) {
				document.getElementById('txtDescription').value = data.tempTitle;
				document.getElementById('txtFilename').value = convertToSlug(data.tempTitle) + '.md';
			}
			if (data.tempUrl) {
				document.getElementById('hiddenUrl').value = data.tempUrl;
			}
			// Clear temp storage
			chrome.storage.local.remove(['tempSelection', 'tempUrl', 'tempTitle']);
		} else {
			// Fall back to standard selection method
			chrome.runtime.sendMessage({ msg: 'get_selected_text' }, (response) => {
				if (response && response.selectedText) {
					document.getElementById('txtContent').value = response.selectedText;
				}
			});

			chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
				const pageUrl = tabs[0].url;
				const pageTitle = tabs[0].title;
				if (pageTitle) {
					document.getElementById('txtDescription').value = pageTitle;
					document.getElementById('txtFilename').value = convertToSlug(pageTitle) + '.md';
				}
				if (pageUrl) {
					document.getElementById('hiddenUrl').value = pageUrl;
				}
			});
		}
	});
};

// Handle submit button click
btnSubmit.onclick = () => {
	const description = document.getElementById('txtDescription').value.trim();
	const filename = document.getElementById('txtFilename').value.trim();
	let content = document.getElementById('txtContent').value.trim();

	// Validate required fields
	if (!filename) {
		showError('Filename is required');
		return false;
	}

	if (!content) {
		showError('Content cannot be empty');
		return false;
	}

	if (chkBox.checked) {
		const pageUrl = document.getElementById('hiddenUrl').value;
		content += `\n\nUrl: ${pageUrl}`;
	}

	const payload = {
		description: description,
		public: publicCheckbox.checked,
		files: {
			[filename]: { content: content }
		}
	};

	saveGist(payload);
	return false;
};

// Save Gist to GitHub
const saveGist = async (payload) => {
	document.getElementById('noteScreen').style.display = 'none';
	document.getElementById('spinner').style.display = 'flex';

	try {
		const response = await fetch('https://api.github.com/gists', {
			method: 'POST',
			headers: {
				'Authorization': `Bearer ${t}`,
				'Content-Type': 'application/json',
				'Accept': 'application/vnd.github.v3+json'
			},
			body: JSON.stringify(payload)
		});

		if (!response.ok) {
			const errorData = await response.json();
			throw new Error(errorData.message || `GitHub API error: ${response.status}`);
		}

		const gistData = await response.json();
		showSuccess(gistData.html_url);
		clearForm();
	} catch (err) {
		console.error('Error saving Gist:', err);
		showError(err.message || 'Failed to save gist. Please try again.');
	} finally {
		document.getElementById('spinner').style.display = 'none';
		document.getElementById('noteScreen').style.display = 'flex';
	}
};

// Convert text to a slug format
const convertToSlug = (text) => {
	return text.toLowerCase()
		.replace(/[^\w ]+/g, '')
		.replace(/ +/g, '-');
};

// Clear the form fields
const clearForm = () => {
	document.getElementById('txtDescription').value = '';
	document.getElementById('txtFilename').value = '';
	document.getElementById('txtContent').value = '';
};

// Show success message with gist URL
const showSuccess = (gistUrl) => {
	const noteScreen = document.getElementById('noteScreen');
	const successMsg = document.createElement('div');
	successMsg.className = 'notification is-success';
	successMsg.innerHTML = `
    <button class="delete" onclick="this.parentElement.remove()"></button>
    <strong>Success!</strong> Your gist has been saved.
    <br><a href="${gistUrl}" target="_blank" class="has-text-white" style="text-decoration: underline;">View Gist →</a>
  `;
	noteScreen.insertBefore(successMsg, noteScreen.firstChild);

	// Auto-remove after 10 seconds
	setTimeout(() => successMsg.remove(), 10000);
};

// Show error message
const showError = (message) => {
	const noteScreen = document.getElementById('noteScreen');
	const errorMsg = document.createElement('div');
	errorMsg.className = 'notification is-danger';
	errorMsg.innerHTML = `
    <button class="delete" onclick="this.parentElement.remove()"></button>
    <strong>Error:</strong> ${message}
  `;
	noteScreen.insertBefore(errorMsg, noteScreen.firstChild);

	// Auto-remove after 8 seconds
	setTimeout(() => errorMsg.remove(), 8000);
};
