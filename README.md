# Certificate in Advanced Christian Apologetics — landing page

A single-page, fully responsive landing page for the certificate program from
**South India Baptist Bible College & Seminary**. Plain HTML, CSS, and vanilla
JavaScript — no build step, no framework, no dependencies.

---

## Files

```
index.html                     the page
assets/
  css/style.css                all styles (design tokens at the top)
  js/main.js                    smooth scroll, nav, menu, parallax, countdown, reveals
  vendor/lenis/                 Lenis smooth-scroll library (self-hosted, v1.3.26)
  img/
    logo.png                    header logo (South India … Online Programs lockup)
    seal.png                    favicon + footer seal
    hero/                       the hero banner carousel images (banner-1.jpg, …)
    program/poster.jpg          the poster beside "The program" text (~4:5 portrait)
    pathway/poster.jpg          the poster beside "The curriculum" text (~4:5 portrait)
    learning/                   the image beside "How it works" text (drop in
                                illustration.svg / .png / .jpg; placeholder ships)
    faculty/                    the four faculty cut-out portraits
  program-overview.pdf          linked from the Curriculum section and footer
.claude/                        local-preview helper (not needed for deployment)
```

Everything the browser needs is inside this folder. To deploy, upload the whole
folder (you can leave out `.claude/` and `README.md`).

---

## Before you go live

### 1. The registration link

Every **Register** / **Open the registration form** button points to the Google Form
`https://forms.gle/biuxaGiAj6wjfLG29` and opens in a new tab.

To change it, update it in **two** places so it also works with JavaScript off:
1. `REGISTER_URL` near the top of `assets/js/main.js`
2. every `href="https://forms.gle/…"` in `index.html` (find-and-replace)

### 2. Faculty photos and teaching assignments

The four faculty photos are in place (`assets/img/faculty/william-subash.png`,
`karthik-r.png`, `rajkumar-richard.png`, `asher-john.png` — cut-out portraits, each
resized and compressed). To swap one, replace the file with the same name; a
transparent PNG cut-out on a plain background works best. If a file is ever missing
the card falls back to the person's initials.

Each teacher is paired with one **stage** of the course (Stage 1 → William, Stage 2
→ Karthik, and so on). If any of those assignments is wrong, edit the matching
`<li class="fac">` block in `index.html` — the badge text, the `<h3 class="fac__module">`
heading, and the `<ul class="fac__topics">` list.

---

## Preview it locally

**In Claude Code:** the `preview` config is already set up — it serves the folder
at `http://localhost:4173`.

**Manually:** from this folder run any static server, e.g.

```bash
node .claude/preview-server.cjs
```

then open `http://localhost:4173`. (Opening `index.html` directly with a
`file://` path also works, though some browsers block the linked PDF that way.)

---

## Deploy it

It is static files, so anywhere works:

- **Netlify / Vercel / Cloudflare Pages** — drag the folder in, or connect a repo.
- **GitHub Pages** — push the folder, enable Pages on the branch.
- **cPanel / shared hosting (e.g. for sibbcs.online)** — upload the contents of
  this folder into `public_html/`.

No server-side code is required.

---

## Editing content

- **Hero banner carousel**: banners live in `assets/img/hero/` as `banner-1.jpg`,
  `banner-2.jpg`, `banner-3.jpg`. Keep them the same wide shape (~2:1, 1600–2400 px
  across). With one image it shows as a static banner; add a second and it becomes a
  rotating carousel — arrows, dots, a pause button, auto-advance every 6 s, swipe on
  touch. No code change needed: a missing `banner-*.jpg` slide removes itself on load.
  For a 4th+ banner, copy a `<li class="hero__carousel__slide">` in `index.html`.
  Auto-advance is off for reduced-motion visitors, and pauses on hover/focus, when
  the tab is hidden, and when the hero scrolls out of view. Update each slide's
  `alt` text to describe that poster.
- **Countdown timer**: a split-flap "flip clock" — the digits flip like cards when
  they change. The target is one attribute on the `<section class="countdown"
  data-countdown="2026-10-05T19:30:00+05:30">` in `index.html`. It is ISO 8601 with
  the `+05:30` India offset, so it counts down correctly for a visitor in any
  timezone. When the moment passes, the clock is replaced by a "cohort has begun"
  message and the button changes to "Register for the next intake". The flip
  animation is skipped for visitors who ask for reduced motion.
