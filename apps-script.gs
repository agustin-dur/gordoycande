/**
 * Backend del RSVP del sitio de invitación (https://gordoycande.vercel.app)
 *
 * Este archivo NO se usa en el sitio: es la copia versionada del código que vive
 * en Google Apps Script, atado a la planilla de respuestas.
 *
 * Cómo instalarlo (una sola vez):
 *  1. En la planilla del casamiento, crear una pestaña "CONFIRMADOS" con estos encabezados en la fila 1:
 *     Fecha | Nombre | Asistencia | Restricciones | Mensaje
 *     (si la pestaña no existe, el script la crea sola con esos encabezados en la primera confirmación)
 *  2. En la planilla: Extensiones → Apps Script. Borrar lo que haya y pegar este archivo. Guardar.
 *  3. Implementar → Nueva implementación → tipo "Aplicación web".
 *       - Ejecutar como: Yo
 *       - Quién tiene acceso: Cualquier usuario   <-- importante, NO "cualquier usuario con cuenta de Google"
 *  4. Autorizar (aparece "Google no verificó esta app" → Configuración avanzada → Ir al proyecto).
 *  5. Copiar la URL que termina en /exec y pegarla en SHEET_URL, arriba del script de index.html.
 *
 * Ojo: cada vez que edites este código hay que hacer Implementar → Gestionar implementaciones →
 * editar (lápiz) → Versión: Nueva. Si no, la URL /exec sigue sirviendo el código viejo.
 */

// Pestaña donde caen las confirmaciones. Nunca se escribe en otra.
var PESTANA = 'CONFIRMADOS';
var ENCABEZADOS = ['Fecha', 'Nombre', 'Asistencia', 'Restricciones', 'Mensaje'];

// Si querés además un mail por cada confirmación, poné acá la dirección. Vacío = sin mails.
var AVISAR_A = '';

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(30000); // dos personas confirmando al mismo tiempo no se pisan

  try {
    var libro = SpreadsheetApp.getActive();
    var hoja = libro.getSheetByName(PESTANA);
    if (!hoja) { // la planilla tiene otras pestañas: nunca caer en la primera
      hoja = libro.insertSheet(PESTANA);
      hoja.appendRow(ENCABEZADOS);
      hoja.setFrozenRows(1);
    }
    var d = JSON.parse(e.postData.contents);

    hoja.appendRow([
      new Date(),
      d.nombre || '',
      d.asistencia || '',
      d.dieta || '',
      d.mensaje || ''
    ]);

    if (AVISAR_A) {
      MailApp.sendEmail(
        AVISAR_A,
        'RSVP: ' + (d.nombre || 'sin nombre') + ' — ' + (d.asistencia || ''),
        'Nombre: ' + (d.nombre || '') + '\n' +
        'Asistencia: ' + (d.asistencia || '') + '\n' +
        'Restricciones: ' + (d.dieta || '') + '\n' +
        'Mensaje: ' + (d.mensaje || '')
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

/** Para probar desde el editor sin pasar por el sitio: Ejecutar → probar. */
function probar() {
  doPost({ postData: { contents: JSON.stringify({
    nombre: 'Prueba', asistencia: 'Siiii', dieta: '', mensaje: 'fila de prueba'
  }) } });
}
