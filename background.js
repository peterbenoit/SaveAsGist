import CONFIG from './config.js';

const client_id = CONFIG.client_id;
const client_secret = CONFIG.client_secret;

// Open the welcome page after installation only if not authenticated
chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.sync.get('gistJotToken', ({ gistJotToken }) => {
        if (!gistJotToken) {
            // If token does not exist, open the welcome page
            chrome.tabs.create({ url: 'welcome.html' });
        }
    });
});

// Listen for messages to perform actions
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.msg === 'get_selected_text') {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
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
    chrome.identity.launchWebAuthFlow(
        {
            url: `https://github.com/login/oauth/authorize?client_id=${client_id}&scope=gist`,
            interactive: true
        },
        (redirect_url) => {
            if (redirect_url) {
                const code = getParams(redirect_url).code;
                getToken(code)
                    .then((res) => {
                        const accessToken = getParams(res).access_token;
                        chrome.storage.sync.set({ gistJotToken: accessToken });
                        chrome.runtime.sendMessage({
                            msg: 'auth_complete',
                            data: { access_token: accessToken }
                        });
                    })
                    .catch((err) => console.error('Error during token retrieval:', err));
            } else {
                console.error('Error in redirect URL:', chrome.runtime.lastError);
            }
        }
    );
};

// Helper functions for OAuth
const getParams = (str) => {
    const params = {};
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
            throw new Error('Failed to retrieve access token');
        }
    })
    .catch((error) => {
        console.error('Error fetching access token:', error);
    });
};
