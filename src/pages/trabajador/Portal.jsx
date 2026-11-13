import { useState } from 'react'
import { Gauge, MessageCircle, GraduationCap, Award, HeartPulse, ChevronLeft, CheckCircle2, Circle, Bell, QrCode, Smartphone, EyeOff, ShieldCheck, Send } from 'lucide-react'
import { useStore } from '../../store/Store.jsx'
import { Badge, Progreso, Campo, Isotipo, EstadoCert } from '../../components/ui.jsx'
import { TIPOS_BIENESTAR } from '../../components/Formularios.jsx'
import Qr from '../../components/Qr.jsx'
import { CATEGORIAS_CANAL, cargoPorId, CERTIFICADOS, CRITERIOS_RECONOCIMIENTO, cursoPorId, DIMENSIONES_CLIMA } from '../../data/catalogos.js'
import { cumplimientoPersona, cursoVigente } from '../../lib/dominio.js'
import { fecha, relativo } from '../../lib/fechas.js'

const ESCALA = ['Muy en desacuerdo', 'En desacuerdo', 'Neutral', 'De acuerdo', 'Muy de acuerdo']

export default function Portal() {
  const { db, usuario, obraPorId } = useStore()
  const p = usuario.persona
  const [vista, setVista] = useState('inicio')
  const abierto = db.pulsos.find((x) => x.estado === 'abierto')
  const respondio = abierto?.respuestas.some((r) => r.personaId === p.id)
  const titulos = { pulso: 'Pulso CZ', canal: 'Canal CZ', formacion: 'Mi formación', reconoce: 'Mis reconocimientos', bienestar: 'Bienestar' }

  return (
    <div className="grid" style={{ gridTemplateColumns: 'minmax(0, 1fr) 440px minmax(0, 1fr)', gap: 32, alignItems: 'start' }}>
      <div className="stack" style={{ paddingTop: 40 }}>
        <div className="etiqueta-modulo" style={{ alignSelf: 'flex-start' }}>Portal del trabajador</div>
        <h1 style={{ fontSize: 24, letterSpacing: '-0.02em' }}>Mi CZ, desde el celular</h1>
        <p className="sec">El trabajador entra escaneando el QR de su obra. No necesita instalar aplicaciones ni recordar contraseñas: se identifica con su documento.</p>
        <div className="stack peq" style={{ gap: 12, marginTop: 8 }}>
          <span className="fila" style={{ gap: 10 }}><span className="kpi-icono"><QrCode /></span>QR impreso en la entrada de cada obra</span>
          <span className="fila" style={{ gap: 10 }}><span className="kpi-icono"><Smartphone /></span>Funciona en cualquier celular con datos</span>
          <span className="fila" style={{ gap: 10 }}><span className="kpi-icono"><EyeOff /></span>Pulso y reportes pueden ser anónimos</span>
          <span className="fila" style={{ gap: 10 }}><span className="kpi-icono"><ShieldCheck /></span>Opción en papel para quien lo prefiera</span>
        </div>
      </div>

      <div className="telefono">
        <div className="telefono-pantalla">
          {vista !== 'inicio' && (
            <div className="fila" style={{ marginBottom: 14 }}>
              <button className="btn sm fantasma icono" onClick={() => setVista('inicio')} aria-label="Volver"><ChevronLeft /></button>
              <b style={{ fontSize: 16 }}>{titulos[vista]}</b>
            </div>
          )}
          {vista === 'inicio' && <Inicio p={p} setVista={setVista} respondio={respondio} abierto={abierto} />}
          {vista === 'pulso' && <PulsoMovil p={p} respondio={respondio} volver={() => setVista('inicio')} />}
          {vista === 'canal' && <CanalMovil p={p} />}
          {vista === 'formacion' && <FormacionMovil p={p} />}
          {vista === 'reconoce' && <ReconoceMovil p={p} />}
          {vista === 'bienestar' && <BienestarMovil p={p} volver={() => setVista('inicio')} />}
        </div>
      </div>

      <div className="stack" style={{ paddingTop: 40, alignItems: 'center' }}>
        <div className="card" style={{ padding: 20, textAlign: 'center', width: '100%', maxWidth: 260 }}>
          <Qr semilla={`portal-${p.obraId}`} size={150} />
          <div className="b mt-12">{obraPorId[p.obraId].nombre}</div>
          <div className="xs muted">Escanee para entrar a Mi CZ</div>
        </div>
      </div>
    </div>
  )
}

