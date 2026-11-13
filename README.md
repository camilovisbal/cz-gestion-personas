# CZ Personas · Prototipo de Gestión de Personas

**Ver en línea:** https://camilovisbal.github.io/cz-gestion-personas/

Prototipo de software para **CZ Construcciones Ltda.** (Barranquilla), desarrollado para la materia Gestión de Personas a partir del documento *Diagnóstico y Plan de Mejora CZ*.

Responde al diagnóstico: Recursos Humanos fue el factor más débil del radar empresarial (2,56 / 5) y la encuesta de clima dio 3,5 / 5, con reconocimiento (2,9) y formación (3,1) como los puntos más bajos.

## Cómo abrirlo

Requiere Node.js 20 o superior.

```bash
npm install
npm run dev
```

Luego abrir http://localhost:5180. En Windows también se puede usar `iniciar-cz-personas.bat` (en la carpeta superior).

Los datos son ficticios y se guardan en el navegador. El botón **Restablecer datos demo** (abajo a la izquierda) los devuelve al estado inicial.

## Vistas por rol

El selector de la barra superior cambia entre tres vistas:

| Rol | Persona de ejemplo | Qué ve |
|---|---|---|
| Gestión Humana | Carolina Mejía Ríos | Todos los módulos |
| Líder de obra | Ing. Mónica Barrios (Edificio Altos del Prado, en cierre) | Su cuadrilla, charlas, nominaciones, desempeño, bienestar y solicitudes de personal |
| Trabajador | José Ariza (soldador, Bodega Malambo) | Portal móvil: Pulso CZ, Canal CZ, formación, reconocimientos y reporte de bienestar |

## Módulos

**CZ Talento (reclutamiento)**
- Vacantes creadas desde la necesidad de cada obra: cargo, experiencia mínima, tipo de obra, habilidades, certificados obligatorios y disponibilidad.
- Candidatos sugeridos con un **puntaje orientativo de 0 a 100** y la explicación de cada criterio (qué cumple y qué falta revisar).
- Quien no cumple un requisito obligatorio aparece aparte, con el motivo.
- Tablero del proceso de selección (arrastrar y soltar): postulados → preseleccionados → entrevista → verificación → contratados.
- Banco de talento con filtros por oficio, tipo de obra, experiencia, certificados vigentes, disponibilidad, ciudad y "trabajó en CZ".
- Registro de candidatos con un **asistente de lectura de hoja de vida**: se pega el texto y propone los datos para revisar. En el prototipo funciona con reglas; en una versión real se usaría IA.
- Exportación a Excel (CSV).

**Personas**
- Directorio de trabajadores con estado de certificados, ruta de formación y último desempeño.
- Conversaciones trimestrales de desempeño.
- Obras: personal requerido frente al asignado, y proyección de la plantilla según las obras programadas (CZ tiene menos de 60 personas, pero el número cambia con cada proyecto).
- Evaluación de cierre: al terminar una obra, el líder califica a cada trabajador y la persona pasa al banco de talento con su historial.

**Estrategia 1 · Escuchar y reconocer**
- Pulso CZ: encuesta corta por QR o en papel, resultados por dimensión frente a la línea base y la meta, eNPS y resultados por obra (solo con 5 respuestas o más).
- Canal CZ: sugerencias e inquietudes con responsable y plazo de respuesta de 15 días; mural "Qué nos dijeron y qué hicimos".
- Charlas semanales de 10 minutos con la cuadrilla.
- Reconoce CZ: criterios visibles, nominaciones, reconocidos del mes, retroalimentación y distribución por obra y cargo (transparencia).

**Estrategia 2 · Formación que sirva en obra**
- Matriz de cursos por oficio, programación de capacitaciones, asistencia y certificados (incluye el reentrenamiento en alturas, Res. 4272 de 2021).
- Inducción y acompañamiento de un trabajador experimentado para el personal nuevo (se asigna automáticamente al contratar).

**Estrategia 3 · Bienestar en obra**
- Horas trabajadas por semana y por obra, con alerta en cierres de obra.
- Pausas activas y reportes de molestias (pueden ser anónimos), canalizados a SST, ARL o EPS.

**Plan de mejora**
- Los 7 indicadores de la presentación (punto de partida, valor actual y meta a 6 meses), calculados con los datos de los módulos.
- Plan de trabajo de 6 meses con tareas y evidencias.
- Relación entre cada aspecto del radar de Recursos Humanos y el módulo que lo atiende.

## Tecnología

React 19 + Vite. Sin backend: los datos de ejemplo se generan en `src/data/seed.js` y se guardan en `localStorage`.

```
src/
  data/        catálogos (cargos, cursos, criterios) y datos de ejemplo
  lib/         reglas: puntaje de candidatos, certificados, clima, lectura de hoja de vida
  store/       estado global y acciones
  components/  interfaz reutilizable, gráficos y formularios
  pages/       módulos (talento, personas, estrategias, líder y trabajador)
```

Tratamiento de datos personales conforme a la Ley 1581 de 2012: el registro de candidatos exige la autorización.
