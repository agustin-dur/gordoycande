# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Static wedding invitation site, started as a template with `{{PLACEHOLDER}}`s and filler photos; the couple's details, photos and favicons are now filled in. The site is a single `index.html` (inline CSS and JS) plus static assets: photos in `fotos/` (the hero postcard uses `fotos/foto-02.jpg`, its back `fotos/foto-01.jpg`) and the favicon PNGs. No build step, no dependencies, no framework, no tests. All content is in Spanish (Argentine voseo) — keep that tone in any copy changes. Guests will open this mostly on phones — design and verify mobile-first (occasionally desktop).

### Placeholders

`grep -n '{{' index.html README.md CLAUDE.md apps-script.gs` lists everything still to fill in. The README has the full table (what each placeholder is and where it appears). Until they are filled: the countdown shows dashes (the JS guards against the unparsable date), the RSVP fallback posts to a bogus formsubmit address. Don't invent real-looking values — leave placeholders as placeholders unless the user gives the data.

## Develop and deploy

- Preview locally with any static server, e.g. `python3 -m http.server 4173` (a `static-site` config exists in `.claude/launch.json`).
- Production: https://gordoycande.vercel.app — Vercel project `gordoycande`, connected to GitHub `agustin-dur/gordoycande`. Pushing to `main` deploys automatically (no build configured).

## Structure of index.html

One page, sections in order: hero (postcard photo + date) → countdown → agenda (`#agenda`, ceremony/party cards with Google Maps links) → RSVP (`#rsvp`) → gifts (`#regalos`) → photo grid (`#fotos`, all photos visible, no flipping) → footer. Design tokens live as CSS variables in `:root` (paper/ink/sea/sand/accent palette, taken from the printed invitation: near-white textured paper, slate-blue ink, watercolor blues); fonts are Cormorant Garamond (body) and Space Mono (labels/numbers, via the `.mono` pattern).

### Photos

`fotos/foto-01.jpg` to `foto-24.jpg`. 01/02 are the hero postcard (back/front, landscape 1200×720, the front `img` carries `width`/`height` and `fetchpriority="high"` since it is the first thing on screen; tapping the postcard lifts it to show the back). 03–24 are the photo grid, all visible at once with no click (the couple asked for no tap-to-reveal): 2 columns on phones, 4 from 641px. Images with `class="grande"` (03 and 16, 1080×1080) span 2×2; the rest are 540×540 squares. Those sizes are deliberate (enough for 2–3x screens, light on mobile data: JPEG q76, progressive, no EXIF); keep them when swapping a photo. Keep a multiple of 4 small photos between big ones and after the last one, or the grid gets holes. Alt texts describe each photo: Spanish in the markup, English in `I18N_EN` (keys `alt.fotoNN`). The README has the slot table.

### English version (`?lang=en`)

The page ships in Spanish. Opening it with `?lang=en` swaps every string to English; anything else (including no param) stays in Spanish. There is no visible language toggle (removed on request); share the `?lang=en` link directly.

**Dates are localised, not just copied.** Spanish shows day.month.year (`{{DD.MM.AAAA}}`); English shows month.day.year (`{{MM.DD.AAAA}}`). This applies everywhere the date is rendered — the hero `.bigdate`, the footer line, the RSVP thank-you and the `og:description`. Any new date needs the same treatment.

Translatable text is marked in the markup with `data-i18n` (textContent), `-html` (text containing markup), `-ph` (placeholder), `-alt`, `-aria`, `-title` and `-href`; the English strings live in the `I18N_EN` dictionary at the top of the inline script. Strings the script writes at runtime (countdown "¡Es hoy!", the RSVP button and its alerts) come from `TEXTOS[LANG]` instead. Adding copy means adding both the `data-i18n` attribute and its key.

A small script in `<head>` sets `LANG` and hides `main` (`html.pre-i18n`) so English readers never see a flash of Spanish; the body script unhides it, with a 1.5s timeout as a fallback. Note that `og:` tags are rewritten client-side only, so link previews of `?lang=en` still show the Spanish description.

### RSVP flow (the only real logic)

One form per person — guests with a +1 are asked to have them submit their own form. On submit, the script picks a backend:

- `SHEET_URL` (top of the inline script) — if non-empty, POSTs JSON `{nombre, telefono, asistencia, dieta, cancion, mensaje}` to a Google Apps Script (code and install steps in `apps-script.gs`), deployed from the couple's "Sorio" spreadsheet: it appends to the `CONFIRMADOS` tab, marks the guest in every tab whose name starts with "Invitados" (Invitados Gordo, Invitados Cande, Invitados Papás — only the main Nombre/Apellido table of each, and each guest must be in exactly one list) and emails both of them. `prepararListas` creates the missing tabs; `remarcarTodo` re-matches every past confirmation after the lists change. The request uses `mode:'no-cors'`, so the page cannot see errors from the script: after any change to `apps-script.gs`, redeploy a new version (same URL) and send a test RSVP.
- Fallback: formsubmit.co, emailing `{{EMAIL}}`.

## Known pending work (from README)

- Nothing pending in the code