function Inicio({ p, setVista, respondio, abierto }) {
  const { db, obraPorId } = useStore()
  const c = cumplimientoPersona(p)
  const mios = db.canal.filter((s) => s.personaId === p.id)
  const recos = db.nominaciones.filter((n) => n.personaId === p.id && n.estado === 'reconocido')
  const prox = db.sesiones.find((s) => s.asistentes === null && s.inscritos.includes(p.id))
  const ACCESOS = [
    { id: 'pulso', t: 'Pulso CZ', d: respondio ? 'Ya respondiste' : '2 minutos', icono: Gauge },
    { id: 'canal', t: 'Canal CZ', d: mios.length === 1 ? '1 mensaje' : `${mios.length} mensajes`, icono: MessageCircle },
    { id: 'formacion', t: 'Mi formación', d: `${c.hechos} de ${c.total} cursos`, icono: GraduationCap },
    { id: 'reconoce', t: 'Reconocimientos', d: recos.length === 1 ? '1 recibido' : `${recos.length} recibidos`, icono: Award },
  ]
  return (
    <div className="stack" style={{ gap: 14 }}>
      <div className="fila-sb">
        <span className="fila" style={{ gap: 8 }}><Isotipo style={{ width: 20, height: 25 }} /><b style={{ color: 'var(--verde)' }}>Mi CZ</b></span>
        <Bell size={18} color="var(--tinta-2)" />
      </div>
      <div className="portal-hero">
        <span>Hola,</span>
        <h2>{p.nombre.split(' ')[0]} {p.nombre.split(' ')[1]}</h2>
        <div style={{ opacity: 0.85, fontSize: 13, marginTop: 4 }}>{cargoPorId[p.cargo].nombre} · {obraPorId[p.obraId].nombre}</div>
      </div>
      {!respondio && abierto && (
        <button className="card" onClick={() => setVista('pulso')} style={{ padding: 14, textAlign: 'left', cursor: 'pointer', border: '1px solid var(--verde-300)', background: 'var(--verde-50)' }}>
          <div className="fila-sb"><b>¿Cómo te sientes en CZ?</b><Badge tono="solido">Nuevo</Badge></div>
          <div className="peq sec mt-8" style={{ marginTop: 4 }}>Responde el Pulso CZ, es anónimo. Cierra {relativo(abierto.cierre)}.</div>
        </button>
      )}
      <div className="accesos">
        {ACCESOS.map((a) => (
          <button key={a.id} className="acceso" onClick={() => setVista(a.id)}><a.icono /><strong>{a.t}</strong><span>{a.d}</span></button>
        ))}
      </div>
      <button className="acceso" style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }} onClick={() => setVista('bienestar')}>
        <HeartPulse /><div><strong>¿Algo te molesta o te cansa?</strong><div className="xs muted">Repórtalo sin temor a SST</div></div>
      </button>
      {prox && (
        <div className="card" style={{ padding: 14 }}>
          <div className="xs muted b" style={{ textTransform: 'uppercase', letterSpacing: '.05em' }}>Próxima capacitación</div>
          <div className="b mt-8" style={{ marginTop: 4 }}>{cursoPorId[prox.cursoId].nombre}</div>
          <div className="peq sec">{fecha(prox.fecha)} · {prox.lugar}</div>
        </div>
      )}
    </div>
  )
}

