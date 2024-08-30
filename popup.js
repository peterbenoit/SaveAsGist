const btnSubmit = document.getElementById('btnSubmit');
const chkBox = document.getElementById('checkBox');
let t = null;

// Check for stored authentication token when the popup is opened
chrome.storage.sync.get('gistJotToken', ({ gistJotToken }) => {
  if (gistJotToken) {
    // Token exists, initialize UI for creating a Gist
    t = gistJotToken;
    initValues();
    document.getElementById('noteScreen').style.display = 'flex';
  } else {
    // No token found, open the welcome page for authentication
    chrome.tabs.create({ url: 'welcome.html' });
    window.close(); // Close the popup after opening the welcome page
  }
});

// Initialize UI fields with selected text and page details
const initValues = () => {
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
};

// Handle submit button click
btnSubmit.onclick = () => {
  const description = document.getElementById('txtDescription').value.trim();
  const filename = document.getElementById('txtFilename').value.trim();
  let content = document.getElementById('txtContent').value.trim();

  if (chkBox.checked) {
    const pageUrl = document.getElementById('hiddenUrl').value;
    content += `\n\nUrl: ${pageUrl}`;
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
