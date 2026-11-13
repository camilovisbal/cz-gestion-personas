// Datos de demostración (ficticios) para CZ Construcciones Ltda. — Barranquilla.
// Se usa un generador pseudoaleatorio con semilla: siempre produce los mismos datos.
import { CARGOS, cargoPorId, CERTIFICADOS, CIUDADES, DIMENSIONES_CLIMA } from './catalogos.js'
import { enDias, enMeses, inicioMes } from '../lib/fechas.js'

function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// Usuaria de ejemplo con el rol de Gestión Humana.
export const USUARIO_ADMIN = { nombre: 'Carolina Mejía Ríos', cargo: 'Coordinadora de Gestión Humana' }

export function crearDatosDemo() {
  const rnd = mulberry32(20261112)
  const int = (a, b) => Math.floor(rnd() * (b - a + 1)) + a
  const pick = (arr) => arr[Math.floor(rnd() * arr.length)]
  const sample = (arr, n) => [...arr].sort(() => rnd() - 0.5).slice(0, n)

  const NOMBRES_H = ['Carlos', 'José', 'Luis', 'Jorge', 'Andrés', 'Rafael', 'Kevin', 'Yeison', 'Jhon', 'Edwin', 'Fabián', 'Hernán', 'Alberto', 'Rubén', 'Wilmer', 'Orlando', 'Javier', 'Dairo', 'Eliécer', 'Samuel', 'Iván', 'Nelson', 'Ricardo', 'Óscar', 'Alfonso', 'Freddy', 'Jair', 'Elkin', 'Mauricio', 'Hugo']
  const NOMBRES_M = ['María', 'Laura', 'Mónica', 'Daniela', 'Paola', 'Katherine', 'Yuliana', 'Andrea', 'Diana', 'Sandra', 'Liliana', 'Marcela']
  const APELLIDOS = ['Ariza', 'Barrios', 'Charris', 'Polo', 'Pertuz', 'Orozco', 'Mendoza', 'Cantillo', 'De la Hoz', 'Fontalvo', 'Gutiérrez', 'Herrera', 'Jiménez', 'Llanos', 'Márquez', 'Navarro', 'Ospino', 'Padilla', 'Rada', 'Salcedo', 'Torres', 'Urueta', 'Vergara', 'Zapata', 'Ahumada', 'Bolaño', 'Cassiani', 'Escorcia', 'Guerrero', 'Molina', 'Rodríguez', 'Pacheco', 'Montes', 'Castro', 'Sarmiento']

  const usados = new Set()
  function nombre(mujer = false) {
    for (;;) {
      const n = `${pick(mujer ? NOMBRES_M : NOMBRES_H)} ${pick(APELLIDOS)} ${pick(APELLIDOS)}`
      if (!usados.has(n)) { usados.add(n); return n }
    }
  }

  // ───────── Obras ─────────
  const obras = [
    { id: 'o1', nombre: 'Bodega industrial Malambo', cliente: 'Logística del Caribe S.A.S.', ciudad: 'Malambo', tipo: 'industrial', fase: 'Estructura y cubierta', estado: 'activa', inicio: enDias(-150), fin: enDias(120), avance: 58,
      requeridos: { ingeniero: 1, maestro: 1, soldador: 5, ayudante: 4, oficial: 3, operador: 1, electricista: 1, sst: 1 } },
    { id: 'o2', nombre: 'Edificio Altos del Prado', cliente: 'Constructora Prado Norte', ciudad: 'Barranquilla', tipo: 'edificaciones', fase: 'Cierre de obra', estado: 'activa', inicio: enDias(-410), fin: enDias(24), avance: 92,
      requeridos: { ingeniero: 1, maestro: 1, oficial: 6, ayudante: 4, carpintero: 2, electricista: 1, sst: 1 } },
    { id: 'o3', nombre: 'Adecuación locales Puerto Colombia', cliente: 'Inversiones Costa Azul', ciudad: 'Puerto Colombia', tipo: 'remodelacion', fase: 'Inicio', estado: 'activa', inicio: enDias(-18), fin: enDias(105), avance: 12,
      requeridos: { ingeniero: 1, maestro: 1, oficial: 4, carpintero: 2, ayudante: 2, electricista: 1 } },
    { id: 'o4', nombre: 'Cubierta Colegio Soledad', cliente: 'Secretaría de Educación de Soledad', ciudad: 'Soledad', tipo: 'cubiertas', fase: 'Planeación', estado: 'planeacion', inicio: enDias(21), fin: enDias(150), avance: 0,
      requeridos: { ingeniero: 1, maestro: 1, soldador: 4, ayudante: 3 } },
    { id: 'of', nombre: 'Oficina central Barranquilla', cliente: 'CZ Construcciones', ciudad: 'Barranquilla', tipo: null, fase: 'Permanente', estado: 'oficina', inicio: enDias(-3000), fin: null, avance: null,
      requeridos: { admin: 3, ingeniero: 1, sst: 1 } },
    { id: 'h1', nombre: 'Urbanización Villa Campestre', cliente: 'Prados del Caribe', ciudad: 'Barranquilla', tipo: 'edificaciones', fase: 'Entregada', estado: 'finalizada', inicio: enDias(-900), fin: enDias(-420), avance: 100, requeridos: {} },
    { id: 'h2', nombre: 'Cubierta Coliseo Galapa', cliente: 'Alcaldía de Galapa', ciudad: 'Galapa', tipo: 'cubiertas', fase: 'Entregada', estado: 'finalizada', inicio: enDias(-560), fin: enDias(-330), avance: 100, requeridos: {} },
  ]

  // Personal asignado actualmente (menor a lo requerido en o3 → vacantes).
  const asignacion = {
    o1: { ingeniero: 1, maestro: 1, soldador: 5, ayudante: 4, oficial: 3, operador: 1, electricista: 1, sst: 1 },
    o2: { ingeniero: 1, maestro: 1, oficial: 6, ayudante: 4, carpintero: 2, electricista: 1, sst: 1 },
    o3: { ingeniero: 1, maestro: 1, oficial: 3, carpintero: 1, ayudante: 2, electricista: 1 },
    of: { admin: 3, ingeniero: 1, sst: 1 },
  }

  const FUENTES = ['Referido por trabajador', 'Hoja de vida física', 'Bolsa de empleo SENA', 'Computrabajo', 'Ex trabajador CZ']

  function certificado(tipo, opts = {}) {
    const def = CERTIFICADOS[tipo]
    const vence = def.vigenciaMeses
      ? enDias(opts.venceEn ?? int(40, 330))
      : null
    const emitido = def.vigenciaMeses ? enMeses(-def.vigenciaMeses, new Date(vence + 'T00:00')) : enDias(-int(400, 3000))
    return { tipo, emitido, vence, verificado: opts.verificado ?? true }
  }

  function experiencia(cargo, anios, tipoPreferido) {
    const tipos = sample(['cubiertas', 'edificaciones', 'industrial', 'remodelacion', 'civil'], int(1, 3))
    if (tipoPreferido && !tipos.includes(tipoPreferido)) tipos[0] = tipoPreferido
    let restante = anios
    return tipos.map((tipo, i) => {
      const a = i === tipos.length - 1 ? Math.max(1, restante) : Math.max(1, Math.round(restante * (0.4 + rnd() * 0.3)))
      restante = Math.max(1, restante - a)
      return { tipo, anios: a, proyectos: Math.max(1, Math.round(a * (1 + rnd() * 1.5))) }
    })
  }

  const SALARIOS = { soldador: [2.6, 3.4], ingeniero: [5.5, 8], maestro: [3.5, 4.8], carpintero: [2.2, 2.9], oficial: [2.0, 2.6], electricista: [2.5, 3.3], ayudante: [1.5, 1.8], sst: [2.8, 4], operador: [2.6, 3.2], admin: [1.9, 2.8] }
  const salario = (cargo) => { const [a, b] = SALARIOS[cargo]; return Math.round((a + rnd() * (b - a)) * 10) * 100000 }

  let seq = 1
  function persona(cargoId, extra = {}) {
    const cargo = cargoPorId[cargoId]
    const mujer = extra.mujer ?? (['admin', 'sst', 'ingeniero'].includes(cargoId) ? rnd() < 0.5 : rnd() < 0.06)
    const anios = extra.anios ?? int(1, cargoId === 'ayudante' ? 5 : 14)
    const id = `p${String(seq++).padStart(3, '0')}`
    return {
      id,
      nombre: extra.nombre ?? nombre(mujer),
      documento: String(int(1001000000, 1143999999)),
      telefono: `3${int(0, 2)}${int(0, 9)} ${int(100, 999)} ${int(1000, 9999)}`,
      email: null,
      ciudad: extra.ciudad ?? pick(['Barranquilla', 'Barranquilla', 'Soledad', 'Malambo', 'Puerto Colombia', 'Galapa']),
      cargo: cargoId,
      anios,
      experiencia: extra.experiencia ?? experiencia(cargoId, anios),
      habilidades: extra.habilidades ?? sample(cargo.habilidades, int(2, Math.min(5, cargo.habilidades.length))),
      certificados: extra.certificados ?? cargo.certificados.map((t) => certificado(t)),
      disponibilidad: extra.disponibilidad ?? 'inmediata',
      viaja: extra.viaja ?? rnd() < 0.55,
      aspiracion: salario(cargoId),
      estado: extra.estado ?? 'banco',
      obraId: extra.obraId ?? null,
      ingreso: extra.ingreso ?? null,
      fuente: extra.fuente ?? pick(FUENTES),
      consentimiento: true,
      fechaRegistro: extra.fechaRegistro ?? enDias(-int(5, 500)),
      historial: extra.historial ?? [],
      formacion: extra.formacion ?? [],
      mujer,
    }
  }

  const personas = []

  // ───────── Trabajadores activos ─────────
  const nombresFijos = {
    'o1-ingeniero': { nombre: 'Ing. Javier Fontalvo Rada', mujer: false },
    'o2-ingeniero': { nombre: 'Ing. Mónica Barrios Llanos', mujer: true },
    'o3-ingeniero': { nombre: 'Ing. Andrea Salcedo Molina', mujer: true },
    'of-ingeniero': { nombre: 'Ing. Ricardo Zapata Herrera', mujer: false },
    'of-sst': { nombre: 'Paola Escorcia Navarro', mujer: true },
    'o1-soldador': { nombre: 'José Ariza Pacheco', mujer: false },
  }
  for (const [obraId, cargos] of Object.entries(asignacion)) {
    for (const [cargoId, n] of Object.entries(cargos)) {
      for (let i = 0; i < n; i++) {
        const fijo = i === 0 ? nombresFijos[`${obraId}-${cargoId}`] : null
        const reciente = obraId === 'o3' && i > 0 ? true : rnd() < 0.08
        const ingreso = reciente ? enDias(-int(5, 30)) : enDias(-int(60, 1600))
        const p = persona(cargoId, {
          ...(fijo || {}),
          estado: 'activo', obraId, ingreso, disponibilidad: 'no',
          fuente: pick(FUENTES),
          fechaRegistro: ingreso,
          experiencia: undefined,
        })
        const obra = obras.find((o) => o.id === obraId)
        if (obra.tipo) p.experiencia = experiencia(cargoId, p.anios, obra.tipo)
        personas.push(p)
      }
    }
  }
  const activos = personas.filter((p) => p.estado === 'activo')
  const porNombre = (n) => personas.find((p) => p.nombre === n)
  const jose = porNombre('José Ariza Pacheco')
  jose.anios = 7
  jose.habilidades = ['SMAW', 'GMAW / MIG', 'Estructuras metálicas', 'Cubiertas', 'Lectura de planos']
  jose.ingreso = enDias(-640)

  // Algunos certificados por vencer, vencidos o pendientes de verificar (para alertas).
  const conAlturas = activos.filter((p) => p.certificados.some((c) => c.tipo === 'alturas'))
  ;[4, 9, 17, 23, 29].forEach((dias, i) => {
    const c = conAlturas[i * 5 + 2]?.certificados.find((x) => x.tipo === 'alturas')
    if (c) { c.vence = enDias(dias); c.emitido = enMeses(-12, new Date(c.vence + 'T00:00')) }
  })
  ;[-6, -15].forEach((dias, i) => {
    const c = conAlturas[i * 7 + 4]?.certificados.find((x) => x.tipo === 'alturas')
    if (c) { c.vence = enDias(dias); c.emitido = enMeses(-12, new Date(c.vence + 'T00:00')) }
  })
  activos.filter((p) => p.ingreso && p.ingreso > enDias(-31)).forEach((p) => {
    p.certificados.forEach((c) => { c.verificado = rnd() < 0.4 })
  })

  // Formación completada (≈78 % del plan: la meta es ≥ 90 %).
  for (const p of activos) {
    const cursos = cargoPorId[p.cargo].cursos
    const nuevo = p.ingreso > enDias(-31)
    p.formacion = cursos
      .filter((c) => (c === 'induccion' ? !nuevo || rnd() < 0.5 : rnd() < (nuevo ? 0.25 : 0.8)))
      .map((cursoId) => ({ cursoId, fecha: enDias(-int(nuevo ? 1 : 10, nuevo ? 15 : 120)) }))
  }

  // ───────── Banco de talento (candidatos y ex trabajadores) ─────────
  const ex = (obraId, calificacion, recontratable, comentario, periodo) => ({ obraId, calificacion, recontratable, comentario, periodo })

  personas.push(
    persona('soldador', { nombre: 'Kevin Charris Ospino', anios: 6, ciudad: 'Barranquilla', fuente: 'Ex trabajador CZ', disponibilidad: 'inmediata', viaja: true,
      experiencia: [{ tipo: 'cubiertas', anios: 4, proyectos: 9 }, { tipo: 'industrial', anios: 2, proyectos: 3 }],
      habilidades: ['SMAW', 'GMAW / MIG', 'Estructuras metálicas', 'Cubiertas', 'Lectura de planos'],
      certificados: [certificado('alturas', { venceEn: 210 }), certificado('aws', { venceEn: 400 })],
      historial: [ex('h2', 4.7, true, 'Excelente en montaje de cerchas; cumplido y ordenado.', 'Coliseo Galapa · 7 meses')] }),
    persona('soldador', { nombre: 'Luis Fernando Mendoza Polo', anios: 4, ciudad: 'Soledad', fuente: 'Referido por trabajador', disponibilidad: '15dias', viaja: true,
      experiencia: [{ tipo: 'cubiertas', anios: 2, proyectos: 4 }, { tipo: 'edificaciones', anios: 2, proyectos: 3 }],
      habilidades: ['SMAW', 'Cubiertas', 'Estructuras metálicas'],
      certificados: [certificado('alturas', { venceEn: 160 }), certificado('aws', { venceEn: 300, verificado: false })] }),
    persona('soldador', { nombre: 'Yeison Pertuz Cassiani', anios: 8, ciudad: 'Malambo', fuente: 'Computrabajo', disponibilidad: 'inmediata', viaja: false,
      experiencia: [{ tipo: 'industrial', anios: 5, proyectos: 7 }, { tipo: 'cubiertas', anios: 3, proyectos: 5 }],
      habilidades: ['SMAW', 'TIG', 'GMAW / MIG', 'Estructuras metálicas', 'Cubiertas'],
      certificados: [certificado('alturas', { venceEn: -40 }), certificado('aws', { venceEn: 200 })] }),
    persona('soldador', { nombre: 'Andrés Polo Guerrero', anios: 2, ciudad: 'Malambo', fuente: 'Bolsa de empleo SENA', disponibilidad: 'inmediata', viaja: true,
      experiencia: [{ tipo: 'cubiertas', anios: 1, proyectos: 2 }, { tipo: 'remodelacion', anios: 1, proyectos: 2 }],
      habilidades: ['SMAW', 'Cubiertas'],
      certificados: [certificado('alturas', { venceEn: 290 })] }),
    persona('soldador', { nombre: 'Rafael Orozco Montes', anios: 5, ciudad: 'Cartagena', fuente: 'Computrabajo', disponibilidad: '30dias', viaja: true,
      experiencia: [{ tipo: 'cubiertas', anios: 3, proyectos: 6 }, { tipo: 'industrial', anios: 2, proyectos: 2 }],
      habilidades: ['SMAW', 'GMAW / MIG', 'Estructuras metálicas', 'Cubiertas'],
      certificados: [certificado('alturas', { venceEn: 120 }), certificado('aws', { venceEn: 500 })] }),
    persona('soldador', { nombre: 'Dairo Cantillo Torres', anios: 3, ciudad: 'Barranquilla', fuente: 'Ex trabajador CZ', disponibilidad: 'inmediata', viaja: true,
      experiencia: [{ tipo: 'edificaciones', anios: 2, proyectos: 3 }, { tipo: 'cubiertas', anios: 1, proyectos: 2 }],
      habilidades: ['SMAW', 'Estructuras metálicas', 'Lectura de planos'],
      certificados: [certificado('alturas', { venceEn: 12 }), certificado('aws', { venceEn: 280 })],
      historial: [ex('h1', 3.9, true, 'Buen trabajo; reforzar orden en el puesto.', 'Villa Campestre · 5 meses')] }),
    persona('ingeniero', { nombre: 'Ing. Daniela Herrera Bolaño', anios: 7, mujer: true, ciudad: 'Barranquilla', fuente: 'Referido por trabajador', disponibilidad: '15dias', viaja: true,
      experiencia: [{ tipo: 'cubiertas', anios: 3, proyectos: 5 }, { tipo: 'industrial', anios: 4, proyectos: 4 }],
      habilidades: ['Residencia de obra', 'Programación de obra', 'Presupuestos y APU', 'AutoCAD'],
      certificados: [certificado('copnia'), certificado('coordAlturas', { venceEn: 180 })] }),
    persona('ingeniero', { nombre: 'Ing. Hugo Márquez Urueta', anios: 3, ciudad: 'Santa Marta', fuente: 'Computrabajo', disponibilidad: 'inmediata', viaja: true,
      experiencia: [{ tipo: 'edificaciones', anios: 3, proyectos: 3 }],
      habilidades: ['Residencia de obra', 'AutoCAD', 'BIM / Revit'],
      certificados: [certificado('copnia')] }),
    persona('carpintero', { nombre: 'Freddy Gutiérrez Ahumada', anios: 9, ciudad: 'Puerto Colombia', fuente: 'Ex trabajador CZ', disponibilidad: 'inmediata', viaja: false,
      experiencia: [{ tipo: 'remodelacion', anios: 6, proyectos: 14 }, { tipo: 'edificaciones', anios: 3, proyectos: 4 }],
      habilidades: ['Carpintería arquitectónica', 'Instalación de puertas', 'Acabados', 'Mobiliario'],
      certificados: [certificado('alturas', { venceEn: 95 })],
      historial: [ex('h1', 4.5, true, 'Muy buen acabado; apoya a los ayudantes.', 'Villa Campestre · 11 meses')] }),
  )
  const BANCO = { soldador: 4, ayudante: 7, oficial: 6, carpintero: 3, maestro: 2, electricista: 3, sst: 1, operador: 1 }
  for (const [cargoId, n] of Object.entries(BANCO)) {
    for (let i = 0; i < n; i++) {
      const esEx = rnd() < 0.3
      const r = rnd()
      const disponibilidad = r < 0.55 ? 'inmediata' : r < 0.8 ? '15dias' : r < 0.93 ? '30dias' : 'no'
      const p = persona(cargoId, {
        ciudad: pick(CIUDADES), disponibilidad,
        fuente: esEx ? 'Ex trabajador CZ' : pick(FUENTES.slice(0, 4)),
        historial: esEx ? [ex(pick(['h1', 'h2']), Math.round((3 + rnd() * 1.9) * 10) / 10, rnd() < 0.85, pick(['Cumplido y colaborador.', 'Buen ritmo de trabajo.', 'Requiere supervisión en acabados.', 'Muy comprometido con la seguridad.', 'Llegadas tarde frecuentes.']), 'Obra anterior')] : [],
      })
      p.historial.forEach((h) => { if (h.comentario === 'Llegadas tarde frecuentes.') { h.recontratable = false; h.calificacion = 2.8 } })
      // Algunos certificados vencidos o sin verificar en el banco.
      p.certificados.forEach((c) => {
        if (c.vence && rnd() < 0.18) c.vence = enDias(-int(5, 120))
        if (rnd() < 0.25) c.verificado = false
      })
      personas.push(p)
    }
  }
  // Ex trabajadores de obras finalizadas también tienen historial.
  activos.slice(0, 14).forEach((p, i) => {
    if (i % 3 === 0) p.historial.push(ex(i % 2 ? 'h1' : 'h2', Math.round((3.6 + rnd() * 1.3) * 10) / 10, true, 'Buen desempeño; se recontrató.', 'Obra anterior'))
  })

  const id = (n) => porNombre(n).id
  const lider = { o1: id('Ing. Javier Fontalvo Rada'), o2: id('Ing. Mónica Barrios Llanos'), o3: id('Ing. Andrea Salcedo Molina'), of: id('Ing. Ricardo Zapata Herrera') }
  obras.forEach((o) => { o.liderId = lider[o.id] ?? null })
  obras.find((o) => o.id === 'o4').liderId = lider.o1

  // ───────── Vacantes y postulaciones ─────────
  const vacantes = [
    { id: 'v1', obraId: 'o4', cargo: 'soldador', cantidad: 4, expMin: 3, tipoProyecto: 'cubiertas', habilidades: ['Estructuras metálicas', 'Cubiertas', 'SMAW'], certificados: ['alturas'], ciudad: 'Soledad', aceptaViajeros: true, disponibilidad: '15dias', estado: 'abierta', creada: enDias(-9), fechaLimite: enDias(12), solicitadaPor: lider.o1, descripcion: 'Montaje de estructura metálica y cubierta en termoacústica para el coliseo del colegio.' },
    { id: 'v2', obraId: 'o4', cargo: 'ayudante', cantidad: 3, expMin: 1, tipoProyecto: 'cubiertas', habilidades: ['Cargue y descargue'], certificados: ['alturas'], ciudad: 'Soledad', aceptaViajeros: true, disponibilidad: 'inmediata', estado: 'abierta', creada: enDias(-7), fechaLimite: enDias(14), solicitadaPor: lider.o1, descripcion: 'Apoyo en izaje, cargue de material y orden de obra.' },
    { id: 'v3', obraId: 'o3', cargo: 'carpintero', cantidad: 1, expMin: 2, tipoProyecto: 'remodelacion', habilidades: ['Carpintería arquitectónica', 'Instalación de puertas', 'Acabados'], certificados: [], ciudad: 'Puerto Colombia', aceptaViajeros: true, disponibilidad: 'inmediata', estado: 'abierta', creada: enDias(-4), fechaLimite: enDias(6), solicitadaPor: lider.o3, descripcion: 'Puertas, closets y mobiliario para locales comerciales.' },
    { id: 'v4', obraId: 'o4', cargo: 'ingeniero', cantidad: 1, expMin: 4, tipoProyecto: 'cubiertas', habilidades: ['Residencia de obra', 'Programación de obra', 'Presupuestos y APU'], certificados: ['copnia'], ciudad: 'Soledad', aceptaViajeros: true, disponibilidad: '30dias', estado: 'abierta', creada: enDias(-12), fechaLimite: enDias(18), solicitadaPor: lider.of, descripcion: 'Residente de obra para la cubierta del colegio; reporta a dirección de proyectos.' },
    { id: 'v5', obraId: 'o3', cargo: 'oficial', cantidad: 1, expMin: 2, tipoProyecto: 'remodelacion', habilidades: ['Enchapes', 'Drywall'], certificados: ['alturas'], ciudad: 'Puerto Colombia', aceptaViajeros: true, disponibilidad: 'inmediata', estado: 'solicitada', creada: enDias(-1), fechaLimite: enDias(10), solicitadaPor: lider.o3, descripcion: 'Oficial para enchapes y cielos en drywall.' },
    { id: 'v6', obraId: 'o1', cargo: 'electricista', cantidad: 1, expMin: 3, tipoProyecto: 'industrial', habilidades: ['Instalaciones industriales', 'Tableros eléctricos'], certificados: ['conte', 'alturas'], ciudad: 'Malambo', aceptaViajeros: true, disponibilidad: 'inmediata', estado: 'cerrada', creada: enDias(-80), fechaLimite: enDias(-60), solicitadaPor: lider.o1, descripcion: 'Instalaciones eléctricas de la bodega.' },
  ]
  const post = (vacanteId, nombre, etapa, dias, notas = []) => ({ id: `a${vacanteId}-${id(nombre)}`, vacanteId, personaId: id(nombre), etapa, fecha: enDias(dias), notas: notas.map((t, i) => ({ fecha: enDias(dias + i + 1), texto: t, autor: 'Gestión Humana' })) })
  const postulaciones = [
    post('v1', 'Kevin Charris Ospino', 'verificacion', -8, ['Llamado: disponible de inmediato.', 'Entrevista técnica aprobada; pendiente verificar AWS.']),
    post('v1', 'Rafael Orozco Montes', 'entrevista', -7, ['Vive en Cartagena; acepta trasladarse.']),
    post('v1', 'Luis Fernando Mendoza Polo', 'preseleccionado', -6),
    post('v1', 'Andrés Polo Guerrero', 'postulado', -3),
    post('v1', 'Yeison Pertuz Cassiani', 'descartado', -8, ['Certificado de alturas vencido; se le invita a reentrenarse y volver a postular.']),
    post('v4', 'Ing. Daniela Herrera Bolaño', 'entrevista', -10, ['Experiencia en cubiertas industriales.']),
    post('v4', 'Ing. Hugo Márquez Urueta', 'preseleccionado', -6),
    post('v3', 'Freddy Gutiérrez Ahumada', 'preseleccionado', -3, ['Ex trabajador CZ con calificación 4,5.']),
  ]
  const ayudantesBanco = personas.filter((p) => p.estado === 'banco' && p.cargo === 'ayudante').slice(0, 3)
  ayudantesBanco.forEach((p, i) => postulaciones.push({ id: `av2-${p.id}`, vacanteId: 'v2', personaId: p.id, etapa: ['postulado', 'preseleccionado', 'postulado'][i], fecha: enDias(-5 + i), notas: [] }))

  // ───────── Pulso CZ (clima) ─────────
  const pulsos = [
    { id: 'base', nombre: 'Encuesta de clima (línea base)', fecha: enDias(-110), cierre: enDias(-96), estado: 'cerrado', participantes: 38,
      dims: { compromiso: 4.2, seguridad: 3.9, comunicacion: 3.5, formacion: 3.1, reconocimiento: 2.9, salud: 3.2 }, enps: 16 },
    { id: 'p1', nombre: 'Pulso CZ · 1.ª medición', fecha: enDias(-52), cierre: enDias(-40), estado: 'cerrado', participantes: 35,
      dims: { compromiso: 4.2, seguridad: 4.0, comunicacion: 3.6, formacion: 3.3, reconocimiento: 3.2, salud: 3.3 }, enps: 20 },
    { id: 'p2', nombre: 'Pulso CZ · 2.ª medición', fecha: enDias(-6), cierre: enDias(8), estado: 'abierto', respuestas: [] },
  ]
  const objetivo = { compromiso: 4.3, seguridad: 4.0, comunicacion: 3.8, formacion: 3.5, reconocimiento: 3.4, salud: 3.2 }
  const encuestados = sample(activos.filter((p) => p.id !== jose.id), 27)
  for (const [i, p] of encuestados.entries()) {
    const enCierre = p.obraId === 'o2'
    const dims = {}
    for (const d of DIMENSIONES_CLIMA) {
      // Entero con valor esperado igual al objetivo (más algo de dispersión).
      let v = objetivo[d.id] - (enCierre && d.id === 'salud' ? 0.9 : 0)
      const r = rnd()
      v = Math.floor(v + rnd()) + (r < 0.1 ? -1 : r > 0.92 ? 1 : 0)
      dims[d.id] = Math.max(1, Math.min(5, v))
    }
    // ≈ 38 % promotores, 46 % pasivos y 16 % detractores (eNPS alrededor de +22).
    const k = (i * 7) % 25
    const nps = k < 9 ? int(9, 10) : k < 21 ? int(7, 8) : int(4, 6)
    pulsos[2].respuestas.push({ personaId: p.id, obraId: p.obraId, fecha: enDias(-int(0, 6)), dims, recomendaria: nps, comentario: null })
  }

  // ───────── Canal CZ (sugerencias e inquietudes) ─────────
  const sug = (n, dias, obraId, categoria, texto, estado, extra = {}) => ({
    id: `s${n}`, fecha: enDias(dias), obraId, categoria, texto, estado,
    anonimo: extra.anonimo ?? false, personaId: extra.personaId ?? null,
    responsable: extra.responsable ?? 'Gestión Humana', fechaLimite: enDias(dias + 15),
    respuesta: extra.respuesta ?? null, accion: extra.accion ?? null, publicar: extra.publicar ?? false,
  })
  const canal = [
    sug(1, -70, 'o2', 'Bienestar', 'En las semanas de fundida salimos muy tarde y no alcanzamos a descansar.', 'respondida', { anonimo: true, responsable: 'SST', respuesta: 'Se revisó la programación de fundidas con el residente.', accion: 'Se fijó un máximo de 2 fundidas nocturnas por semana y turno de relevo.', publicar: true }),
    sug(2, -62, 'o1', 'Herramientas y equipos', 'Faltan caretas de soldar de repuesto en la bodega.', 'respondida', { personaId: jose.id, responsable: 'Almacén', respuesta: 'Se compraron 6 caretas adicionales.', accion: 'Inventario mínimo de EPP de soldadura en cada obra.', publicar: true }),
    sug(3, -48, 'o2', 'Comunicación', 'No nos enteramos a tiempo de los cambios de turno.', 'respondida', { anonimo: true, responsable: 'Líder de obra', respuesta: 'Los cambios se anuncian en la charla semanal y en el tablero de la obra.', accion: 'Tablero de novedades en la entrada de obra.', publicar: true }),
    sug(4, -35, 'o1', 'Formación', 'Queremos curso de soldadura TIG para crecer en el oficio.', 'respondida', { responsable: 'SST', respuesta: 'Se incluyó en la ruta de formación del próximo trimestre.', accion: 'Curso TIG programado con el SENA.', publicar: true }),
    sug(5, -20, 'o3', 'Seguridad', 'El acceso a la placa no tiene baranda provisional.', 'respondida', { responsable: 'SST', respuesta: 'Se instaló baranda y señalización el mismo día.', accion: 'Inspección de accesos en cada charla semanal.', publicar: false }),
    sug(6, -16, 'o2', 'Pagos y contratos', 'Los pagos de horas extra llegan con retraso.', 'en_revision', { anonimo: true, responsable: 'Administración' }),
    sug(7, -11, 'o1', 'Bienestar', 'Necesitamos más puntos de hidratación cerca de la cubierta.', 'en_revision', { responsable: 'SST' }),
    sug(8, -9, 'o2', 'Bienestar', 'Pausas activas solo se hacen cuando viene SST.', 'recibida', { anonimo: true }),
    sug(9, -6, 'o3', 'Herramientas y equipos', 'La pulidora de la obra está fallando.', 'recibida', { responsable: 'Almacén' }),
    sug(10, -4, 'of', 'Comunicación', 'Sería bueno conocer los resultados del Pulso de cada obra.', 'recibida', {}),
    sug(11, -2, 'o2', 'Bienestar', 'Muchas horas seguidas en cierre; algunos compañeros están agotados.', 'recibida', { anonimo: true }),
    sug(12, -27, 'o1', 'Otro', 'Propongo que el reconocimiento del mes incluya a los ayudantes.', 'respondida', { responsable: 'Gerencia', respuesta: 'Todos los cargos pueden ser nominados; se aclaró en la charla.', accion: 'Criterios publicados en cada obra.', publicar: true }),
  ]

  // ───────── Charlas semanales (10 minutos con la cuadrilla) ─────────
  const charlas = []
  const temasCharla = ['Novedades de la semana y cambios de turno', 'Orden y aseo en frentes de trabajo', 'Reporte de riesgos sin temor', 'Resultados del Pulso CZ', 'Hidratación y pausas activas', 'Uso correcto del arnés', 'Reconocimientos del mes', 'Programación de fundidas']
  ;['o1', 'o2', 'o3'].forEach((obraId) => {
    const semanas = obraId === 'o3' ? 2 : 6
    for (let w = 0; w < semanas; w++) {
      if (obraId === 'o2' && w === 1) continue // semana sin charla en cierre de obra
      charlas.push({ id: `c${obraId}${w}`, obraId, fecha: enDias(-w * 7 - int(0, 2)), liderId: lider[obraId], tema: pick(temasCharla), asistentes: int(7, obraId === 'o3' ? 8 : 15), inquietudes: rnd() < 0.5 ? pick(['Solicitan más caretas', 'Preguntan por el pago de extras', 'Piden aclarar turnos del sábado', 'Sin inquietudes nuevas', 'Proponen rotar tareas pesadas']) : 'Sin inquietudes nuevas' })
    }
  })

  // ───────── Reconoce CZ ─────────
  const mesAnterior = inicioMes(-1)
  const mesActual = inicioMes(0)
  const obreros = activos.filter((p) => !['ingeniero', 'admin'].includes(p.cargo))
  const nominaciones = [
    { id: 'n1', mes: mesAnterior, personaId: jose.id, criterio: 'seguridad', nominadoPor: lider.o1, motivo: 'Detectó una eslinga en mal estado antes del izaje y detuvo la maniobra.', estado: 'reconocido' },
    { id: 'n2', mes: mesAnterior, personaId: obreros.find((p) => p.obraId === 'o2' && p.cargo === 'oficial').id, criterio: 'cumplimiento', nominadoPor: lider.o2, motivo: 'Terminó los enchapes del piso 8 dos días antes de lo programado.', estado: 'reconocido' },
    { id: 'n3', mes: mesAnterior, personaId: obreros.find((p) => p.obraId === 'o1' && p.cargo === 'ayudante').id, criterio: 'equipo', nominadoPor: lider.o1, motivo: 'Organizó el cargue de perfiles con dos cuadrillas sin parar la obra.', estado: 'reconocido' },
    { id: 'n4', mes: mesAnterior, personaId: obreros.find((p) => p.obraId === 'o2' && p.cargo === 'maestro').id, criterio: 'apoyo', nominadoPor: lider.o2, motivo: 'Acompañó a tres ayudantes nuevos durante su primera semana.', estado: 'reconocido' },
    { id: 'n5', mes: mesActual, personaId: obreros.filter((p) => p.obraId === 'o1' && p.cargo === 'soldador')[2].id, criterio: 'cumplimiento', nominadoPor: lider.o1, motivo: 'Mantuvo cero reprocesos en uniones de la cercha principal.', estado: 'nominado' },
    { id: 'n6', mes: mesActual, personaId: obreros.find((p) => p.obraId === 'o2' && p.cargo === 'carpintero').id, criterio: 'equipo', nominadoPor: lider.o2, motivo: 'Apoyó a la cuadrilla de acabados en el cierre de apartamentos.', estado: 'nominado' },
    { id: 'n7', mes: mesActual, personaId: obreros.find((p) => p.obraId === 'o3' && p.cargo === 'oficial').id, criterio: 'seguridad', nominadoPor: lider.o3, motivo: 'Reportó la falta de baranda en el acceso a la placa.', estado: 'nominado' },
    { id: 'n8', mes: mesActual, personaId: obreros.find((p) => p.obraId === 'o1' && p.cargo === 'sst').id, criterio: 'apoyo', nominadoPor: lider.o1, motivo: 'Dictó refuerzo de alturas a los nuevos en horario de obra.', estado: 'nominado' },
  ]
  const retro = [
    { id: 'r1', personaId: jose.id, liderId: lider.o1, fecha: enDias(-12), tipo: 'positivo', texto: 'Excelente calidad en las uniones de la cubierta. Sigue así.' },
    { id: 'r2', personaId: obreros[3].id, liderId: lider.o1, fecha: enDias(-9), tipo: 'mejora', texto: 'Recordar el orden de cables en el frente de trabajo.' },
    { id: 'r3', personaId: obreros[18].id, liderId: lider.o2, fecha: enDias(-6), tipo: 'positivo', texto: 'Buen manejo del cierre en los apartamentos del piso 9.' },
    { id: 'r4', personaId: obreros[20].id, liderId: lider.o2, fecha: enDias(-5), tipo: 'positivo', texto: 'Gracias por quedarte a apoyar la entrega del lobby.' },
    { id: 'r5', personaId: obreros[22].id, liderId: lider.o2, fecha: enDias(-3), tipo: 'mejora', texto: 'Usar el arnés también en los trabajos cortos de fachada.' },
    { id: 'r6', personaId: obreros[6].id, liderId: lider.o1, fecha: enDias(-2), tipo: 'positivo', texto: 'Muy buena disposición para enseñar a los ayudantes.' },
  ]

  // ───────── Desempeño trimestral y acompañamiento ─────────
  const desempeno = activos.filter((p) => p.ingreso < enDias(-90)).slice(0, 26).filter((_, i) => i % 2 === 0).map((p, i) => ({
    id: `d${i}`, personaId: p.id, liderId: lider[p.obraId] ?? lider.of, fecha: enDias(-int(5, 80)),
    calificacion: Math.round((3.2 + rnd() * 1.6) * 10) / 10,
    fortalezas: pick(['Calidad en su oficio', 'Compromiso con la seguridad', 'Trabajo en equipo', 'Puntualidad', 'Iniciativa']),
    pendientes: pick(['Lectura de planos', 'Liderazgo de cuadrilla', 'Orden y aseo', 'Reentrenamiento en alturas', 'Curso TIG']),
    potencial: rnd() < 0.3,
  }))
  const nuevos = activos.filter((p) => p.ingreso > enDias(-31))
  const mentores = activos.filter((p) => p.ingreso < enDias(-365) && ['maestro', 'oficial', 'soldador', 'carpintero'].includes(p.cargo))
  const mentorias = nuevos.map((p, i) => {
    const dias = -Number((Date.now() - new Date(p.ingreso + 'T00:00')) / 86400000).toFixed(0)
    const avance = Math.min(5, Math.floor(-dias / 6) + 1)
    const mentor = mentores.find((m) => m.obraId === p.obraId) ?? mentores[i % mentores.length]
    return { id: `m${i}`, nuevoId: p.id, mentorId: mentor.id, inicio: p.ingreso, checklist: { bienvenida: avance > 0, epp: avance > 1, induccion: p.formacion.some((f) => f.cursoId === 'induccion'), procedimientos: avance > 3, seguimiento30: false } }
  })

  // ───────── Bienestar en obra ─────────
  const jornadas = []
  ;['o1', 'o2', 'o3'].forEach((obraId) => {
    for (let w = 7; w >= 0; w--) {
      if (obraId === 'o3' && w > 2) continue
      const base = obraId === 'o2' ? 49 + (7 - w) * 1.4 : obraId === 'o1' ? 48 + (rnd() - 0.5) * 3 : 47
      jornadas.push({ obraId, semana: enDias(-w * 7), horas: Math.round(base * 10) / 10, pausas: obraId === 'o2' ? int(2, 4) : int(4, 6) })
    }
  })
  const bienestar = [
    { id: 'b1', fecha: enDias(-18), obraId: 'o2', tipo: 'Carga de trabajo', descripcion: 'Turnos dobles en semana de fundida.', anonimo: true, estado: 'canalizado', canalizadoA: 'SST · ajuste de turnos' },
    { id: 'b2', fecha: enDias(-12), obraId: 'o1', tipo: 'Molestia física', descripcion: 'Dolor lumbar al cargar perfiles.', anonimo: false, personaId: obreros[2].id, estado: 'canalizado', canalizadoA: 'ARL · valoración' },
    { id: 'b3', fecha: enDias(-8), obraId: 'o2', tipo: 'Estrés o ansiedad', descripcion: 'Presión por la fecha de entrega.', anonimo: true, estado: 'abierto', canalizadoA: null },
    { id: 'b4', fecha: enDias(-5), obraId: 'o1', tipo: 'Golpe de calor', descripcion: 'Mareo trabajando en la cubierta al mediodía.', anonimo: false, personaId: jose.id, estado: 'cerrado', canalizadoA: 'SST · hidratación y pausas' },
    { id: 'b5', fecha: enDias(-2), obraId: 'o2', tipo: 'Carga de trabajo', descripcion: 'Jornadas de 11 horas tres días seguidos.', anonimo: true, estado: 'abierto', canalizadoA: null },
  ]

  // ───────── Formación: sesiones programadas ─────────
  const instructores = ['Paola Escorcia (SST CZ)', 'SENA Barranquilla', 'ARL Positiva', 'Centro de entrenamiento Alturas Caribe']
  const sesiones = [
    { id: 'f1', cursoId: 'alturas', fecha: enDias(-25), lugar: 'Centro de entrenamiento', instructor: instructores[3], cupos: 12 },
    { id: 'f2', cursoId: 'herramientas', fecha: enDias(-14), lugar: 'Bodega industrial Malambo', instructor: instructores[0], cupos: 15 },
    { id: 'f3', cursoId: 'induccion', fecha: enDias(-10), lugar: 'Oficina central', instructor: instructores[0], cupos: 10 },
    { id: 'f4', cursoId: 'alturas', fecha: enDias(6), lugar: 'Centro de entrenamiento', instructor: instructores[3], cupos: 12 },
    { id: 'f5', cursoId: 'liderazgo', fecha: enDias(9), lugar: 'Oficina central', instructor: instructores[1], cupos: 12 },
    { id: 'f6', cursoId: 'induccion', fecha: enDias(3), lugar: 'Adecuación locales Puerto Colombia', instructor: instructores[0], cupos: 8 },
    { id: 'f7', cursoId: 'primerosAux', fecha: enDias(16), lugar: 'Edificio Altos del Prado', instructor: instructores[2], cupos: 15 },
    { id: 'f8', cursoId: 'calidad', fecha: enDias(23), lugar: 'Edificio Altos del Prado', instructor: instructores[1], cupos: 15 },
  ]
  sesiones.forEach((s) => {
    const candidatos = activos.filter((p) => cargoPorId[p.cargo].cursos.includes(s.cursoId))
    s.inscritos = sample(candidatos, Math.min(s.cupos - int(0, 3), candidatos.length)).map((p) => p.id)
    if (s.fecha < enDias(0)) {
      s.asistentes = s.inscritos.filter(() => rnd() < 0.9)
      s.asistentes.forEach((pid) => {
        const p = personas.find((x) => x.id === pid)
        if (!p.formacion.some((f) => f.cursoId === s.cursoId)) p.formacion.push({ cursoId: s.cursoId, fecha: s.fecha })
      })
    } else s.asistentes = null
  })
  // Los nuevos de Puerto Colombia van a la inducción programada.
  sesiones.find((s) => s.id === 'f6').inscritos = nuevos.filter((p) => !p.formacion.some((f) => f.cursoId === 'induccion')).map((p) => p.id)

  // ───────── Plan de trabajo a 6 meses (diapositiva 9) ─────────
  const inicioPlan = enDias(-112)
  const plan = [
    { id: 'pl1', periodo: 'Mes 1', desde: inicioPlan, accion: 'Validar causas, encuesta corta y necesidades de formación', responsable: 'Administración / SST', evidencia: 'Resultados y matriz',
      tareas: [{ t: 'Encuesta de clima aplicada (38 respuestas)', ok: true }, { t: 'Matriz de necesidades por oficio', ok: true }, { t: 'Socializar diagnóstico con líderes', ok: true }] },
    { id: 'pl2', periodo: 'Meses 2–3', desde: enDias(-82), accion: 'Activar canal, reconocimientos y primeras capacitaciones', responsable: 'Gerencia / líderes / SST', evidencia: 'Registros y asistencias',
      tareas: [{ t: 'Canal CZ activo con QR en cada obra', ok: true }, { t: 'Criterios de Reconoce CZ publicados', ok: true }, { t: 'Primer reconocimiento mensual', ok: true }, { t: 'Capacitaciones de alturas y herramientas', ok: true }] },
    { id: 'pl3', periodo: 'Meses 4–5', desde: enDias(-22), accion: 'Seguimiento a respuestas, desempeño y bienestar', responsable: 'Líderes / administración', evidencia: 'Actas y reportes',
      tareas: [{ t: 'Conversaciones trimestrales de desempeño', ok: true }, { t: 'Responder inquietudes en ≤ 15 días', ok: false }, { t: 'Plan de bienestar en cierre de obra', ok: false }, { t: '2.ª medición del Pulso CZ', ok: false }] },
    { id: 'pl4', periodo: 'Mes 6', desde: enDias(68), accion: 'Repetir encuesta y valorar los avances', responsable: 'Equipo de mejora', evidencia: 'Comparativo de resultados',
      tareas: [{ t: 'Encuesta de clima completa', ok: false }, { t: 'Comparativo línea base vs. mes 6', ok: false }, { t: 'Informe a gerencia', ok: false }] },
  ]

  // Personal total por mes (histórico): la plantilla cambia según las obras activas.
  const historicoPersonal = [26, 29, 33, 38, 45, 53, 57, 51, 41, 39, 43].map((total, i) => ({ mes: inicioMes(i - 11), total }))

  return {
    version: 1,
    obras, personas, vacantes, postulaciones, pulsos, canal, charlas,
    nominaciones, retro, desempeno, mentorias, jornadas, bienestar, sesiones, plan,
    historicoPersonal,
    radarActual: 3.1,
    usuarios: {
      admin: USUARIO_ADMIN,
      lider: { personaId: lider.o2, obraId: 'o2' },
      trabajador: { personaId: jose.id },
    },
  }
}
