# Adaptive Chat Bubble

## Local YouTube Overlay

**Download:** [ChatBubble.zip](https://github.com/r1cegod/chat-bubble/releases/latest/download/ChatBubble.zip)

Published releases include `ChatBubble.zip.sha256` for manual integrity
verification.

Requirements:

- Windows 10 or newer
- Node.js LTS
- Internet access while using YouTube chat

Create the distributable folder:

```text
powershell -ExecutionPolicy Bypass -File src/server/make-release.ps1
```

Send `src/server/release/ChatBubble.zip`. The recipient extracts that archive
and works entirely inside its `ChatBubble` folder. Git and this repository are
not required on the recipient's machine. The release root exposes only
`START CHAT.bat`, `UPDATE CHAT.bat`, `QUICK START.txt`, and one internal files
folder.

First setup:

1. Extract the ZIP.
2. Double-click `START CHAT.bat`.
3. Paste the API key once.
4. Open the livestream on YouTube, click **Share**, click **Copy**, and paste
   the complete link.

The package includes its JavaScript dependencies. If Node.js is missing, the
launcher opens the official Node.js download page and stops; it never installs
software. It copies the OBS URL to the clipboard without opening a hidden
process. `QUICK START.txt` contains the complete recipient instructions.
`UPDATE CHAT.bat` only opens the official GitHub release page and displays
manual replacement instructions.

The local API key is used only with Google's YouTube API. The application has
no analytics, hosted backend, user account, or remote database. Runtime network
access is limited to Google/YouTube, GitHub release pages, the official Node.js
download page when Node is missing, and the local `127.0.0.1` overlay. The
distributed application does not invoke PowerShell or hide background windows.

Active local workspace for the YouTube-targeted adaptive chat bubble.

## Public Preview

The root Vite page is the public renderer preview. It includes two fixed
controls for changing the display name and message:

[Open the live Vercel preview](https://chat-bubble-sandy.vercel.app)

```powershell
npm install
npm run dev
```

Open the URL printed by Vite. The same values can be supplied as URL
parameters:

```text
/?name=ricy_rice&message=hello%20world
```

JavaScript integrations can update the renderer without touching the preview
controls directly:

```js
window.setBubble({
  name: "ricy_rice",
  message: "hello world",
});
```

Production builds use:

```powershell
npm run build
npm run preview
```

Vercel detects the project as Vite and publishes the generated `dist/`
directory.

The plan is:

```text
Krita art kit -> HTML/CSS/JS renderer -> browser preview -> OBS Browser Source -> later YouTube adapter
```

Current art reference:

- `chatbubble_style_sheet.png`

Architecture research:

- `docs/renderer-research.md` - custom renderer decision, docs endpoints, and GitHub references

Planned source files:

- `index.html` - preview and OBS-ready page
- `styles.css` - bubble layout and visual styling
- `bubble.js` - input parsing and `window.setBubble`
- `test-cases.json` - short/normal/long message presets
- `assets/` - exported Krita parts

Current production modules:

- `src/nameplate/nameplate.html` - standalone nameplate renderer preview
- `src/nameplate/nameplate.css` - fixed-height adaptive nameplate layout
- `src/avatarbox/avatarbox.html` / `.css` - fixed circular avatar slot
- `src/messagebox/messagebox.html` / `.css` - CSS-only adaptive message body with fixed cloud cap

Vite live preview:

```powershell
npm install
npm run dev:nameplate
npm run dev:avatarbox
npm run dev:messagebox
npm run dev:renderer
```

If PowerShell says `'vite' is not recognized`, rebuild Node dependencies from PowerShell:

```powershell
Remove-Item -Recurse -Force node_modules
npm install
npm run dev:nameplate
```

Then open the URL Vite prints, usually:

```text
http://127.0.0.1:5173/nameplate.html
```

The assembled message renderer uses:

```text
http://127.0.0.1:5176/message_renderer.html
```

Save changes in `src/nameplate/nameplate.html`, `nameplate.css`, or exported assets to auto-refresh the preview.

Headless screenshot preview for Codex:

```bash
npm run render:messagebox
```

This uses the project-local Playwright Chromium install and writes:

```text
tests/screenshots/messagebox.png
```

Render any running local page with:

```bash
npm run render:page -- http://127.0.0.1:5175/messagebox.html tests/screenshots/custom.png
```

Python venv setup:

```powershell
py -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt
```

The venv is for future utility scripts only. It is not required for Vite live preview.

Vault source of truth:

- `D:/ANHDUC/ADUC_vault/ADUC/projects/art/notes/adaptive-chat-bubble-build-plan.md`

Version 1 should render one avatar-present bubble from data. YouTube chat wiring comes later.
