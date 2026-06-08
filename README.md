# Adaptive Chat Bubble

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
