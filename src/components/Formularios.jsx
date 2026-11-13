// Formularios compartidos entre Gestión Humana y líderes de obra.
import { useState } from 'react'
import { useStore } from '../store/Store.jsx'
import { Modal, Campo } from './ui.jsx'
import { CATEGORIAS_CANAL, CRITERIOS_RECONOCIMIENTO, cargoPorId } from '../data/catalogos.js'
import { inicioMes } from '../lib/fechas.js'

function SelectPersona({ personas, value, onChange }) {
  const { obraPorId } = useStore()
  return (
    <select className="select" value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="">Seleccione…</option>
      {personas.map((p) => <option key={p.id} value={p.id}>{p.nombre} · {cargoPorId[p.cargo].nombre} · {obraPorId[p.obraId]?.nombre}</option>)}
    </select>
  )
}

function Escala({ value, onChange, max = 5 }) {
  return <div className="escala">{Array.from({ length: max }, (_, i) => i + 1).map((n) => <button type="button" key={n} className={value === n ? 'on' : ''} onClick={() => onChange(n)}>{n}</button>)}</div>
}

export function DesempenoForm({ onClose, obraId, personaId: inicial }) {
  const { activos, acciones, usuario, db } = useStore()
  const personas = activos.filter((p) => !obraId || p.obraId === obraId)
  const [d, setD] = useState({ personaId: inicial ?? '', calificacion: 4, fortalezas: '', pendientes: '', potencial: false })
  const liderId = usuario.persona?.id ?? db.obras.find((o) => o.id === personas.find((p) => p.id === d.personaId)?.obraId)?.liderId
  return (
    <Modal titulo="Conversación trimestral de desempeño" sub="Retroalimentación y metas claras: qué hace bien y qué le falta aprender." onClose={onClose}
      pie={<><button className="btn" onClick={onClose}>Cancelar</button><button className="btn primario" disabled={!d.personaId || !d.fortalezas} onClick={() => { acciones.registrarDesempeno({ ...d, liderId }); onClose() }}>Guardar conversación</button></>}>
      <div className="stack">
        <Campo label="Trabajador"><SelectPersona personas={personas} value={d.personaId} onChange={(v) => setD({ ...d, personaId: v })} /></Campo>
        <Campo label="Valoración general (1 a 5)"><Escala value={d.calificacion} onChange={(v) => setD({ ...d, calificacion: v })} /></Campo>
        <Campo label="Fortalezas observadas"><input className="input" value={d.fortalezas} onChange={(e) => setD({ ...d, fortalezas: e.target.value })} placeholder="Ej.: Calidad en las uniones, puntualidad" /></Campo>
        <Campo label="Aprendizajes pendientes" ayuda="Alimenta la ruta de formación."><input className="input" value={d.pendientes} onChange={(e) => setD({ ...d, pendientes: e.target.value })} placeholder="Ej.: Lectura de planos, curso TIG" /></Campo>
        <label className="check"><input type="checkbox" checked={d.potencial} onChange={(e) => setD({ ...d, potencial: e.target.checked })} /><span>Puede asumir nuevas responsabilidades (potencial de crecimiento)</span></label>
      </div>
    </Modal>
  )
}

