# Pattern: the photographic hero ground

A photograph behind the hero, darkened until the text wins. Two sites in the portfolio
arrived at it independently — WODrounds and Anvil Workout — and eleven have not tried it.
The hub's `DESIGN.md` calls it the cheapest thing that separates a designed page from a
generated one.

This page exists so the next site does not derive the overlay again.

---

## The rule: mood, never subject

The photograph sets a room, a light, a temperature. It is never the thing being explained.
If a visitor has to look *at* the image to understand the product, it is a screenshot or a
diagram and belongs elsewhere on the page.

That is what makes the treatment safe to darken heavily: nothing is lost when 90% of it
disappears under an overlay, because it was never carrying information.

---

## The overlay

Both sites reached almost the same answer without talking to each other:

```css
/* WODrounds */ linear-gradient(to right, rgba(13,13,13,0.95) 10%, rgba(13,13,13,0.7)  50%, rgba(13,13,13,0.2)  100%)
/* Anvil     */ linear-gradient(90deg,    rgba(10,10,10,0.97)  0%, rgba(10,10,10,0.86) 38%, rgba(10,10,10,0.45) 100%)
```

Horizontal, near-opaque where the text sits, thinning toward the image side. **Ramp the
overlay toward the text rather than darkening the whole frame** — a uniform scrim dulls the
photograph everywhere and buys contrast only where you needed it.

In tokens:

```css
.hero {
  position: relative;
  overflow: hidden;
}
.hero::before {           /* the photograph */
  content: "";
  position: absolute;
  inset: 0;
  z-index: 0;
  background: var(--hero-image) center / cover no-repeat;
}
.hero::after {            /* the ramp, built from the ground token */
  content: "";
  position: absolute;
  inset: 0;
  z-index: 0;
  background: linear-gradient(
    to right,
    var(--ij-color-bg-app) 0%,
    color-mix(in srgb, var(--ij-color-bg-app) 80%, transparent) 55%,
    color-mix(in srgb, var(--ij-color-bg-app) 45%, transparent) 100%
  );
}
.hero > * { position: relative; z-index: 1; }   /* or the overlay paints over the text */
```

That last line is not optional. A positioned pseudo-element paints *after* its positioned
siblings at the same z-index, so without it the ramp covers the content and the whole hero
goes flat.

---

## The contrast floor

Text over a photograph has no fixed background colour, so the usual check does not apply.
Rather than measuring each image, make the overlay opaque enough that the image cannot
matter.

Compositing `rgba(13,13,13,α)` over the **lightest possible** image and measuring white text
against the result:

| α | white text |
|---|---|
| 0.50 | 3.64:1 ✗ |
| **0.60** | **5.10:1 ✓** |
| 0.70 | 7.34:1 ✓ |
| 0.95 | 17.58:1 ✓ |

**α ≥ 0.60 under the text guarantees AA for white text no matter what the photograph does.**
Both production sites sit at 0.95–0.97 where their text falls, which is why neither has a
problem despite never having computed this.

The light-mode mirror — `rgba(255,255,255,α)` over the darkest possible image, black text —
clears comfortably by 0.70 (10.02:1).

This is a floor for the region *under the text*, not for the whole ramp. The thin end can go
as low as the design wants, because nothing is read there.

To recompute for a different ground, composite the overlay over `#FFFFFF`, then run the
result through `scripts/color.js`:

```js
import { parseColor, contrastRatio } from './scripts/color.js';
```

---

## The weight budget

WODrounds ships **2521 KB** for its hero photograph — the original at 3936px wide, which is
more than twice any viewport it will meet. The same image, resized and re-encoded:

| Width | Weight |
|---|---|
| 3936px (shipped today) | 2521 KB |
| 1600px | 280 KB |
| 1200px | 164 KB |
| 800px | 63 KB |

**Budget: 250 KB for the largest breakpoint.** Nearly all of the 9× saving comes from
serving a sensible width, not from the codec — resize first, then reach for AVIF or WebP.

Neither site uses `srcset` today. A decorative hero should:

```html
<picture>
  <source type="image/avif" srcset="hero-800.avif 800w, hero-1200.avif 1200w, hero-1600.avif 1600w"
          sizes="100vw">
  <source type="image/webp" srcset="hero-800.webp 800w, hero-1200.webp 1200w, hero-1600.webp 1600w"
          sizes="100vw">
  <img src="hero-1200.jpg" alt="" loading="eager" fetchpriority="high" decoding="async">
</picture>
```

`alt=""` is correct here and not laziness: the image is mood, so a screen reader announcing
it would be noise. That is the same rule as the first section, enforced in the markup.

---

## Reference implementations

- **WODrounds** — full-bleed gym photograph, ramp to the right, display type over it
- **Anvil Workout** — the same shape at a steeper ramp

Both predate this page. Where they differ from it, they are the evidence and this is the
summary; where a third site differs from both, that is worth a look before it ships.
