#!/bin/bash
# package.sh - Bundles SaveAsGist for sharing (excludes sensitive files)

set -e

DIST_DIR="SaveAsGist-dist"
ZIP_FILE="SaveAsGist.zip"

# Clean up any previous build
rm -rf "$DIST_DIR" "$ZIP_FILE"
mkdir -p "$DIST_DIR"

echo "Packaging SaveAsGist..."

# Files and folders to exclude from the bundle
EXCLUDES=(
  "config.js"
  "config.txt"
  ".github"
  ".gitignore"
  ".DS_Store"
  "package.sh"
  "$DIST_DIR"
  "$ZIP_FILE"
  "*.log"
  "node_modules"
  "dist"
  "build"
)

# Build rsync exclude args
EXCLUDE_ARGS=()
for item in "${EXCLUDES[@]}"; do
  EXCLUDE_ARGS+=(--exclude="$item")
done

# Copy all non-excluded files preserving structure
rsync -a "${EXCLUDE_ARGS[@]}" ./ "$DIST_DIR/"

# Write INSTRUCTIONS.md into the bundle
cat > "$DIST_DIR/INSTRUCTIONS.md" << 'EOF'
# Save as Gist — Setup Instructions

This Chrome extension lets you save selected webpage text as private GitHub Gists.

---

## Prerequisites

- Google Chrome (or any Chromium-based browser)
- A GitHub account

---

## Step 1: Create Your GitHub OAuth App

You must create your own OAuth app — this links the extension to **your** GitHub account.

1. Go to [https://github.com/settings/developers](https://github.com/settings/developers)
2. Click **OAuth Apps** → **New OAuth App**
3. Fill in:
   - **Application name**: Save as Gist (or anything you like)
   - **Homepage URL**: `https://github.com`
   - **Authorization callback URL**: Leave blank for now — you'll fill this in after Step 2
4. Click **Register application**
5. On the next page, note your **Client ID**
6. Click **Generate a new client secret** and copy the secret immediately (it won't be shown again)

---

## Step 2: Load the Extension in Chrome

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable **Developer mode** using the toggle in the top-right corner
3. Click **Load unpacked** and select this folder (`SaveAsGist-dist/src/`)
4. The extension will appear in your list — find it and click **"service worker"** (blue link)
5. In the console that opens, look for a message like:
   ```
   📋 COPY THIS URL TO YOUR GITHUB OAUTH APP SETTINGS:
   https://abcdefghij.chromiumapp.org/
   ```
6. Copy that URL

---

## Step 3: Finish the OAuth App Setup

1. Go back to your OAuth App on GitHub (from Step 1)
2. Paste the `chromiumapp.org` URL into **Authorization callback URL**
3. Click **Update application**

Also update the `client_id` in `manifest.json` to match the Client ID from Step 1.

---

## Step 4: Configure the Extension

1. In the extension folder, copy `src/config/config.example.js` to `src/config/config.js`:
   ```bash
   cp src/config/config.example.js src/config/config.js
   ```
2. Open `src/config/config.js` and replace the placeholders:
   ```js
   const CONFIG = {
       client_id: 'YOUR_CLIENT_ID_HERE',      // from Step 1
       client_secret: 'YOUR_CLIENT_SECRET_HERE' // from Step 1
   };
   ```
3. Also update `src/manifest.json` — find the `oauth2` section and replace `client_id` with your own.

---

## Step 5: Reload and Authenticate

1. Go back to `chrome://extensions/`
2. Click the **refresh icon** on the SaveAsGist extension
3. Click the extension icon in the toolbar
4. Click **Authenticate with GitHub** and authorize the app

---

## Using the Extension

- **Select text** on any webpage, then click the extension icon to save it as a Gist
- **Right-click** selected text and choose "Save as Gist" from the context menu
- After saving, you'll get a direct link to your new Gist

---

## Troubleshooting

| Problem | Fix |
|--------|-----|
| "Authentication failed" | Double-check your `client_id` and `client_secret` in `src/config/config.js` and `src/manifest.json` |
| Callback URL mismatch | Make sure the `chromiumapp.org` URL in your GitHub OAuth App matches exactly |
| Extension not loading | Ensure Developer mode is on and you selected the right folder |
| No service worker link | Reload the extension from `chrome://extensions/` |

---

## Security Notes

- `src/config/config.js` contains your credentials — **do not share it or commit it to a public repo**
- All gists are saved to **your** GitHub account using your OAuth app
- The extension only requests the `gist` scope — it cannot access your code or other data
EOF

echo "Created INSTRUCTIONS.md"

# Create the zip
zip -r "$ZIP_FILE" "$DIST_DIR" --quiet
echo "Created $ZIP_FILE"

echo ""
echo "Done! Share the file: $ZIP_FILE"
echo "Contents of $DIST_DIR/:"
ls "$DIST_DIR/"
