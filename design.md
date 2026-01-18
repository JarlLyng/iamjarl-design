# IAMJARL Design System (v0.1.1)

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

#### Semantic usage
- `primary` is an accent color and must always be paired with a semantic on-color.
- Never guess text color on top of colored backgrounds.
- Use the following rules:
  - `primary` → use `onPrimary` for text and icons
  - `success` → use `onSuccess`
  - `warning` → use `onWarning`
  - `error` → use `onError`

### Typography
- Default UI font: system-ui (platform native)
- Keep type scale minimal and consistent.
- Prefer semibold for headings, regular for body.

### Icons (Phosphor)
- Icon set: **Phosphor**
- Default icon weight: **regular**
- Allowed weights: thin, light, regular, bold, fill, duotone

#### Usage rules
- Use **regular** weight for all core UI by default.
- Use **duotone** only for highlights, illustrations, or special emphasis — never for core navigation or standard actions.
- Avoid mixing different icon weights within the same screen or component.

#### Sizes
- **20** → inline actions (toolbars, list rows, secondary actions)
- **24** → primary actions, navigation, empty states

#### Color
- Icons should be single-color.
- Default icon color:
  - Use `text.primary` from the current color mode.
- Active or emphasized icons:
  - May use `primary`.
- Destructive actions:
  - Use `error`.

Icons should communicate meaning, not decoration. If an icon does not add clarity, omit it.

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

6. **Always use semantic on-colors for contrast**.
   - Never place `text.primary` or `text.inverse` directly on `primary`, `success`, `warning`, or `error`.
   - Always use the matching `on*` token.
7. **If contrast is uncertain, default to maximum contrast**.
   - Black text on bright colors.
   - White text on dark colors.

## Implementation Guidance

### Token mapping
- `primary` -> main CTAs, progress bars, links, toggles
- `background.muted` / `background.card` -> cards, sections, subtle containers
- `text.primary` -> main text
- `text.secondary` -> helper text / labels
- `border.subtle` -> separators (use sparingly)

### Accessibility
- Primary must not be used for long text paragraphs.
- All text/background combinations must meet WCAG 2.1 AA contrast:
  - 4.5:1 for normal text
  - 3:1 for large text (≥ 18pt regular / 14pt bold)
- For text or icons on colored backgrounds:
  - Always use semantic on-colors (`onPrimary`, `onSuccess`, `onWarning`, `onError`).
  - Never guess or invert colors manually.

### UI Recipes (Canonical)

#### Primary Button
- Background: `primary`
- Text / Icon: `onPrimary`
- Radius: `radius.md`
- Padding: `spacing.md` (vertical) / `spacing.xl` (horizontal)

#### Secondary Button
- Background: `background.card`
- Border: `border.subtle`
- Text / Icon: `text.primary`

#### Destructive Button
- Background: `error`
- Text / Icon: `onError`

## Cursor usage
When starting a new project:
- Read `tokens.json` and implement design tokens in the project.
- Create a local file like:
  - iOS/macOS (SwiftUI): `DesignTokens.swift`
  - React Native: `src/constants/design.ts`
  - Web: `tokens.css` or `tailwind.config.js` mapping
- Never invent new colors unless the design system is updated first.