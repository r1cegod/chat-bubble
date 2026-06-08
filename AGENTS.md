# AGENTS.md - Chat Bubble Project

This folder is the active local workspace for the adaptive chat bubble project.

Durable project knowledge lives in the Obsidian vault:

- Vault root: `D:/ANHDUC/ADUC_vault/ADUC`
- Project router: `D:/ANHDUC/ADUC_vault/ADUC/projects/art/README.md`
- Main plan: `D:/ANHDUC/ADUC_vault/ADUC/projects/art/notes/adaptive-chat-bubble-build-plan.md`

Before answering or changing this project, read:

```text
D:/ANHDUC/ADUC_vault/ADUC/AGENTS.md
  -> context/hot.md
  -> duc-os.md
  -> projects/art/README.md
  -> projects/art/notes/adaptive-chat-bubble-build-plan.md
```

Current implementation decision:

```text
Krita art kit -> HTML/CSS/JS renderer -> browser preview -> OBS Browser Source -> later YouTube adapter
```

Project constraints:

- Avatar is mandatory.
- Major visual parts should remain separate assets/layers.
- Message body stretches; avatar, fixed corners, cloud cap, and decorations stay fixed.
- Version 1 is data-driven but not connected to YouTube yet.
- Keep YouTube integration as a later adapter that feeds `BubbleInput`.
- Review layout in browser first; use OBS only after browser layout passes.

Working files should live here:

- `index.html`
- `styles.css`
- `bubble.js`
- `test-cases.json`
- `assets/`
- `presets/`
- `tests/`

Current art reference:

- `chatbubble_style_sheet.png`

Always update the vault before finishing durable project work.
