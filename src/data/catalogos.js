// Catálogos de CZ Construcciones: cargos, criterios, cursos y referencias del diagnóstico.

export const CIUDADES = [
  'Barranquilla', 'Soledad', 'Malambo', 'Puerto Colombia', 'Galapa',
  'Sabanagrande', 'Cartagena', 'Santa Marta',
]

export const TIPOS_PROYECTO = [
  { id: 'cubiertas', nombre: 'Cubiertas y estructuras metálicas' },
  { id: 'edificaciones', nombre: 'Vivienda y edificaciones' },
  { id: 'industrial', nombre: 'Industrial y bodegas' },
  { id: 'remodelacion', nombre: 'Remodelaciones y adecuaciones' },
  { id: 'civil', nombre: 'Obras civiles y urbanismo' },
]

export const CERTIFICADOS = {
  alturas: { corto: 'Alturas', nombre: 'Trabajo seguro en alturas', vigenciaMeses: 12, nota: 'Reentrenamiento anual · Res. 4272 de 2021' },
  coordAlturas: { corto: 'Coord. alturas', nombre: 'Coordinador de trabajo en alturas', vigenciaMeses: 12 },
  confinados: { corto: 'Confinados', nombre: 'Espacios confinados', vigenciaMeses: 12 },
  aws: { corto: 'AWS D1.1', nombre: 'Certificación de soldador (AWS D1.1)', vigenciaMeses: 24 },
  copnia: { corto: 'COPNIA', nombre: 'Matrícula profesional (COPNIA)', vigenciaMeses: null },
  conte: { corto: 'CONTE', nombre: 'Matrícula CONTE (electricista)', vigenciaMeses: null },
  sst50: { corto: 'SG-SST 50 h', nombre: 'Curso 50 horas SG-SST', vigenciaMeses: 36 },
  licenciaSst: { corto: 'Licencia SST', nombre: 'Licencia en SST', vigenciaMeses: 120 },
  primerosAux: { corto: 'Primeros aux.', nombre: 'Primeros auxilios', vigenciaMeses: 24 },
  equipos: { corto: 'Op. equipos', nombre: 'Operación segura de equipos', vigenciaMeses: 24 },
}

// Criterios de evaluación por cargo: lo que conviene revisar en cada perfil.
export const CARGOS = [
  {
    id: 'soldador', nombre: 'Soldador', area: 'Obra',
    habilidades: ['SMAW', 'GMAW / MIG', 'TIG', 'Estructuras metálicas', 'Cubiertas', 'Lectura de planos'],
    certificados: ['alturas', 'aws'],
    cursos: ['induccion', 'alturas', 'soldaduraSegura', 'herramientas'],
  },
  {
    id: 'ingeniero', nombre: 'Ingeniero civil residente', area: 'Ingeniería',
    habilidades: ['Residencia de obra', 'Presupuestos y APU', 'AutoCAD', 'Programación de obra', 'Interventoría', 'BIM / Revit'],
    certificados: ['copnia', 'coordAlturas'],
    cursos: ['induccion', 'alturas', 'liderazgo', 'calidad'],
  },
  {
    id: 'maestro', nombre: 'Maestro de obra', area: 'Obra',
    habilidades: ['Coordinación de cuadrillas', 'Lectura de planos', 'Concreto', 'Control de calidad', 'Mampostería'],
    certificados: ['alturas', 'coordAlturas'],
    cursos: ['induccion', 'alturas', 'liderazgo', 'calidad', 'primerosAux'],
  },
  {
    id: 'carpintero', nombre: 'Carpintero', area: 'Obra',
    habilidades: ['Formaletas', 'Carpintería arquitectónica', 'Instalación de puertas', 'Mobiliario', 'Acabados'],
    certificados: ['alturas'],
    cursos: ['induccion', 'alturas', 'herramientas', 'calidad'],
  },
  {
    id: 'oficial', nombre: 'Oficial de construcción', area: 'Obra',
    habilidades: ['Mampostería', 'Pañete', 'Enchapes', 'Concreto', 'Impermeabilización', 'Drywall'],
    certificados: ['alturas'],
    cursos: ['induccion', 'alturas', 'herramientas', 'calidad'],
  },
  {
    id: 'electricista', nombre: 'Electricista', area: 'Obra',
    habilidades: ['Instalaciones residenciales', 'Instalaciones industriales', 'RETIE', 'Tableros eléctricos', 'Iluminación'],
    certificados: ['conte', 'alturas'],
    cursos: ['induccion', 'alturas', 'herramientas'],
  },
  {
    id: 'ayudante', nombre: 'Ayudante de obra', area: 'Obra',
    habilidades: ['Concreto', 'Cargue y descargue', 'Mampostería', 'Aseo y orden de obra', 'Formaletas'],
    certificados: ['alturas'],
    cursos: ['induccion', 'alturas', 'herramientas'],
  },
  {
    id: 'sst', nombre: 'Técnico SST', area: 'SST',
    habilidades: ['Matriz de riesgos', 'Permisos de trabajo', 'Inspecciones', 'Investigación de incidentes', 'Capacitación'],
    certificados: ['licenciaSst', 'sst50', 'coordAlturas'],
    cursos: ['induccion', 'alturas', 'confinados', 'primerosAux', 'liderazgo'],
  },
  {
    id: 'operador', nombre: 'Operador de equipo', area: 'Obra',
    habilidades: ['Minicargador', 'Retroexcavadora', 'Montacargas', 'Mantenimiento básico'],
    certificados: ['equipos'],
    cursos: ['induccion', 'herramientas'],
  },
  {
    id: 'admin', nombre: 'Auxiliar administrativo', area: 'Oficina',
    habilidades: ['Nómina', 'Excel', 'Compras', 'Archivo documental'],
    certificados: [],
    cursos: ['induccion'],
  },
]

