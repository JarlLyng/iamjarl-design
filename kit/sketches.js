// Identities for the kit's own example pages, held to the same rules as an
// app's (validate.js runs them through the same checks) and written by the
// same code (scripts/css-modes.js), but belonging to no site.
//
// The dark sketch tries the kit on a site that is dark whatever the visitor's
// setting (#65): neither flagship is, and the Mac sites and WODrounds may be.
// It is not WODrounds' identity; that comes from its brief.

export const SKETCHES = [
  {
    id: 'dark-sketch',
    name: 'Dark sketch',
    identity: {
      scheme: 'dark',
      display: 'mono',
      dark: { background: '#101315', surface: '#1A1E21', text: '#EEF0EE', accent: '#F140FE' },
    },
  },
];
