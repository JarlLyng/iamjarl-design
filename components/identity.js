// A site's identity, resolved from the registry: the accent it may lean on and
// the display face its family speaks in.
//
// The system defines one primary per mode, so thirteen of fifteen sites ended
// up black with the same lime pill. A family accent gives a category room to
// differ without leaving the system — primary stays the brand thread.
//
// Resolution order: the app's own accent, then its category's, then the mode
// primary. Absent everywhere means nothing changes, which is why this can ship
// before a single colour is chosen.
//
// Pure: no DOM, no fetch. The same function feeds the generated CSS, the
// validator and anything the component does with it later.

export function accentFor(registry, appId, tokens) {
  const app = registry.apps.find(a => a.id === appId);
  if (!app) throw new Error(`Unknown app "${appId}"`);

  const category = app.category ? registry.categories?.[app.category] : null;
  const primary = {
    light: tokens.colors.modes.light.primary,
    dark: tokens.colors.modes.dark.primary,
  };

  const pick = mode =>
    app.accent?.[mode] ?? category?.accent?.[mode] ?? primary[mode];

  const resolved = { light: pick('light'), dark: pick('dark') };
  return {
    ...resolved,
    // Whether this app actually differs from the shared primary. Nothing is
    // generated for an app that does not, so the output stays empty until a
    // family opts in rather than repeating the primary fourteen times.
    isFamilyAccent:
      resolved.light !== primary.light || resolved.dark !== primary.dark,
    source: app.accent ? 'app' : category?.accent ? 'category' : 'primary',
  };
}

// Which display face a site speaks in. Body copy stays --ij-font-ui everywhere;
// this is the voice, and it is one decision per family rather than per site.
//
// The approved set lives in tokens.json because which faces exist is a system
// fact; which one a family uses lives in apps.json beside its accent.
export function displayFor(registry, appId, tokens) {
  const app = registry.apps.find(a => a.id === appId);
  if (!app) throw new Error(`Unknown app "${appId}"`);

  const category = app.category ? registry.categories?.[app.category] : null;
  const key = app.display ?? category?.display ?? null;
  if (!key) return { key: null, face: null, source: 'none' };

  const face = tokens.brand?.typography?.display?.[key];
  if (!face) throw new Error(`Unknown display face "${key}" for "${appId}"`);

  return { key, face, source: app.display ? 'app' : 'category' };
}
