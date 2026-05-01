# Migration Guide

Step-by-step instructions for updating consumer projects between versions.

---

## v0.3.x → v0.4.0

### What changed
1. **Error color updated**: `#FF3B30` → `#D70015` for WCAG AA compliance with white text.
2. **`package.json` is now ESM** with proper `.js` + `.d.ts` artifacts. Runtime entry moved from `.ts` to `.js`.

### Who needs to migrate
- ✅ **SwiftUI projects** — just bump the SPM version. Visual change: error red is slightly darker.
- ⚠️ **React/Expo projects** — bump version. If you imported from the `.ts` source directly (rare), switch to the package's main export.
- ✅ **CSS-only projects** — bump version, no other changes.

### Action
- **SPM**: Xcode → File → Packages → Update to Latest Package Versions
- **npm**: `npm update @iamjarl/design-tokens` (or update the `from:` version in your manifest)
- Visually verify destructive UI in light + dark mode — red is slightly deeper.

If you previously imported via:
```ts
import { colors } from '@iamjarl/design-tokens/dist/ts/tokens.ts';  // ❌ deep import
```
switch to the package main export:
```ts
import { colors } from '@iamjarl/design-tokens';  // ✅ uses exports map
```

---

## v0.2.x → v0.3.0

**Status: Breaking change for web/CSS consumers only.** SwiftUI and TypeScript imports are unaffected.

### What changed
All CSS custom properties have been prefixed with `--ij-` to prevent collisions with third-party libraries (Tailwind, UI kits, etc.).

### Who needs to migrate
- ✅ **SwiftUI projects** — no changes needed
- ⚠️ **React web projects using CSS variables** — must update all `var(--*)` references
- ✅ **React/Expo projects using TS imports** — no changes needed (TS API is unchanged)

### CSS find & replace

In your project, find and replace these patterns:

| Old | New |
| --- | --- |
| `var(--color-` | `var(--ij-color-` |
| `var(--spacing-` | `var(--ij-spacing-` |
| `var(--radius-` | `var(--ij-radius-` |
| `var(--font-` | `var(--ij-font-` |
| `var(--line-height-` | `var(--ij-line-height-` |
| `var(--shadow-` | `var(--ij-shadow-` |
| `var(--duration-` | `var(--ij-duration-` |
| `var(--easing-` | `var(--ij-easing-` |
| `var(--breakpoint-` | `var(--ij-breakpoint-` |
| `var(--focus-` | `var(--ij-focus-` |

### One-liner (macOS/Linux)

From your project root:

```bash
# Preview changes (dry run)
grep -rn "var(--" src/ --include="*.css" --include="*.scss" --include="*.tsx" --include="*.ts"

# Apply changes (creates .bak files first)
find src -type f \( -name "*.css" -o -name "*.scss" -o -name "*.tsx" -o -name "*.ts" \) \
  -exec sed -i.bak -E 's/var\(--(color|spacing|radius|font|line-height|shadow|duration|easing|breakpoint|focus)-/var(--ij-\1-/g' {} +

# Verify, then delete backups
find src -name "*.bak" -delete
```

### Example diff

```diff
.button {
-  background: var(--color-primary);
-  color: var(--color-on-primary);
-  border-radius: var(--radius-md);
-  padding: var(--spacing-md) var(--spacing-xl);
-  box-shadow: var(--shadow-md);
-  transition: transform var(--duration-fast) var(--easing-standard);
+  background: var(--ij-color-primary);
+  color: var(--ij-color-on-primary);
+  border-radius: var(--ij-radius-md);
+  padding: var(--ij-spacing-md) var(--ij-spacing-xl);
+  box-shadow: var(--ij-shadow-md);
+  transition: transform var(--ij-duration-fast) var(--ij-easing-standard);
}
```

### After migrating

1. Run your project's build / dev server
2. Visually verify key screens in light + dark mode
3. Update your project's lockfile to v0.3.0

---

## Pre-v0.2.0

Earlier versions had no breaking changes. Patch and minor bumps were color/value tweaks only — safe to update by re-running `npm update` or Xcode's "Update Package Versions".
