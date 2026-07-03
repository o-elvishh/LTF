const CORREO_DESTINO = "mayfesm@inaoep.mx";
const CORREO_CCO = "anyel.garcia@inaoe.mx";

function doGet(e) {
  const version = e && e.parameter && String(e.parameter.v || "").toUpperCase() === "B" ? "B" : "A";
  const template = HtmlService.createTemplateFromFile("Examen");
  template.version = version;

  return template
    .evaluate()
    .setTitle("Examen Bioseguridad " + version + " - Laboratorio TFD")
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function doPost(e) {
  try {
    const contents = e && e.postData && e.postData.contents
      ? e.postData.contents
      : e.parameter && e.parameter.data;

    if (!contents) {
      throw new Error("No se recibieron datos en la solicitud POST.");
    }

    const resultado = procesarExamen(JSON.parse(contents));

    return ContentService
      .createTextOutput(resultado.ok ? "Exito" : "Error: " + resultado.error)
      .setMimeType(ContentService.MimeType.TEXT);

  } catch (err) {
    registrarError_("ERROR_GENERAL", err, null);

    return ContentService
      .createTextOutput("Error: " + err.message)
      .setMimeType(ContentService.MimeType.TEXT);
  }
}

function procesarExamen(data) {
  try {
    if (!data || !data.nombre || !data.correo) {
      throw new Error("Faltan nombre o correo.");
    }

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheetRespuestas = ss.getSheetByName("Respuestas") || ss.insertSheet("Respuestas");

    const versionExamen = String(data.version || "A").toUpperCase() === "B" ? "B" : "A";
    const nombreHojaConfig = versionExamen === "B" ? "Configuracion_B" : "Configuracion_A";
    const sheetConfig = ss.getSheetByName(nombreHojaConfig);

    if (!sheetConfig) {
      throw new Error("No se encontro la hoja: " + nombreHojaConfig);
    }

    const configData = sheetConfig.getDataRange().getValues();
    let aciertosTotales = 0;
    let totalPreguntasCalificables = 0;
    let detalleFallos = "";
    const seccionesInfo = {};

    for (let i = 1; i < configData.length; i++) {
      const id = configData[i][0];
      const tema = configData[i][2];
      const correcta = String(configData[i][3]).trim().toUpperCase();

      if (correcta !== "REVISION MANUAL" && correcta !== "REVISIÓN MANUAL" && id) {
        totalPreguntasCalificables++;

        if (!seccionesInfo[tema]) {
          seccionesInfo[tema] = { aciertos: 0, total: 0 };
        }

        seccionesInfo[tema].total++;

        const respuestaAlumno = data[id] ? String(data[id]).trim().toUpperCase() : "VACIO";

        if (respuestaAlumno === correcta) {
          aciertosTotales++;
          seccionesInfo[tema].aciertos++;
        } else {
          detalleFallos += '<li><b>Pregunta ' + String(id).replace("p", "") + ':</b> Marco "' +
            respuestaAlumno + '", la correcta era "' + correcta + '"</li>';
        }
      }
    }

    if (totalPreguntasCalificables === 0) {
      throw new Error("No hay preguntas calificables en la hoja " + nombreHojaConfig + ".");
    }

    const notaFinal = ((aciertosTotales / totalPreguntasCalificables) * 10).toFixed(1);
    const cuerpoHTML = construirReporte_(data, versionExamen, aciertosTotales, totalPreguntasCalificables, notaFinal, seccionesInfo, detalleFallos);

    sheetRespuestas.appendRow([
      new Date(),
      data.nombre || "",
      data.correo || "",
      versionExamen,
      aciertosTotales,
      notaFinal,
      JSON.stringify(data)
    ]);

    try {
      MailApp.sendEmail({
        to: CORREO_DESTINO,
        bcc: CORREO_CCO,
        subject: "EXAMEN V." + versionExamen + " [Nota: " + notaFinal + "]: " + data.nombre,
        htmlBody: cuerpoHTML
      });
    } catch (mailErr) {
      registrarError_("ERROR_CORREO", mailErr, data);
    }

    return {
      ok: true,
      mensaje: "Tus respuestas fueron registradas correctamente."
    };

  } catch (err) {
    registrarError_("ERROR_GENERAL", err, data || null);
    return {
      ok: false,
      error: err.message
    };
  }
}

function construirReporte_(data, versionExamen, aciertosTotales, totalPreguntasCalificables, notaFinal, seccionesInfo, detalleFallos) {
  let tablaHTML = '<table border="1" style="border-collapse: collapse; width: 100%;">' +
    '<tr style="background: #f2f2f2;"><th>Seccion</th><th>Puntaje</th></tr>';

  for (const tema in seccionesInfo) {
    tablaHTML += "<tr><td>" + tema + '</td><td style="text-align:center;">' +
      seccionesInfo[tema].aciertos + " / " + seccionesInfo[tema].total + "</td></tr>";
  }

  tablaHTML += "</table>";

  return '<div style="font-family: Arial, sans-serif; padding: 20px;">' +
    "<h2>Reporte de Examen: " + escapeHtml(data.nombre) + " (Version " + versionExamen + ")</h2>" +
    '<div style="margin: 20px 0; padding: 20px; background: #ebf5fb; border: 2px solid #2980b9; text-align: center;">' +
    '<h2 style="margin: 0; color: #2980b9;">CALIFICACION FINAL</h2>' +
    '<span style="font-size: 32px; font-weight: bold;">' +
    aciertosTotales + " / " + totalPreguntasCalificables + " = " + notaFinal +
    "</span></div>" +
    "<h3>1. Calificacion por Temas</h3>" +
    tablaHTML +
    "<h3>2. Detalle de Fallos</h3>" +
    "<ul>" + (detalleFallos || "<li>Sin errores.</li>") + "</ul>" +
    "<h3>3. Respuestas Abiertas</h3>" +
    "<p><b>BP1:</b> " + escapeHtml(data.bp1) +
    " | <b>BP2:</b> " + escapeHtml(data.bp2) +
    " | <b>BP3:</b> " + escapeHtml(data.bp3) +
    " | <b>BP4:</b> " + escapeHtml(data.bp4) + "</p>" +
    "</div>";
}

function registrarError_(tipo, err, data) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheetErrores = ss.getSheetByName("Errores") || ss.insertSheet("Errores");

    sheetErrores.appendRow([
      new Date(),
      tipo,
      err && err.message ? err.message : String(err),
      err && err.stack ? err.stack : "",
      data ? JSON.stringify(data) : ""
    ]);
  } catch (logErr) {
    console.error(logErr);
  }
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
