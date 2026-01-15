# IAMJARL Design System (v0.1)

This document defines a shared visual DNA across all IAMJARL apps and web projects.
Use together with `tokens.json` (single source of truth).

## Goals
- Different products, same family feeling
- Low maintenance: update tokens once, apply in each project
- Works in both light and dark mode

## The DNA
### Color
- Primary is a bold neon accent:
  - Light: #00FF7B
  - Dark:  #D0FF00
- UI uses subtle translucent backgrounds (muted/card) instead of heavy borders.
- States are consistent across all products:
  - Success: #4CAF50
  - Error:   #FF3B30
  - Warning: #FF6B35

### Typography
- Default UI font: system-ui (platform native)
- Keep type scale minimal and consistent.
- Prefer semibold for headings, regular for body.

### Icons (Phosphor)
- Icon set: Phosphor
- Default weight: regular
- Default sizes: 20 or 24
- Use icons as meaning, not decoration.

## Rules (non-negotiable)
1. **Do not hardcode colors**.
   - Always read from `tokens.json`.
2. **Always support light + dark mode**.
   - Use `tokens.tokens.colors.modes.light` / `.dark`.
3. **No pure white/black by default**.
   - Use mode tokens for text/background.
4. **Primary is not for destructive actions**.
   - Use `error` for destructive actions.
5. **Keep corner radius consistent**.
   - Use radius tokens (sm/md/lg).

## Implementation Guidance

### Token mapping
- `primary` -> main CTAs, progress bars, links, toggles
- `background.muted` / `background.card` -> cards, sections, subtle containers
- `text.primary` -> main text
- `text.secondary` -> helper text / labels
- `border.subtle` -> separators (use sparingly)

### Accessibility
- Primary must not be used for long text paragraphs.
- For text on primary backgrounds, use:
  - light mode: text.inverse (#FFFFFF) if needed
  - dark mode:  text.inverse (#000000) if needed

## Cursor usage
When starting a new project:
- Read `tokens.json` and implement design tokens in the project.
- Create a local file like:
  - iOS/macOS (SwiftUI): `DesignTokens.swift`
  - React Native: `src/constants/design.ts`
  - Web: `tokens.css` or `tailwind.config.js` mapping
- Never invent new colors unless the design system is updated first.