export function NominarForm({ onClose, obraId }) {
  const { activos, acciones, usuario, db } = useStore()
  const personas = activos.filter((p) => (!obraId || p.obraId === obraId) && p.id !== usuario.persona?.id)
  const [d, setD] = useState({ personaId: '', criterio: 'seguridad', motivo: '' })
  return (
    <Modal titulo="Nominar a Reconoce CZ" sub="Reconocer buenas prácticas con criterios visibles, no por favoritismo." onClose={onClose}
      pie={<><button className="btn" onClick={onClose}>Cancelar</button><button className="btn primario" disabled={!d.personaId || d.motivo.length < 10} onClick={() => { acciones.nominar({ ...d, mes: inicioMes(0), nominadoPor: usuario.persona?.id ?? db.obras.find((o) => o.id === 'of').liderId }); onClose() }}>Enviar nominación</button></>}>
      <div className="stack">
        <Campo label="¿A quién quiere reconocer?"><SelectPersona personas={personas} value={d.personaId} onChange={(v) => setD({ ...d, personaId: v })} /></Campo>
        <Campo label="Criterio">
          <div className="grid g-2" style={{ gap: 8 }}>
            {CRITERIOS_RECONOCIMIENTO.map((c) => (
              <button key={c.id} type="button" className="card" onClick={() => setD({ ...d, criterio: c.id })}
                style={{ padding: 12, textAlign: 'left', cursor: 'pointer', borderColor: d.criterio === c.id ? 'var(--verde-500)' : undefined, background: d.criterio === c.id ? 'var(--verde-50)' : '#fff', boxShadow: d.criterio === c.id ? '0 0 0 1px var(--verde-500)' : undefined }}>
                <div className="b">{c.nombre}</div>
                <div className="xs muted mt-8" style={{ marginTop: 2 }}>{c.descripcion}</div>
              </button>
            ))}
          </div>
        </Campo>
        <Campo label="¿Qué hizo? (hechos concretos)" ayuda="Mínimo 10 caracteres. Este texto se lee en la charla semanal."><textarea className="textarea" value={d.motivo} onChange={(e) => setD({ ...d, motivo: e.target.value })} placeholder="Ej.: Detectó una eslinga en mal estado y detuvo el izaje." /></Campo>
      </div>
    </Modal>
  )
}

export function RetroForm({ onClose, obraId }) {
  const { activos, acciones, usuario, db } = useStore()
  const personas = activos.filter((p) => (!obraId || p.obraId === obraId) && p.id !== usuario.persona?.id)
  const [d, setD] = useState({ personaId: '', tipo: 'positivo', texto: '' })
  return (
    <Modal titulo="Retroalimentación individual" sub="No solo llamados de atención: también lo que se hace bien." onClose={onClose}
      pie={<><button className="btn" onClick={onClose}>Cancelar</button><button className="btn primario" disabled={!d.personaId || !d.texto} onClick={() => { acciones.darRetro({ ...d, liderId: usuario.persona?.id ?? db.obras.find((o) => o.id === 'of').liderId }); onClose() }}>Guardar</button></>}>
      <div className="stack">
        <Campo label="Trabajador"><SelectPersona personas={personas} value={d.personaId} onChange={(v) => setD({ ...d, personaId: v })} /></Campo>
        <Campo label="Tipo">
          <div className="toggle-group">
            <button className={d.tipo === 'positivo' ? 'on' : ''} onClick={() => setD({ ...d, tipo: 'positivo' })}>Reconocer algo bien hecho</button>
            <button className={d.tipo === 'mejora' ? 'on' : ''} onClick={() => setD({ ...d, tipo: 'mejora' })}>Oportunidad de mejora</button>
          </div>
        </Campo>
        <Campo label="Mensaje"><textarea className="textarea" value={d.texto} onChange={(e) => setD({ ...d, texto: e.target.value })} /></Campo>
      </div>
    </Modal>
  )
}

export function CharlaForm({ onClose, obraId }) {
  const { db, acciones, usuario, activos } = useStore()
  const obras = db.obras.filter((o) => o.estado === 'activa')
  const [d, setD] = useState({ obraId: obraId ?? obras[0].id, tema: '', asistentes: '', inquietudes: '' })
  const total = activos.filter((p) => p.obraId === d.obraId).length
  return (
    <Modal titulo="Registrar charla semanal" sub="Espacio de 10 minutos con la cuadrilla: novedades, inquietudes y reconocimientos." onClose={onClose}
      pie={<><button className="btn" onClick={onClose}>Cancelar</button><button className="btn primario" disabled={!d.tema || !d.asistentes} onClick={() => { acciones.registrarCharla({ ...d, asistentes: Number(d.asistentes), liderId: usuario.persona?.id ?? db.obras.find((o) => o.id === d.obraId).liderId, inquietudes: d.inquietudes || 'Sin inquietudes nuevas' }); onClose() }}>Registrar</button></>}>
      <div className="form-grid">
        <Campo label="Obra">
          <select className="select" value={d.obraId} disabled={!!obraId} onChange={(e) => setD({ ...d, obraId: e.target.value })}>{obras.map((o) => <option key={o.id} value={o.id}>{o.nombre}</option>)}</select>
        </Campo>
        <Campo label={`Asistentes (de ${total})`}><input className="input num" type="number" min="1" max={total} value={d.asistentes} onChange={(e) => setD({ ...d, asistentes: e.target.value })} /></Campo>
        <Campo label="Tema principal" full><input className="input" value={d.tema} onChange={(e) => setD({ ...d, tema: e.target.value })} placeholder="Ej.: Cambios de turno de la semana" /></Campo>
        <Campo label="Inquietudes de la cuadrilla" ayuda="Si requieren respuesta, regístrelas también en el Canal CZ." full><textarea className="textarea" value={d.inquietudes} onChange={(e) => setD({ ...d, inquietudes: e.target.value })} /></Campo>
      </div>
    </Modal>
  )
}

