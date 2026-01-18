# iamjarl-design

Shared design system for all IAMJARL products (apps + web).

This repository is the **single source of truth** for colors, typography, spacing, radius and icon usage across all IAMJARL projects.
It is designed to work equally well for **humans** (design overview) and **AI tools like Cursor** (deterministic tokens + rules).

---

## What’s inside
- `tokens.json` — machine-readable design tokens (colors, spacing, radius, typography, icons)
- `design.md` — rules, principles and non-negotiables (Cursor-friendly)
- `index.html` — human-friendly viewer that renders tokens visually
- `templates/` — optional implementation templates (e.g. SwiftUI)
  - `templates/swiftui/DesignTokens.swift`

---

## Cursor start prompt (copy/paste)

Use this when you start a new project or when you want Cursor to sync an existing project with the latest tokens.

```text
You must follow the IAMJARL Design System.

Source of truth:
- Design rules: https://jarllyng.github.io/iamjarl-design/design.md
- Tokens (JSON): https://jarllyng.github.io/iamjarl-design/tokens.json
- Human viewer: https://jarllyng.github.io/iamjarl-design/

Rules:
- Do NOT invent new colors, spacing, radius or typography values.
- Always support light + dark mode using the tokens.
- Use Phosphor icons and follow the icon rules in design.md.
- For colored backgrounds, always use semantic on-colors (onPrimary, onSuccess, onWarning, onError) to ensure sufficient contrast.

Task:
1) Read tokens.json and design.md.
2) Create local design token mappings for this project.
3) Update the UI to use tokens only (no hardcoded values).
4) If there are conflicts, prefer the design system.
```

---

## How to use in a new project

1. Give Cursor these links:
   - `tokens.json`
   - `design.md`

2. Ask Cursor to generate **local design tokens** for the project.
   - iOS / macOS (SwiftUI): copy from `templates/swiftui/DesignTokens.swift` or generate a local `DesignTokens.swift`
   - Web: CSS variables / Tailwind config
   - React Native: `design.ts`

3. Build UI **using tokens only**.
   - No hardcoded colors
   - No ad-hoc spacing or radius values

---

## SwiftUI workflow (recommended)

- Each SwiftUI app should contain its own local `DesignTokens.swift` file.
- That file is generated/mapped from `tokens.json` and follows the rules in `design.md`.
- When the design system changes:
  1. Update `tokens.json` (and/or `design.md`)
  2. Commit + push this repo
  3. Re-run Cursor in the app project with updated links

Reference implementation:

```
templates/swiftui/DesignTokens.swift
```

Treat the Swift file as generated code.

---

## Update checklist (when changing the design system)

Use this checklist whenever you change tokens or rules.

### 1) Make the change
- [ ] Update `tokens.json` (preferred) or `design.md` (rules)
- [ ] Bump `meta.version` in `tokens.json` (patch bump is fine)
- [ ] Update `meta.updated` date in `tokens.json`

### 2) Verify locally
- [ ] Open `index.html` locally and confirm tokens render correctly
- [ ] Sanity check light + dark mode values
- [ ] Confirm the change does not break JSON validity

### 3) Publish
- [ ] Commit with a clear message (e.g. `tokens: adjust primary dark`)
- [ ] Push to GitHub
- [ ] Confirm GitHub Pages reflects the update

### 4) Sync projects
- [ ] For each app/web project: paste the **Cursor start prompt** and ask it to sync tokens
- [ ] Run the app and visually verify key screens in light + dark mode

---

## Hosting

This repo is intended to be hosted on GitHub Pages.

Typical URL:

```
https://jarllyng.github.io/iamjarl-design/
```

This URL is safe to share with Cursor and other tools.