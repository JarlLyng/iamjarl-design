# Checking the components

Most of this is automated now. `node scripts/test-browser.js` drives real Chrome over the DevTools
protocol, with no npm dependency, and runs in PR CI:

- **`<ij-nav>`** — landmark, sticky, translucency and its reduced-transparency fallback, focus order
  on wide and narrow screens, the skip link, `aria-current`, the disclosure (Enter, Tab into the
  menu, Escape, click outside, widening the window), `cta-after`, the rule warnings, the minimal
  case, and the pre-upgrade state.
- **`<ij-footer>`** — checks 5 and the alignment hook below.

What a headless browser cannot judge is whether it looks right. For that, serve the same fixtures
and open them:

```bash
node scripts/build.js
node scripts/test-browser.js --serve   # prints a URL per fixture
```

## Manual checks for `<ij-footer>`

Run before a release that touches the footer. **Automated** marks the ones CI now covers.

| # | Check | Expected |
|---|---|---|
| 1 | Host **with** `--ij-` tokens | Links use the host's colours, not the component's fallbacks |
| 2 | Host with tokens **and** a pinned `.light` class, OS in dark mode | Renders **dark text on light** — follows the site, not the OS |
| 3 | Host with **no** token layer | Renders correctly on the component's own fallbacks |
| 4 | Host with no tokens, OS dark | Component's own dark fallbacks apply |
| 5 | `app="does-not-exist"` | Fallback content stays visible, error in console, footer not blanked — **automated** |
| 6 | Unslotted children with a valid `app` | Hidden after upgrade; `slot="links"` children rendered |
| 7 | Tab through the footer | Focus ring visible on every link |
| 8 | Narrow the viewport below 480px | Links wrap, no horizontal scroll |
| 9 | `slot="fineprint"` content | Rendered below the links, dimmed |
| 10 | `layout="columns"` | Grid of groups; collapses to one column under 480px |

Checks 5 and 9 are the ones that have already caught real bugs. Check 9 exists because the first
draft had no `fineprint` slot at all, so a consuming site's legal text would have vanished on
upgrade — found by comparing against the footers already in the portfolio rather than by testing.

Check 5: attaching the shadow root before validating
the `app` attribute hides the fallback exactly when it is needed. Do not skip it.