function PulsoMovil({ p, respondio, volver }) {
  const { acciones, db } = useStore()
  const [r, setR] = useState({})
  const [nps, setNps] = useState(null)
  const [enviado, setEnviado] = useState(false)
  const completo = DIMENSIONES_CLIMA.every((d) => r[d.id]) && nps !== null
  if (enviado || respondio) {
    const hechos = db.canal.filter((s) => s.publicar).slice(0, 3)
    return (
      <div className="stack" style={{ gap: 14 }}>
        <div className="card" style={{ padding: 20, textAlign: 'center' }}>
          <CheckCircle2 size={36} color="var(--verde)" />
          <div className="b mt-8" style={{ fontSize: 16 }}>¡Gracias por responder!</div>
          <div className="peq sec mt-8">Tu respuesta es anónima. Los resultados se comparten en la charla semanal.</div>
        </div>
        <div className="b peq">Lo que hicimos con lo que nos dijeron</div>
        {hechos.map((s) => <div key={s.id} className="card" style={{ padding: 12 }}><div className="xs muted">“{s.texto}”</div><div className="peq b mt-8" style={{ marginTop: 4, color: 'var(--verde)' }}>{s.accion}</div></div>)}
        <button className="btn" onClick={volver}>Volver al inicio</button>
      </div>
    )
  }
  return (
    <div className="stack" style={{ gap: 16 }}>
      <div className="peq sec">6 preguntas · responde de 1 (muy en desacuerdo) a 5 (muy de acuerdo).</div>
      {DIMENSIONES_CLIMA.map((d, i) => (
        <div key={d.id}>
          <div className="peq b" style={{ marginBottom: 8 }}>{i + 1}. {d.pregunta}</div>
          <div className="escala">{[1, 2, 3, 4, 5].map((n) => <button key={n} title={ESCALA[n - 1]} className={r[d.id] === n ? 'on' : ''} onClick={() => setR((s) => ({ ...s, [d.id]: n }))}>{n}</button>)}</div>
        </div>
      ))}
      <div>
        <div className="peq b" style={{ marginBottom: 8 }}>7. ¿Qué tanto recomendarías CZ a un amigo como lugar para trabajar? (0 a 10)</div>
        <div className="escala" style={{ gap: 3 }}>{Array.from({ length: 11 }, (_, n) => <button key={n} style={{ height: 34, fontSize: 12 }} className={nps === n ? 'on' : ''} onClick={() => setNps(n)}>{n}</button>)}</div>
      </div>
      <button className="btn primario" style={{ height: 42 }} disabled={!completo} onClick={() => { acciones.responderPulso({ personaId: p.id, obraId: p.obraId, dims: r, recomendaria: nps }); setEnviado(true) }}>Enviar respuesta anónima</button>
    </div>
  )
}

function CanalMovil({ p }) {
  const { db, acciones } = useStore()
  const [d, setD] = useState({ categoria: 'Herramientas y equipos', texto: '', anonimo: false })
  const mios = db.canal.filter((s) => s.personaId === p.id)
  return (
    <div className="stack" style={{ gap: 14 }}>
      <div className="card" style={{ padding: 14 }}>
        <Campo label="Tema"><select className="select" value={d.categoria} onChange={(e) => setD({ ...d, categoria: e.target.value })}>{CATEGORIAS_CANAL.map((c) => <option key={c}>{c}</option>)}</select></Campo>
        <div className="mt-12"><textarea className="textarea" rows={3} placeholder="Escribe tu sugerencia o inquietud…" value={d.texto} onChange={(e) => setD({ ...d, texto: e.target.value })} /></div>
        <div className="fila-sb mt-12">
          <label className="check peq"><input type="checkbox" checked={d.anonimo} onChange={(e) => setD({ ...d, anonimo: e.target.checked })} />Anónimo</label>
          <button className="btn primario sm" disabled={d.texto.length < 8} onClick={() => { acciones.crearSugerencia({ ...d, obraId: p.obraId, personaId: d.anonimo ? null : p.id }); setD({ ...d, texto: '' }) }}><Send />Enviar</button>
        </div>
        <div className="xs muted mt-8">CZ responde en máximo 15 días.</div>
      </div>
      <div className="b peq">Mis mensajes</div>
      {mios.length === 0 && <div className="peq muted">Aún no has enviado mensajes con tu nombre.</div>}
      {mios.map((s) => (
        <div key={s.id} className="card" style={{ padding: 12 }}>
          <div className="fila-sb"><span className="xs muted">{s.categoria} · {fecha(s.fecha)}</span><Badge tono={s.estado === 'respondida' ? 'good' : 'warning'}>{s.estado === 'respondida' ? 'Respondida' : 'En proceso'}</Badge></div>
          <div className="peq mt-8" style={{ marginTop: 4 }}>{s.texto}</div>
          {s.respuesta && <div className="peq mt-8" style={{ marginTop: 6, paddingLeft: 10, borderLeft: '2px solid var(--verde-300)' }}><b>CZ:</b> {s.respuesta}</div>}
        </div>
      ))}
    </div>
  )
}

