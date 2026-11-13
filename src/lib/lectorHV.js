// Asistente de lectura de hojas de vida (demostración).
// Extrae datos clave de un texto pegado usando patrones y palabras clave del sector.
// En una versión real esta función se reemplaza por un modelo de IA; la persona de
// Gestión Humana siempre revisa los datos antes de guardarlos.
import { CARGOS, CIUDADES, TIPOS_PROYECTO } from '../data/catalogos.js'

const PALABRAS_CARGO = {
  soldador: ['soldador', 'soldadura', 'smaw', 'mig', 'tig'],
  ingeniero: ['ingeniero civil', 'ingeniera civil', 'residente de obra', 'ingeniero residente'],
  maestro: ['maestro de obra', 'maestro general'],
  carpintero: ['carpintero', 'carpintería', 'ebanista'],
  oficial: ['oficial de construcción', 'oficial de obra', 'mampostero', 'enchapador'],
  electricista: ['electricista', 'instalaciones eléctricas'],
  ayudante: ['ayudante de obra', 'ayudante de construcción', 'obrero'],
  sst: ['seguridad y salud en el trabajo', 'sst', 'hse', 'tecnólogo en sst'],
  operador: ['operador de', 'retroexcavadora', 'minicargador'],
  admin: ['auxiliar administrativo', 'asistente administrativo'],
}

const PALABRAS_TIPO = {
  cubiertas: ['cubierta', 'cercha', 'estructura metálica', 'estructuras metálicas', 'techo', 'termoacústica'],
  edificaciones: ['edificio', 'vivienda', 'apartamento', 'torre', 'urbanización'],
  industrial: ['bodega', 'planta', 'industrial', 'nave'],
  remodelacion: ['remodelación', 'adecuación', 'local comercial', 'oficinas'],
  civil: ['vial', 'vías', 'pavimento', 'alcantarillado', 'urbanismo', 'puente'],
}

const PALABRAS_HABILIDAD = {
  'GMAW / MIG': ['mig', 'gmaw'],
  'Residencia de obra': ['residente', 'residencia'],
  'Programación de obra': ['project', 'programación de obra', 'cronograma'],
  'Presupuestos y APU': ['presupuesto', 'apu'],
  'BIM / Revit': ['revit', 'bim'],
  'Lectura de planos': ['planos'],
  'Tableros eléctricos': ['tablero'],
}

const PALABRAS_CERT = {
  alturas: ['alturas'],
  coordAlturas: ['coordinador de alturas', 'coordinador de trabajo en alturas'],
  aws: ['aws', 'certificación de soldador', 'soldador calificado'],
  copnia: ['copnia', 'matrícula profesional', 'tarjeta profesional'],
  conte: ['conte'],
  sst50: ['50 horas'],
  licenciaSst: ['licencia en sst', 'licencia sst'],
  primerosAux: ['primeros auxilios'],
  confinados: ['espacios confinados'],
  equipos: ['operación segura', 'licencia de operador'],
}

const quitarTildes = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '')

