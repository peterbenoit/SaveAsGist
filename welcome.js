document.getElementById('authButton').addEventListener('click', () => {
    // Trigger GitHub OAuth flow through background script
    chrome.runtime.sendMessage({ msg: 'start_auth' });
});

// Listen for authentication completion
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.msg === 'auth_complete') {
        alert('Authentication successful! You can now use the extension.');
        window.close(); // Close the welcome page after authentication
    }
});
