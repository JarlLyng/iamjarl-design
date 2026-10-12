// The words <ij-nav> and <ij-footer> print themselves, in the languages the
// portfolio's sites are written in (#80), and the nav landmark's name (#88). Until 1.29.0 they were English on
// every page, so Wean's Danish, Swedish and Norwegian pages and WODrounds' six
// translations said "Menu" and "More from IAMJARL" in English.
//
// A component reads the language from the nearest lang attribute, so a Danish
// page gets Danish without setting anything. An attribute on the element
// (label, skip-label, menu-label, more-label, projects-label) overrides a word, for a
// language not listed here or a site's own phrasing. Anything unknown is English.
//
// Pure apart from langOf, which reads the DOM: the build imports labelsFor to
// write the footer fragments in each language.

export const LABELS = {
  en: { nav: 'Main', skip: 'Skip to content', menu: 'Menu', more: 'More from IAMJARL', projects: 'All projects' },
  da: { nav: 'Hovedmenu', skip: 'Gå til indhold', menu: 'Menu', more: 'Mere fra IAMJARL', projects: 'Alle projekter' },
  de: { nav: 'Hauptmenü', skip: 'Zum Inhalt springen', menu: 'Menü', more: 'Mehr von IAMJARL', projects: 'Alle Projekte' },
  es: { nav: 'Menú principal', skip: 'Saltar al contenido', menu: 'Menú', more: 'Más de IAMJARL', projects: 'Todos los proyectos' },
  fr: { nav: 'Menu principal', skip: 'Aller au contenu', menu: 'Menu', more: 'Plus d’IAMJARL', projects: 'Tous les projets' },
  nb: { nav: 'Hovedmeny', skip: 'Gå til innhold', menu: 'Meny', more: 'Mer fra IAMJARL', projects: 'Alle prosjekter' },
  sv: { nav: 'Huvudmeny', skip: 'Till innehållet', menu: 'Meny', more: 'Mer från IAMJARL', projects: 'Alla projekt' },
};

// Norwegian pages are often marked "no" or "nn"; the words are Bokmål's.
const ALIASES = { no: 'nb', nn: 'nb' };

export function labelsFor(lang) {
  const base = String(lang || 'en').toLowerCase().split(/[-_]/)[0];
  return LABELS[ALIASES[base] ?? base] ?? LABELS.en;
}

// The registry's link to the whole portfolio is a phrase, not a name, so it is
// the one cross-link that is translated.
export const PROJECTS_ID = 'iamjarl';

export const langOf = el => el.closest('[lang]')?.getAttribute('lang') || document.documentElement.lang || 'en';
