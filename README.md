# Noeul — marketing landing page

A static, single-page marketing site for **Noeul**, a reading-first Korean language-learning app for Android. No build step, no framework, no backend — just HTML, one CSS file, and a small amount of vanilla JS. Open `index.html` directly in a browser, or serve it from any static host.

## Deploy to GitHub Pages

1. Push this folder to a GitHub repo (e.g. `fluent-fable-website`).
2. In the repo: **Settings → Pages → Build and deployment → Source: "Deploy from a branch"**, then pick the `main` branch and the `/ (root)` folder. Save.
3. Wait a minute; your site is live at `https://<user>.github.io/<repo>/`.

The included empty `.nojekyll` file tells GitHub Pages to serve `/assets` as-is. All asset paths are relative (`./css/...`, `./assets/...`), so the site works correctly under a project subpath.

## Before you publish — fill in the placeholders

These are greppable tokens. Search the project for each:

- **`PLAY_STORE_URL`** — your Google Play link (used by every "Get it on Google Play" button/badge).
- **`CONTACT_EMAIL`** — the address behind the footer "Contact" link.
- **`[DATE]`** / **`[PLACEHOLDER — replace]`** — the "Last updated" dates and any remaining legal copy.
- **`/assets/*.svg`** — remaining placeholder images (`og-image.svg`). The hero, screenshots, and demo video now use real app assets (`.png` / `.mp4`).
- **`privacy.html` / `terms.html`** — paste your real legal content into the marked placeholder block.

## Structure

```
index.html      landing page (CONFIG block of placeholders at the top)
privacy.html    legal page (placeholder content)
terms.html      legal page (placeholder content)
css/styles.css  single stylesheet; all colors are :root custom properties
js/main.js      mobile nav toggle, sticky-header state, screenshot lightbox, scroll reveal
assets/         app screenshots, hero image, demo video + poster (PNG/MP4); OG image (SVG)
favicon.svg     N monogram
.nojekyll       lets GitHub Pages serve /assets untouched
```
