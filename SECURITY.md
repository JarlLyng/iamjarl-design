# Security Policy

## Supported Versions

Only the latest minor version receives security updates.

| Version | Supported |
| ------- | --------- |
| 0.5.x   | ✅        |
| < 0.5.0 | ❌        |

## Reporting a vulnerability

If you discover a security issue, please **do not** open a public issue.

Instead, report it privately via GitHub's security advisory:

1. Go to [Security → Advisories](https://github.com/jarllyng/iamjarl-design/security/advisories/new)
2. Click **Report a vulnerability**
3. Fill in the details

You can expect an initial response within 7 days.

## Scope

This is a design system distributing static design tokens (colors, spacing, shadows, etc.). The main security concerns are:

- **Supply chain**: accidental publication of secrets via `npm`/SPM
- **Build pipeline**: GitHub Actions running untrusted code
- **Consumer impact**: tokens are static values and do not execute at runtime

If you find any issue in these areas, please report it as above.
