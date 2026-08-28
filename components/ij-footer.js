// <ij-footer app="tonvault" tagline="…" layout="stacked|columns">
//
// Renders a site's footer with cross-links to the rest of the portfolio,
// grouped by category so a visitor is offered what they would plausibly want.
//
//   <ij-footer app="tonvault" tagline="An IAMJARL app. Pay once, own it.">
//     <a slot="links" href="/privacy">Privacy</a>
//     <a slot="links" href="/support">Support</a>
//     <p slot="fineprint">© 2026 IAMJARL. Not affiliated with Elektron.</p>
//     <p>© 2026 TonVault</p>   <!-- unslotted: the pre-upgrade fallback -->
//   </ij-footer>
//
// Two slots, because a footer has two kinds of per-site content: the site's own
// links, and the colophon — copyright, legal disclaimers, attribution. Both
// reference footers in the portfolio have that second region, and without a slot
// for it a consuming site would silently lose its legal text on upgrade.
//
// Anything in neither slot is deliberately not rendered. Custom elements show
// their own children until they upgrade, so that content is what a visitor sees
// if this script never loads — a plainer footer rather than none.
//
// layout="stacked" (default) is the WODrounds shape: groups above one another,
// links flowing inline. layout="columns" is the Wean Nicotine shape: a grid of
// groups with links stacked under each heading.

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
  --_gap:     var(--ij-spacing-sm,   8px);
  --_gap-md:  var(--ij-spacing-lg,  16px);
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
.tagline { color: var(--_heading); margin: 0 0 var(--_gap-lg); }

/* A quiet label, not a shouted one. Both reference footers in the portfolio use
   sentence case at normal weight — no uppercase, no letter-spacing. */
.label {
  color: var(--_heading);
  opacity: var(--ij-opacity-muted, 0.65);
  margin: 0 0 var(--_gap);
}

.groups { display: grid; gap: var(--_gap-lg); margin-bottom: var(--_gap-lg); }
.links { display: flex; flex-wrap: wrap; gap: var(--_gap) var(--_gap-md); }

/* Wean Nicotine's shape: a grid of groups, links stacked under each heading. */
:host([layout="columns"]) .groups {
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: var(--_gap-lg) var(--_gap-lg);
}
:host([layout="columns"]) .links { flex-direction: column; gap: var(--_gap); }

.fineprint { opacity: var(--ij-opacity-muted, 0.65); }
.fineprint ::slotted(*) { margin: 0; }

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

@media (max-width: 480px) {
  :host([layout="columns"]) .groups { grid-template-columns: 1fr; }
}
`;

const escape = s => String(s).replace(/[&<>"]/g, c =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// Name only. Neither reference footer annotates links with a platform, and the
// suffix turned a scannable list into noise.
const linkHtml = app => `<a href="${escape(app.url)}">${escape(app.name)}</a>`;

export class IjFooter extends HTMLElement {
  static observedAttributes = ['app', 'tagline', 'layout', 'links-label'];

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

    const { self, siblings, topUp, always } = selection;
    // One group, not two rows. Made by Human and All projects belong with the
    // apps, the way both reference footers have them.
    const related = [...siblings, ...topUp, ...always];
    const tagline = this.getAttribute('tagline');
    const ownLabel = this.getAttribute('links-label') ?? self.name;

    this.shadowRoot.innerHTML = `
      <style>${STYLE}</style>
      <footer class="footer">
        ${tagline ? `<p class="tagline">${escape(tagline)}</p>` : ''}
        <div class="groups">
          <div class="group">
            <p class="label">${escape(ownLabel)}</p>
            <div class="links"><slot name="links"></slot></div>
          </div>
          <nav class="group" aria-labelledby="more">
            <p class="label" id="more">More from IAMJARL</p>
            <div class="links">${related.map(linkHtml).join('')}</div>
          </nav>
        </div>
        <div class="fineprint"><slot name="fineprint"></slot></div>
      </footer>`;
  }
}

if (!customElements.get('ij-footer')) customElements.define('ij-footer', IjFooter);
