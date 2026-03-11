# GitHub OAuth Setup Instructions

## The "Authorization page could not be loaded" Error

This error occurs when the GitHub OAuth app doesn't have the correct redirect URI configured. Follow these steps to fix it:

## Step 1: Get Your Extension's Redirect URL

1. Load your extension in Chrome (`chrome://extensions/`)
2. Make sure Developer mode is enabled
3. Click "Inspect views: service worker" under your extension
4. In the console that opens, you'll see a log message like:
   ```
   Redirect URL: https://YOUR_EXTENSION_ID.chromiumapp.org/
   ```
5. **Copy this entire URL** - you'll need it in the next step

## Step 2: Configure Your GitHub OAuth App

1. Go to your GitHub OAuth App settings:
   - Visit https://github.com/settings/developers
   - Click on your "SaveAsGist" OAuth App (or create one if you haven't)

2. Update the following fields:
   - **Application name**: SaveAsGist (or whatever you prefer)
   - **Homepage URL**: `https://github.com/peterbenoit/SaveAsGist` (or your repo URL)
   - **Authorization callback URL**: Paste the redirect URL from Step 1
     - Example: `https://abcdefghijklmnop.chromiumapp.org/`
     - ⚠️ Make sure to include the trailing slash `/`

3. Click "Update application"

4. Copy your **Client ID** and **Client Secret**

## Step 3: Update Your Extension Config Files

### Update `src/config/config.js`:
```javascript
const CONFIG = {
    client_id: 'YOUR_ACTUAL_CLIENT_ID_FROM_GITHUB',
    client_secret: 'YOUR_ACTUAL_CLIENT_SECRET_FROM_GITHUB'
};

export default CONFIG;
```

### Update `src/manifest.json`:

Find the `oauth2` section and update the `client_id`:
```json
"oauth2": {
    "client_id": "YOUR_ACTUAL_CLIENT_ID_FROM_GITHUB",
    "scopes": ["gist"]
}
```

⚠️ **Important**: Both files need the same Client ID!

## Step 4: Reload and Test

1. Go back to `chrome://extensions/`
2. Click the reload icon under your extension
3. Click "Inspect views: service worker" again to see the console
4. Click your extension icon and try to authenticate
5. Check the console for the redirect URL log (to confirm it matches GitHub)

## Troubleshooting

### Still getting the error?

1. **Double-check the redirect URI** in GitHub OAuth app settings
   - Must match exactly what's logged in the console
   - Must include `https://` and trailing `/`

2. **Make sure Client ID matches** in both:
   - `src/config/config.js`
   - `src/manifest.json` (oauth2.client_id)

3. **Check the console** for error messages:
   - Open DevTools on the extension popup (right-click popup → Inspect)
   - Check service worker console (Inspect views: service worker)

4. **Try these commands** in the service worker console:
   ```javascript
   chrome.identity.getRedirectURL()  // Should return your redirect URL
   ```

### Common Issues:

- **Wrong extension ID**: If you reload the unpacked extension, the ID might change. Get the new redirect URL and update GitHub.
- **Missing trailing slash**: GitHub callback URLs are strict about the format.
- **Client ID mismatch**: Make sure the same client_id is in both src/config/config.js and src/manifest.json.

## Alternative: Using GitHub Device Flow (More Secure)

For a more secure approach that doesn't require client_secret in your code, consider implementing GitHub's Device Flow. See [GitHub Device Flow documentation](https://docs.github.com/en/developers/apps/building-oauth-apps/authorizing-oauth-apps#device-flow).
