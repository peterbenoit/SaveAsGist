import CONFIG from '../config/config.js';

const client_id = CONFIG.client_id;

// Note: client_secret should NOT be used in browser extensions for security reasons.
// GitHub OAuth for extensions should use PKCE or device flow instead.
// Keeping this temporarily for backwards compatibility during migration.
const client_secret = CONFIG.client_secret;

// Log the redirect URL on startup for easy GitHub OAuth configuration
const redirectUrl = chrome.identity.getRedirectURL();
console.log('='.repeat(80));
console.log('📋 COPY THIS URL TO YOUR GITHUB OAUTH APP SETTINGS:');
console.log(redirectUrl);
console.log('='.repeat(80));
console.log('Go to: https://github.com/settings/developers');
console.log('Edit your OAuth App and paste the URL above into "Authorization callback URL"');
console.log('='.repeat(80));

// Open the welcome page after installation only if not authenticated
chrome.runtime.onInstalled.addListener(() => {
	chrome.storage.sync.get('gistJotToken', ({ gistJotToken }) => {
		if (!gistJotToken) {
			// If token does not exist, open the welcome page
			chrome.tabs.create({ url: 'welcome/welcome.html' });
		}
	});

	// Create context menu
	chrome.contextMenus.create({
		id: 'saveAsGist',
		title: 'Save as Gist',
		contexts: ['selection']
	}, () => {
		if (chrome.runtime.lastError) {
			console.log('Context menu item already exists or could not be created:', chrome.runtime.lastError.message);
		}
	});
});

// Handle context menu click
chrome.contextMenus.onClicked.addListener((info, tab) => {
	if (info.menuItemId === 'saveAsGist' && info.selectionText) {
		// Check if we're on a restricted page
		const currentUrl = tab.url || '';
		if (currentUrl.startsWith('chrome://') ||
			currentUrl.startsWith('chrome-extension://') ||
			currentUrl.startsWith('edge://') ||
			currentUrl.startsWith('about:')) {
			// Can't save from restricted pages
			return;
		}

		// Store selected text temporarily
		chrome.storage.local.set({
			tempSelection: info.selectionText,
			tempUrl: tab.url,
			tempTitle: tab.title
		}, () => {
			// Open popup (or handle inline)
			chrome.action.openPopup();
		});
	}
});

// Listen for messages to perform actions
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
	if (request.msg === 'get_selected_text') {
		chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
			const currentUrl = tabs[0]?.url || '';

			// Check if URL is restricted
			if (currentUrl.startsWith('chrome://') ||
				currentUrl.startsWith('chrome-extension://') ||
				currentUrl.startsWith('edge://') ||
				currentUrl.startsWith('about:')) {
				sendResponse({ selectedText: '', error: 'Cannot access this page' });
				return;
			}

			chrome.scripting.executeScript(
				{
					target: { tabId: tabs[0].id },
					func: getSelectedTextWithUrls // Change the function to capture URLs
				},
				(results) => {
					if (results && results[0] && results[0].result) {
						sendResponse({ selectedText: results[0].result });
					} else {
						sendResponse({ selectedText: '' });
					}
				}
			);
		});
		return true; // Keep the messaging channel open for sendResponse
	} else if (request.msg === 'start_auth') {
		// Trigger OAuth authentication flow
		launchWebAuthFlow();
	}
});

// Function to capture selected text along with URLs in Markdown format
function getSelectedTextWithUrls() {
	const selection = window.getSelection();
	const range = selection.getRangeAt(0).cloneContents(); // Get the selected range
	const div = document.createElement('div');
	div.appendChild(range); // Add the selection to a temporary div to traverse

	// Traverse and extract anchor tags, converting them to Markdown
	const convertToMarkdown = (node) => {
		if (node.nodeType === Node.TEXT_NODE) {
			return node.textContent; // Keep plain text as is
		} else if (node.nodeType === Node.ELEMENT_NODE && node.tagName === 'A') {
			return `[${node.textContent}](${node.href})`; // Convert <a> to Markdown
		} else if (node.childNodes && node.childNodes.length > 0) {
			// Recursively process child nodes
			let content = '';
			node.childNodes.forEach((child) => {
				content += convertToMarkdown(child);
			});
			return content;
		}
		return ''; // Ignore non-text or non-anchor nodes
	};

	return convertToMarkdown(div);
}

// OAuth Flow for GitHub Authentication
const launchWebAuthFlow = () => {
	// Get the redirect URL - Chrome provides this automatically
	const redirectUrl = chrome.identity.getRedirectURL();
	console.log('Redirect URL:', redirectUrl); // Log this to configure in GitHub OAuth App

	chrome.identity.launchWebAuthFlow(
		{
			url: `https://github.com/login/oauth/authorize?client_id=${client_id}&scope=gist&redirect_uri=${encodeURIComponent(redirectUrl)}`,
			interactive: true
		},
		(redirect_url) => {
			if (chrome.runtime.lastError || !redirect_url) {
				console.error('OAuth error:', chrome.runtime.lastError);
				chrome.runtime.sendMessage({
					msg: 'auth_error',
					error: chrome.runtime.lastError?.message || 'Authentication cancelled'
				});
				return;
			}

			const code = getParams(redirect_url).code;
			if (!code) {
				console.error('No authorization code received');
				chrome.runtime.sendMessage({
					msg: 'auth_error',
					error: 'No authorization code received'
				});
				return;
			}

			getToken(code)
				.then((res) => {
					const accessToken = getParams(res).access_token;
					if (!accessToken) {
						throw new Error('No access token received');
					}
					chrome.storage.sync.set({ gistJotToken: accessToken });
					chrome.runtime.sendMessage({
						msg: 'auth_complete',
						data: { access_token: accessToken }
					});
				})
				.catch((err) => {
					console.error('Error during token retrieval:', err);
					chrome.runtime.sendMessage({
						msg: 'auth_error',
						error: err.message || 'Failed to retrieve access token'
					});
				});
		}
	);
};

// Helper functions for OAuth
const getParams = (str) => {
	const params = {};
	if (!str) return params; // Protect against undefined
	const queryString = str.includes('https://') ? new URL(str).search.substring(1) : str;
	const vars = queryString.split('&');
	vars.forEach((param) => {
		const [key, value] = param.split('=');
		params[key] = decodeURIComponent(value);
	});
	return params;
};

const getToken = (code) => {
	const url = `https://github.com/login/oauth/access_token?client_id=${client_id}&client_secret=${client_secret}&code=${code}`;

	return fetch(url, {
		method: 'POST',
		headers: {
			'Accept': 'application/json'
		}
	})
		.then((response) => response.json())
		.then((data) => {
			if (data.access_token) {
				return `access_token=${data.access_token}`;
			} else {
				throw new Error(data.error_description || 'Failed to retrieve access token');
			}
		})
		.catch((error) => {
			console.error('Error fetching access token:', error);
			throw error; // Rethrow to let the caller handle it
		});
};