export const cargoPorId = Object.fromEntries(CARGOS.map((c) => [c.id, c]))

// Ruta de formación CZ (Estrategia 2 de la presentación).
export const CURSOS = [
  { id: 'induccion', nombre: 'Inducción CZ', horas: 4, tipo: 'Acompañamiento' },
  { id: 'alturas', nombre: 'Trabajo seguro en alturas', horas: 8, tipo: 'Riesgo crítico', certificado: 'alturas' },
  { id: 'confinados', nombre: 'Espacios confinados', horas: 8, tipo: 'Riesgo crítico', certificado: 'confinados' },
  { id: 'soldaduraSegura', nombre: 'Soldadura segura', horas: 6, tipo: 'Riesgo crítico' },
  { id: 'herramientas', nombre: 'Uso seguro de herramientas', horas: 4, tipo: 'Oficio' },
  { id: 'liderazgo', nombre: 'Liderazgo de cuadrillas', horas: 6, tipo: 'Desarrollo' },
  { id: 'calidad', nombre: 'Calidad del trabajo en obra', horas: 4, tipo: 'Oficio' },
  { id: 'primerosAux', nombre: 'Primeros auxilios', horas: 8, tipo: 'Bienestar', certificado: 'primerosAux' },
]

export const cursoPorId = Object.fromEntries(CURSOS.map((c) => [c.id, c]))

// Reconoce CZ: criterios visibles para que no dependa de favoritismos.
export const CRITERIOS_RECONOCIMIENTO = [
  { id: 'seguridad', nombre: 'Seguridad', descripcion: 'Cumple y promueve prácticas seguras, reporta riesgos.' },
  { id: 'equipo', nombre: 'Trabajo en equipo', descripcion: 'Colabora con la cuadrilla y otras áreas.' },
  { id: 'cumplimiento', nombre: 'Cumplimiento', descripcion: 'Entrega a tiempo y con la calidad esperada.' },
  { id: 'apoyo', nombre: 'Apoyo a compañeros', descripcion: 'Enseña, acompaña y ayuda a quien lo necesita.' },
]

// Dimensiones de la encuesta de clima (Pulso CZ).
export const DIMENSIONES_CLIMA = [
  { id: 'compromiso', nombre: 'Compromiso y pertenencia', pregunta: 'Me siento orgulloso de trabajar en CZ.' },
  { id: 'seguridad', nombre: 'Seguridad y condiciones', pregunta: 'Tengo los equipos y condiciones para trabajar seguro.' },
  { id: 'comunicacion', nombre: 'Comunicación y liderazgo', pregunta: 'Puedo hablar con mi líder cuando lo necesito.' },
  { id: 'formacion', nombre: 'Formación y desarrollo', pregunta: 'Recibo la formación que necesito para mi oficio.' },
  { id: 'reconocimiento', nombre: 'Reconocimiento', pregunta: 'Cuando hago bien mi trabajo, me lo reconocen.' },
  { id: 'salud', nombre: 'Salud y carga de trabajo', pregunta: 'Mi jornada me permite descansar y recuperarme.' },
]

export const CATEGORIAS_CANAL = ['Seguridad', 'Bienestar', 'Herramientas y equipos', 'Comunicación', 'Pagos y contratos', 'Formación', 'Otro']

export const ETAPAS = [
  { id: 'postulado', nombre: 'Postulados' },
  { id: 'preseleccionado', nombre: 'Preseleccionados' },
  { id: 'entrevista', nombre: 'Entrevista' },
  { id: 'verificacion', nombre: 'Verificación' },
  { id: 'contratado', nombre: 'Contratados' },
  { id: 'descartado', nombre: 'Descartados' },
]

export const DISPONIBILIDAD = [
  { id: 'inmediata', nombre: 'Inmediata', puntos: 1 },
  { id: '15dias', nombre: 'En 15 días', puntos: 0.6 },
  { id: '30dias', nombre: 'En 30 días', puntos: 0.3 },
  { id: 'no', nombre: 'No disponible', puntos: 0 },
]

// Radar empresarial · Recursos Humanos (diapositiva 3) y qué módulo del software lo atiende.
export const RADAR_RRHH = [
  { aspecto: 'Selección, competencias e inducción', inicial: 3, mejora: 'Hacer seguimiento según el cargo', modulo: 'CZ Talento · Inducción', ruta: 'talento/vacantes' },
  { aspecto: 'Evaluación del desempeño', inicial: 2, mejora: 'Retroalimentación y metas claras', modulo: 'Desempeño trimestral', ruta: 'personal' },
  { aspecto: 'Motivación del personal', inicial: 2, mejora: 'Escucha y reconocimiento frecuente', modulo: 'Reconoce CZ', ruta: 'reconoce' },
  { aspecto: 'Compensaciones y bonificaciones', inicial: 2, mejora: 'Criterios comunicados y transparentes', modulo: 'Reconoce CZ · criterios', ruta: 'reconoce' },
  { aspecto: 'Medición del clima laboral', inicial: 2, mejora: 'Escucha periódica y seguimiento', modulo: 'Pulso CZ', ruta: 'escucha' },
  { aspecto: 'Rotación y ausentismo', inicial: 2, mejora: 'Conocer causas y tomar medidas', modulo: 'Personal · retiros', ruta: 'personal' },
  { aspecto: 'Salud ocupacional y riesgos', inicial: 4, mejora: 'Mantener la gestión preventiva', modulo: 'Bienestar en obra', ruta: 'bienestar' },
]
