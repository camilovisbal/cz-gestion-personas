// Reglas de negocio del prototipo: estado de certificados, puntaje de candidatos,
// cumplimiento de formación, clima (Pulso CZ) e indicadores del plan de mejora.
import { cargoPorId, CERTIFICADOS, DISPONIBILIDAD, DIMENSIONES_CLIMA, TIPOS_PROYECTO } from '../data/catalogos.js'
import { diasHasta, enDias, inicioMes, parse } from './fechas.js'

// ───────── Certificados ─────────
export function estadoCertificado(c) {
  if (!c) return { id: 'falta', nombre: 'No registrado', tono: 'critical' }
  const d = c.vence ? diasHasta(c.vence) : null
  if (d !== null && d < 0) return { id: 'vencido', nombre: 'Vencido', tono: 'critical', dias: d }
  if (!c.verificado) return { id: 'pendiente', nombre: 'Por verificar', tono: 'neutral', dias: d }
  if (d !== null && d <= 30) return { id: 'porVencer', nombre: `Vence en ${d} d`, tono: 'warning', dias: d }
  return { id: 'vigente', nombre: 'Vigente', tono: 'good', dias: d }
}

export function certificadoValido(persona, tipo) {
  const c = persona.certificados.find((x) => x.tipo === tipo)
  const e = estadoCertificado(c)
  return e.id === 'vigente' || e.id === 'porVencer'
}

export function alertasCertificados(personas) {
  const out = []
  for (const p of personas) {
    for (const tipo of cargoPorId[p.cargo].certificados) {
      const c = p.certificados.find((x) => x.tipo === tipo)
      const e = estadoCertificado(c)
      if (e.id !== 'vigente') out.push({ persona: p, tipo, nombre: CERTIFICADOS[tipo].nombre, corto: CERTIFICADOS[tipo].corto, estado: e, cert: c })
    }
  }
  const orden = { vencido: 0, falta: 0, porVencer: 1, pendiente: 2 }
  return out.sort((a, b) => orden[a.estado.id] - orden[b.estado.id] || (a.estado.dias ?? 0) - (b.estado.dias ?? 0))
}

// ───────── Puntaje de compatibilidad (CZ Talento) ─────────
// Pesos: suman 100. El puntaje es orientativo: organiza la búsqueda, no contrata.
export const PESOS = [
  { id: 'experiencia', nombre: 'Años en el oficio', peso: 25 },
  { id: 'proyecto', nombre: 'Experiencia en este tipo de obra', peso: 20 },
  { id: 'habilidades', nombre: 'Habilidades requeridas', peso: 20 },
  { id: 'certificados', nombre: 'Certificados vigentes', peso: 15 },
  { id: 'disponibilidad', nombre: 'Disponibilidad', peso: 10 },
  { id: 'ubicacion', nombre: 'Ubicación', peso: 5 },
  { id: 'historial', nombre: 'Historial en CZ', peso: 5 },
]

const ORDEN_DISP = { inmediata: 0, '15dias': 1, '30dias': 2, no: 3 }

