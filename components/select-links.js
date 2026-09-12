// Which cross-links does a given site's footer show?
//
// Pure: no DOM, no fetch, no globals. The custom element is a rendering shell
// over this, so the part with actual decisions in it is testable with the
// repo's plain-assertion harness and no browser.

export const DEFAULT_OPTIONS = {
  // Categories with few members would render a near-empty list, so top up from
  // the rest of the registry, least-connected first. See categoryReach below.
  minLinks: 3,
  // Side projects are in the registry so the data is complete, but shipped
  // products are what a footer sells. Flip this to widen the net.
  include: ['shipped'],
};

// How many other apps an app's own category already reaches. An app in a
// two-member category is seen by one footer; one in a four-member category by
// three. Top-up prefers the former, which spreads links towards the apps a
// category cannot reach on its own.
//
// Deliberately computed from the registry and NOT from the result: ranking by
// actual inbound links would make the rule depend on its own output, so two
// runs could disagree and the generated fragments would not be reproducible.
export function categoryReach(apps, app) {
  if (!app.category) return Number.MAX_SAFE_INTEGER;
  return apps.filter(a => a.category === app.category && a.id !== app.id).length;
}

export function selectLinks(registry, siteId, options = {}) {
  const { minLinks, include } = { ...DEFAULT_OPTIONS, ...options };
  const apps = registry?.apps ?? [];

  const self = apps.find(a => a.id === siteId);
  if (!self) {
    throw new Error(
      `Unknown site "${siteId}". Add it to apps.json, or check the app attribute on <ij-footer>.`
    );
  }

  // Never link to yourself, and never link something marked unlisted.
  const eligible = apps.filter(
    a => a.id !== siteId && a.listed !== false && include.includes(a.status)
  );

  const always = eligible.filter(a => a.always === true);
  const pool = eligible.filter(a => a.always !== true);

  // Sorted by id, not by position in apps.json, so re-sorting the registry
  // cannot rewrite a committed fragment. The always-links are the exception:
  // they are a curated pair and render in the order the registry lists them.
  const byId = (a, b) => (a.id < b.id ? -1 : 1);
  const siblings = self.category
    ? pool.filter(a => a.category === self.category).sort(byId)
    : [];

  const topUp = [];
  if (siblings.length < minLinks) {
    const chosen = new Set(siblings.map(a => a.id));
    const candidates = pool
      .filter(a => !chosen.has(a.id))
      .map(a => ({ app: a, reach: categoryReach(pool, a) }))
      // Least-connected first, then by id. Deliberately NOT by position in
      // apps.json: order would make a cosmetic re-sort of the registry rewrite
      // every committed fragment. Reach already carries the "needs exposure"
      // signal that ordering used to approximate.
      .sort((x, y) => x.reach - y.reach || (x.app.id < y.app.id ? -1 : 1));

    for (const c of candidates) {
      if (siblings.length + topUp.length >= minLinks) break;
      topUp.push(c.app);
    }
  }

  return { self, siblings, topUp, always, links: [...siblings, ...topUp, ...always] };
}