export function leerHojaDeVida(texto) {
  const t = quitarTildes(texto.toLowerCase())
  const lineas = texto.split('\n').map((l) => l.trim()).filter(Boolean)
  const encontrados = []

  // Nombre: primera línea con 2–5 palabras que empiezan en mayúscula.
  const nombre = lineas.find((l) => /^([A-ZÁÉÍÓÚÑ][a-záéíóúñ]+\.?\s?){2,5}$/.test(l)) ?? ''
  if (nombre) encontrados.push('nombre')

  const telefono = (texto.match(/(\+?57\s?)?3\d{2}[\s-]?\d{3}[\s-]?\d{4}/) ?? [''])[0].replace(/^\+?57\s?/, '')
  if (telefono) encontrados.push('teléfono')
  const email = (texto.match(/[\w.+-]+@[\w-]+\.[\w.]+/) ?? [''])[0]
  if (email) encontrados.push('correo')
  const documento = (texto.match(/(?:c\.?c\.?|cédula|documento)[^\d]{0,12}([\d.]{7,13})/i) ?? [, ''])[1].replace(/\./g, '')

  // Ciudad de residencia: se ignoran las líneas del documento ("C.C. … de Barranquilla").
  const lineasSinDoc = lineas.map((l) => quitarTildes(l.toLowerCase())).filter((l) => !/c\.?c\.?|cedula|documento/.test(l))
  const ciudad = CIUDADES.find((c) => lineasSinDoc.some((l) => l.includes(quitarTildes(c.toLowerCase())))) ?? ''
  if (ciudad) encontrados.push('ciudad')

  // Cargo: el que más coincidencias de palabras clave tenga.
  let cargo = ''
  let mejor = 0
  for (const [id, palabras] of Object.entries(PALABRAS_CARGO)) {
    const n = palabras.filter((p) => t.includes(quitarTildes(p))).length
    if (n > mejor) { mejor = n; cargo = id }
  }
  if (cargo) encontrados.push('cargo')

  // Años de experiencia: el mayor número seguido de "años".
  const anios = Math.max(0, ...[...t.matchAll(/(\d{1,2})\s*(?:anos|ano)/g)].map((m) => Number(m[1])).filter((n) => n < 45))
  if (anios) encontrados.push('años de experiencia')

  // Experiencia por tipo de proyecto: cada frase que lo menciona cuenta como un proyecto.
  const frases = t.split(/[\n.;]+/).filter((f) => f.trim())
  const menciona = (f, p) => new RegExp(`\\b${quitarTildes(p).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`).test(f)
  const experiencia = []
  for (const [tipo, palabras] of Object.entries(PALABRAS_TIPO)) {
    const n = frases.filter((f) => palabras.some((p) => menciona(f, p))).length
    if (n) experiencia.push({ tipo, anios: 1, proyectos: n })
  }
  if (experiencia.length && anios) {
    const total = experiencia.reduce((s, e) => s + e.proyectos, 0)
    experiencia.forEach((e) => { e.anios = Math.max(1, Math.round((anios * e.proyectos) / total)) })
  }
  if (experiencia.length) encontrados.push('tipos de proyecto')

  // Habilidades del cargo detectado (o de todos si no hay cargo).
  const habs = new Set()
  const fuente = cargo ? CARGOS.filter((c) => c.id === cargo) : CARGOS
  for (const c of fuente) {
    for (const h of c.habilidades) {
      const claves = PALABRAS_HABILIDAD[h] ?? [h.toLowerCase().split(' / ')[0]]
      if (claves.some((k) => t.includes(quitarTildes(k.toLowerCase())))) habs.add(h)
    }
  }
  if (habs.size) encontrados.push('habilidades')

  const certificados = Object.entries(PALABRAS_CERT)
    .filter(([, palabras]) => palabras.some((p) => t.includes(quitarTildes(p))))
    .map(([tipo]) => tipo)
  // "Coordinador de alturas" no implica el curso básico registrado por separado.
  if (certificados.includes('coordAlturas') && certificados.includes('alturas') && !/curso de trabajo|trabajo seguro en alturas/.test(t)) {
    certificados.splice(certificados.indexOf('alturas'), 1)
  }
  if (certificados.length) encontrados.push('certificados')

  const disponibilidad = /inmediat/.test(t) ? 'inmediata' : /15 dias|quince dias/.test(t) ? '15dias' : /30 dias|un mes/.test(t) ? '30dias' : 'inmediata'
  const viaja = /disponibilidad (para|de) viajar|puedo viajar|traslad/.test(t)

  return {
    datos: { nombre, telefono, email, documento, ciudad, cargo, anios, experiencia, habilidades: [...habs], certificados, disponibilidad, viaja },
    encontrados,
    confianza: Math.round((encontrados.length / 9) * 100),
  }
}

export const HV_EJEMPLO = [
  {
    titulo: 'Soldador · cubiertas',
    texto: `Wilmer Andrés Rada Montes
C.C. 1.045.678.321 de Barranquilla
Celular: 301 456 7890 · wilmer.rada@correo.com
Soledad, Atlántico

PERFIL
Soldador con 5 años de experiencia en estructuras metálicas y montaje de cubiertas. Manejo de soldadura SMAW y MIG. Interpretación de planos de taller.

EXPERIENCIA
Metálicas del Norte — Soldador (2022 - 2025)
Montaje de cerchas para cubierta de bodega industrial en Malambo. Cubierta termoacústica de colegio en Sabanagrande.
Taller Hermanos Polo — Ayudante de soldadura (2020 - 2022)
Estructura metálica de cubierta para local comercial.

CERTIFICACIONES
Curso de trabajo seguro en alturas nivel avanzado (vigente)
Certificación de soldador AWS D1.1

Disponibilidad inmediata. Puedo viajar por la región.`,
  },
  {
    titulo: 'Ingeniera residente',
    texto: `Katherine Llanos Herrera
Cédula 1.140.223.987
Teléfono 315 220 1144 — klanos.ing@correo.com
Barranquilla

Ingeniera civil con 6 años de experiencia como residente de obra en edificios de vivienda y bodegas industriales.
Manejo de presupuestos y APU, programación de obra en MS Project, AutoCAD y Revit.

Constructora Mar Caribe — Ingeniera residente (2021 - 2025): torre de apartamentos de 12 pisos; urbanización de vivienda VIS.
Inversiones Atlántico — Residente (2019 - 2021): bodega industrial y adecuación de oficinas.

Matrícula profesional COPNIA vigente. Coordinador de trabajo en alturas.
Disponibilidad en 30 días.`,
  },
]

export { TIPOS_PROYECTO }
