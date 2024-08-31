# Save as Gist Chrome Extension

A Chrome extension that allows users to easily save selected text, notes, and webpage information directly as private gists on GitHub.

## Features

-   Save any selected text from a webpage as a GitHub Gist.
-   Automatically appends the page URL to the Gist if desired.
-   Integrated authentication with GitHub for secure access to your gists.

[View an example on Gist](https://gist.github.com/peterbenoit/c1a621cd3f8b59fd6c60bba40d74866c)

## Installation

1. Clone or download this repository to your local machine.
2. Add the following content to `config.js`:

    ```javascript
    const CONFIG = {
        client_id: 'YOUR_CLIENT_ID',
        client_secret: 'YOUR_CLIENT_SECRET',
    };

    export default CONFIG;
    ```

3. Replace 'YOUR_CLIENT_ID' and 'YOUR_CLIENT_SECRET' with your actual GitHub OAuth credentials.
    - Go to GitHub Developer Settings:
        - Visit GitHub Developer Settings.
    - Register a New OAuth Application:
        - Click on “New OAuth App.”
4. Open Chrome and go to `chrome://extensions/`.
5. Enable **Developer mode** by toggling the switch in the upper right corner.
6. Click on **Load unpacked** and select the extension directory.

## Usage

1. Click on the extension icon in the Chrome toolbar to open the popup.
2. If you haven't authenticated yet, the welcome page will prompt you to log in with GitHub.
3. Once authenticated, select any text on a webpage and use the popup to save it as a Gist.

## Important Notices

-   This extension is **not affiliated with GitHub** in any way.
-   The extension uses your GitHub credentials to save gists but does not store your credentials; it only requests a token for secure API access.

## Contributing

Feel free to fork this repository, make changes, and submit pull requests!

## License

This project is licensed under the MIT License.
