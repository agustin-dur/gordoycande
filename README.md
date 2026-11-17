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
| `{{EMAIL}}` | fallback del RSVP vía formsubmit.co | |
| `{{DOMINIO}}` | `og:url`, `og:image` y el "Más info" del calendario | `xxx.vercel.app` |

Los placeholders aparecen en los dos idiomas (español en el HTML, inglés en el diccionario `I18N_EN` del script): completar ambos.

## Fotos

Para cambiar una foto, reemplazar el archivo de `fotos/` manteniendo el nombre. Cada foto tiene su descripción (`alt`) en castellano en el HTML y en inglés en `I18N_EN` (claves `alt.fotoNN`).

| Archivo | Dónde |
|---|---|
| `foto-01.jpg` | dorso de la postal del hero (se ve al tocarla), apaisada 1200×720 |
| `foto-02.jpg` | frente de la postal, apaisada 1200×720 (si cambia la proporción, actualizar `width`/`height` del `img`) |
| `foto-03.jpg` … `foto-24.jpg` | grilla "Nosotros", en orden: 22 fotos a la vista, una por recuadro, sin clic |

La grilla tiene 2 columnas en el celu y 4 desde 641px. Las fotos con `class="grande"` (hoy la 03 y la 16, de 1080×1080) ocupan 2×2; las demás son de 540×540. Esos tamaños alcanzan para pantallas de alta densidad y mantienen el sitio liviano (JPEG calidad 76, progresivo, sin metadatos): si se cambia una foto, conviene respetarlos. Para que la grilla cierre sin huecos, entre una grande y la siguiente, y después de la última, tiene que haber una cantidad de fotos chicas múltiplo de 4 (hoy: grande, 12 chicas, grande, 8 chicas).

`og-image.jpg` (1200×630, la vista previa al compartir el link) sale de la foto de portada. `favicon.png` (192×192) y `apple-touch-icon.png` (180×180) son el monograma "A&C" en Cormorant Garamond sobre el azul de la paleta.

## Secciones
Cuenta regresiva · Agenda con mapas · RSVP (un form por persona) · Regalos (dos alias, pesos y dólares) · Fotos

## RSVP
- Un form por persona (los +1 completan el suyo)
- Cada confirmación se escribe como una fila en una planilla de Google, vía el Apps Script publicado como web app. La URL va en `SHEET_URL`, arriba del script de `index.html` (ya cargada)
- El código del Apps Script está en `apps-script.gs`, con los pasos de instalación y deploy en su comentario de cabecera. Ojo: al editarlo hay que crear una **nueva versión** de la implementación, si no la URL `/exec` sigue ejecutando el código viejo
- El envío por mail vía formsubmit.co queda como fallback: sólo corre si `SHEET_URL` está vacía. Requiere completar `{{EMAIL}}` y confirmar la dirección la primera vez que formsubmit manda un mail

## Deploy
Vercel, sitio estático sin build. Importar el repo de GitHub como proyecto nuevo en Vercel; después, push a `main` deploya automáticamente. Preview local: `python3 -m http.server 4173`.

## Pendientes
- [x] Completar todos los `{{PLACEHOLDER}}` (ver arriba)
- [x] Reemplazar las fotos de relleno y `og-image.jpg`
- [x] Reemplazar `favicon.png` y `apple-touch-icon.png`
- [x] Describir los `alt` de las fotos (español e inglés)
- [x] Crear la planilla + Apps Script y pegar la URL en `SHEET_URL`
- [x] Crear el proyecto en Vercel y conectarlo al repo
