# IAMJARL Design System — AI Instructions

This repo is a shared design system. All IAMJARL apps and websites MUST use these tokens. No hardcoded colors, spacing, or radius values.

## Boundaries: work only in this repo

- Commit, push and open pull requests **only in this repo**. Never edit, commit to, push to or
  open a pull request in a consumer repo (any app, site or the portfolio hub), even when a
  release here makes a change there obvious.
- To ask a consumer to adopt something, **open an issue in that repo**: what changed, the one
  line to change, how to verify. A "no" is a real answer.
- Consumers ask this repo for things the same way, through issues here.
- If a task seems to need a change in another repo, stop, open the issue, and carry on with what
  this repo can do.

The strategy behind this repo lives in the private hub,
[iamjarl-strategy](https://github.com/JarlLyng/iamjarl-strategy): `DESIGN.md` is the design strategy
this repo implements, `VOICE.md` the voice, and `CONVENTIONS.md` the rules that span repos, including
the one above.

## Source files
- `tokens.json` — single source of truth for all design tokens
- `design.md` — design rules, UI recipes, and non-negotiables
- `COMPONENTS.md` — proposal for a components layer; read before adding any component

## Install as a dependency

### SwiftUI (iOS / macOS / watchOS / tvOS)
Add via Swift Package Manager:
```
https://github.com/jarllyng/iamjarl-design.git
```
Then:
```swift
import IAMJARLDesignTokens

// Mode-aware colors (pass @Environment(\.colorScheme) var scheme)
DesignTokens.Common.primary(scheme)
DesignTokens.Common.primaryHover(scheme)     // also primaryPressed, primarySubtle
DesignTokens.Common.Text.primary(scheme)
DesignTokens.Common.Text.disabled(scheme)
DesignTokens.Common.Background.app(scheme)
DesignTokens.Common.Background.disabled(scheme)
DesignTokens.Common.Border.subtle(scheme)
DesignTokens.Common.OnPrimary.text(scheme)

// State colors as TEXT/foreground (mode-aware, WCAG AA on background.app)
DesignTokens.Common.State.error(scheme)      // also success, warning

// State colors as FILLS (not mode-dependent; always pair with on* color)
DesignTokens.ColorToken.State.success
DesignTokens.ColorToken.State.error

// Stacking & opacity
DesignTokens.ZIndex.modal       // 1300
DesignTokens.Opacity.disabled   // 0.4

// Layout
DesignTokens.Spacing.md   // 12pt
DesignTokens.Radius.lg    // 16pt

// Typography
DesignTokens.Typography.Size.base   // 16pt
DesignTokens.Typography.Weight.semibold

// Shadows
let s = DesignTokens.Shadow.md  // Value(x, y, blur, opacity)
.shadow(color: .black.opacity(s.opacity), radius: s.blur, x: s.x, y: s.y)

// Motion
DesignTokens.Motion.Duration.normal       // 0.25
DesignTokens.Motion.Easing.standard()     // Animation

// Breakpoints (adaptive layouts)
DesignTokens.Breakpoint.md  // 768

// Focus ring
DesignTokens.Focus.width   // 2
DesignTokens.Focus.offset  // 2
```

### React web
```bash
npm install github:jarllyng/iamjarl-design
```
CSS custom properties (auto light/dark via `prefers-color-scheme`):
```css
@import '@iamjarl/design-tokens/css';
```
All CSS variables are prefixed with `--ij-` to avoid collisions. Use `var(--ij-color-primary)`, `var(--ij-color-primary-hover)`, `var(--ij-color-state-error)` (state text), `var(--ij-color-text-disabled)`, `var(--ij-spacing-md)`, `var(--ij-radius-lg)`, `var(--ij-shadow-md)`, `var(--ij-duration-normal)`, `var(--ij-easing-standard)`, `var(--ij-focus-width)`, `var(--ij-z-modal)`, `var(--ij-opacity-disabled)`, etc.

For manual mode switching, add class `.light` or `.dark` to a parent element.

TypeScript:
```typescript
import {
  colors, spacing, radius, typography,
  shadows, shadowCss,
  motion, easingCss,
  breakpoints, focus,
  zIndex, opacity
} from '@iamjarl/design-tokens';
```

### Chrome extension (Manifest V3)
```bash
npm install github:jarllyng/iamjarl-design
```
- **Popup/options/sidepanel**: link `dist/css/tokens.css`. Use `--ij-breakpoint-popup` (320px) for popup width.
- **Content scripts with Shadow DOM**: import `@iamjarl/design-tokens/css/shadow` (`:host`-scoped variant) instead of the regular CSS to avoid host page collisions.
- **Background/service worker**: import from `@iamjarl/design-tokens` for color values.
- Remember to declare CSS files in `web_accessible_resources` if accessed from content scripts.

### Expo / React Native
```bash
npm install github:jarllyng/iamjarl-design
```
```typescript
import { colors, spacing, radius, typography } from '@iamjarl/design-tokens';
import { useColorScheme } from 'react-native';

const scheme = useColorScheme() ?? 'light';
const theme = colors[scheme]; // theme.primary, theme.text.primary, etc.
```

## Rules (non-negotiable)
1. Never hardcode colors — always use tokens
2. Always support light + dark mode
3. Use `onPrimary` for text/icons on `primary` backgrounds (same for onSuccess, onWarning, onError)
4. Use `error` (not `primary`) for destructive actions
5. Use Phosphor icons, default weight `regular`, sizes 20 (inline) or 24 (primary actions)
6. Keep corner radius consistent — use `radius.sm/md/lg` only
7. State colors: shared `success/warning/error` are **fills** (pair with `on*`). For colored **text** on a normal background use the mode-aware `state.*` tokens — never a raw fill color as text.
8. Don't hand-roll hover/pressed/disabled — use `primaryHover`/`primaryPressed`, `text.disabled`/`background.disabled`, or `opacity.disabled`.
9. Stacking: use the `zIndex` scale (`modal`, `popover`, `toast`, …), never magic numbers.

## UI recipes
- **Primary button**: bg=`primary` (hover `primaryHover`, pressed `primaryPressed`), text=`onPrimary`, radius=`md`, padding=`spacing.md`/`spacing.xl`; disabled=`background.disabled`+`text.disabled`
- **Secondary button**: bg=`background.card`, border=`border.subtle`, text=`text.primary`
- **Destructive button**: bg=`error`, text=`onError`
- **Inline validation text**: color=`state.error` / `state.success` / `state.warning` (mode-aware)
- **Cards**: bg=`background.card`, border=`border.subtle`, radius=`lg`

## Updating the design system

If a consumer needs a token that does not exist, do not invent one locally, and do not edit this
repo from the consumer's session. Open an issue here describing the need.

A session working in this repo adds the token, bumps `meta.version` and releases. It then opens
an issue in each consumer that should adopt the change, with the one line to change and how to
verify. It does not edit the consumers.
