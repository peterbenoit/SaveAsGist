const bgp = chrome.extension.getBackgroundPage();
const btnSubmit = document.getElementById('btnSubmit');
const btnLogin = document.getElementById('btnLogin');
const chkBox = document.getElementById('checkBox');
const isAuthenticated = false;
let t = null;

chrome.storage.sync.get('gistJotToken', function(data) {
  if (data.gistJotToken) {
    initValues();
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('noteScreen').style.display = 'flex';
    t = data.gistJotToken;
  } else {
    document.getElementById('noteScreen').style.display = 'none';
    document.getElementById('loginScreen').style.display = 'flex';
  }
});

function initValues() {
  // Get text selection
  chrome.tabs.executeScript(
    { code: 'window.getSelection().toString();' },
    function(selection) {
      pageText = selection[0];
      if (pageText) {
        document.getElementById('txtContent').value = pageText;
      }
    }
  );

  chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
    pageUrl = tabs[0].url;
    pageTitle = tabs[0].title;
    if (pageTitle) {
      document.getElementById('txtDescription').value = pageTitle;
      document.getElementById('txtFilename').value = convertToSlug(pageTitle) + '.md';
    }
    if (pageUrl) {
      document.getElementById('checkBox').value = pageUrl;
    }
  });
}

function convertToSlug(Text) {
  return Text.toLowerCase()
    .replace(/[^\w ]+/g, '')
    .replace(/ +/g, '-');
}

btnLogin.onclick = function(element) {
  document.getElementById('loginScreen').style.display = 'none';
  document.getElementById('spinner').style.display = 'flex';
  bgp.launchWebAuthFlow();
};

// On save event handler
btnSubmit.onclick = function(element) {
  let description = document.getElementById('txtDescription').value.trim();
  let filename = document.getElementById('txtFilename').value.trim();
  let content = document.getElementById('txtContent').value.trim();

  if (chkBox.checked) {
    content += `\n\nUrl: ${document.getElementById('checkBox').value.trim()}`;
  }

  if (filename && filename.length > 0) {
    let payload = {
      description: description,
      public: false,
      files: {
        [filename]: {
          content: content
        }
      }
    };

    // Make call to send the payload to create a new private gist
    saveGist(payload);
  }
  return false;
};

let clearForm = function() {
  document.getElementById('txtDescription').value = '';
  document.getElementById('txtFilename').value = '';
  document.getElementById('txtContent').value = '';
};

let saveGist = function(payload) {
  document.getElementById('noteScreen').style.display = 'none';
  document.getElementById('spinner').style.display = 'flex';
  request('POST', 'https://api.github.com/gists', t, payload)
    .then(res => {
      clearForm();
      document.getElementById('noteScreen').style.display = 'flex';
      document.getElementById('spinner').style.display = 'none';
    })
    .catch(err => console.log(err));
};

function request(method, url, token, payload = null) {
  return new Promise((resolve, reject) => {
    let xhr = new XMLHttpRequest();
    xhr.open(method, url, true);
    xhr.setRequestHeader('Authorization', 'Bearer ' + token);
    xhr.onload = function() {
      if (xhr.status >= 200 && xhr.status < 300) {
        return resolve(xhr.response);
      } else {
        reject(
          Error({
            status: xhr.status,
            statusTextInElse: xhr.statusText
          })
        );
      }
    };
    xhr.onerror = function() {
      reject(
        Error({
          status: xhr.status,
          statusText: xhr.statusText
        })
      );
    };
    payload ? xhr.send(JSON.stringify(payload)) : xhr.send();
  });
}

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.msg === 'auth_complete') {
    //  Assign token and show note screen
    t = request.data.access_token;
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('noteScreen').style.display = 'flex';
    document.getElementById('spinner').style.display = 'none';
  }
});
