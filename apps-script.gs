/**
 * Backend del RSVP del sitio de invitación (https://gordoycande.vercel.app)
 *
 * Este archivo NO se usa en el sitio: es la copia versionada del código que vive
 * en Google Apps Script, atado a la planilla del casamiento.
 *
 * Qué hace cada confirmación:
 *  1. Agrega una fila en la pestaña CONFIRMADOS (si no existe, la crea).
 *  2. Busca a la persona en "Invitados Gordo" e "Invitados Cande" y, si la encuentra,
 *     escribe Confirmado / Rechazado en la columna "Confirmación" y pinta la fila
 *     (amarillo claro = viene, rojo claro = no viene).
 *  3. Anota en la columna "En la lista" de CONFIRMADOS dónde la marcó, o que no la
 *     encontró / encontró varias posibles. En esos casos NO marca nada: se marca a mano.
 *
 * Cómo instalarlo (una sola vez):
 *  1. En la planilla del casamiento: Extensiones → Apps Script. Borrar lo que haya y pegar este archivo. Guardar.
 *  2. Elegir la función "prepararListas" y Ejecutar. Autorizar (aparece "Google no verificó esta app" →
 *     Configuración avanzada → Ir al proyecto → Permitir). Crea la pestaña CONFIRMADOS y la columna
 *     "Confirmación" en las dos listas de invitados.
 *  3. Implementar → Nueva implementación → tipo "Aplicación web".
 *       - Ejecutar como: Yo
 *       - Quién tiene acceso: Cualquier usuario   <-- importante, NO "cualquier usuario con cuenta de Google"
 *  4. Copiar la URL que termina en /exec y pegarla en SHEET_URL, arriba del script de index.html.
 *
 * Ojo: cada vez que edites este código hay que hacer Implementar → Gestionar implementaciones →
 * editar (lápiz) → Versión: Nueva. Si no, la URL /exec sigue sirviendo el código viejo.
 *
 * Si corregís un nombre en las listas (por ejemplo, alguien que confirmó con apodo), ejecutá
 * "remarcarTodo": vuelve a cruzar todas las confirmaciones con las listas.
 */

// Pestaña donde caen las confirmaciones.
var PESTANA = 'CONFIRMADOS';
var ENCABEZADOS = ['Fecha', 'Nombre', 'Asistencia', 'Restricciones', 'Mensaje', 'En la lista'];

// Listas de invitados donde se marca a cada persona. En la fila 1 tienen que tener
// las columnas "Nombre" y "Apellido"; la columna "Confirmación" se agrega sola.
var LISTAS = ['Invitados Gordo', 'Invitados Cande'];
var COLUMNA_ESTADO = 'Confirmación';
var COLOR_CONFIRMADO = '#fff2cc'; // amarillo claro
var COLOR_RECHAZADO = '#f4cccc';  // rojo claro

