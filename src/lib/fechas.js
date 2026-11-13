// Utilidades de fecha. Los datos de ejemplo se generan relativos a hoy para que el
// prototipo siempre se vea "al día" sin importar cuándo se presente.

const DIA = 86400000

export function hoy() {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
}

export function iso(d) {
  const x = new Date(d)
  const m = String(x.getMonth() + 1).padStart(2, '0')
  const day = String(x.getDate()).padStart(2, '0')
  return `${x.getFullYear()}-${m}-${day}`
}

export function enDias(n, desde = hoy()) {
  return iso(new Date(desde.getTime() + n * DIA))
}

export function enMeses(n, desde = hoy()) {
  const d = new Date(desde)
  d.setMonth(d.getMonth() + n)
  return iso(d)
}

export function parse(s) {
  if (!s) return null
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function diasHasta(s) {
  const d = parse(s)
  if (!d) return null
  return Math.round((d - hoy()) / DIA)
}

const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
const MESES_LARGOS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']

export function fecha(s) {
  const d = parse(s)
  if (!d) return '—'
  return `${d.getDate()} ${MESES[d.getMonth()]} ${d.getFullYear()}`
}

export function fechaCorta(s) {
  const d = parse(s)
  if (!d) return '—'
  return `${d.getDate()} ${MESES[d.getMonth()]}`
}

export function mesCorto(s) {
  const d = parse(s)
  return d ? `${MESES[d.getMonth()]} ${String(d.getFullYear()).slice(2)}` : '—'
}

export function mesLargo(s) {
  const d = parse(s)
  return d ? `${MESES_LARGOS[d.getMonth()]} ${d.getFullYear()}` : '—'
}

export function relativo(s) {
  const n = diasHasta(s)
  if (n === null) return '—'
  if (n === 0) return 'hoy'
  if (n === 1) return 'mañana'
  if (n === -1) return 'ayer'
  if (n > 0) return n < 45 ? `en ${n} días` : `en ${Math.round(n / 30)} meses`
  const p = -n
  return p < 45 ? `hace ${p} días` : `hace ${Math.round(p / 30)} meses`
}

export function inicioMes(offset = 0) {
  const d = hoy()
  d.setDate(1)
  d.setMonth(d.getMonth() + offset)
  return iso(d)
}
