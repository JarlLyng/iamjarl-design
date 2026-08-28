// <ij-footer app="tonvault" tagline="…">
//
// Renders a site's footer with cross-links to the rest of the portfolio,
// grouped by category so a visitor is offered what they would plausibly want.
//
//   <ij-footer app="tonvault" tagline="An IAMJARL app. Pay once, own it.">
//     <a slot="links" href="/privacy">Privacy</a>
//     <a slot="links" href="/support">Support</a>
//     <p>© 2026 TonVault</p>   <!-- unslotted: the pre-upgrade fallback -->
//   </ij-footer>
//
// Anything without slot="links" is deliberately not rendered. Custom elements
// show their own children until they upgrade, so that content is what a visitor
// sees if this script never loads — a plainer footer rather than none.

import { selectLinks } from './select-links.js';
import { REGISTRY } from './registry.js';

const STYLE = `
:host {
  /* The host page wins if it has tokens; otherwise fall back to the system's
     own values. Never import tokens.shadow.css here — its :host declarations
     would beat the page's and override the site's chosen mode. */
  --_text:    var(--ij-color-text-secondary, rgba(0, 0, 0, 0.70));
  --_heading: var(--ij-color-text-primary,   rgba(0, 0, 0, 1));
  --_link:    var(--ij-color-text-secondary, rgba(0, 0, 0, 0.70));
  --_hover:   var(--ij-color-primary,        #A435D2);
  --_border:  var(--ij-color-border-subtle,  rgba(0, 0, 0, 0.10));
  --_gap:     var(--ij-spacing-md,  12px);
  --_gap-lg:  var(--ij-spacing-xxl, 24px);
  --_size:    var(--ij-font-size-sm, 14px);
  --_focus:   var(--ij-focus-width,  2px);
  --_offset:  var(--ij-focus-offset, 2px);

  display: block;
  color: var(--_text);
  font-size: var(--_size);
  line-height: var(--ij-line-height-sm, 20px);
}

/* Only for hosts with no token layer at all — a site that defines --ij-*
   already carries its own mode and must not be second-guessed here. */
@media (prefers-color-scheme: dark) {
  :host {
    --_text:    var(--ij-color-text-secondary, rgba(255, 255, 255, 0.75));
    --_heading: var(--ij-color-text-primary,   rgba(255, 255, 255, 1));
    --_link:    var(--ij-color-text-secondary, rgba(255, 255, 255, 0.75));
    --_hover:   var(--ij-color-primary,        #D0FF00);
    --_border:  var(--ij-color-border-subtle,  rgba(255, 255, 255, 0.12));
  }
}

.footer { border-top: 1px solid var(--_border); padding-top: var(--_gap-lg); }
.tagline { color: var(--_heading); margin: 0 0 var(--_gap); }
.row { display: flex; flex-wrap: wrap; gap: var(--_gap) var(--_gap-lg); margin: 0 0 var(--_gap-lg); }

.group-label {
  font-size: var(--ij-font-size-xs, 12px);
  font-weight: var(--ij-font-weight-semibold, 600);
  letter-spacing: 0.05em;
  text-transform: uppercase;
  opacity: var(--ij-opacity-muted, 0.65);
  margin: 0 0 var(--_gap);
}

a, ::slotted(a) {
  color: var(--_link);
  text-decoration: none;
  border-bottom: 1px solid transparent;
}
a:hover, ::slotted(a:hover) { color: var(--_hover); border-bottom-color: currentColor; }
a:focus-visible, ::slotted(a:focus-visible) {
  outline: var(--_focus) solid var(--_hover);
  outline-offset: var(--_offset);
  border-radius: var(--ij-radius-sm, 8px);
}
.platform { opacity: var(--ij-opacity-muted, 0.65); }

@media (max-width: 480px) { .row { gap: var(--_gap); } }
`;

const escape = s => String(s).replace(/[&<>"]/g, c =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

const linkHtml = app =>
  `<a href="${escape(app.url)}">${escape(app.name)}` +
  (app.platform ? ` <span class="platform">(${escape(app.platform)})</span>` : '') +
  `</a>`;

export class IjFooter extends HTMLElement {
  static observedAttributes = ['app', 'tagline'];

  connectedCallback() {
    this.render();
  }

  attributeChangedCallback() {
    if (this.shadowRoot) this.render();
  }

  render() {
    const app = this.getAttribute('app');
    let selection;
    try {
      selection = selectLinks(REGISTRY, app);
    } catch (err) {
      // A wrong or missing app id must not blank the footer. Attaching a shadow
      // root hides unslotted light DOM, so bail out BEFORE attaching one and the
      // pre-upgrade fallback keeps standing.
      console.error('[ij-footer]', err.message);
      return;
    }

    if (!this.shadowRoot) this.attachShadow({ mode: 'open' });

    const { siblings, topUp, always } = selection;
    const related = [...siblings, ...topUp];
    const tagline = this.getAttribute('tagline');

    this.shadowRoot.innerHTML = `
      <style>${STYLE}</style>
      <footer class="footer">
        ${tagline ? `<p class="tagline">${escape(tagline)}</p>` : ''}
        <div class="row"><slot name="links"></slot></div>
        <nav aria-labelledby="more">
          <p class="group-label" id="more">More from IAMJARL</p>
          <div class="row">${related.map(linkHtml).join('')}</div>
          <div class="row">${always.map(linkHtml).join('')}</div>
        </nav>
      </footer>`;
  }
}

if (!customElements.get('ij-footer')) customElements.define('ij-footer', IjFooter);
