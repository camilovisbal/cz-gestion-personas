import { useMemo, useState } from 'react'
import { GraduationCap, CalendarPlus, ShieldAlert, Users, CheckCircle2, Circle, MapPin, ClipboardCheck, UserCheck, Target } from 'lucide-react'
import { useStore } from '../store/Store.jsx'
import { useUi } from '../store/ui.js'
import { PageHead, Card, Badge, Kpi, Tabs, Modal, Campo, Progreso, Persona, Avatar, Vacio } from '../components/ui.jsx'
import { CARGOS, cargoPorId, CURSOS, cursoPorId } from '../data/catalogos.js'
import { alertasCertificados, cumplimientoPlan, cursoVigente } from '../lib/dominio.js'
import { enDias, fecha, relativo } from '../lib/fechas.js'
import { useRuta } from '../lib/router.js'

export default function Formacion() {
  const { db, rol, usuario, activos } = useStore()
  const { query } = useRuta()
  const obraLider = rol === 'lider' ? usuario.obraId : null
  const equipo = activos.filter((p) => !obraLider || p.obraId === obraLider)
  const [tab, setTab] = useState(query.tab ?? 'ruta')
  const cumpl = cumplimientoPlan(equipo)
  const alertas = alertasCertificados(equipo)
  const proximas = db.sesiones.filter((s) => s.asistentes === null && s.fecha >= enDias(0))
  const sinAsistencia = db.sesiones.filter((s) => s.asistentes === null && s.fecha < enDias(0))
  const mentorias = db.mentorias.filter((m) => equipo.some((p) => p.id === m.nuevoId))

  return (
    <>
      <PageHead modulo="Estrategia 2 · Formación que sirva en obra" titulo="Ruta de formación CZ"
        descripcion="Capacitar según los riesgos del trabajo y las necesidades de cada cargo. Control de participación, certificados e inducción con acompañamiento." />
      <div className="grid g-4" style={{ marginBottom: 16 }}>
        <Kpi etiqueta="Cumplimiento del plan" valor={Math.round(cumpl * 100)} unidad=" %" icono={Target} tono={cumpl < 0.9 ? 'ocre' : ''}
          pie={<div style={{ width: '100%' }}><Progreso valor={cumpl} meta={0.9} tono={cumpl < 0.9 ? 'ocre' : ''} /><div style={{ marginTop: 6 }}>Meta propuesta ≥ 90 %</div></div>} />
        <Kpi etiqueta="Capacitaciones programadas" valor={proximas.length} icono={CalendarPlus} pie={proximas[0] ? `Próxima: ${cursoPorId[proximas.sort((a, b) => (a.fecha > b.fecha ? 1 : -1))[0].cursoId].nombre} ${relativo(proximas[0].fecha)}` : 'Sin programar'} />
        <Kpi etiqueta="Certificados por atender" valor={alertas.filter((a) => a.estado.id !== 'pendiente').length} icono={ShieldAlert} tono="rojo" pie={`${alertas.filter((a) => a.estado.id === 'vencido').length} vencidos · ${alertas.filter((a) => a.estado.id === 'porVencer').length} vencen en 30 días`} />
        <Kpi etiqueta="Nuevos en acompañamiento" valor={mentorias.length} icono={UserCheck} pie={`${mentorias.filter((m) => !m.checklist.induccion).length} sin inducción completa`} />
      </div>

      <Tabs activo={tab} onChange={setTab} tabs={[
        { id: 'ruta', nombre: 'Matriz por oficio', icono: GraduationCap },
        { id: 'sesiones', nombre: 'Programación', icono: CalendarPlus, n: proximas.length + sinAsistencia.length },
        { id: 'certificados', nombre: 'Certificados', icono: ShieldAlert, n: alertas.length },
        { id: 'acompanamiento', nombre: 'Inducción y acompañamiento', icono: Users, n: mentorias.length },
      ]} />
      {tab === 'ruta' && <Matriz equipo={equipo} />}
      {tab === 'sesiones' && <Sesiones equipo={equipo} soloLectura={rol !== 'admin'} />}
      {tab === 'certificados' && <Certificados alertas={alertas} />}
      {tab === 'acompanamiento' && <Acompanamiento mentorias={mentorias} />}
    </>
  )
}