// Si querés además un mail por cada confirmación, poné acá la dirección. Vacío = sin mails.
var AVISAR_A = '';

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(30000); // dos personas confirmando al mismo tiempo no se pisan

  try {
    var d = JSON.parse(e.postData.contents);
    var libro = SpreadsheetApp.getActive();
    var enLista = marcarEnListas(libro, d.nombre || '', d.asistencia || '');

    hojaConfirmados(libro).appendRow([
      new Date(),
      d.nombre || '',
      d.asistencia || '',
      d.dieta || '',
      d.mensaje || '',
      enLista
    ]);

    if (AVISAR_A) {
      MailApp.sendEmail(
        AVISAR_A,
        'RSVP: ' + (d.nombre || 'sin nombre') + ' — ' + (d.asistencia || ''),
        'Nombre: ' + (d.nombre || '') + '\n' +
        'Asistencia: ' + (d.asistencia || '') + '\n' +
        'Restricciones: ' + (d.dieta || '') + '\n' +
        'Mensaje: ' + (d.mensaje || '') + '\n' +
        'En la lista: ' + enLista
      );
    }

    return json({ ok: true });
  } catch (err) {
    // Queda en Ejecuciones, dentro del editor de Apps Script
    console.error(err);
    return json({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

function json(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/** La pestaña de confirmaciones; si no existe la crea. Nunca escribe en otra pestaña. */
function hojaConfirmados(libro) {
  var hoja = libro.getSheetByName(PESTANA);
  if (!hoja) {
    hoja = libro.insertSheet(PESTANA);
    hoja.appendRow(ENCABEZADOS);
    hoja.setFrozenRows(1);
  } else if (hoja.getRange(1, ENCABEZADOS.length).getValue() === '') {
    hoja.getRange(1, ENCABEZADOS.length).setValue(ENCABEZADOS[ENCABEZADOS.length - 1]);
  }
  return hoja;
}

/**
 * Columnas de Nombre, Apellido y Confirmación de una lista (1 = columna A).
 * Si falta "Confirmación", la inserta justo después de la tabla principal.
 */
function tabla(hoja) {
  var enc = hoja.getRange(1, 1, 1, hoja.getLastColumn()).getValues()[0].map(normalizar);
  var colNombre = enc.indexOf('nombre') + 1;
  var colApellido = enc.indexOf('apellido') + 1;
  if (!colNombre || !colApellido) return null;

  var colEstado = enc.indexOf(normalizar(COLUMNA_ESTADO)) + 1;
  if (!colEstado) {
    var fin = colNombre; // última columna con encabezado, sin cortes, desde "Nombre"
    while (fin < enc.length && enc[fin] !== '') fin++;
    hoja.insertColumnAfter(fin);
    colEstado = fin + 1;
    hoja.getRange(1, fin).copyTo(hoja.getRange(1, colEstado), { formatOnly: true });
    hoja.getRange(1, colEstado).setValue(COLUMNA_ESTADO);
  }
  return { colNombre: colNombre, colApellido: colApellido, colEstado: colEstado };
}

/** "  Sebastián  Madero (Nano)" → "sebastian madero" */
function normalizar(s) {
  return String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
    .replace(/\(.*?\)/g, ' ').replace(/[^a-z0-9]+/g, ' ').trim();
}

function palabras(s) {
  var n = normalizar(s);
  return n ? n.split(' ') : [];
}

function viene(asistencia) {
  return /^(si|yes)/.test(normalizar(asistencia)); // "Siiii" / "Yesss"
}

/**
 * Busca a la persona en las listas. Marca solo si hay UNA coincidencia:
 *  - exacta: nombre + apellido de la lista == lo que escribió (sin tildes ni mayúsculas), o si no
 *  - parecida: escribió el primer nombre y todo el apellido ("Mariano Posse" → "Mariano Agustín Posse").
 * Devuelve el texto para la columna "En la lista".
 */
function marcarEnListas(libro, nombre, asistencia) {
  var escrito = palabras(nombre);
  if (!escrito.length) return 'Sin nombre';
  var textoEscrito = escrito.join(' ');
  var exactos = [], parecidos = [];

  LISTAS.forEach(function (nombreHoja) {
    var hoja = libro.getSheetByName(nombreHoja);
    if (!hoja || hoja.getLastRow() < 2) return;
    var t = tabla(hoja);
    if (!t) return;
    var filas = hoja.getRange(2, 1, hoja.getLastRow() - 1, hoja.getLastColumn()).getValues();
    filas.forEach(function (fila, i) {
      var n = palabras(fila[t.colNombre - 1]), a = palabras(fila[t.colApellido - 1]);
      if (!n.length) return;
      var c = { hoja: hoja, t: t, fila: i + 2 };
      if (n.concat(a).join(' ') === textoEscrito) exactos.push(c);
      else if (a.length && escrito.indexOf(n[0]) >= 0 &&
               a.every(function (p) { return escrito.indexOf(p) >= 0; })) parecidos.push(c);
    });
  });

  var elegidos = exactos.length ? exactos : parecidos;
  if (!elegidos.length) return 'No encontrado: marcar a mano';
  if (elegidos.length > 1) return 'Varios posibles (' + elegidos.map(donde).join(', ') + '): marcar a mano';

  var c = elegidos[0], si = viene(asistencia);
  var desde = Math.min(c.t.colNombre, c.t.colEstado), hasta = Math.max(c.t.colNombre, c.t.colEstado);
  c.hoja.getRange(c.fila, c.t.colEstado).setValue(si ? 'Confirmado' : 'Rechazado');
  c.hoja.getRange(c.fila, desde, 1, hasta - desde + 1).setBackground(si ? COLOR_CONFIRMADO : COLOR_RECHAZADO);
  return donde(c);
}

function donde(c) {
  return c.hoja.getName() + ' · fila ' + c.fila;
}

/** Ejecutar una vez desde el editor: crea CONFIRMADOS y la columna "Confirmación" en las listas. */
function prepararListas() {
  var libro = SpreadsheetApp.getActive();
  hojaConfirmados(libro);
  LISTAS.forEach(function (nombreHoja) {
    var hoja = libro.getSheetByName(nombreHoja);
    if (hoja) tabla(hoja);
  });
}

/** Vuelve a cruzar todas las confirmaciones con las listas (después de corregir un nombre a mano). */
function remarcarTodo() {
  var libro = SpreadsheetApp.getActive();
  var hoja = hojaConfirmados(libro);
  if (hoja.getLastRow() < 2) return;
  var filas = hoja.getRange(2, 1, hoja.getLastRow() - 1, ENCABEZADOS.length).getValues();
  filas.forEach(function (fila, i) {
    hoja.getRange(i + 2, ENCABEZADOS.length).setValue(marcarEnListas(libro, fila[1], fila[2]));
  });
}