export function evaluarCandidato(p, v) {
  const tipoNombre = TIPOS_PROYECTO.find((t) => t.id === v.tipoProyecto)?.nombre ?? 'el tipo de obra'
  const cumple = []
  const faltantes = []
  const bloqueos = []
  const partes = {}

  if (p.cargo !== v.cargo) bloqueos.push(`Su cargo es ${cargoPorId[p.cargo].nombre}`)

  // Experiencia total
  const ratioExp = v.expMin > 0 ? Math.min(1, p.anios / v.expMin) : 1
  partes.experiencia = ratioExp
  if (p.anios >= v.expMin) cumple.push(`${p.anios} años de experiencia (mínimo ${v.expMin})`)
  else faltantes.push(`${p.anios} de ${v.expMin} años de experiencia mínima`)

  // Tipo de proyecto
  const expTipo = p.experiencia.find((e) => e.tipo === v.tipoProyecto)
  partes.proyecto = expTipo ? Math.min(1, (expTipo.anios / Math.max(1, v.expMin)) * 0.7 + Math.min(expTipo.proyectos, 6) / 6 * 0.3) : 0
  if (expTipo) cumple.push(`${expTipo.anios} años y ${expTipo.proyectos} proyectos en ${tipoNombre.toLowerCase()}`)
  else faltantes.push(`Sin experiencia registrada en ${tipoNombre.toLowerCase()}`)

  // Habilidades
  const tiene = v.habilidades.filter((h) => p.habilidades.includes(h))
  partes.habilidades = v.habilidades.length ? tiene.length / v.habilidades.length : 1
  if (tiene.length) cumple.push(`Domina ${tiene.join(', ')}`)
  const falta = v.habilidades.filter((h) => !p.habilidades.includes(h))
  if (falta.length) faltantes.push(`No registra ${falta.join(', ')}`)

  // Certificados: los de la vacante son obligatorios; los del cargo suman.
  const requeridos = [...new Set([...v.certificados, ...cargoPorId[v.cargo].certificados])]
  let okCert = 0
  for (const t of requeridos) {
    const e = estadoCertificado(p.certificados.find((c) => c.tipo === t))
    const valido = e.id === 'vigente' || e.id === 'porVencer'
    if (valido) okCert++
    if (v.certificados.includes(t)) {
      if (!valido && e.id !== 'pendiente') bloqueos.push(`${CERTIFICADOS[t].nombre}: ${e.nombre.toLowerCase()}`)
      else if (e.id === 'pendiente') faltantes.push(`${CERTIFICADOS[t].nombre} por verificar`)
      else cumple.push(`${CERTIFICADOS[t].nombre} ${e.id === 'porVencer' ? `(vence en ${e.dias} días)` : 'vigente'}`)
    } else if (e.id === 'pendiente') {
      okCert -= 0.5
    }
  }
  partes.certificados = requeridos.length ? Math.max(0, okCert) / requeridos.length : 1

  // Disponibilidad
  const disp = DISPONIBILIDAD.find((d) => d.id === p.disponibilidad)
  partes.disponibilidad = disp?.puntos ?? 0
  if (p.disponibilidad === 'no' && p.estado === 'banco') bloqueos.push('No está disponible')
  else if (ORDEN_DISP[p.disponibilidad] <= ORDEN_DISP[v.disponibilidad]) cumple.push(`Disponible ${disp.nombre.toLowerCase()}`)
  else faltantes.push(`Disponible ${disp?.nombre.toLowerCase()} (se necesita ${DISPONIBILIDAD.find((d) => d.id === v.disponibilidad).nombre.toLowerCase()})`)

  // Ubicación
  const local = p.ciudad === v.ciudad || (['Barranquilla', 'Soledad', 'Malambo', 'Puerto Colombia', 'Galapa'].includes(p.ciudad) && ['Barranquilla', 'Soledad', 'Malambo', 'Puerto Colombia', 'Galapa'].includes(v.ciudad))
  partes.ubicacion = local ? 1 : p.viaja ? 0.5 : 0
  if (!local && !p.viaja) bloqueos.push(`Vive en ${p.ciudad} y no puede trasladarse`)
  else if (!local) faltantes.push(`Vive en ${p.ciudad}; acepta trasladarse`)
  else cumple.push(`Vive en el área metropolitana (${p.ciudad})`)

  // Historial en CZ
  const h = p.historial
  if (h.length) {
    const prom = h.reduce((s, x) => s + x.calificacion, 0) / h.length
    const recontratable = h.every((x) => x.recontratable)
    partes.historial = recontratable ? Math.min(1, prom / 5) : 0
    if (!recontratable) bloqueos.push('Marcado como no recontratable en una obra anterior')
    else cumple.push(`Ya trabajó con CZ (calificación ${prom.toFixed(1).replace('.', ',')})`)
  } else partes.historial = 0.4

  const puntaje = Math.round(PESOS.reduce((s, w) => s + w.peso * (partes[w.id] ?? 0), 0))
  return { persona: p, puntaje, partes, cumple, faltantes, bloqueos, apto: bloqueos.length === 0 }
}

export function rankingVacante(personas, vacante) {
  return personas
    .filter((p) => p.cargo === vacante.cargo && p.estado === 'banco')
    .map((p) => evaluarCandidato(p, vacante))
    .sort((a, b) => Number(b.apto) - Number(a.apto) || b.puntaje - a.puntaje)
}

export function nivelPuntaje(n) {
  if (n >= 80) return { nombre: 'Alta', tono: 'good' }
  if (n >= 60) return { nombre: 'Media', tono: 'warning' }
  return { nombre: 'Baja', tono: 'neutral' }
}

