// <ij-store-cta app="tonvault" placement="hero" locale="en" tone="white">
//   …the generated fragment from dist/store/<app>.<locale>.html…
// </ij-store-cta>
//
// The fragment does the work and needs no JavaScript: badge, campaign link,
// click event and the facts line are in the served HTML, where crawlers and AI
// assistants read them. This element only adjusts it:
//
//   placement  sets data-umami-event-placement, so one fragment serves the hero,
//              a mid-page repeat or the footer. Analytics runs on JavaScript
//              anyway, so the value is right whenever an event can fire.
//   locale     sets data-umami-event-locale.
//   tone       black or white, for a site whose mode does not follow the
//              system — Echolume is always dark. Without it the badge follows
//              the visitor's setting.
//
// Left empty, it renders the fragment itself from the registry, for a site with
// no build step. That copy exists only after JavaScript runs, so crawlers miss
// it; the fragment is the better path where a site can take it.
//
// Light DOM throughout: the badge has to stay in the page, styleable by the site
// and visible to the crawlers it is for.

import { badgeHtml, badgeFile } from './store.js';
import { REGISTRY, BADGE_WIDTHS } from './store-registry.js';

export class IjStoreCta extends HTMLElement {
  static observedAttributes = ['placement', 'locale', 'tone'];

  connectedCallback() {
    if (!this.querySelector('.ij-store')) this.renderFromRegistry();
    this.apply();
  }

  attributeChangedCallback() {
    if (this.isConnected) this.apply();
  }

  renderFromRegistry() {
    const id = this.getAttribute('app');
    const app = REGISTRY.apps.find(a => a.id === id);
    if (!app?.store) {
      console.error('[ij-store-cta]', `no store entry for app "${id}" in apps.json`);
      return;
    }
    const wanted = this.getAttribute('locale') || (document.documentElement.lang || 'en').split('-')[0];
    const code = app.store.locales.includes(wanted) ? wanted : 'en';
    this.innerHTML = badgeHtml(app, code, {
      placement: this.getAttribute('placement') || 'hero',
      badges: { base: new URL('../../badges/', import.meta.url).href, width: f => BADGE_WIDTHS[f] },
    });
  }

  apply() {
    const link = this.querySelector('.ij-store-badge');
    if (!link) return;
    const placement = this.getAttribute('placement');
    if (placement) link.setAttribute('data-umami-event-placement', placement);
    const loc = this.getAttribute('locale');
    if (loc) link.setAttribute('data-umami-event-locale', loc);

    const tone = this.getAttribute('tone');
    if (tone !== 'black' && tone !== 'white') return;
    const img = link.querySelector('img');
    const box = this.querySelector('.ij-store');
    const app = REGISTRY.apps.find(a => a.id === box?.dataset.ijStore);
    if (!img || !app) return;
    const file = badgeFile(app.store.platform, box.dataset.ijStoreLocale || 'en', tone);
    img.src = new URL(file, img.src).href;
    link.querySelector('source')?.remove();
  }
}

if (!customElements.get('ij-store-cta')) customElements.define('ij-store-cta', IjStoreCta);
