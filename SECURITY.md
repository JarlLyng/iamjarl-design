# Security Policy

## Supported versions

Security fixes go into the latest release. Every 1.x release is a safe bump (no token or CSS
variable has been renamed or removed since 1.0), so moving to the latest release is how you take a
fix.

| Version | Supported |
| ------- | --------- |
| The latest 1.x release | ✅ |
| Any earlier release | ❌ |

## Reporting a vulnerability

If you discover a security issue, please **do not** open a public issue.

Instead, report it privately via GitHub's security advisory:

1. Go to [Security → Advisories](https://github.com/jarllyng/iamjarl-design/security/advisories/new)
2. Click **Report a vulnerability**
3. Fill in the details

You can expect an initial response within 7 days.

## Scope

The design system ships static values and code that runs. Both are in scope.

- **Code that runs in a visitor's browser.** The web components (`dist/components/ij-footer.js`,
  `ij-nav.js`, `ij-store-cta.js`) and the marketing kit's `dist/kit/kit.js` run as modules on the
  pages that load them. Anything that lets one of them run script, inject markup or send data
  somewhere it shouldn't is in scope.
- **Code that runs on a developer's machine or in CI.** `dist/vendor.mjs` downloads a release,
  writes files into a site's repo and runs `git`. The build-time helpers (`dist/kit/loose.js`,
  `dist/kit/wave.js`) run in a site's build. `scripts/` builds and checks this repo.
- **Integrity.** `dist/sri.json` and the release notes carry a hash for every file a page loads by
  URL. A tagged file that doesn't match its hash is in scope.
- **Supply chain.** What a tag publishes through Swift Package Manager, npm (installed from GitHub)
  and the CDN, including any secret that slips into it.
- **Build and release pipeline.** The GitHub Actions workflows that build, tag, release and warm
  the CDN.

The tokens themselves (`tokens.json`, the CSS custom properties, the Swift and TypeScript values)
are data and don't execute. A wrong value there is a bug, not a vulnerability: report it as an
ordinary issue.

If you find any issue in these areas, please report it as above.
