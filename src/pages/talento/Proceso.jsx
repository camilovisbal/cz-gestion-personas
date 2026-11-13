import { useState } from 'react'
import { MessageSquare, Clock, ArrowRight } from 'lucide-react'
import { useStore } from '../../store/Store.jsx'
import { useUi } from '../../store/ui.js'
import { PageHead, Avatar, Anillo, Modal, Badge, Campo } from '../../components/ui.jsx'
import { cargoPorId, ETAPAS } from '../../data/catalogos.js'
import { evaluarCandidato } from '../../lib/dominio.js'
import { diasHasta, fecha } from '../../lib/fechas.js'

export default function Proceso() {
  const { db, acciones, obraPorId, personaPorId } = useStore()
  const [vacante, setVacante] = useState('todas')
  const [arrastrando, setArrastrando] = useState(null)
  const [sobre, setSobre] = useState(null)
  const [detalle, setDetalle] = useState(null)

  const vacantes = db.vacantes.filter((v) => v.estado !== 'solicitada')
  const posts = db.postulaciones.filter((p) => {
    const v = db.vacantes.find((x) => x.id === p.vacanteId)
    return v && v.estado !== 'solicitada' && (vacante === 'todas' ? v.estado === 'abierta' || p.etapa === 'contratado' : v.id === vacante)
  })

  const soltar = (etapa) => {
    const post = db.postulaciones.find((p) => p.id === arrastrando)
    setSobre(null); setArrastrando(null)
    if (!post || post.etapa === etapa) return
    if (etapa === 'contratado') {
      if (confirm(`¿Contratar a ${personaPorId[post.personaId].nombre}? Se le asignará inducción y un compañero de acompañamiento.`)) acciones.contratar(post.id)
      return
    }
    acciones.moverEtapa(post.id, etapa)
  }

  return (
    <>
      <PageHead modulo="CZ Talento" titulo="Proceso de selección" descripcion="Arrastre cada candidato a la etapa en la que está. Todo movimiento queda registrado en su historial.">
        <select className="select" style={{ width: 340 }} value={vacante} onChange={(e) => setVacante(e.target.value)}>
          <option value="todas">Todas las vacantes abiertas</option>
          {vacantes.map((v) => <option key={v.id} value={v.id}>{v.cantidad} × {cargoPorId[v.cargo].nombre} · {obraPorId[v.obraId].nombre}{v.estado === 'cerrada' ? ' (cerrada)' : ''}</option>)}
        </select>
      </PageHead>

      <div className="kanban">
        {ETAPAS.map((e) => {
          const items = posts.filter((p) => p.etapa === e.id)
          return (
            <div key={e.id} className={`columna ${sobre === e.id ? 'sobre' : ''}`}
              onDragOver={(ev) => { ev.preventDefault(); setSobre(e.id) }}
              onDragLeave={() => setSobre((s) => (s === e.id ? null : s))}
              onDrop={() => soltar(e.id)}>
              <div className="columna-head">
                <span className="fila" style={{ gap: 7 }}>
                  <i className="punto" style={{ color: e.id === 'contratado' ? 'var(--verde)' : e.id === 'descartado' ? 'var(--rojo)' : 'var(--verde-300)' }} />
                  {e.nombre}
                </span>
                <span className="badge">{items.length}</span>
              </div>
              {items.map((post) => {
                const p = personaPorId[post.personaId]
                const v = db.vacantes.find((x) => x.id === post.vacanteId)
                const ev = evaluarCandidato(p, v)
                const dias = -diasHasta(post.fecha)
                return (
                  <div key={post.id} className={`tarjeta-k ${arrastrando === post.id ? 'arrastrando' : ''}`} draggable
                    onDragStart={() => setArrastrando(post.id)} onDragEnd={() => { setArrastrando(null); setSobre(null) }}
                    onClick={() => setDetalle(post.id)}>
                    <div className="fila" style={{ alignItems: 'flex-start', gap: 8 }}>
                      <Avatar nombre={p.nombre} size="sm" />
                      <div style={{ minWidth: 0 }}>
                        <strong style={{ fontSize: 13, lineHeight: 1.25, display: 'block' }}>{p.nombre}</strong>
                        <span className="xs muted">{cargoPorId[v.cargo].nombre}</span>
                      </div>
                    </div>
                    <div className="xs muted trunc">{obraPorId[v.obraId].nombre}</div>
                    <div className="fila xs muted" style={{ gap: 8, whiteSpace: 'nowrap' }}>
                      <Anillo valor={ev.puntaje} size={28} grosor={3} />
                      <span className="fila" style={{ gap: 3 }}><Clock size={12} />{dias === 0 ? 'hoy' : `${dias} d`}</span>
                      {post.notas.length > 0 && <span className="fila" style={{ gap: 3 }}><MessageSquare size={12} />{post.notas.length}</span>}
                    </div>
                    {!ev.apto && <Badge tono="critical">No cumple requisitos</Badge>}
                  </div>
                )
              })}
            </div>
          )
        })}
      </div>
      {detalle && <DetallePostulacion id={detalle} onClose={() => setDetalle(null)} />}
    </>
  )
}

