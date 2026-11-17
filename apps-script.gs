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
// Cada dato se escribe en la columna con ese título (se pueden reordenar a mano).
// Si falta alguna, se agrega al final de la fila 1.
var ENCABEZADOS = ['Fecha', 'Nombre', 'Teléfono', 'Asistencia', 'Restricciones', 'Canción', 'Mensaje', 'En la lista'];

// Listas de invitados donde se marca a cada persona. En la fila 1 tienen que tener
// las columnas "Nombre" y "Apellido"; la columna "Confirmación" se agrega sola.
var LISTAS = ['Invitados Gordo', 'Invitados Cande'];
var COLUMNA_ESTADO = 'Confirmación';
var COLOR_CONFIRMADO = '#fff2cc'; // amarillo claro
var COLOR_RECHAZADO = '#f4cccc';  // rojo claro

// Mail que recibe un aviso por cada confirmación (varios: separados por coma). Vacío = sin mails.
var AVISAR_A = 'agustindurlach@gmail.com';

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(30000); // dos personas confirmando al mismo tiempo no se pisan

  try {
    var d = JSON.parse(e.postData.contents);
    var libro = SpreadsheetApp.getActive();
    var enLista = marcarEnListas(libro, d.nombre || '', d.asistencia || '');

    agregarFila(hojaConfirmados(libro), {
      'Fecha': new Date(),
      'Nombre': d.nombre || '',
      'Teléfono': d.telefono || '',
      'Asistencia': d.asistencia || '',
      'Restricciones': d.dieta || '',
      'Canción': d.cancion || '',
      'Mensaje': d.mensaje || '',
      'En la lista': enLista
    });

    if (AVISAR_A) {
      MailApp.sendEmail(
        AVISAR_A,
        'RSVP: ' + (d.nombre || 'sin nombre') + ' — ' + (d.asistencia || ''),
        'Nombre: ' + (d.nombre || '') + '\n' +
        'Teléfono: ' + (d.telefono || '') + '\n' +
        'Asistencia: ' + (d.asistencia || '') + '\n' +
        'Restricciones: ' + (d.dieta || '') + '\n' +
        'Canción: ' + (d.cancion || '') + '\n' +
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
  }
  columnas(hoja); // agrega los títulos que falten
  return hoja;
}

/** { 'fecha': 1, 'nombre': 2, ... } según los títulos de la fila 1; agrega al final los que falten. */
function columnas(hoja) {
  var ancho = Math.max(hoja.getLastColumn(), 1);
  var titulos = hoja.getRange(1, 1, 1, ancho).getValues()[0];
  var cols = {};
  titulos.forEach(function (t, i) { if (t !== '' && !cols[normalizar(t)]) cols[normalizar(t)] = i + 1; });
  var ultima = 0;
  titulos.forEach(function (t, i) { if (t !== '') ultima = i + 1; });
  ENCABEZADOS.forEach(function (t) {
    if (!cols[normalizar(t)]) {
      ultima++;
      hoja.getRange(1, ultima).setValue(t);
      cols[normalizar(t)] = ultima;
    }
  });
  return cols;
}

/** Agrega una fila poniendo cada dato debajo de su título. */
function agregarFila(hoja, datos) {
  var cols = columnas(hoja);
  var fila = [];
  Object.keys(datos).forEach(function (t) { fila[cols[normalizar(t)] - 1] = datos[t]; });
  for (var i = 0; i < fila.length; i++) if (fila[i] === undefined) fila[i] = '';
  hoja.getRange(hoja.getLastRow() + 1, 1, 1, fila.length).setValues([fila]);
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
  return String(s).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    .replace(/\(.*?\)/g, ' ').replace(/[^a-z0-9]+/g, ' ').trim();
}

function palabras(s) {
  var n = normalizar(s);
  return n ? n.split(' ') : [];
}

function viene(asistencia) {
  return /^(si|yes)/.test(normalizar(asistencia)); // "Sí" / "Yes"
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
  var cols = columnas(hoja);
  var filas = hoja.getRange(2, 1, hoja.getLastRow() - 1, hoja.getLastColumn()).getValues();
  filas.forEach(function (fila, i) {
    var resultado = marcarEnListas(libro, fila[cols['nombre'] - 1], fila[cols['asistencia'] - 1]);
    hoja.getRange(i + 2, cols['en la lista']).setValue(resultado);
  });
}
