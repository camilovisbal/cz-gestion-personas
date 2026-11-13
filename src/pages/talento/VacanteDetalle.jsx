import { useMemo, useState } from 'react'
import { ChevronDown, ChevronRight, Check, AlertTriangle, Ban, Download, UserPlus, Info, MapPin, CalendarClock, ArrowRight, Star, Lock } from 'lucide-react'
import { useStore } from '../../store/Store.jsx'
import { useUi } from '../../store/ui.js'
import { PageHead, Card, Badge, Anillo, Avatar, Progreso, Segmentado, Vacio } from '../../components/ui.jsx'
import { cargoPorId, CERTIFICADOS, DISPONIBILIDAD, ETAPAS, TIPOS_PROYECTO } from '../../data/catalogos.js'
import { PESOS, nivelPuntaje, rankingVacante } from '../../lib/dominio.js'
import { fecha, relativo } from '../../lib/fechas.js'

export function exportarCSV(nombre, filas) {
  const csv = filas.map((f) => f.map((c) => `"${String(c ?? '').replace(/"/g, '""')}"`).join(';')).join('\r\n')
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = nombre
  a.click()
  URL.revokeObjectURL(a.href)
}

const SIGUIENTE = { postulado: 'preseleccionado', preseleccionado: 'entrevista', entrevista: 'verificacion' }

