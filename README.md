# Adaptive Chat Bubble

[![Release safety](https://github.com/r1cegod/chat-bubble/actions/workflows/release.yml/badge.svg)](https://github.com/r1cegod/chat-bubble/actions/workflows/release.yml)
[![Release behavior](https://github.com/r1cegod/chat-bubble/actions/workflows/release-behavior.yml/badge.svg)](https://github.com/r1cegod/chat-bubble/actions/workflows/release-behavior.yml)

## Local YouTube Overlay

**Download:** [ChatBubble.zip](https://github.com/r1cegod/chat-bubble/releases/latest/download/ChatBubble.zip)

Published releases include `ChatBubble.zip.sha256` for manual integrity
verification. New tagged releases are built on GitHub Actions and published
only after the generated ZIP passes the VirusTotal release gate with zero
malicious and zero suspicious engine results. Each release also includes a
sanitized `release-safety.json` report and a link to the public VirusTotal
result.

## Safe Release Workflow

One-time setup:

1. Revoke the VirusTotal key pasted into chat and create a replacement.
2. Open the repository's **Settings > Secrets and variables > Actions**.
3. Add a repository secret named `VIRUSTOTAL_API_KEY`.

The release ZIP is already public software, and the workflow uploads it to
VirusTotal's public scanning service. Never use this workflow for private
artifacts.

Test the gate without publishing from the GitHub **Actions** tab by running
the **Release safety** workflow manually.

Publish a new release:

1. Put every intended distributed file under `src/server/`.
2. Double-click `RELEASE CHAT.bat`.
3. Press Enter for the default patch bump, or enter `minor`, `major`, or an
   exact version such as `1.1.0`.

The release button automatically includes every tracked, modified, deleted, or
new non-ignored file under `src/server/`. It does not ask you to select files,
and it leaves changes outside `src/server/` untouched. It requires synchronized
`main`, checks GitHub authentication and the VirusTotal secret, performs fast
local syntax checks, bumps both server package files, commits, pushes, tags,
and waits for the pre-publication safety workflow.

The button configures Windows Git to use the authenticated GitHub CLI account
over HTTPS before pushing, so it does not depend on a separate SSH key.

Run a non-destructive readiness check from Command Prompt with:

```bat
"RELEASE CHAT.bat" check
```

The fast **Release safety** workflow runs source checks, production dependency
audits, Windows packaging, checksum verification, and VirusTotal scanning. It
creates the GitHub Release only when every safety gate passes. The slower
**Release behavior** workflow is explicitly dispatched after publication, then
builds the browser preview and smoke-tests the exact published ZIP. This keeps
behavior validation visible without delaying release publication.

The Actions tab is the fastest readout:

- `Release safety` green: package/checksum/dependencies/VirusTotal passed.
- `Release behavior` green: the published ZIP built and served correctly.

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
