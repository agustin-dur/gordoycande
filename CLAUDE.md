# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Static wedding invitation site, started as a template: every personal detail is a `{{PLACEHOLDER}}` and the photos are numbered filler images. The site is a single `index.html` (inline CSS and JS) plus static assets: photos in `fotos/` (the hero postcard uses `fotos/foto-02.jpg`, its back `fotos/foto-01.jpg`) and the favicon PNGs. No build step, no dependencies, no framework, no tests. All content is in Spanish (Argentine voseo) — keep that tone in any copy changes. Guests will open this mostly on phones — design and verify mobile-first (occasionally desktop).

### Placeholders

`grep -n '{{' index.html README.md CLAUDE.md apps-script.gs` lists everything still to fill in. The README has the full table (what each placeholder is and where it appears). Until they are filled: the countdown shows dashes (the JS guards against the unparsable date), the Spotify embed shows an error, and the RSVP fallback posts to a bogus formsubmit address. Don't invent real-looking values — leave placeholders as placeholders unless the user gives the data.

## Develop and deploy

- Preview locally with any static server, e.g. `python3 -m http.server 4173` (a `static-site` config exists in `.claude/launch.json`).
- Production: https://{{DOMINIO}} — Vercel project `{{VERCEL_PROJECT}}`, connected to GitHub `{{GITHUB_REPO}}`. Pushing to `main` deploys automatically (no build configured). Not set up yet.

## Structure of index.html

One page, sections in order: hero (postcard photo + date) → countdown → agenda (`#agenda`, ceremony/party cards with Google Maps links) → RSVP (`#rsvp`) → gifts (`#regalos`) → photo grid (`#fotos`) → music (`#musica`, Spotify embed + collaborator invite link) → footer. Design tokens live as CSS variables in `:root` (paper/ink/sea/sand/accent palette); fonts are Cormorant Garamond (body) and Space Mono (labels/numbers, via the `.mono` pattern).

### Photos

`fotos/foto-01.jpg` to `foto-20.jpg`. 01/02 are the hero postcard (back/front, landscape 1600×960, the front `img` carries `width`/`height`); 03–20 fill the 8 flip tiles of the grid in visible order (front, back, and for tiles 3 and 4 a third photo via `data-ciclo` / `data-ciclo-en`). Alt texts are "Foto N" (markup) and "Photo N" (`I18N_EN`, keys `alt.fotoNN`). The README has the slot table.

### English version (`?lang=en`)

The page ships in Spanish. Opening it with `?lang=en` swaps every string to English; anything else (including no param) stays in Spanish. A discreet toggle in the footer links between the two.

**Dates are localised, not just copied.** Spanish shows day.month.year (`{{DD.MM.AAAA}}`); English shows month.day.year (`{{MM.DD.AAAA}}`). This applies everywhere the date is rendered — the hero `.bigdate`, the footer line, the RSVP thank-you and the `og:description`. Any new date needs the same treatment.

Translatable text is marked in the markup with `data-i18n` (textContent), `-html` (text containing markup), `-ph` (placeholder), `-alt`, `-aria`, `-title` and `-href`; the English strings live in the `I18N_EN` dictionary at the top of the inline script. Strings the script writes at runtime (countdown "¡Es hoy!", the RSVP button and its alerts) come from `TEXTOS[LANG]` instead. Adding copy means adding both the `data-i18n` attribute and its key.

A small script in `<head>` sets `LANG` and hides `main` (`html.pre-i18n`) so English readers never see a flash of Spanish; the body script unhides it, with a 1.5s timeout as a fallback. Note that `og:` tags are rewritten client-side only, so link previews of `?lang=en` still show the Spanish description.

### RSVP flow (the only real logic)

One form per person — guests with a +1 are asked to have them submit their own form. On submit, the script picks a backend:

- `SHEET_URL` (top of the inline script) — if non-empty, POSTs JSON `{nombre, asistencia, dieta, mensaje}` to a Google Apps Script (code and install steps in `apps-script.gs`). Currently empty.
- Fallback: formsubmit.co, emailing `{{EMAIL}}`.

## Known pending work (from README)

- Fill every placeholder and replace the filler photos, `og-image.jpg` and the favicons
- Create the Google Sheet + Apps Script and set `SHEET_URL`
- Create the collaborative Spotify playlist
- Create the Vercel project and connect it to the repo
