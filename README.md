# OS5

Actividad de quinto de primaria: Misión azul.

- Normal: 20 misiones. Avanzado: 30 misiones.
- Instrucciones numeradas con doble clic explícito y comprobación de ruta.
- Protección contra pegar en carpetas equivocadas y confundir copiar/cortar.
- Misión anterior y Reintentar restauran los archivos y diapositivas.
- Robot guía, fichas de lectura y tolerancia de ortografía.

Todo funciona dentro del navegador. Al recargar se reinicia la práctica.

## Juego de entregas de quinto

El botón **Jugar Entregas** del escritorio abre `actividades/entregas/index.html` con diez niveles de tres encargos y un reto hacker opcional de seis encargos. Se trabaja con textos, imágenes, audio, video, PDF y presentaciones: carpetas por materia, rutas de investigación, nombres descriptivos, versiones, corrección de ubicaciones, creación de proyectos y una entrega con respaldo.

La ventana de Guardar como empieza en Descargas. El alumno elige una carpeta real del árbol simulado y debe acertar el destino y el nombre. Continuar no acredita una operación pendiente. El reto hacker está disponible desde el inicio y termina con una copia de respaldo que conserva el original. No hay temporizador ni preguntas de opción múltiple.

El juego guarda su propio progreso y bitácora en este navegador, separados de otros grados. Descargar bitácora genera un TXT con fechas, encargos, errores, intentos y archivos resultantes. No mide ayuda externa ni equivale a una calificación escolar. El guardado local no se transfiere automáticamente a otra computadora. Las misiones originales, Robot Lab y las tres animaciones de OS5 se conservan.

Verificación: `node tests/entregas.cjs` recorre los 36 encargos y comprueba errores sin avance, extensiones, versiones, movimientos, respaldo, desbloqueos, bitácora y recarga.
