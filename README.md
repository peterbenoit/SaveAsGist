# Save as Gist Chrome Extension

Quickly save any text from the web as a GitHub Gist with one click. Perfect for capturing code snippets, research notes, quotes, or anything else you want to save to your GitHub account.

## Features

✨ **Quick Save** - Select text and save it as a gist in seconds
🖱️ **Right-Click Menu** - Right-click selected text → "Save as Gist"
🔒 **Private or Public** - Choose whether your gist is private or public
🔗 **Auto URL** - Optionally append the page URL to remember where it came from
✅ **Instant Feedback** - Get a direct link to view your gist after saving
🎨 **Clean Interface** - Simple, modern popup interface

[View an example gist created with this extension](https://gist.github.com/peterbenoit/c1a621cd3f8b59fd6c60bba40d74866c)

## Installation

⚠️ **IMPORTANT**: Each user must create their own GitHub OAuth App. You cannot use someone else's credentials - gists will be saved to YOUR GitHub account using YOUR OAuth app.

### Step-by-Step Setup

**Step 1: Download this extension**
- Clone or download this repository
- Extract to a folder on your computer

**Step 2: Create YOUR OWN GitHub OAuth App**
- Go to [GitHub Developer Settings](https://github.com/settings/developers)
- Click **"OAuth Apps"** tab (not GitHub Apps!)
- Click **"New OAuth App"**
- Fill in:
  - Application name: `SaveAsGist` (or your choice)
  - Homepage URL: `https://github.com/yourusername/SaveAsGist` (or any URL)
  - Authorization callback URL: Leave blank for now (we'll add this in step 4)
- Click **"Register application"**
- Keep this page open - you'll need the Client ID and Client Secret

**Step 3: Load the extension in Chrome**
- Open Chrome and go to `chrome://extensions/`
- Enable **Developer mode** (toggle in top-right corner)
- Click **"Load unpacked"** and select the extension folder you downloaded
- Find the SaveAsGist extension in the list
- Click **"Inspect views: service worker"** (blue link under the extension)
- In the console that opens, you'll see a box with text like:
  ```
  📋 COPY THIS URL TO YOUR GITHUB OAUTH APP SETTINGS:
  https://abcdefg.chromiumapp.org/
  ```
- **Copy that URL** (the one that looks like `https://xxxxx.chromiumapp.org/`)

**Step 4: Add the callback URL to your GitHub OAuth App**
- Go back to your GitHub OAuth App page from Step 2
- Paste the URL you just copied into **"Authorization callback URL"**
- Click **"Update application"**

**Step 5: Configure the extension with your credentials**
- In the extension folder, copy `config.example.js` to create a new file called `config.js`
- Edit `config.js` and add your Client ID and Client Secret from Step 2:
  ```javascript
  const CONFIG = {
      client_id: 'your_actual_client_id_from_github',
      client_secret: 'your_actual_client_secret_from_github'
  };
  ```
- Also open `manifest.json` and find line 40 where it says `"client_id": "YOUR_CLIENT_ID"`
- Replace `YOUR_CLIENT_ID` with your actual Client ID (same one as above)
- Save both files

**Step 6: Reload and authenticate**
- Go back to `chrome://extensions/`
- Click the reload icon (circular arrow) under the SaveAsGist extension
- Click the extension icon in your Chrome toolbar
- Click **"Authenticate with GitHub"**
- Authorize the application
- Done! You're ready to save gists to YOUR GitHub account!

### Troubleshooting

**"Authorization page could not be loaded"** error?
- Make sure the callback URL in your GitHub OAuth App matches the one from the console exactly
- Make sure you're using an **OAuth App** not a GitHub App
- See [SETUP.md](SETUP.md) for detailed troubleshooting

**Extension won't load?**
- Make sure `config.js` exists (copy from `config.example.js`)
- Make sure both `config.js` and `manifest.json` have the correct Client ID
- Check that Client ID and Secret don't have any extra spaces or quotes

## How to Use

### Method 1: Extension Icon
1. Select any text on a webpage
2. Click the SaveAsGist extension icon in your toolbar
3. The popup opens with your selected text
4. Edit the description and filename if you want
5. Choose public or private
6. Click "Save Note"
7. Get a link to view your new gist!

### Method 2: Right-Click Menu
1. Select any text on a webpage
2. Right-click the selected text
3. Choose **"Save as Gist"** from the menu
4. The popup opens with your selection ready to save
5. Click "Save Note"

### Tips
- ✓ Check "Save with page URL" to include the source URL in your gist
- ✓ Filenames automatically use `.md` extension for Markdown formatting
- ✓ Links in your selected text are converted to Markdown format
- ✓ Click "Logout" in the popup to disconnect your GitHub account

## Privacy & Security

- ✅ Your GitHub credentials are never stored
- ✅ Only an access token is kept locally for API access
- ✅ You can revoke access anytime from [GitHub Settings](https://github.com/settings/applications)
- ⚠️ This is a client-side extension for personal use
- ⚠️ For enhanced security, consider using GitHub's Device Flow (see developer docs)

## Support

Having issues? Check out:
- [SETUP.md](SETUP.md) - Detailed setup and troubleshooting guide
- [GitHub Issues](https://github.com/peterbenoit/SaveAsGist/issues) - Report bugs or request features

## For Developers

Want to contribute or modify this extension? See the development details:

### Project Structure
- `manifest.json` - Extension configuration
- `background.js` - Service worker (OAuth, context menu)
- `popup.html/js/css` - Main UI
- `welcome.html/js/css` - Authentication page
- `config.js` - OAuth credentials (gitignored)

### Recent Updates (v0.0.2)
- Fixed OAuth authentication flow
- Added error handling with user notifications
- Modernized API calls (fetch instead of XMLHttpRequest)
- Implemented right-click context menu
- Added public/private gist toggle
- Added logout functionality
- Implemented Content Security Policy

### Contributing
Pull requests welcome! Fork this repo, make your changes, and submit a PR.

## License

MIT License - feel free to use and modify for your own needs.

---

**Note:** This extension is not affiliated with GitHub. It uses GitHub's official API to create gists on your behalf.