function DetallePostulacion({ id, onClose }) {
  const { db, acciones, obraPorId, personaPorId } = useStore()
  const { verPersona } = useUi()
  const [nota, setNota] = useState('')
  const post = db.postulaciones.find((p) => p.id === id)
  const p = personaPorId[post.personaId]
  const v = db.vacantes.find((x) => x.id === post.vacanteId)
  const ev = evaluarCandidato(p, v)
  const idx = ETAPAS.findIndex((e) => e.id === post.etapa)
  const siguiente = ETAPAS[idx + 1]
  return (
    <Modal titulo={p.nombre} sub={`${v.cantidad} × ${cargoPorId[v.cargo].nombre} · ${obraPorId[v.obraId].nombre}`} onClose={onClose}
      pie={<>
        <button className="btn" onClick={() => { onClose(); verPersona(p.id) }}>Ver perfil</button>
        {!['descartado', 'contratado'].includes(post.etapa) && <button className="btn peligro" onClick={() => { acciones.moverEtapa(post.id, 'descartado'); onClose() }}>Descartar</button>}
        {post.etapa === 'verificacion' && <button className="btn primario" onClick={() => { acciones.contratar(post.id); onClose() }}>Contratar</button>}
        {siguiente && !['verificacion', 'contratado', 'descartado'].includes(post.etapa) && <button className="btn primario" onClick={() => acciones.moverEtapa(post.id, siguiente.id)}>Mover a {siguiente.nombre.toLowerCase()} <ArrowRight /></button>}
      </>}>
      <div className="fila" style={{ gap: 16, marginBottom: 16 }}>
        <Anillo valor={ev.puntaje} size={56} grosor={5} />
        <div>
          <div className="fila" style={{ gap: 6 }}>{ETAPAS.filter((e) => e.id !== 'descartado').map((e, i) => (
            <span key={e.id} className="fila" style={{ gap: 6 }}>
              <span className={`badge ${e.id === post.etapa ? 'solido' : i < idx && post.etapa !== 'descartado' ? 'good' : ''}`}>{e.nombre.replace(/s$/, '')}</span>
              {i < 4 && <span className="muted">›</span>}
            </span>
          ))}</div>
          <div className="peq sec mt-8">{ev.cumple.length} criterios cumplidos · {ev.faltantes.length} por revisar</div>
        </div>
      </div>
      <div className="seccion-t" style={{ marginTop: 0 }}>Historial y notas</div>
      <ul className="timeline">
        <li><b>Ingresó al proceso</b> · {fecha(post.fecha)}</li>
        {post.notas.map((n, i) => <li key={i}><b>{n.autor}</b> · {fecha(n.fecha)}<div className="sec">{n.texto}</div></li>)}
      </ul>
      <Campo label="Agregar nota">
        <div className="fila">
          <input className="input" value={nota} onChange={(e) => setNota(e.target.value)} placeholder="Ej.: Se llamó, confirma disponibilidad para el lunes" onKeyDown={(e) => { if (e.key === 'Enter' && nota.trim()) { acciones.agregarNota(post.id, nota); setNota('') } }} />
          <button className="btn" disabled={!nota.trim()} onClick={() => { acciones.agregarNota(post.id, nota); setNota('') }}>Guardar</button>
        </div>
      </Campo>
    </Modal>
  )
}
