import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { crearDatosDemo, USUARIO_ADMIN } from '../data/seed.js'
import { cargoPorId } from '../data/catalogos.js'
import { enDias } from '../lib/fechas.js'

const CLAVE = 'cz-personas-v1'
const StoreCtx = createContext(null)

function cargar() {
  try {
    const raw = localStorage.getItem(CLAVE)
    if (raw) {
      const data = JSON.parse(raw)
      if (data.version === 1) return data
    }
  } catch { /* sin almacenamiento disponible: se usan datos demo */ }
  return crearDatosDemo()
}

let contador = Date.now() % 100000
const nuevoId = (prefijo) => `${prefijo}${(contador++).toString(36)}`

export function StoreProvider({ children }) {
  const [db, setDb] = useState(cargar)
  const [rol, setRol] = useState(() => {
    try { return localStorage.getItem(`${CLAVE}-rol`) || 'admin' } catch { return 'admin' }
  })
  const [toasts, setToasts] = useState([])

  useEffect(() => {
    try { localStorage.setItem(CLAVE, JSON.stringify(db)) } catch { /* ignorar */ }
  }, [db])
  useEffect(() => {
    try { localStorage.setItem(`${CLAVE}-rol`, rol) } catch { /* ignorar */ }
  }, [rol])

  const toast = useCallback((texto, tono = 'good') => {
    const id = nuevoId('t')
    setToasts((t) => [...t, { id, texto, tono }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3400)
  }, [])

  // Aplica cambios sobre una copia del estado (estilo "draft").
  const mutar = useCallback((fn) => setDb((s) => { const n = structuredClone(s); fn(n); return n }), [])

  const dbRef = useRef(db)
  dbRef.current = db

  const acciones = useMemo(() => ({
    reiniciar() {
      setDb(crearDatosDemo())
      toast('Datos de demostración restablecidos')
    },

    // ── Talento ──
    crearVacante(v, comoSolicitud = false) {
      const id = nuevoId('v')
      mutar((d) => { d.vacantes.unshift({ ...v, id, creada: enDias(0), estado: comoSolicitud ? 'solicitada' : 'abierta' }) })
      toast(comoSolicitud ? 'Solicitud de personal enviada a Gestión Humana' : 'Vacante publicada')
      return id
    },
    aprobarVacante(id) {
      mutar((d) => { d.vacantes.find((v) => v.id === id).estado = 'abierta' })
      toast('Solicitud aprobada: la vacante quedó abierta')
    },
    cerrarVacante(id) {
      mutar((d) => { d.vacantes.find((v) => v.id === id).estado = 'cerrada' })
      toast('Vacante cerrada', 'neutral')
    },
    postular(vacanteId, personaIds, etapa = 'preseleccionado') {
      const ids = Array.isArray(personaIds) ? personaIds : [personaIds]
      mutar((d) => {
        for (const personaId of ids) {
          if (d.postulaciones.some((p) => p.vacanteId === vacanteId && p.personaId === personaId)) continue
          d.postulaciones.push({ id: nuevoId('a'), vacanteId, personaId, etapa, fecha: enDias(0), notas: [] })
        }
      })
      toast(ids.length > 1 ? `${ids.length} candidatos agregados al proceso` : 'Candidato agregado al proceso')
    },
    moverEtapa(postId, etapa) {
      mutar((d) => {
        const p = d.postulaciones.find((x) => x.id === postId)
        p.etapa = etapa
        p.notas.push({ fecha: enDias(0), texto: `Movido a «${etapa}»`, autor: 'Sistema' })
      })
    },
    agregarNota(postId, texto) {
      mutar((d) => { d.postulaciones.find((x) => x.id === postId).notas.push({ fecha: enDias(0), texto, autor: 'Gestión Humana' }) })
    },
    contratar(postId) {
      const s = dbRef.current
      const post = s.postulaciones.find((x) => x.id === postId)
      const vac = s.vacantes.find((v) => v.id === post.vacanteId)
      const persona = s.personas.find((p) => p.id === post.personaId)
      mutar((d) => {
        const p = d.postulaciones.find((x) => x.id === postId)
        p.etapa = 'contratado'
        p.notas.push({ fecha: enDias(0), texto: 'Contratado. Inicia inducción y acompañamiento.', autor: 'Sistema' })
        const per = d.personas.find((x) => x.id === post.personaId)
        per.estado = 'activo'
        per.obraId = vac.obraId
        per.ingreso = enDias(0)
        per.disponibilidad = 'no'
        // Acompañamiento: un trabajador experimentado de la misma obra (o el maestro).
        const mentor = d.personas.find((m) => m.estado === 'activo' && m.obraId === vac.obraId && m.id !== per.id && m.cargo === per.cargo && m.ingreso < enDias(-365))
          ?? d.personas.find((m) => m.estado === 'activo' && m.cargo === 'maestro' && (m.obraId === vac.obraId || !d.personas.some((x) => x.obraId === vac.obraId && x.cargo === 'maestro')))
        d.mentorias.push({ id: nuevoId('m'), nuevoId: per.id, mentorId: mentor?.id ?? null, inicio: enDias(0), checklist: { bienvenida: false, epp: false, induccion: false, procedimientos: false, seguimiento30: false } })
        // Inscripción automática en la próxima inducción.
        const ind = d.sesiones.filter((x) => x.cursoId === 'induccion' && x.fecha >= enDias(0)).sort((a, b) => (a.fecha > b.fecha ? 1 : -1))[0]
        if (ind && !ind.inscritos.includes(per.id)) ind.inscritos.push(per.id)
        const contratados = d.postulaciones.filter((x) => x.vacanteId === vac.id && x.etapa === 'contratado').length
        if (contratados >= vac.cantidad) d.vacantes.find((v) => v.id === vac.id).estado = 'cerrada'
      })
      toast(`${persona.nombre} contratado · inducción y acompañamiento asignados`)
    },
    registrarPersona(datos) {
      const id = nuevoId('p')
      mutar((d) => {
        d.personas.push({
          id, email: null, documento: '', telefono: '', historial: [], formacion: [], estado: 'banco', obraId: null, ingreso: null,
          fechaRegistro: enDias(0), consentimiento: true, viaja: false, aspiracion: 0, experiencia: [], habilidades: [], certificados: [],
          ...datos,
        })
      })
      toast('Persona registrada en el banco de talento')
      return id
    },
    actualizarPersona(id, cambios) {
      mutar((d) => { Object.assign(d.personas.find((p) => p.id === id), cambios) })
    },
    verificarCertificado(personaId, tipo) {
      mutar((d) => { d.personas.find((p) => p.id === personaId).certificados.find((c) => c.tipo === tipo).verificado = true })
      toast('Certificado verificado')
    },
    retirar(personaId, evaluacion) {
      mutar((d) => {
        const p = d.personas.find((x) => x.id === personaId)
        p.historial.push({ obraId: p.obraId, ...evaluacion, periodo: `Hasta ${enDias(0)}` })
        p.estado = 'banco'
        p.obraId = null
        p.disponibilidad = 'inmediata'
      })
      toast('Evaluación de cierre guardada; la persona pasa al banco de talento')
    },

    // ── Escuchar ──
    crearSugerencia(s) {
      mutar((d) => { d.canal.unshift({ id: nuevoId('s'), fecha: enDias(0), estado: 'recibida', responsable: 'Gestión Humana', fechaLimite: enDias(15), respuesta: null, accion: null, publicar: false, ...s }) })
      toast('Gracias. Tu mensaje llegó al Canal CZ')
    },
    responderSugerencia(id, cambios) {
      mutar((d) => { Object.assign(d.canal.find((s) => s.id === id), cambios) })
      toast(cambios.estado === 'respondida' ? 'Respuesta registrada' : 'Inquietud actualizada')
    },
    registrarCharla(c) {
      mutar((d) => { d.charlas.unshift({ id: nuevoId('c'), fecha: enDias(0), ...c }) })
      toast('Charla semanal registrada')
    },
    responderPulso(r) {
      mutar((d) => {
        const abierto = d.pulsos.find((p) => p.estado === 'abierto')
        abierto.respuestas = abierto.respuestas.filter((x) => x.personaId !== r.personaId)
        abierto.respuestas.push({ ...r, fecha: enDias(0) })
      })
      toast('¡Gracias! Tu respuesta es confidencial')
    },

    // ── Reconocer ──
    nominar(n) {
      mutar((d) => { d.nominaciones.unshift({ id: nuevoId('n'), estado: 'nominado', ...n }) })
      toast('Nominación enviada a Reconoce CZ')
    },
    reconocer(id) {
      mutar((d) => { d.nominaciones.find((n) => n.id === id).estado = 'reconocido' })
      toast('Reconocimiento otorgado')
    },
    darRetro(r) {
      mutar((d) => { d.retro.unshift({ id: nuevoId('r'), fecha: enDias(0), ...r }) })
      toast('Retroalimentación registrada')
    },
    registrarDesempeno(c) {
      mutar((d) => { d.desempeno.unshift({ id: nuevoId('d'), fecha: enDias(0), ...c }) })
      toast('Conversación de desempeño guardada')
    },
    marcarMentoria(id, clave) {
      mutar((d) => { const m = d.mentorias.find((x) => x.id === id); m.checklist[clave] = !m.checklist[clave] })
    },

    // ── Formación ──
    crearSesion(s) {
      mutar((d) => { d.sesiones.push({ id: nuevoId('f'), asistentes: null, ...s }) })
      toast('Capacitación programada')
    },
    registrarAsistencia(sesionId, asistentes) {
      mutar((d) => {
        const s = d.sesiones.find((x) => x.id === sesionId)
        s.asistentes = asistentes
        for (const pid of asistentes) {
          const p = d.personas.find((x) => x.id === pid)
          p.formacion.push({ cursoId: s.cursoId, fecha: s.fecha })
          if (s.cursoId === 'induccion') {
            const m = d.mentorias.find((x) => x.nuevoId === pid)
            if (m) m.checklist.induccion = true
          }
        }
      })
      toast('Asistencia registrada y formación actualizada')
    },

    // ── Bienestar ──
    reportarBienestar(r) {
      mutar((d) => { d.bienestar.unshift({ id: nuevoId('b'), fecha: enDias(0), estado: 'abierto', canalizadoA: null, ...r }) })
      toast('Reporte enviado. SST hará seguimiento')
    },
    actualizarBienestar(id, cambios) {
      mutar((d) => { Object.assign(d.bienestar.find((b) => b.id === id), cambios) })
      toast('Caso actualizado')
    },
    registrarPausas(obraId, pausas) {
      mutar((d) => {
        const ult = d.jornadas.filter((j) => j.obraId === obraId).at(-1)
        if (ult) ult.pausas += pausas
      })
      toast('Pausas registradas')
    },

    // ── Plan ──
    marcarTarea(planId, idx) {
      mutar((d) => { const t = d.plan.find((p) => p.id === planId).tareas[idx]; t.ok = !t.ok })
    },
  }), [mutar, toast])

  // Datos derivados frecuentes.
  const derivados = useMemo(() => {
    const activos = db.personas.filter((p) => p.estado === 'activo')
    const banco = db.personas.filter((p) => p.estado === 'banco')
    const personaPorId = Object.fromEntries(db.personas.map((p) => [p.id, p]))
    const obraPorId = Object.fromEntries(db.obras.map((o) => [o.id, o]))
    const usuario = rol === 'admin'
      ? { ...USUARIO_ADMIN }
      : rol === 'lider'
        ? { persona: personaPorId[db.usuarios.lider.personaId], obraId: db.usuarios.lider.obraId }
        : { persona: personaPorId[db.usuarios.trabajador.personaId] }
    return { activos, banco, personaPorId, obraPorId, usuario, cargoDe: (p) => cargoPorId[p.cargo] }
  }, [db, rol])

  const value = useMemo(() => ({ db, rol, setRol, acciones, toasts, toast, ...derivados }), [db, rol, acciones, toasts, toast, derivados])
  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>
}

export function useStore() {
  return useContext(StoreCtx)
}
