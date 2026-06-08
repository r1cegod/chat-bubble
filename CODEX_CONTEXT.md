# Codex Context

This folder is the active workspace for the adaptive chat bubble.

Current project root:

```text
D:/Downloads/emoji/chat bubble
```

Vault source of truth:

```text
D:/ANHDUC/ADUC_vault/ADUC/projects/art/notes/adaptive-chat-bubble-build-plan.md
```

Current decision:

```text
Krita art kit -> HTML/CSS/JS renderer -> browser preview -> OBS Browser Source -> later YouTube adapter
```

Current state:

- Avatar is mandatory.
- Art reference exists: `chatbubble_style_sheet.png`.
- Major visual parts are separated in Krita layers.
- Guide lines mark padding and fixed-corner regions.
- The renderer should assume an avatar-present layout.
- YouTube wiring is later; version 1 is a stable renderer fed by test/manual data.

Planned renderer files:

- `index.html`
- `styles.css`
- `bubble.js`
- `test-cases.json`
- `assets/export/`

Input shape:

```js
{
  name: "ricy_rice",
  role: "member",
  message: "Hawoo hewoo haiii",
  avatar: "assets/export/avatar.png"
}
```

Review loop:

1. Edit in VS Code.
2. Run a local dev server.
3. Review in browser with test cases.
4. Add to OBS as Browser Source only after browser layout passes.

Codex note:

The original conversation may not visually appear inside this folder because thread history is managed by the Codex app. This file, `AGENTS.md`, and the vault note are the durable context bridge.
