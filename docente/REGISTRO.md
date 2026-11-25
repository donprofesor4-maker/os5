# Expediente OS5 y promedio trimestral

Registro integrado en Entregas de quinto. El juego y sus actividades anteriores se conservan. El servicio de Google Apps Script se ejecuta en la cuenta DonProfesor4; la URL pública está configurada en registro-config.js. La hoja de datos permanece privada.

## Flujo del alumno

1. Primera vez: nombre, grupo, clave personal de seis números y código de clase del profesor. Después entra con los mismos datos, desde cualquier computadora.
2. El expediente recupera evidencias y punto de continuación. Los perfiles locales se separan; el trabajo anónimo anterior no se atribuye automáticamente a ningún niño.
3. «Guardar y terminar clase» envía el avance, incluso incompleto. Solo anuncia «guardado» con confirmación del servidor. Ante un fallo conserva el reporte en esa computadora y permite reenviarlo sin duplicarlo. El juego queda pausado hasta resolver el envío o cambiar de alumno.
4. Un envío confirmado cierra la sesión. La clave del alumno solo permanece en memoria mientras juega; nunca se guarda en localStorage. En computadora compartida hay que terminar/cambiar alumno antes de entregarla.
5. Al superar el último reto, el botón final permite guardar y terminar. La bitácora descargable sigue disponible.

## Promedio propuesto, sujeto a revisión docente

En `Trimestres`, el profesor define fechas (inicio incluido, fin excluido) y encargos básicos asignados, del 1 al 30. Fechas iniciales orientativas para 2026–2027: hay que ajustarlas al calendario real de la escuela. El primer trimestre se propone con las 30 entregas; los otros quedan sin asignaciones y sin nota hasta configurarlos.

`Promedio = 10 × encargos asignados acreditados durante el trimestre / encargos asignados`.

- Se cuenta cada encargo una sola vez por trimestre. Los reportes parciales, reintentos y errores no se promedian ni rebajan la nota.
- Se usa la fecha en que el servidor recibe la evidencia, para no depender del reloj del equipo del alumno. Si se entrega tarde por falta de internet, el profesor puede revisar su bitácora y ajustar la evaluación.
- Los seis encargos hacker se muestran por separado; no son requisito para obtener 10 en las actividades básicas.
- `Resumen` muestra una propuesta de este juego, no el promedio oficial de toda la materia. La columna `Nota docente` se conserva al actualizar. Otros juegos o trabajos deberán integrarse explícitamente antes de promediar toda la materia.
- No se mide autonomía ni comprensión completa a partir de pulsaciones. Se conservan operaciones, solicitudes, destinos y resultados como evidencia de la simulación.

## Despliegue

1. Crear proyecto nuevo de Apps Script en **donprofesor4@gmail.com**, sin modificar el servicio anterior de entregas PDF.
2. Pegar `backend/Code.gs` y, a continuación, `actividades/archivo-engine/rules.js` en el proyecto. No publicar estas instrucciones como página del alumno.
3. Ejecutar `prepararRegistro` una sola vez. Requiere autorización de Google para crear/editar la hoja privada del registro. La función es idempotente. La URL de la hoja aparece en el registro de ejecución.
4. Publicar como aplicación web, ejecutada como propietario, acceso de alumnos sin cuenta de Google. La hoja NO se comparte públicamente. Solo `doPost` acepta registro, acceso y envío; no expone listado ni panel docente. Requiere clave personal para consultar el expediente y código de clase para crear alumnos.
5. Colocar la URL `/exec` en `actividades/archivo-engine/registro-config.js`. No subir códigos de clase, claves, IDs de alumnos ni expedientes a GitHub.
6. Verificar desde el dominio GitHub Pages que el navegador recibe respuesta JSON (incluida la redirección de Apps Script). No usar `no-cors`: una respuesta opaca no acredita que el reporte se guardó.
7. Ensayar alta, envío parcial, reintento del mismo reporte, recuperación en otro navegador y resumen. Después publicar.

La autorización y publicación inicial del servicio se completaron el 25 de noviembre de 2026. Se verificaron alta, envío parcial, reenvío idempotente y recuperación contra la nube real, además de un envío de evidencia desde el navegador. Las instrucciones anteriores permiten reinstalarlo en otro entorno.

## Administración

La hoja tiene Inicio, Trimestres, Resumen, Sesiones y Evidencias; Alumnos y Estado quedan ocultas por claridad (ocultar no constituye protección frente a editores). Mantener el archivo privado y no dar edición a los alumnos. El código de clase está en Inicio. Tras ajustar asignaciones, ejecutar `actualizarResumen`. El profesor puede restablecer una clave eliminando únicamente el alta del alumno con revisión previa de su identidad; no borrar el expediente. Se recomienda añadir una interfaz docente de recuperación antes del uso masivo.

El servicio rechaza conflictos de revisión entre dos computadoras. En ese caso, descargar la bitácora y usar «Recuperar el avance más reciente». Se archiva el reporte en conflicto localmente, se recupera el punto de continuación de la nube y se conservan las evidencias locales para volver a enviarlas. No usar dos equipos simultáneamente para el mismo alumno. Los envíos no son una prueba contra manipulación deliberada del navegador: se validan las evidencias contra los encargos canónicos, pero la nota final requiere revisión docente.