const CORTO_CURSO = { induccion: 'Inducción', alturas: 'Alturas', confinados: 'Confinados', soldaduraSegura: 'Soldadura segura', herramientas: 'Herramientas', liderazgo: 'Liderazgo', calidad: 'Calidad', primerosAux: 'Primeros aux.' }

function Matriz({ equipo }) {
  const cargos = CARGOS.filter((c) => equipo.some((p) => p.cargo === c.id))
  const porCargo = cargos.map((c) => {
    const ps = equipo.filter((p) => p.cargo === c.id)
    return { id: c.id, nombre: c.nombre, valor: cumplimientoPlan(ps), n: ps.length }
  })
  return (
    <div className="stack">
      <Card titulo="Necesidades por oficio" sub="Cada celda: personas del cargo con el curso vigente · los cursos con fondo blanco no aplican al cargo" flush>
        <div className="tabla-wrap">
          <table className="tabla">
            <thead><tr><th>Cargo</th>{CURSOS.map((c) => <th key={c.id} className="derecha" title={`${c.nombre} · ${c.horas} h`}>{CORTO_CURSO[c.id]}</th>)}</tr></thead>
            <tbody>
              {cargos.map((c) => {
                const ps = equipo.filter((p) => p.cargo === c.id)
                return (
                  <tr key={c.id}>
                    <td><b className="peq">{c.nombre}</b><div className="xs muted">{ps.length} personas</div></td>
                    {CURSOS.map((cu) => {
                      if (!c.cursos.includes(cu.id)) return <td key={cu.id} />
                      const ok = ps.filter((p) => cursoVigente(p, cu.id)).length
                      const r = ok / ps.length
                      const bg = r >= 0.9 ? 'var(--verde-100)' : r >= 0.6 ? 'var(--ocre-100)' : 'var(--rojo-100)'
                      const fg = r >= 0.9 ? 'var(--verde)' : r >= 0.6 ? '#8d5a17' : 'var(--rojo)'
                      return <td key={cu.id} className="derecha"><span className="num b" title={`${ok} de ${ps.length} con ${cu.nombre}`} style={{ display: 'inline-block', minWidth: 46, textAlign: 'center', padding: '3px 6px', borderRadius: 6, background: bg, color: fg, fontSize: 12 }}>{ok}/{ps.length}</span></td>
                    })}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <div className="card-pie"><div className="leyenda"><span><i style={{ background: 'var(--verde-100)' }} />≥ 90 %</span><span><i style={{ background: 'var(--ocre-100)' }} />60–89 %</span><span><i style={{ background: 'var(--rojo-100)' }} />&lt; 60 %</span></div><span>Alturas: reentrenamiento anual (Res. 4272 de 2021)</span></div>
      </Card>
      <Card titulo="Cumplimiento por cargo" sub="Meta ≥ 90 % · ordenado de menor a mayor">
        <div className="grid g-3" style={{ gap: '12px 28px' }}>
          {porCargo.sort((a, b) => a.valor - b.valor).map((c) => (
            <div key={c.id}>
              <div className="fila-sb peq" style={{ marginBottom: 5 }}><span>{c.nombre} <span className="muted">· {c.n}</span></span><b className="num">{Math.round(c.valor * 100)} %</b></div>
              <Progreso valor={c.valor} meta={0.9} tono={c.valor < 0.6 ? 'rojo' : c.valor < 0.9 ? 'ocre' : ''} />
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

function Sesiones({ equipo, soloLectura }) {
  const { db, personaPorId } = useStore()
  const [nueva, setNueva] = useState(false)
  const [asistencia, setAsistencia] = useState(null)
  const enEquipo = (s) => s.inscritos.some((id) => equipo.some((p) => p.id === id))
  const futuras = db.sesiones.filter((s) => s.asistentes === null && s.fecha >= enDias(0) && enEquipo(s)).sort((a, b) => (a.fecha > b.fecha ? 1 : -1))
  const pasadas = db.sesiones.filter((s) => (s.asistentes !== null || s.fecha < enDias(0)) && enEquipo(s)).sort((a, b) => (a.fecha < b.fecha ? 1 : -1))
  const Fila = ({ s }) => {
    const c = cursoPorId[s.cursoId]
    const pendiente = s.asistentes === null && s.fecha < enDias(0)
    return (
      <li>
        <div className="stack" style={{ gap: 0, width: 54, textAlign: 'center', flex: 'none' }}>
          <span className="xs muted" style={{ textTransform: 'uppercase' }}>{fecha(s.fecha).split(' ')[1]}</span>
          <b style={{ fontSize: 20, lineHeight: 1.1 }} className="num">{fecha(s.fecha).split(' ')[0]}</b>
        </div>
        <div className="cuerpo">
          <div className="titulo">{c.nombre} <Badge tono={c.tipo === 'Riesgo crítico' ? 'critical' : c.tipo === 'Desarrollo' ? 'info' : ''}>{c.tipo}</Badge></div>
          <div className="meta-l fila" style={{ gap: 5 }}><MapPin size={12} />{s.lugar} · {s.instructor} · {c.horas} h</div>
        </div>
        <div className="fila" style={{ gap: 0, paddingLeft: 6 }}>{s.inscritos.slice(0, 4).map((id) => <span key={id} style={{ marginLeft: -6, border: '2px solid #fff', borderRadius: '50%' }}><Avatar nombre={personaPorId[id].nombre} size="sm" /></span>)}</div>
        <span className="peq num sec" style={{ width: 90, textAlign: 'right' }}>{s.asistentes ? `${s.asistentes.length} asistieron` : `${s.inscritos.length}/${s.cupos} inscritos`}</span>
        {pendiente && !soloLectura && <button className="btn sm primario" onClick={() => setAsistencia(s.id)}><ClipboardCheck />Asistencia</button>}
        {!pendiente && s.asistentes && <Badge tono="good">Realizada</Badge>}
        {s.asistentes === null && !pendiente && <Badge tono="info">{relativo(s.fecha)}</Badge>}
      </li>
    )
  }
  return (
    <>
      <div className="grid g-2">
        <Card titulo="Próximas capacitaciones" accion={!soloLectura && <button className="btn sm primario" onClick={() => setNueva(true)}><CalendarPlus />Programar</button>} flush>
          {futuras.length === 0 && <Vacio titulo="Nada programado" />}
          <ul className="lista">{futuras.map((s) => <Fila key={s.id} s={s} />)}</ul>
        </Card>
        <Card titulo="Realizadas" sub="Registro de participación y evidencias" flush>
          <ul className="lista">{pasadas.map((s) => <Fila key={s.id} s={s} />)}</ul>
        </Card>
      </div>
      {nueva && <NuevaSesion onClose={() => setNueva(false)} />}
      {asistencia && <Asistencia id={asistencia} onClose={() => setAsistencia(null)} />}
    </>
  )
}

function NuevaSesion({ onClose }) {
  const { activos, acciones, db } = useStore()
  const [d, setD] = useState({ cursoId: 'alturas', fecha: enDias(10), lugar: 'Oficina central', instructor: 'Paola Escorcia (SST CZ)', cupos: 12 })
  const faltan = useMemo(() => activos.filter((p) => cargoPorId[p.cargo].cursos.includes(d.cursoId) && !cursoVigente(p, d.cursoId) && !db.sesiones.some((s) => s.cursoId === d.cursoId && s.asistentes === null && s.inscritos.includes(p.id))), [activos, d.cursoId, db.sesiones])
  const [sel, setSel] = useState(null)
  const inscritos = sel ?? faltan.slice(0, d.cupos).map((p) => p.id)
  return (
    <Modal ancho titulo="Programar capacitación" sub="El sistema sugiere a quienes les falta el curso según su cargo." onClose={onClose}
      pie={<><button className="btn" onClick={onClose}>Cancelar</button><button className="btn primario" disabled={!inscritos.length} onClick={() => { acciones.crearSesion({ ...d, cupos: Number(d.cupos), inscritos }); onClose() }}>Programar ({inscritos.length} inscritos)</button></>}>
      <div className="grid g-2" style={{ gap: 24 }}>
        <div className="stack">
          <Campo label="Curso"><select className="select" value={d.cursoId} onChange={(e) => { setD({ ...d, cursoId: e.target.value }); setSel(null) }}>{CURSOS.map((c) => <option key={c.id} value={c.id}>{c.nombre} · {c.horas} h</option>)}</select></Campo>
          <Campo label="Fecha"><input className="input" type="date" value={d.fecha} onChange={(e) => setD({ ...d, fecha: e.target.value })} /></Campo>
          <Campo label="Lugar"><select className="select" value={d.lugar} onChange={(e) => setD({ ...d, lugar: e.target.value })}>{['Oficina central', 'Centro de entrenamiento', ...db.obras.filter((o) => o.estado === 'activa').map((o) => o.nombre)].map((l) => <option key={l}>{l}</option>)}</select></Campo>
          <Campo label="Instructor"><select className="select" value={d.instructor} onChange={(e) => setD({ ...d, instructor: e.target.value })}>{['Paola Escorcia (SST CZ)', 'SENA Barranquilla', 'ARL Positiva', 'Centro de entrenamiento Alturas Caribe'].map((l) => <option key={l}>{l}</option>)}</select></Campo>
          <Campo label="Cupos"><input className="input num" type="number" min="1" value={d.cupos} onChange={(e) => { setD({ ...d, cupos: e.target.value }); setSel(null) }} /></Campo>
        </div>
        <div>
          <div className="lbl peq b sec" style={{ marginBottom: 8 }}>Personas a las que les falta ({faltan.length})</div>
          <div className="card" style={{ maxHeight: 340, overflowY: 'auto', boxShadow: 'none' }}>
            {faltan.length === 0 && <Vacio icono={CheckCircle2} titulo="Todos al día con este curso" />}
            <ul className="lista">
              {faltan.map((p) => (
                <li key={p.id} style={{ padding: '8px 12px' }}>
                  <label className="check" style={{ flex: 1 }}>
                    <input type="checkbox" checked={inscritos.includes(p.id)} onChange={() => setSel(inscritos.includes(p.id) ? inscritos.filter((x) => x !== p.id) : [...inscritos, p.id])} />
                    <span>{p.nombre}<div className="xs muted">{cargoPorId[p.cargo].nombre}</div></span>
                  </label>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </Modal>
  )
}

function Asistencia({ id, onClose }) {
  const { db, acciones, personaPorId } = useStore()
  const s = db.sesiones.find((x) => x.id === id)
  const [ok, setOk] = useState(s.inscritos)
  return (
    <Modal titulo={`Asistencia · ${cursoPorId[s.cursoId].nombre}`} sub={`${fecha(s.fecha)} · ${s.lugar}`} onClose={onClose}
      pie={<><button className="btn" onClick={onClose}>Cancelar</button><button className="btn primario" onClick={() => { acciones.registrarAsistencia(id, ok); onClose() }}>Guardar asistencia ({ok.length})</button></>}>
      <ul className="lista card" style={{ boxShadow: 'none' }}>
        {s.inscritos.map((pid) => (
          <li key={pid}><label className="check" style={{ flex: 1 }}><input type="checkbox" checked={ok.includes(pid)} onChange={() => setOk(ok.includes(pid) ? ok.filter((x) => x !== pid) : [...ok, pid])} /><span>{personaPorId[pid].nombre}</span></label></li>
        ))}
      </ul>
    </Modal>
  )
}

function Certificados({ alertas }) {
  const { acciones, obraPorId, db, rol } = useStore()
  const { verPersona } = useUi()
  const proxAlturas = db.sesiones.filter((s) => s.cursoId === 'alturas' && s.asistentes === null && s.fecha >= enDias(0)).sort((a, b) => (a.fecha > b.fecha ? 1 : -1))[0]
  return (
    <Card flush titulo="Certificados que requieren acción" sub="Vencidos, próximos a vencer (30 días) o pendientes de verificar el soporte">
      {alertas.length === 0 && <Vacio icono={CheckCircle2} titulo="Todo al día" />}
      <table className="tabla">
        <thead><tr><th>Trabajador</th><th>Certificado</th><th>Estado</th><th>Vence</th><th></th></tr></thead>
        <tbody>
          {alertas.map((a) => (
            <tr key={a.persona.id + a.tipo}>
              <td className="click" style={{ cursor: 'pointer' }} onClick={() => verPersona(a.persona.id)}><Persona persona={a.persona} detalle={`${cargoPorId[a.persona.cargo].nombre} · ${obraPorId[a.persona.obraId]?.nombre}`} /></td>
              <td className="peq">{a.nombre}</td>
              <td><Badge tono={a.estado.tono} punto>{a.estado.nombre}</Badge></td>
              <td className="peq muted">{a.cert?.vence ? `${fecha(a.cert.vence)} · ${relativo(a.cert.vence)}` : '—'}</td>
              <td className="derecha">
                {rol === 'admin' && a.estado.id === 'pendiente' && <button className="btn sm" onClick={() => acciones.verificarCertificado(a.persona.id, a.tipo)}>Verificar soporte</button>}
                {a.tipo === 'alturas' && a.estado.id !== 'pendiente' && proxAlturas && (proxAlturas.inscritos.includes(a.persona.id)
                  ? <Badge tono="info">Inscrito {fecha(proxAlturas.fecha)}</Badge>
                  : <span className="xs muted">Reentrenamiento: {fecha(proxAlturas.fecha)}</span>)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="card-pie"><span>Las alertas se generan con 30 días de anticipación</span><span>Fuente: soportes cargados en el perfil de cada persona</span></div>
    </Card>
  )
}

const PASOS = [
  { id: 'bienvenida', t: 'Bienvenida y presentación a la cuadrilla' },
  { id: 'epp', t: 'Entrega de EPP y dotación' },
  { id: 'induccion', t: 'Inducción CZ (4 h)' },
  { id: 'procedimientos', t: 'Procedimientos seguros del cargo' },
  { id: 'seguimiento30', t: 'Conversación de seguimiento a 30 días' },
]

function Acompanamiento({ mentorias }) {
  const { acciones, personaPorId, obraPorId } = useStore()
  const { verPersona } = useUi()
  if (!mentorias.length) return <Card><Vacio icono={UserCheck} titulo="No hay personas nuevas en acompañamiento" /></Card>
  return (
    <div className="grid g-3">
      {mentorias.map((m) => {
        const p = personaPorId[m.nuevoId]
        const mentor = personaPorId[m.mentorId]
        const hechos = PASOS.filter((x) => m.checklist[x.id]).length
        return (
          <Card key={m.id}>
            <div className="fila-sb" style={{ alignItems: 'flex-start' }}>
              <div style={{ cursor: 'pointer' }} onClick={() => verPersona(p.id)}><Persona persona={p} detalle={`${cargoPorId[p.cargo].nombre} · ingresó ${relativo(p.ingreso)}`} /></div>
              <span className="num b">{hechos}/5</span>
            </div>
            <div className="mt-12"><Progreso valor={hechos / 5} /></div>
            <div className="peq sec mt-12">{obraPorId[p.obraId]?.nombre}</div>
            {mentor && <div className="fila mt-8 peq"><Avatar nombre={mentor.nombre} size="sm" /><span><span className="muted">Acompaña:</span> {mentor.nombre}</span></div>}
            <div className="stack mt-12" style={{ gap: 6 }}>
              {PASOS.map((x) => (
                <button key={x.id} className="fila" style={{ border: 0, background: 'none', padding: '3px 0', cursor: 'pointer', textAlign: 'left', fontSize: 13, color: m.checklist[x.id] ? 'var(--tinta)' : 'var(--tinta-2)' }}
                  onClick={() => acciones.marcarMentoria(m.id, x.id)}>
                  {m.checklist[x.id] ? <CheckCircle2 size={17} color="var(--verde-500)" /> : <Circle size={17} color="var(--borde)" />}
                  <span style={{ textDecoration: m.checklist[x.id] ? 'none' : 'none' }}>{x.t}</span>
                </button>
              ))}
            </div>
          </Card>
        )
      })}
    </div>
  )
}
