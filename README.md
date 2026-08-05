# Elique Events

Marketing site for Elique Events — a dependency-free static site.

**Live:** https://elique-events.com

---

## Running it locally

The site is plain HTML, CSS and JavaScript. There is no build step and no
package manager.

Opening `index.html` directly works for most things, but a few features
(the web manifest, and `fetch` on the contact form) behave better over HTTP.
Any static server will do:

```bash
# Python (already installed on most machines)
python -m http.server 8000

# or Node
npx serve .
```

Then visit http://localhost:8000.

---

## Project layout

```
index.html            Homepage
services/<slug>/      One page per service
style.css             All styling; design tokens live at the top
index.js              All behaviour; one init function per feature
404.html              Not-found page
robots.txt            Crawler rules
sitemap.xml           Sitemap for search engines
site.webmanifest      PWA / home-screen metadata

assets/
  img/
    bg/               Full-width section backgrounds (2 widths each)
    experience/       The three square tiles
    services/         Service card images
    ui/               Decorative bits (quote mark, about banner)
    logo/             Logo and app icons
    og-image.jpg      Social sharing preview
  video/              Hero and services clips + poster frames
```

Every raster image ships as **AVIF** with a **WebP** fallback, in two widths.
Browsers pick the smallest format they support; there is no JavaScript
involved in that choice.

---

## Pages

The site is no longer a single page. The homepage carries the brand and the
overview; each service has its own page so that it has something to rank on.

```
/                                         Homepage
/services/corporate-meetings-and-events/  Meetings and conferences
/services/incentive-experiences/          Incentive travel and rewards
/services/branding-and-communication/     Event identity and delegate comms
/services/production-services/            Technical production
```

Every page is standalone HTML sharing one `style.css` and one `index.js`.
There is no build step, so the header and footer markup is repeated in each
file — that is a deliberate trade-off at this size. If the site grows past
roughly ten pages, move to a static site generator (Eleventy is the smallest
sensible option) rather than keep copying the shell by hand.

`index.js` is safe to load on every page: each feature checks for the markup
it needs and exits quietly when it is absent, so the carousel, backdrop,
video and form code simply does nothing on a service page.

### Adding a service page

Copy an existing one and change, in this order:

1. `<title>`, `<meta name="description">` (aim for 150–158 characters — Google
   truncates around there), `<link rel="canonical">` and the `og:` tags
2. The `Service` and `BreadcrumbList` blocks in the JSON-LD
3. The visible content
4. Add the URL to `sitemap.xml`
5. Link to it from the homepage service card **and** from the "rest of the
   picture" block on the other service pages — internal links are how search
   engines find and weigh a page

## Making changes

### Colours, spacing and type

Do not hunt through the stylesheet for hex codes. Everything comes from the
token block at the top of `style.css`:

```css
:root {
  --c-ink: #020302;      /* deepest background            */
  --c-surface: #1e1b1b;  /* header, drawer, footer        */
  --c-raised: #292527;   /* buttons                       */
  --text-lg: clamp(...); /* fluid type — no breakpoints   */
  --section-padding: clamp(...);
}
```

Changing a token updates every place it is used.

Type and spacing scale fluidly with `clamp()`, so text grows smoothly between
a 320px phone and a 2560px monitor rather than jumping at fixed breakpoints.

### The continuous backdrop

The Experience, Services, Testimonials and About Us sections share one photo
of a venue. It is a single tall image (`assets/img/bg/backdrop-*`) on a
sticky layer that stays pinned to the viewport while those four sections
scroll past, and JavaScript pans it downwards — so the visitor travels from
the lighting rig at the top of the photo, through the beams, to the seating
at the bottom.

The image was rebuilt from the three original slices
(`background-top/middle/bottom.png`) at their full 3620px width. The lighting
rig and the seating are used at their native scale; only the middle is
stretched to give the group enough height, and that stretch is graded — about
1.1× where the trusses and beams are, rising to roughly 3.9× in the near-black
lower portion where there is no detail to lose. Because the whole thing is now
one image on one element, there are no seams to line up and nothing breaks
when a section changes height.