export default function VacanteDetalle({ id }) {
  const { db, acciones, obraPorId, personaPorId } = useStore()
  const { verPersona } = useUi()
  const v = db.vacantes.find((x) => x.id === id)
  const [abierto, setAbierto] = useState(null)
  const [sel, setSel] = useState([])
  const [verNoAptos, setVerNoAptos] = useState(false)
  const [orden, setOrden] = useState('puntaje')

  const ranking = useMemo(() => (v ? rankingVacante(db.personas, v) : []), [db.personas, v])
  if (!v) return <Vacio titulo="Vacante no encontrada" />

  const cargo = cargoPorId[v.cargo]
  const obra = obraPorId[v.obraId]
  const posts = db.postulaciones.filter((p) => p.vacanteId === v.id)
  const etapaDe = (pid) => posts.find((p) => p.personaId === pid)
  let aptos = ranking.filter((r) => r.apto)
  if (orden === 'experiencia') aptos = [...aptos].sort((a, b) => b.persona.anios - a.persona.anios)
  if (orden === 'disponibilidad') aptos = [...aptos].sort((a, b) => DISPONIBILIDAD.findIndex((d) => d.id === a.persona.disponibilidad) - DISPONIBILIDAD.findIndex((d) => d.id === b.persona.disponibilidad) || b.puntaje - a.puntaje)
  const noAptos = ranking.filter((r) => !r.apto)
  const contratados = posts.filter((p) => p.etapa === 'contratado').length
  const libres = sel.filter((pid) => !etapaDe(pid))

  const exportar = () => {
    exportarCSV(`preseleccion-${cargo.nombre.toLowerCase().replace(/\s+/g, '-')}-${obra.nombre.toLowerCase().replace(/\s+/g, '-')}.csv`, [
      ['Nombre', 'Cargo', 'Puntaje', 'Años', 'Ciudad', 'Disponibilidad', 'Teléfono', 'Etapa', 'Cumple', 'Por revisar'],
      ...aptos.map((r) => [r.persona.nombre, cargo.nombre, r.puntaje, r.persona.anios, r.persona.ciudad, DISPONIBILIDAD.find((d) => d.id === r.persona.disponibilidad)?.nombre, r.persona.telefono, ETAPAS.find((e) => e.id === etapaDe(r.persona.id)?.etapa)?.nombre ?? 'Sin contactar', r.cumple.join(' | '), r.faltantes.join(' | ')]),
    ])
  }

  return (
    <>
      <PageHead migas={<><a href="#/talento/vacantes">Vacantes</a><ChevronRight size={13} />{obra.nombre}</>}
        titulo={<span className="fila" style={{ gap: 10 }}>{v.cantidad} × {cargo.nombre} <Badge tono={v.estado === 'abierta' ? 'good' : v.estado === 'solicitada' ? 'warning' : ''}>{{ abierta: 'Abierta', solicitada: 'Por aprobar', cerrada: 'Cerrada' }[v.estado]}</Badge></span>}
        descripcion={v.descripcion || `Vacante para ${obra.nombre}.`}>
        <button className="btn" onClick={exportar}><Download />Exportar a Excel</button>
        {v.estado === 'solicitada' && <button className="btn primario" onClick={() => acciones.aprobarVacante(v.id)}><Check />Aprobar solicitud</button>}
        {v.estado === 'abierta' && <button className="btn" onClick={() => acciones.cerrarVacante(v.id)}><Lock />Cerrar vacante</button>}
      </PageHead>

      <div className="grid g-21">
        <div className="stack">
          <Card titulo="Candidatos sugeridos del banco de talento"
            sub={`${aptos.length} cumplen los requisitos obligatorios · ordenados por compatibilidad con la obra`}
            accion={<Segmentado valor={orden} onChange={setOrden} opciones={[{ id: 'puntaje', nombre: 'Compatibilidad' }, { id: 'experiencia', nombre: 'Experiencia' }, { id: 'disponibilidad', nombre: 'Disponibilidad' }]} />}
            flush
            pie={sel.length > 0 && (
              <>
                <span>{sel.length} seleccionados{libres.length !== sel.length ? ` · ${sel.length - libres.length} ya en proceso` : ''}</span>
                <span className="fila">
                  <button className="btn sm fantasma" onClick={() => setSel([])}>Limpiar</button>
                  <button className="btn sm primario" disabled={!libres.length} onClick={() => { acciones.postular(v.id, libres); setSel([]) }}><UserPlus />Preseleccionar ({libres.length})</button>
                </span>
              </>
            )}>
            {aptos.length === 0 && <Vacio titulo="Nadie del banco cumple todos los requisitos">Revise los requisitos obligatorios o registre nuevos candidatos.</Vacio>}
            <ul className="lista">
              {aptos.map((r, i) => {
                const p = r.persona
                const post = etapaDe(p.id)
                const exp = abierto === p.id
                const nivel = nivelPuntaje(r.puntaje)
                return (
                  <li key={p.id} style={{ display: 'block', padding: 0 }}>
                    <div className="fila" style={{ padding: '12px 18px', gap: 14 }}>
                      <input type="checkbox" className="check" style={{ width: 16, height: 16, accentColor: 'var(--verde)' }} checked={sel.includes(p.id)}
                        onChange={() => setSel((s) => (s.includes(p.id) ? s.filter((x) => x !== p.id) : [...s, p.id]))} aria-label={`Seleccionar a ${p.nombre}`} />
                      <span className="xs muted num" style={{ width: 16 }}>{i + 1}</span>
                      <Anillo valor={r.puntaje} />
                      <div style={{ flex: 1, minWidth: 0, cursor: 'pointer' }} onClick={() => setAbierto(exp ? null : p.id)}>
                        <div className="fila" style={{ gap: 8 }}>
                          <strong style={{ fontSize: 14 }}>{p.nombre}</strong>
                          {p.historial.length > 0 && <Badge tono="good" icono={Star}>Ex CZ</Badge>}
                          <Badge tono={nivel.tono}>Coincidencia {nivel.nombre.toLowerCase()}</Badge>
                        </div>
                        <div className="peq sec mt-8 trunc" style={{ marginTop: 3 }}>
                          {p.anios} años · {p.experiencia.find((e) => e.tipo === v.tipoProyecto) ? `${p.experiencia.find((e) => e.tipo === v.tipoProyecto).proyectos} proyectos similares` : 'sin proyectos similares'} · {p.ciudad} · {DISPONIBILIDAD.find((d) => d.id === p.disponibilidad)?.nombre}
                        </div>
                        {r.faltantes.length > 0 && !exp && <div className="xs mt-8" style={{ marginTop: 3, color: '#8d5a17' }}>Revisar: {r.faltantes[0]}{r.faltantes.length > 1 ? ` y ${r.faltantes.length - 1} más` : ''}</div>}
                      </div>
                      {post
                        ? <Badge tono={post.etapa === 'contratado' ? 'good' : post.etapa === 'descartado' ? 'critical' : 'info'}>{ETAPAS.find((e) => e.id === post.etapa).nombre.replace(/s$/, '')}</Badge>
                        : <button className="btn sm" disabled={v.estado !== 'abierta'} onClick={() => acciones.postular(v.id, p.id)}><UserPlus />Preseleccionar</button>}
                      <button className="btn sm fantasma icono" onClick={() => setAbierto(exp ? null : p.id)} aria-label="Ver detalle">{exp ? <ChevronDown /> : <ChevronRight />}</button>
                    </div>
                    {exp && (
                      <div className="grid g-2 detalle-expandido" style={{ padding: '4px 18px 18px 84px', gap: 24 }}>
                        <div>
                          <div className="seccion-t" style={{ marginTop: 4 }}>Por qué este puntaje</div>
                          <div className="desglose">
                            {PESOS.map((w) => (
                              <FragmentoPeso key={w.id} nombre={w.nombre} valor={r.partes[w.id] ?? 0} peso={w.peso} />
                            ))}
                          </div>
                        </div>
                        <div>
                          <div className="seccion-t" style={{ marginTop: 4 }}>Cumple</div>
                          <ul className="cumple">{r.cumple.map((c) => <li key={c}><Check />{c}</li>)}</ul>
                          {r.faltantes.length > 0 && <>
                            <div className="seccion-t">A revisar en entrevista</div>
                            <ul className="falta">{r.faltantes.map((c) => <li key={c}><AlertTriangle />{c}</li>)}</ul>
                          </>}
                          <button className="btn sm mt-16" onClick={() => verPersona(p.id)}>Ver hoja de vida completa <ArrowRight /></button>
                        </div>
                      </div>
                    )}
                  </li>
                )
              })}
            </ul>
          </Card>

          {noAptos.length > 0 && (
            <Card titulo={<button className="btn fantasma" style={{ padding: 0, height: 'auto', fontSize: 14.5, fontWeight: 600, color: 'var(--tinta)' }} onClick={() => setVerNoAptos((s) => !s)}>{verNoAptos ? <ChevronDown /> : <ChevronRight />}No cumplen requisitos obligatorios ({noAptos.length})</button>}
              sub="Se muestran con el motivo para que la decisión sea transparente y la persona pueda ser orientada (p. ej., reentrenarse en alturas)." flush>
              {verNoAptos && (
                <ul className="lista">
                  {noAptos.map((r) => (
                    <li key={r.persona.id} className="click" onClick={() => verPersona(r.persona.id)}>
                      <Avatar nombre={r.persona.nombre} size="sm" />
                      <div className="cuerpo">
                        <div className="titulo">{r.persona.nombre}</div>
                        <ul className="falta mt-8" style={{ marginTop: 3 }}>{r.bloqueos.map((b) => <li key={b} className="bloqueo"><Ban />{b}</li>)}</ul>
                      </div>
                      <span className="xs muted num">{r.puntaje} pts</span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          )}
        </div>

        <div className="stack">
          <Card titulo="Perfil requerido">
            <div className="stack" style={{ gap: 12 }}>
              <div className="fila-sb peq"><span className="muted">Obra</span><b>{obra.nombre}</b></div>
              <div className="fila-sb peq"><span className="muted">Tipo de obra</span><span>{TIPOS_PROYECTO.find((t) => t.id === v.tipoProyecto)?.nombre}</span></div>
              <div className="fila-sb peq"><span className="muted">Experiencia mínima</span><span className="num">{v.expMin} años</span></div>
              <div className="fila-sb peq"><span className="muted">Disponibilidad</span><span>{DISPONIBILIDAD.find((d) => d.id === v.disponibilidad)?.nombre}</span></div>
              <div className="fila-sb peq"><span className="muted">Ubicación</span><span className="fila" style={{ gap: 4 }}><MapPin size={13} />{v.ciudad}{v.aceptaViajeros ? ' · acepta traslados' : ''}</span></div>
              <div className="fila-sb peq"><span className="muted">Fecha límite</span><span className="fila" style={{ gap: 4 }}><CalendarClock size={13} />{fecha(v.fechaLimite)} · {relativo(v.fechaLimite)}</span></div>
              <div>
                <div className="peq muted" style={{ marginBottom: 6 }}>Certificados obligatorios</div>
                <div className="chips">{v.certificados.length ? v.certificados.map((c) => <span key={c} className="chip on">{CERTIFICADOS[c].nombre}</span>) : <span className="peq">Ninguno</span>}</div>
              </div>
              <div>
                <div className="peq muted" style={{ marginBottom: 6 }}>Habilidades</div>
                <div className="chips">{v.habilidades.map((h) => <span key={h} className="chip">{h}</span>)}</div>
              </div>
              <div>
                <div className="fila-sb xs muted" style={{ marginBottom: 5 }}><span>Contratados</span><span className="num">{contratados} de {v.cantidad}</span></div>
                <Progreso valor={contratados / v.cantidad} />
              </div>
            </div>
          </Card>

          <Card titulo="En proceso" sub={`${posts.length} candidatos`} flush pie={<><span>Arrastre tarjetas en el tablero</span><a href="#/talento/proceso">Abrir tablero</a></>}>
            {posts.length === 0 && <Vacio titulo="Aún no hay candidatos">Preseleccione desde la lista de sugeridos.</Vacio>}
            <ul className="lista">
              {ETAPAS.flatMap((e) => posts.filter((p) => p.etapa === e.id)).map((post) => {
                const p = personaPorId[post.personaId]
                const sig = SIGUIENTE[post.etapa]
                return (
                  <li key={post.id}>
                    <div className="cuerpo" style={{ cursor: 'pointer' }} onClick={() => verPersona(p.id)}>
                      <div className="titulo trunc">{p.nombre}</div>
                      <div className="meta-l">{ETAPAS.find((e) => e.id === post.etapa).nombre.replace(/s$/, '')} · {relativo(post.fecha)}</div>
                    </div>
                    {sig && <button className="btn sm" title={`Mover a ${sig}`} onClick={() => acciones.moverEtapa(post.id, sig)}><ArrowRight /></button>}
                    {post.etapa === 'verificacion' && <button className="btn sm primario" onClick={() => acciones.contratar(post.id)}>Contratar</button>}
                    {post.etapa === 'contratado' && <Badge tono="good">Contratado</Badge>}
                    {post.etapa === 'descartado' && <Badge tono="critical">Descartado</Badge>}
                  </li>
                )
              })}
            </ul>
          </Card>

          <div className="aviso"><Info /><span>El puntaje es <b>orientativo</b>: organiza la búsqueda, pero la decisión la toma CZ después de la entrevista y la verificación de documentos y experiencia.</span></div>
        </div>
      </div>
    </>
  )
}

function FragmentoPeso({ nombre, valor, peso }) {
  return (
    <>
      <span className="sec">{nombre}</span>
      <Progreso valor={valor} />
      <span className="num derecha b">{Math.round(valor * peso)}<span className="muted" style={{ fontWeight: 400 }}>/{peso}</span></span>
    </>
  )
}
