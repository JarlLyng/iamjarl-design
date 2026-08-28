# Manual checks for `<ij-footer>`

CI covers the selection logic, the registry and the built artifact. It does not cover the DOM —
see the testing section in [`COMPONENTS.md`](../COMPONENTS.md). Run this before any release that
touches `components/`.

```bash
node scripts/build.js
mkdir -p /tmp/ijf/dist && cp -r dist/components dist/css /tmp/ijf/dist/
# write a page that loads dist/components/ij-footer.js, then:
cd /tmp/ijf && python3 -m http.server 8777
```

| # | Check | Expected |
|---|---|---|
| 1 | Host **with** `--ij-` tokens | Links use the host's colours, not the component's fallbacks |
| 2 | Host with tokens **and** a pinned `.light` class, OS in dark mode | Renders **dark text on light** — follows the site, not the OS |
| 3 | Host with **no** token layer | Renders correctly on the component's own fallbacks |
| 4 | Host with no tokens, OS dark | Component's own dark fallbacks apply |
| 5 | `app="does-not-exist"` | Fallback content stays visible, error in console, footer not blanked |
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