Two knobs, both on `.backdrop` in `style.css`:

```css
--backdrop-scale: 2;    /* image height as a multiple of the viewport;
                           higher = more travel, more parallax           */
--backdrop-aspect: 1;   /* width ÷ height of the source image — keep this
                           in sync if you replace the photo              */
```

Phones load a separate portrait crop, swapped in by a `media` attribute on
the `<picture>` element. If you replace it, update `--backdrop-aspect` inside
the `max-width: 700px` block to match.

The `sizes` attributes read `130vw` and `190vw` rather than `100vw`. That is
deliberate: `object-fit: cover` scales the photo up beyond the width of its
box, so the browser needs to pick a rendition wider than the viewport or the
result looks soft on high-density screens.

Visitors who have asked for reduced motion get the same photo held at a
fixed position, with no panning.

### Adding a testimonial

Add one `<li class="carousel__slide">` inside `.carousel__track` in
`index.html`. That is the only change needed — the dots, the arrows, the
autoplay loop and the ARIA labels all count the slides at runtime.

### Adding a service

Copy one `<li class="service-card">` block. The grid reflows on its own.

### Adding or replacing images

Source images should be exported at roughly twice their display size, then
converted. With ImageMagick and a recent Python + Pillow:

```python
from PIL import Image
im = Image.open("source.png").convert("RGB")
im.save("out.avif", quality=55, speed=4)
im.save("out.webp", quality=78, method=6)
```

Then reference both in a `<picture>` element, largest format first:

```html
<picture>
  <source type="image/avif" srcset="out.avif">
  <source type="image/webp" srcset="out.webp">
  <img src="out.webp" width="800" height="600" loading="lazy" decoding="async" alt="...">
</picture>
```

Always set `width` and `height` — they reserve the right amount of space
while the image loads and stop the page jumping around.

---

## The contact form

Submissions go to [Web3Forms](https://web3forms.com). The access key in
`index.html` is public by design; it only allows posting to the address the
key is registered to.

`index.js` submits over `fetch`, so visitors stay on the page and see an
inline confirmation. A hidden `botcheck` field catches most spam bots.

To change the recipient address, generate a new access key at web3forms.com
and replace the `access_key` value.

---

## Browser support

Targets the last two versions of Chrome, Edge, Firefox and Safari, plus iOS
Safari and Chrome on Android.

Older browsers degrade rather than break: without AVIF they get WebP, without
`image-set()` they get the plain background colour, and without JavaScript
they still get the full page, all five testimonials and a working form (it
posts normally instead of over `fetch`).

---

## Accessibility notes

Worth preserving when editing:

- Every interactive control is a real `<button>` or `<a>` and is reachable
  by keyboard.
- Focus outlines are deliberate. Do not add `outline: none` without
  providing a visible replacement.
- The carousel can be paused, is operable with arrow keys, and stops
  rotating for visitors who have asked for reduced motion.
- Videos never autoplay for visitors with reduced-motion or Data Saver
  enabled; they see the poster frame instead.
- Form fields have real `<label>` elements — visually hidden, but present.

---

## Possible next steps

- **Self-host the fonts.** The site currently loads Montserrat and DM Sans
  from Google Fonts. In the EU that transfers visitor IP addresses to Google,
  which several courts have found to require consent. Self-hosting removes
  the issue and is faster. Download the WOFF2 files (for example via
  `@fontsource/montserrat` and `@fontsource/dm-sans` on npm), drop them in
  `assets/fonts/`, replace the `<link>` in `index.html` with local
  `@font-face` rules, and add `font-display: swap`.
- **A higher-resolution stage photo.** `assets/img/experience/stage-*` comes
  from a 532×274 source, which is smaller than the tile it fills. Any
  replacement at 800px or wider will look noticeably sharper.
- **Analytics**, if wanted — a cookie-free option such as Plausible or
  Fathom avoids needing a consent banner.
