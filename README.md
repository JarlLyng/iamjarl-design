# iamjarl-design

Shared design system for all IAMJARL products (apps + web).

## What’s inside
- `tokens.json` — single source of truth (colors, spacing, radius, typography, icons)
- `design.md` — principles + rules (great for Cursor prompts)
- `index.html` — human-friendly viewer

## How to use in a new project (Cursor)
1. Give Cursor these links:
   - `tokens.json`
   - `design.md`
2. Ask Cursor to create local tokens (Swift/TS/CSS) based on `tokens.json`.
3. Build UI using tokens only (no hardcoded values).

## Updating
- Change `tokens.json`
- Commit + push
- In each app: provide updated link to Cursor and ask it to sync tokens.

## Hosting
This repo is meant to be hosted on GitHub Pages.