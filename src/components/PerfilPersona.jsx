import { useState } from 'react'
import { Phone, MapPin, Plane, BadgeCheck, LogOut, Briefcase, Star, ShieldAlert, CheckCircle2, Circle } from 'lucide-react'
import { useStore } from '../store/Store.jsx'
import { Modal, Avatar, Badge, Tabs, Dato, EstadoCert, Progreso, Campo, Vacio } from './ui.jsx'
import { cargoPorId, CERTIFICADOS, CRITERIOS_RECONOCIMIENTO, cursoPorId, DISPONIBILIDAD, ETAPAS, TIPOS_PROYECTO } from '../data/catalogos.js'
import { antiguedad, cumplimientoPersona, cursoVigente, estadoCertificado, evaluarCandidato, num, pesos } from '../lib/dominio.js'
import { fecha, relativo } from '../lib/fechas.js'
import { ir } from '../lib/router.js'

export default function PerfilPersona({ id, onClose }) {
  const { db, rol, acciones, obraPorId, personaPorId } = useStore()
  const p = personaPorId[id]
  const [tab, setTab] = useState('perfil')
  const [retiro, setRetiro] = useState(false)
  const [vacante, setVacante] = useState('')
  if (!p) return null
  const cargo = cargoPorId[p.cargo]
  const obra = obraPorId[p.obraId]
  const posts = db.postulaciones.filter((x) => x.personaId === id)
  const recos = db.nominaciones.filter((n) => n.personaId === id)
  const retro = db.retro.filter((r) => r.personaId === id)
  const desem = db.desempeno.filter((d) => d.personaId === id)
  const cumpl = cumplimientoPersona(p)
  const vacantesAbiertas = db.vacantes.filter((v) => v.estado === 'abierta' && v.cargo === p.cargo && !posts.some((x) => x.vacanteId === v.id))
  const promHist = p.historial.length ? p.historial.reduce((s, h) => s + h.calificacion, 0) / p.historial.length : null

  const tabs = [
    { id: 'perfil', nombre: 'Perfil' },
    { id: 'certificados', nombre: 'Certificados', n: p.certificados.length },
    ...(p.estado === 'activo' ? [{ id: 'formacion', nombre: 'Formación' }] : []),
    { id: 'historial', nombre: 'Historial CZ', n: p.historial.length + recos.length + desem.length },
    ...(rol === 'admin' ? [{ id: 'procesos', nombre: 'Procesos', n: posts.length }] : []),
  ]

  return (
    <Modal drawer onClose={onClose}
      titulo={
        <div className="fila" style={{ gap: 14 }}>
          <Avatar nombre={p.nombre} size="lg" />
          <div style={{ minWidth: 0 }}>
            <h2 className="trunc">{p.nombre}</h2>
            <div className="sec peq">{cargo.nombre} · {p.anios} años de experiencia</div>
            <div className="fila mt-8 wrap" style={{ gap: 6 }}>
              {p.estado === 'activo'
                ? <Badge tono="good" punto>Activo · {obra?.nombre}</Badge>
                : <Badge tono="info" punto>Banco de talento</Badge>}
              {promHist && <Badge tono={p.historial.every((h) => h.recontratable) ? 'good' : 'critical'} icono={Star}>{num(promHist)} en CZ</Badge>}
            </div>
          </div>
        </div>
      }
      pie={rol === 'admin' && (
        p.estado === 'activo'
          ? <button className="btn" onClick={() => setRetiro(true)}><LogOut />Evaluación de cierre</button>
          : (
            <div className="fila" style={{ width: '100%' }}>
              <select className="select" value={vacante} onChange={(e) => setVacante(e.target.value)} style={{ maxWidth: 330 }}>
                <option value="">Agregar a una vacante abierta…</option>
                {vacantesAbiertas.map((v) => {
                  const ev = evaluarCandidato(p, v)
                  return <option key={v.id} value={v.id}>{v.cantidad} × {cargo.nombre} · {obraPorId[v.obraId].nombre} ({ev.puntaje} pts)</option>
                })}
              </select>
              <button className="btn primario" disabled={!vacante} onClick={() => { acciones.postular(vacante, p.id); setVacante('') }}><Briefcase />Agregar</button>
            </div>
          )
      )}>
      <Tabs tabs={tabs} activo={tab} onChange={setTab} />

      {tab === 'perfil' && (
        <>
          <div className="datos">
            <Dato label="Teléfono"><span className="fila"><Phone size={13} />{p.telefono || '—'}</span></Dato>
            <Dato label="Ciudad"><span className="fila"><MapPin size={13} />{p.ciudad}</span></Dato>
            <Dato label="Documento">{p.documento ? `C.C. ${Number(p.documento).toLocaleString('es-CO')}` : '—'}</Dato>
            {p.estado === 'activo'
              ? <Dato label="Antigüedad">{antiguedad(p)} · desde {fecha(p.ingreso)}</Dato>
              : <Dato label="Disponibilidad">{DISPONIBILIDAD.find((d) => d.id === p.disponibilidad)?.nombre}</Dato>}
            <Dato label="Puede trasladarse"><span className="fila"><Plane size={13} />{p.viaja ? 'Sí, a otras ciudades' : 'Solo área metropolitana'}</span></Dato>
            <Dato label={p.estado === 'activo' ? 'Fuente de ingreso' : 'Aspiración salarial'}>{p.estado === 'activo' ? p.fuente : p.aspiracion ? pesos(p.aspiracion) : '—'}</Dato>
          </div>
          <div className="seccion-t">Experiencia por tipo de obra</div>
          <div className="stack" style={{ gap: 10 }}>
            {p.experiencia.length === 0 && <span className="muted peq">Sin experiencia registrada.</span>}
            {p.experiencia.map((e) => (
              <div key={e.tipo}>
                <div className="fila-sb peq" style={{ marginBottom: 4 }}>
                  <span>{TIPOS_PROYECTO.find((t) => t.id === e.tipo)?.nombre}</span>
                  <span className="sec num">{e.anios} {e.anios === 1 ? 'año' : 'años'} · {e.proyectos} proyectos</span>
                </div>
                <Progreso valor={e.anios / Math.max(...p.experiencia.map((x) => x.anios), 1)} />
              </div>
            ))}
          </div>
          <div className="seccion-t">Habilidades del oficio</div>
          <div className="chips">
            {cargo.habilidades.map((h) => <span key={h} className={`chip ${p.habilidades.includes(h) ? 'on' : ''}`}>{h}</span>)}
          </div>
          <div className="aviso mt-16"><BadgeCheck />Autorización de tratamiento de datos personales (Ley 1581 de 2012) {p.consentimiento ? 'registrada' : 'pendiente'} el {fecha(p.fechaRegistro)}.</div>
        </>
      )}

      {tab === 'certificados' && (
        <div className="stack" style={{ gap: 10 }}>
          {[...new Set([...cargo.certificados, ...p.certificados.map((c) => c.tipo)])].map((tipo) => {
            const c = p.certificados.find((x) => x.tipo === tipo)
            const e = estadoCertificado(c)
            return (
              <div key={tipo} className="card" style={{ padding: 14 }}>
                <div className="fila-sb">
                  <div>
                    <div className="b">{CERTIFICADOS[tipo].nombre}</div>
                    <div className="xs muted mt-8" style={{ marginTop: 2 }}>
                      {c ? <>Emitido {fecha(c.emitido)}{c.vence ? ` · vence ${fecha(c.vence)} (${relativo(c.vence)})` : ' · sin vencimiento'}</> : 'Requerido para el cargo · no registrado'}
                    </div>
                    {CERTIFICADOS[tipo].nota && <div className="xs muted">{CERTIFICADOS[tipo].nota}</div>}
                  </div>
                  <div className="fila">
                    <EstadoCert persona={p} tipo={tipo} />
                    {rol === 'admin' && c && !c.verificado && e.id !== 'vencido' && <button className="btn sm" onClick={() => acciones.verificarCertificado(p.id, tipo)}>Verificar</button>}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {tab === 'formacion' && (
        <>
          <div className="fila-sb">
            <span className="sec">Ruta de formación de {cargo.nombre.toLowerCase()}</span>
            <b className="num">{cumpl.hechos}/{cumpl.total}</b>
          </div>
          <div className="mt-8"><Progreso valor={cumpl.pct} meta={0.9} tono={cumpl.pct < 0.6 ? 'ocre' : ''} /></div>
          <ul className="lista mt-12 card" style={{ boxShadow: 'none' }}>
            {cargo.cursos.map((cId) => {
              const f = cursoVigente(p, cId)
              const prox = db.sesiones.find((s) => s.cursoId === cId && s.asistentes === null && s.inscritos.includes(p.id))
              return (
                <li key={cId}>
                  {f ? <CheckCircle2 size={18} color="var(--verde-500)" /> : <Circle size={18} color="var(--borde)" />}
                  <div className="cuerpo">
                    <div className="titulo">{cursoPorId[cId].nombre}</div>
                    <div className="meta-l">{f ? `Completado ${fecha(f.fecha)}` : prox ? `Inscrito · ${fecha(prox.fecha)}` : 'Pendiente de programar'}</div>
                  </div>
                  <span className="xs muted">{cursoPorId[cId].horas} h</span>
                </li>
              )
            })}
          </ul>
        </>
      )}

      {tab === 'historial' && (
        <>
          <div className="seccion-t" style={{ marginTop: 0 }}>Obras con CZ</div>
          {p.historial.length === 0 && p.estado !== 'activo' && <Vacio titulo="Sin historial en CZ">Aún no ha trabajado con la empresa.</Vacio>}
          <ul className="timeline">
            {p.estado === 'activo' && <li><b>{obra?.nombre}</b> · actual desde {fecha(p.ingreso)}</li>}
            {p.historial.map((h, i) => (
              <li key={i}>
                <div className="fila-sb"><b>{obraPorId[h.obraId]?.nombre ?? 'Obra anterior'}</b><span className="fila"><Star size={13} color="var(--ocre)" />{num(h.calificacion)}</span></div>
                <div className="muted">{h.comentario}</div>
                <div className="mt-8" style={{ marginTop: 4 }}>{h.recontratable ? <Badge tono="good">Recontratable</Badge> : <Badge tono="critical" icono={ShieldAlert}>No recontratable</Badge>}</div>
              </li>
            ))}
          </ul>
          {desem.length > 0 && <>
            <div className="seccion-t">Conversaciones de desempeño</div>
            {desem.map((d) => (
              <div key={d.id} className="card" style={{ padding: 12, marginBottom: 8 }}>
                <div className="fila-sb peq"><b>{fecha(d.fecha)}</b><span>{num(d.calificacion)} / 5 {d.potencial && <Badge tono="info">Potencial de crecimiento</Badge>}</span></div>
                <div className="peq mt-8" style={{ marginTop: 4 }}><span className="muted">Fortaleza:</span> {d.fortalezas} · <span className="muted">Por aprender:</span> {d.pendientes}</div>
              </div>
            ))}
          </>}
          {(recos.length > 0 || retro.length > 0) && <>
            <div className="seccion-t">Reconocimientos y retroalimentación</div>
            <ul className="timeline">
              {recos.map((n) => <li key={n.id}><b>{n.estado === 'reconocido' ? 'Reconocido' : 'Nominado'} · {CRITERIOS_RECONOCIMIENTO.find((c) => c.id === n.criterio).nombre}</b><div className="muted">{n.motivo}</div></li>)}
              {retro.map((r) => <li key={r.id}><b>{r.tipo === 'positivo' ? 'Retroalimentación positiva' : 'Oportunidad de mejora'}</b> · {fecha(r.fecha)}<div className="muted">{r.texto}</div></li>)}
            </ul>
          </>}
        </>
      )}

      {tab === 'procesos' && (
        posts.length === 0 ? <Vacio titulo="Sin procesos">No ha participado en vacantes recientes.</Vacio> : (
          <ul className="lista card" style={{ boxShadow: 'none' }}>
            {posts.map((x) => {
              const v = db.vacantes.find((vv) => vv.id === x.vacanteId)
              return (
                <li key={x.id} className="click" onClick={() => { onClose(); ir(`talento/vacantes/${v.id}`) }}>
                  <div className="cuerpo">
                    <div className="titulo">{v.cantidad} × {cargoPorId[v.cargo].nombre}</div>
                    <div className="meta-l">{obraPorId[v.obraId].nombre} · desde {fecha(x.fecha)}</div>
                  </div>
                  <Badge tono={x.etapa === 'contratado' ? 'good' : x.etapa === 'descartado' ? 'critical' : 'info'}>{ETAPAS.find((e) => e.id === x.etapa).nombre}</Badge>
                </li>
              )
            })}
          </ul>
        )
      )}

      {retiro && <Retiro persona={p} onClose={() => setRetiro(false)} onDone={() => { setRetiro(false); onClose() }} />}
    </Modal>
  )
}

export function Retiro({ persona, onClose, onDone }) {
  const { acciones, obraPorId } = useStore()
  const [calificacion, setCal] = useState(4)
  const [recontratable, setRec] = useState(true)
  const [comentario, setCom] = useState('')
  return (
    <Modal titulo="Evaluación de cierre" sub={`${persona.nombre} · ${obraPorId[persona.obraId]?.nombre}`} onClose={onClose}
      pie={<>
        <button className="btn" onClick={onClose}>Cancelar</button>
        <button className="btn primario" disabled={!comentario.trim()} onClick={() => { acciones.retirar(persona.id, { calificacion, recontratable, comentario }); onDone() }}>Guardar y pasar al banco</button>
      </>}>
      <p className="sec peq" style={{ marginBottom: 16 }}>Al terminar la obra, el líder registra cómo trabajó la persona. Así CZ construye un historial de talento conocido para futuras contrataciones.</p>
      <div className="stack">
        <Campo label="Calificación general">
          <div className="escala">{[1, 2, 3, 4, 5].map((n) => <button key={n} className={calificacion === n ? 'on' : ''} onClick={() => setCal(n)}>{n}</button>)}</div>
        </Campo>
        <Campo label="¿Volvería a trabajar con CZ?">
          <div className="toggle-group">
            <button className={recontratable ? 'on' : ''} onClick={() => setRec(true)}>Sí, recontratable</button>
            <button className={!recontratable ? 'on' : ''} onClick={() => setRec(false)}>No recontratable</button>
          </div>
        </Campo>
        <Campo label="Actividades y comentario" ayuda="Qué hizo bien y qué debe mejorar. Será visible para Gestión Humana.">
          <textarea className="textarea" value={comentario} onChange={(e) => setCom(e.target.value)} placeholder="Ej.: Montaje de cerchas, cumplido y ordenado…" />
        </Campo>
      </div>
    </Modal>
  )
}
