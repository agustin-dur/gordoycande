# Gordo & Cande — Invitación de casamiento

Web de invitación estática: un `index.html` (CSS y JS inline), las fotos en `fotos/` y `apps-script.gs`, que es la copia versionada del backend del RSVP que corre en Google Apps Script.

Este repo arranca como **plantilla**: todos los datos personales están marcados como `{{PLACEHOLDER}}` y las fotos son imágenes de relleno numeradas. Para ver qué falta completar:

```bash
grep -n '{{' index.html README.md CLAUDE.md apps-script.gs
```

- **Producción:** https://gordoycande.vercel.app (proyecto Vercel `gordoycande`, conectado a GitHub `agustin-dur/gordoycande`)
- **Fecha:** 08.02.2027 · 16:30 Parroquia La Merced · 18:30 Darwin Tortugas, Salón Laguna

## Placeholders

| Placeholder | Dónde aparece | Ejemplo |
|---|---|---|
| `{{NOMBRE1}}`, `{{NOMBRE2}}` | título, hero, footer, `og:`, calendario, asunto del mail de RSVP | `Cata`, `Chano` |
| `{{DD.MM.AAAA}}` / `{{MM.DD.AAAA}}` | fecha en español / en inglés (hero, footer, `og:description`) | `24.10.2026` / `10.24.2026` |
| `{{DD.MM}}` / `{{MM.DD}}` | el "¡Gracias! Nos vemos el…" del RSVP, en cada idioma | `24.10` / `10.24` |
| `{{AAAA-MM-DD}}` | fecha del countdown (JS) | `2026-10-24` |
| `{{DIA_SEMANA}}` / `{{DIA_SEMANA_EN}}`, `{{CIUDAD}}` | subtítulo del hero | `Sábado` / `Saturday`, `Buenos Aires` |
| `{{HORA_CEREMONIA}}`, `{{HORA_FIESTA}}` | agenda, countdown, texto del calendario | `16:00`, `18:00` |
| `{{LUGAR_CEREMONIA}}`, `{{LUGAR_FIESTA}}` | agenda, `og:description`, calendario | `Iglesia San Martín`, `Quinta Los Olivos` |
| `{{MAPA_CEREMONIA}}`, `{{MAPA_FIESTA}}` | links "Ver en el mapa" (URL completa) | `https://maps.google.com/?q=…` |
| `{{INICIO_AAAAMMDDTHHMMSS}}`, `{{FIN_AAAAMMDDTHHMMSS}}` | link "Agregar al calendario" (hay dos: español e inglés) | `20261024T160000`, `20261025T020000` |
| `{{ALIAS_PESOS}}`, `{{ALIAS_DOLARES}}`, `{{TITULAR_CUENTA}}` | sección Regalos | |
| `{{SPOTIFY_PLAYLIST_ID}}` | iframe de la playlist (el id que sigue a `/playlist/` en la URL) | |
| `{{SPOTIFY_LINK_COLABORAR}}` | botón "Agregá canciones" (link de "Invitar colaboradores") | |
| `{{EMAIL}}` | fallback del RSVP vía formsubmit.co | |
| `{{DOMINIO}}` | `og:url`, `og:image` y el "Más info" del calendario | `xxx.vercel.app` |

Los placeholders aparecen en los dos idiomas (español en el HTML, inglés en el diccionario `I18N_EN` del script): completar ambos.

## Fotos

Reemplazar cada archivo de `fotos/` manteniendo el nombre, o cambiar el `src` en `index.html`. Los `alt` están como "Foto N" / "Photo N" (en `I18N_EN`): conviene describirlas.

| Archivo | Dónde |
|---|---|
| `foto-01.jpg` | dorso de la postal del hero (se ve al tocarla) |
| `foto-02.jpg` | frente de la postal, apaisada 1600×960 (si cambia la proporción, actualizar `width`/`height` del `img`) |
| `foto-03.jpg` … `foto-20.jpg` | grilla "Nosotros": 8 cuadrados que se dan vuelta al tocarlos |

| Cuadro | Frente | Dorso | Tercera (`data-ciclo`) |
|---|---|---|---|
| 1 | 03 | 04 | |
| 2 | 05 | 06 | |
| 3 | 07 | 08 | 09 |
| 4 | 10 | 11 | 12 |
| 5 | 13 | 14 | |
| 6 | 15 | 16 | |
| 7 | 17 | 18 | |
| 8 | 19 | 20 | |

También son de relleno `og-image.jpg` (1200×630, preview al compartir el link), `favicon.png` (512×512) y `apple-touch-icon.png` (180×180).

## Secciones
Cuenta regresiva · Agenda con mapas · RSVP (un form por persona) · Regalos (dos alias, pesos y dólares) · Fotos · Música (playlist de Spotify colaborativa)

## RSVP
- Un form por persona (los +1 completan el suyo)
- Cada confirmación se escribe como una fila en una planilla de Google, vía el Apps Script publicado como web app. La URL va en `SHEET_URL`, arriba del script de `index.html` (hoy vacía)
- El código del Apps Script está en `apps-script.gs`, con los pasos de instalación y deploy en su comentario de cabecera. Ojo: al editarlo hay que crear una **nueva versión** de la implementación, si no la URL `/exec` sigue ejecutando el código viejo
- El envío por mail vía formsubmit.co queda como fallback: sólo corre si `SHEET_URL` está vacía. Requiere completar `{{EMAIL}}` y confirmar la dirección la primera vez que formsubmit manda un mail

## Música
La sección `#musica` embebe la playlist de Spotify y el botón "Agregá canciones" abre el link de invitación a colaborar. Para que la gente pueda sumar temas, la playlist tiene que estar en modo colaborativo en Spotify (playlist → menú → Invitar colaboradores).

## Deploy
Vercel, sitio estático sin build. Importar el repo de GitHub como proyecto nuevo en Vercel; después, push a `main` deploya automáticamente. Preview local: `python3 -m http.server 4173`.

## Pendientes
- [ ] Completar todos los `{{PLACEHOLDER}}` (ver arriba)
- [ ] Reemplazar las fotos de relleno, `og-image.jpg`, `favicon.png` y `apple-touch-icon.png`
- [ ] Describir los `alt` de las fotos (español e inglés)
- [ ] Crear la planilla + Apps Script y pegar la URL en `SHEET_URL`
- [ ] Crear la playlist en Spotify en modo colaborativo
- [ ] Crear el proyecto en Vercel y conectarlo al repo
