const bgp = chrome.runtime.getBackgroundPage((backgroundPage) => backgroundPage);
const btnSubmit = document.getElementById('btnSubmit');
const btnLogin = document.getElementById('btnLogin');
const chkBox = document.getElementById('checkBox');
let t = null;

// Check for stored authentication token
chrome.storage.sync.get('gistJotToken', ({ gistJotToken }) => {
  if (gistJotToken) {
    initValues();
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('noteScreen').style.display = 'flex';
    t = gistJotToken;
  } else {
    document.getElementById('noteScreen').style.display = 'none';
    document.getElementById('loginScreen').style.display = 'flex';
  }
});

// Initialize UI fields with selected text and page details
const initValues = () => {
  chrome.tabs.executeScript(
    { code: 'window.getSelection().toString();' },
    (selection) => {
      const pageText = selection[0];
      if (pageText) {
        document.getElementById('txtContent').value = pageText;
      }
    }
  );

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const pageUrl = tabs[0].url;
    const pageTitle = tabs[0].title;
    if (pageTitle) {
      document.getElementById('txtDescription').value = pageTitle;
      document.getElementById('txtFilename').value = convertToSlug(pageTitle) + '.md';
    }
    if (pageUrl) {
      document.getElementById('checkBox').value = pageUrl;
    }
  });
};

// Convert text to a slug format
const convertToSlug = (text) => {
  return text.toLowerCase()
    .replace(/[^\w ]+/g, '')
    .replace(/ +/g, '-');
};

// Handle login button click
btnLogin.onclick = () => {
  document.getElementById('loginScreen').style.display = 'none';
  document.getElementById('spinner').style.display = 'flex';
  bgp.launchWebAuthFlow();
};

// Handle submit button click
btnSubmit.onclick = () => {
  const description = document.getElementById('txtDescription').value.trim();
  const filename = document.getElementById('txtFilename').value.trim();
  let content = document.getElementById('txtContent').value.trim();

  if (chkBox.checked) {
    content += `\n\nUrl: ${document.getElementById('checkBox').value.trim()}`;
  }

  if (filename && filename.length > 0) {
    const payload = {
      description: description,
      public: false,
      files: {
        [filename]: { content: content }
      }
    };

    saveGist(payload);
  }
  return false;
};

// Save Gist to GitHub
const saveGist = (payload) => {
  document.getElementById('noteScreen').style.display = 'none';
  document.getElementById('spinner').style.display = 'flex';

  request('POST', 'https://api.github.com/gists', t, payload)
    .then(() => {
      clearForm();
      document.getElementById('noteScreen').style.display = 'flex';
      document.getElementById('spinner').style.display = 'none';
    })
    .catch((err) => console.error('Error saving Gist:', err));
};

// Clear the form fields
const clearForm = () => {
  document.getElementById('txtDescription').value = '';
  document.getElementById('txtFilename').value = '';
  document.getElementById('txtContent').value = '';
};

// Make a request to the GitHub API
const request = (method, url, token, payload = null) => {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open(method, url, true);
    xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        return resolve(xhr.response);
      } else {
        reject(new Error(`Request failed: ${xhr.status} ${xhr.statusText}`));
      }
    };
    xhr.onerror = () => {
      reject(new Error(`Network error: ${xhr.status} ${xhr.statusText}`));
    };
    payload ? xhr.send(JSON.stringify(payload)) : xhr.send();
  });
};

// Listen for messages from the background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.msg === 'auth_complete') {
    t = request.data.access_token;
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('noteScreen').style.display = 'flex';
    document.getElementById('spinner').style.display = 'none';
  }
});