- **Faculty portraits**: each photo is clipped to an organic blob shape (an inline
  SVG `<clipPath id="facBlob">` near the top of `index.html`), sitting on a lighter
  navy panel. A second, larger copy of the blob is traced as a thin outline
  (`<svg class="fac__outline">`) offset behind it, and the name overlaps the blob's
  lower curve. Edit the blob shape by changing the two matching `<path d="…">`
  values (one in the `<clipPath>`, one in each `.fac__outline`). The outline drifts
  with scroll and the text counter-drifts — a **parallax** effect; tune it with the
  `data-parallax` attribute on `.fac__outline` (`"26"`) and `.fac__body` (`"-10"`).
  Parallax is off on phones and for reduced-motion visitors.
- **Section posters**: "The program" and "The curriculum" each open with a 60% text /
  40% poster row (`assets/img/program/poster.jpg` and `assets/img/pathway/poster.jpg`).
  Replace those files to swap the images — keep them portrait (~4:5). They drop below
  the text on screens under 880 px. Update each `<img alt>` to match a new poster.
- **"How it works" illustration**: the same 60/40 row. It ships with a placeholder,
  `assets/img/learning/illustration-placeholder.svg` (a brand-matched line drawing —
  live-class window, discussion thread, open book). To use your own, just save it as
  `assets/img/learning/illustration.svg` — or `.png`, `.jpg`, `.jpeg`, `.webp`. No
  code change: `main.js` checks for those five names and swaps in the first one it
  finds, otherwise the placeholder stays. Landscape shape works best.
- **Curriculum** (the 4-stage "path"): each stage is a `<details>` block inside
  `.spine` in `index.html`. Stage I is open by default (`<details ... open>`).
- **FAQ**: each question is a `<details class="faq__item">` in the FAQ section.
- **Dates, schedule, fees**: search `index.html` for `5 October 2026`,
  `7:30`, and `7,800` — they appear in the hero fact strip, the countdown, and the
  "At a glance" panel.
- **Colours & type**: all design tokens are CSS custom properties at the top of
  `assets/css/style.css` (`:root { ... }`). Change `--gold`, `--navy-800`,
  `--parchment`, or the `--font-*` stacks in one place.

---

## Responsive & motion

- **Desktop is the baseline.** Section 17 of `style.css` only *adjusts* it downward —
  breakpoints at **1024 · 900 · 780 · 640 · 600 · 400 · 380 px**. Nothing in those
  blocks changes the desktop view.
  - `≤ 900` — nav collapses to the menu button; the split / 60-40 layouts stack;
    a **visible hero headline + tagline** appears (`.hero__headline` in `index.html`)
    because the banner artwork is too small to read on a phone. It is hidden again on
    desktop, where the banner carries the message. Edit that text in `index.html`.
  - `≤ 780` — faculty rows stack and left-align.
  - `≤ 600` — carousel arrows hide (swipe + dots stay); primary buttons go full-width.
- **Motion.** Scroll-reveal fades every block up as it enters view; grids
  (cards, faculty, FAQ, fact list…) carry a `data-stagger` attribute so their
  children cascade in one after another. Also: the header drops in on load, section
  labels draw their little rule, cards lift on hover, section photos settle out of a
  soft zoom, the active banner slowly pans, `<details>` panels animate open where the
  browser supports it. Everything is off under `prefers-reduced-motion`.
- Keyboard accessible, visible focus outlines, skip link.
- Smooth scrolling via **Lenis** (self-hosted in `assets/vendor/lenis/`, no CDN, no
  build step). It also smooths the in-page `#` links. If the script fails to load
  the page still scrolls normally.
- Respects `prefers-reduced-motion` (turns off smooth scroll, every reveal / stagger /
  hover animation, the spine draw, and the banner pan).
- Fonts load from Google Fonts: **Poppins** (headings + body), **IBM Plex Mono**
  (eyebrows, badges, the countdown digits, module codes), and **Playwrite DE Grund**
  — a handwriting script used as an accent on the countdown headline and the closing
  call-to-action. Each maps to a `--font-*` token at the top of `style.css`
  (`--font-display`, `--font-sans`, `--font-mono`, `--font-script`); point
  `--font-script` at any element via `font-family: var(--font-script)` to move the
  handwriting accent. To self-host, download the families into `assets/fonts/` and
  swap the `<link>` in `index.html` for an `@font-face` block.