function FormacionMovil({ p }) {
  const { db } = useStore()
  const c = cumplimientoPersona(p)
  return (
    <div className="stack" style={{ gap: 14 }}>
      <div className="card" style={{ padding: 14 }}>
        <div className="fila-sb"><b>Mi ruta de {cargoPorId[p.cargo].nombre.toLowerCase()}</b><span className="num b">{c.hechos}/{c.total}</span></div>
        <div className="mt-8"><Progreso valor={c.pct} /></div>
      </div>
      <div className="card" style={{ padding: '4px 0' }}>
        <ul className="lista">
          {cargoPorId[p.cargo].cursos.map((id) => {
            const f = cursoVigente(p, id)
            const prox = db.sesiones.find((s) => s.cursoId === id && s.asistentes === null && s.inscritos.includes(p.id))
            return (
              <li key={id} style={{ padding: '10px 14px' }}>
                {f ? <CheckCircle2 size={18} color="var(--verde-500)" /> : <Circle size={18} color="var(--borde)" />}
                <div className="cuerpo"><div className="titulo">{cursoPorId[id].nombre}</div><div className="meta-l">{f ? `Hecho ${fecha(f.fecha)}` : prox ? `Inscrito · ${fecha(prox.fecha)}` : 'Pendiente'}</div></div>
              </li>
            )
          })}
        </ul>
      </div>
      <div className="b peq">Mis certificados</div>
      {p.certificados.map((ct) => (
        <div key={ct.tipo} className="card fila-sb" style={{ padding: 12 }}>
          <span className="peq">{CERTIFICADOS[ct.tipo].nombre}</span>
          <EstadoCert persona={p} tipo={ct.tipo} />
        </div>
      ))}
    </div>
  )
}

function ReconoceMovil({ p }) {
  const { db, personaPorId } = useStore()
  const recos = db.nominaciones.filter((n) => n.personaId === p.id)
  const retro = db.retro.filter((r) => r.personaId === p.id && r.tipo === 'positivo')
  return (
    <div className="stack" style={{ gap: 12 }}>
      {recos.length === 0 && retro.length === 0 && <div className="peq muted">Aún no tienes reconocimientos. ¡Sigue así!</div>}
      {recos.map((n) => (
        <div key={n.id} className="card reco">
          <div className="criterio"><Award />{CRITERIOS_RECONOCIMIENTO.find((c) => c.id === n.criterio).nombre} · {n.estado === 'reconocido' ? 'Reconocido' : 'Nominado'}</div>
          <div className="peq">“{n.motivo}”</div>
          <div className="xs muted">Por {personaPorId[n.nominadoPor]?.nombre}</div>
        </div>
      ))}
      {retro.map((r) => (
        <div key={r.id} className="card" style={{ padding: 12 }}>
          <div className="xs muted">Mensaje de {personaPorId[r.liderId]?.nombre} · {fecha(r.fecha)}</div>
          <div className="peq mt-8" style={{ marginTop: 4 }}>{r.texto}</div>
        </div>
      ))}
      <div className="card" style={{ padding: 12, background: 'var(--verde-50)', boxShadow: 'none' }}>
        <div className="b peq">¿Cómo se reconoce en CZ?</div>
        <div className="xs sec mt-8">{CRITERIOS_RECONOCIMIENTO.map((c) => c.nombre).join(' · ')}. Los criterios son públicos y cualquier cargo puede ser nominado.</div>
      </div>
    </div>
  )
}

function BienestarMovil({ p, volver }) {
  const { acciones } = useStore()
  const [d, setD] = useState({ tipo: 'Carga de trabajo', descripcion: '', anonimo: true })
  const [ok, setOk] = useState(false)
  if (ok) return (
    <div className="card" style={{ padding: 20, textAlign: 'center' }}>
      <CheckCircle2 size={36} color="var(--verde)" />
      <div className="b mt-8">Reporte enviado</div>
      <div className="peq sec mt-8">SST lo revisará y, si lo necesitas, te orientará.</div>
      <button className="btn mt-16" onClick={volver}>Volver</button>
    </div>
  )
  return (
    <div className="stack" style={{ gap: 14 }}>
      <div className="peq sec">Cuéntanos qué pasa. Nadie será sancionado por reportar.</div>
      <div className="toggle-group">{TIPOS_BIENESTAR.map((t) => <button key={t} className={d.tipo === t ? 'on' : ''} onClick={() => setD({ ...d, tipo: t })}>{t}</button>)}</div>
      <textarea className="textarea" rows={4} value={d.descripcion} onChange={(e) => setD({ ...d, descripcion: e.target.value })} placeholder="Describe brevemente…" />
      <label className="check peq"><input type="checkbox" checked={d.anonimo} onChange={(e) => setD({ ...d, anonimo: e.target.checked })} />Enviar de forma anónima</label>
      <button className="btn primario" style={{ height: 42 }} disabled={d.descripcion.length < 5} onClick={() => { acciones.reportarBienestar({ ...d, obraId: p.obraId, personaId: d.anonimo ? null : p.id }); setOk(true) }}>Enviar a SST</button>
    </div>
  )
}
