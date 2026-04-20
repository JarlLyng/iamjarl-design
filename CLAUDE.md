# IAMJARL Design System — AI Instructions

This repo is a shared design system. All IAMJARL apps and websites MUST use these tokens. No hardcoded colors, spacing, or radius values.

## Source files
- `tokens.json` — single source of truth for all design tokens
- `design.md` — design rules, UI recipes, and non-negotiables

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
DesignTokens.Common.Text.primary(scheme)
DesignTokens.Common.Background.app(scheme)
DesignTokens.Common.Border.subtle(scheme)
DesignTokens.Common.OnPrimary.text(scheme)

// State colors (not mode-dependent)
DesignTokens.ColorToken.State.success
DesignTokens.ColorToken.State.error

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
Use `var(--color-primary)`, `var(--spacing-md)`, `var(--radius-lg)`, `var(--shadow-md)`, `var(--duration-normal)`, `var(--easing-standard)`, `var(--focus-width)`, etc.

For manual mode switching, add class `.light` or `.dark` to a parent element.

TypeScript:
```typescript
import {
  colors, spacing, radius, typography,
  shadows, shadowCss,
  motion, easingCss,
  breakpoints, focus
} from '@iamjarl/design-tokens';
```

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

## UI recipes
- **Primary button**: bg=`primary`, text=`onPrimary`, radius=`md`, padding=`spacing.md`/`spacing.xl`
- **Secondary button**: bg=`background.card`, border=`border.subtle`, text=`text.primary`
- **Destructive button**: bg=`error`, text=`onError`
- **Cards**: bg=`background.card`, border=`border.subtle`, radius=`lg`

## Updating the design system
If a project needs a new token, do NOT invent one locally. Update `tokens.json` in this repo first, bump `meta.version`, then update the dependency in consuming projects.