// ───────── Formación ─────────
export function cursoVigente(persona, cursoId) {
  const f = persona.formacion.filter((x) => x.cursoId === cursoId).sort((a, b) => (a.fecha < b.fecha ? 1 : -1))[0]
  if (!f) return null
  if (cursoId === 'alturas' && diasHasta(f.fecha) < -365) return null
  return f
}

export function cumplimientoPersona(persona) {
  const cursos = cargoPorId[persona.cargo].cursos
  const hechos = cursos.filter((c) => cursoVigente(persona, c))
  return { total: cursos.length, hechos: hechos.length, pendientes: cursos.filter((c) => !hechos.includes(c)), pct: cursos.length ? hechos.length / cursos.length : 1 }
}

export function cumplimientoPlan(activos) {
  let t = 0, h = 0
  for (const p of activos) { const c = cumplimientoPersona(p); t += c.total; h += c.hechos }
  return t ? h / t : 0
}

// ───────── Clima (Pulso CZ) ─────────
const INDICE = ['compromiso', 'seguridad', 'comunicacion', 'formacion', 'reconocimiento']

export function agregarPulso(pulso, filtro = () => true) {
  if (pulso.dims) return { ...pulso, indice: promedio(INDICE.map((k) => pulso.dims[k])), n: pulso.participantes }
  const rs = (pulso.respuestas ?? []).filter(filtro)
  const dims = {}
  for (const d of DIMENSIONES_CLIMA) dims[d.id] = rs.length ? promedio(rs.map((r) => r.dims[d.id])) : null
  const prom = rs.filter((r) => r.recomendaria >= 9).length
  const det = rs.filter((r) => r.recomendaria <= 6).length
  const enps = rs.length ? Math.round(((prom - det) / rs.length) * 100) : null
  return { ...pulso, dims, enps, indice: rs.length ? promedio(INDICE.map((k) => dims[k])) : null, n: rs.length }
}

export function promedio(xs) {
  const v = xs.filter((x) => x !== null && x !== undefined)
  return v.length ? v.reduce((s, x) => s + x, 0) / v.length : null
}

// ───────── Personal ─────────
export function requeridosTotales(obra) {
  return Object.values(obra.requeridos).reduce((s, n) => s + n, 0)
}

// Proyección de personal: suma lo requerido por las obras activas en cada mes futuro.
export function proyeccionPersonal(obras, meses = 4) {
  const out = []
  for (let i = 1; i <= meses; i++) {
    const ini = parse(inicioMes(i))
    const fin = parse(inicioMes(i + 1))
    let total = 0
    for (const o of obras) {
      if (o.estado === 'finalizada') continue
      const oi = parse(o.inicio)
      const of = o.fin ? parse(o.fin) : null
      const activa = oi < fin && (!of || of >= new Date(ini.getTime() + 10 * 86400000))
      if (activa) total += requeridosTotales(o)
    }
    out.push({ mes: inicioMes(i), total, proyectado: true })
  }
  return out
}

export function antiguedad(p) {
  if (!p.ingreso) return null
  const d = -diasHasta(p.ingreso)
  if (d < 31) return `${d} días`
  if (d < 365) return `${Math.round(d / 30)} meses`
  const a = Math.floor(d / 365)
  return `${a} ${a === 1 ? 'año' : 'años'}`
}

export function esNuevo(p) {
  return p.ingreso && p.ingreso > enDias(-31)
}

// ───────── Formatos ─────────
export const num = (n, d = 1) => (n === null || n === undefined || Number.isNaN(n) ? '—' : n.toFixed(d).replace('.', ','))
export const pct = (n) => (n === null || n === undefined ? '—' : `${Math.round(n * 100)} %`)
export const pesos = (n) => `$ ${Math.round(n).toLocaleString('es-CO')}`
export const signo = (n) => (n > 0 ? `+${n}` : `${n}`)
export const deltaDec = (n) => (n === null || n === undefined ? '—' : `${n >= 0 ? '+' : '−'}${num(Math.abs(n))}`)

export function iniciales(nombre) {
  return nombre.replace(/^Ing\.\s*/, '').split(' ').filter(Boolean).slice(0, 2).map((s) => s[0]).join('').toUpperCase()
}

export function nombreCorto(nombre) {
  const limpio = nombre.replace(/^Ing\.\s*/, '')
  const [n, a] = limpio.split(' ')
  return `${nombre.startsWith('Ing.') ? 'Ing. ' : ''}${n} ${a ?? ''}`.trim()
}