export function SugerenciaForm({ onClose, personaId, obraId }) {
  const { db, acciones } = useStore()
  const [d, setD] = useState({ obraId: obraId ?? 'o1', categoria: 'Bienestar', texto: '', anonimo: false })
  return (
    <Modal titulo="Nuevo mensaje al Canal CZ" sub="Sugerencias e inquietudes con fecha de respuesta: CZ se compromete a responder en máximo 15 días." onClose={onClose}
      pie={<><button className="btn" onClick={onClose}>Cancelar</button><button className="btn primario" disabled={d.texto.length < 8} onClick={() => { acciones.crearSugerencia({ ...d, personaId: d.anonimo ? null : personaId ?? null }); onClose() }}>Enviar</button></>}>
      <div className="stack">
        {!obraId && <Campo label="Obra"><select className="select" value={d.obraId} onChange={(e) => setD({ ...d, obraId: e.target.value })}>{db.obras.filter((o) => ['activa', 'oficina'].includes(o.estado)).map((o) => <option key={o.id} value={o.id}>{o.nombre}</option>)}</select></Campo>}
        <Campo label="Tema"><div className="toggle-group">{CATEGORIAS_CANAL.map((c) => <button key={c} className={d.categoria === c ? 'on' : ''} onClick={() => setD({ ...d, categoria: c })}>{c}</button>)}</div></Campo>
        <Campo label="Mensaje"><textarea className="textarea" value={d.texto} onChange={(e) => setD({ ...d, texto: e.target.value })} placeholder="Cuéntenos qué pasa o qué propone…" /></Campo>
        <label className="check"><input type="checkbox" checked={d.anonimo} onChange={(e) => setD({ ...d, anonimo: e.target.checked })} /><span>Enviar de forma anónima</span></label>
      </div>
    </Modal>
  )
}

export const TIPOS_BIENESTAR = ['Carga de trabajo', 'Molestia física', 'Estrés o ansiedad', 'Golpe de calor', 'Descanso insuficiente', 'Otro']

export function ReporteBienestarForm({ onClose, personaId, obraId }) {
  const { db, acciones } = useStore()
  const [d, setD] = useState({ obraId: obraId ?? 'o1', tipo: 'Carga de trabajo', descripcion: '', anonimo: !personaId })
  return (
    <Modal titulo="Reportar una molestia o necesidad" sub="Sin temor: el reporte llega a SST para orientación o apoyo." onClose={onClose}
      pie={<><button className="btn" onClick={onClose}>Cancelar</button><button className="btn primario" disabled={d.descripcion.length < 5} onClick={() => { acciones.reportarBienestar({ ...d, personaId: d.anonimo ? null : personaId ?? null }); onClose() }}>Enviar reporte</button></>}>
      <div className="stack">
        {!obraId && <Campo label="Obra"><select className="select" value={d.obraId} onChange={(e) => setD({ ...d, obraId: e.target.value })}>{db.obras.filter((o) => o.estado === 'activa').map((o) => <option key={o.id} value={o.id}>{o.nombre}</option>)}</select></Campo>}
        <Campo label="Tipo"><div className="toggle-group">{TIPOS_BIENESTAR.map((t) => <button key={t} className={d.tipo === t ? 'on' : ''} onClick={() => setD({ ...d, tipo: t })}>{t}</button>)}</div></Campo>
        <Campo label="Descripción"><textarea className="textarea" value={d.descripcion} onChange={(e) => setD({ ...d, descripcion: e.target.value })} /></Campo>
        <label className="check"><input type="checkbox" checked={d.anonimo} onChange={(e) => setD({ ...d, anonimo: e.target.checked })} /><span>Reporte anónimo</span></label>
      </div>
    </Modal>
  )
}
