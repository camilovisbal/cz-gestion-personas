import { useMemo, useState } from 'react'
import { MessageCircle, Plus, Users, Gauge, HeartHandshake, Clock, CheckCircle2, Megaphone, CalendarCheck, Printer, Lock, EyeOff } from 'lucide-react'
import { useStore } from '../store/Store.jsx'
import { PageHead, Card, Badge, Kpi, Tabs, Modal, Campo, Segmentado, Vacio, Progreso } from '../components/ui.jsx'
import { Bala, LeyendaBala, Lineas } from '../components/charts.jsx'
import { CharlaForm, SugerenciaForm } from '../components/Formularios.jsx'
import Qr from '../components/Qr.jsx'
import { DIMENSIONES_CLIMA } from '../data/catalogos.js'
import { agregarPulso, deltaDec, num, signo } from '../lib/dominio.js'
import { diasHasta, fecha, fechaCorta, relativo } from '../lib/fechas.js'
import { useRuta } from '../lib/router.js'

export const METAS_CLIMA = { compromiso: 4.2, seguridad: 4.0, comunicacion: 3.8, formacion: 3.7, reconocimiento: 3.5, salud: 3.8 }
const ESTADOS = { recibida: { t: 'Recibida', tono: '' }, en_revision: { t: 'En revisión', tono: 'warning' }, respondida: { t: 'Respondida', tono: 'good' } }

export default function Escucha() {
  const { db, rol, usuario, obraPorId, activos } = useStore()
  const { query } = useRuta()
  const obraLider = rol === 'lider' ? usuario.obraId : null
  const [tab, setTab] = useState(query.tab ?? 'pulso')
  const canal = db.canal.filter((s) => !obraLider || s.obraId === obraLider)
  const charlas = db.charlas.filter((c) => !obraLider || c.obraId === obraLider)
  const publicadas = db.canal.filter((s) => s.publicar)

  return (
    <>
      <PageHead modulo="Estrategia 1 · Escuchar" titulo={obraLider ? `Escuchar a la cuadrilla · ${obraPorId[obraLider].nombre}` : 'Pulso CZ y Canal CZ'}
        descripcion="Encuesta corta cada tres meses por QR o en papel, canal de sugerencias con fecha de respuesta y espacio semanal de 10 minutos con la cuadrilla." />
      <Tabs activo={tab} onChange={setTab} tabs={[
        { id: 'pulso', nombre: 'Pulso CZ', icono: Gauge },
        { id: 'canal', nombre: 'Canal CZ', icono: MessageCircle, n: canal.filter((s) => s.estado !== 'respondida').length },
        { id: 'charlas', nombre: 'Charlas semanales', icono: CalendarCheck, n: charlas.length },
        { id: 'mural', nombre: 'Qué nos dijeron y qué hicimos', icono: Megaphone, n: publicadas.length },
      ]} />
      {tab === 'pulso' && <Pulso obraLider={obraLider} />}
      {tab === 'canal' && <Canal lista={canal} obraLider={obraLider} />}
      {tab === 'charlas' && <Charlas lista={charlas} obraLider={obraLider} activos={activos} />}
      {tab === 'mural' && <Mural lista={publicadas} />}
    </>
  )
}

function Pulso({ obraLider }) {
  const { db, activos } = useStore()
  const abierto = db.pulsos.find((p) => p.estado === 'abierto')
  const filtro = obraLider ? (r) => r.obraId === obraLider : () => true
  const actual = agregarPulso(abierto, filtro)
  const base = agregarPulso(db.pulsos[0])
  const rondas = db.pulsos.map((p) => agregarPulso(p))
  const universo = activos.filter((p) => !obraLider || p.obraId === obraLider).length
  const obras = db.obras.filter((o) => ['activa', 'oficina'].includes(o.estado) && (!obraLider || o.id === obraLider))
  const porObra = obras.map((o) => ({ o, a: agregarPulso(abierto, (r) => r.obraId === o.id) }))

  return (
    <>
      <div className="grid g-4">
        <Kpi etiqueta="Participación" valor={actual.n} unidad={` / ${universo}`} icono={Users} pie={<div style={{ width: '100%' }}><Progreso valor={actual.n / universo} /><div style={{ marginTop: 6 }}>Cierra {relativo(abierto.cierre)} · meta ≥ 70 %</div></div>} />
        <Kpi etiqueta="Índice de clima" valor={num(actual.indice)} unidad=" / 5" icono={Gauge} pie={<><span className={`delta ${actual.indice >= base.indice ? 'up' : 'down'}`}>{deltaDec(actual.indice - base.indice)}</span> vs. línea base {num(base.indice)} · meta ≥ 4,0</>} />
        <Kpi etiqueta="eNPS · recomendaría CZ" valor={actual.enps !== null ? signo(actual.enps) : '—'} icono={HeartHandshake} pie={`Línea base +${base.enps} · meta ≥ +30`} />
        <Kpi etiqueta="Salud y carga de trabajo" valor={num(actual.dims.salud)} unidad=" / 5" icono={Clock} tono={actual.dims.salud < 3.5 ? 'rojo' : ''} pie={`Línea base ${num(base.dims.salud)} · meta ≥ 3,8`} />
      </div>

      <div className="grid g-21 mt-16">
        <Card titulo={`${abierto.nombre} · resultados parciales`} sub={`Abierta del ${fechaCorta(abierto.fecha)} al ${fechaCorta(abierto.cierre)} · respuestas confidenciales, se muestran solo promedios`} accion={<LeyendaBala />}>
          {DIMENSIONES_CLIMA.map((d) => {
            const v = actual.dims[d.id]
            const meta = METAS_CLIMA[d.id]
            return <Bala key={d.id} etiqueta={d.nombre} valor={v ?? 0} inicial={base.dims[d.id]} meta={meta} formato={(x) => num(x)} tono={v < base.dims[d.id] - 0.05 ? 'critical' : v < meta - 0.05 ? 'warning' : undefined} />
          })}
          <div className="aviso ocre mt-16"><Clock /><span>La dimensión <b>Salud y carga</b> es la más baja en obras en cierre. En Edificio Altos del Prado se perciben jornadas extensas: se cruzó con el módulo de Bienestar.</span></div>
        </Card>
        <div className="stack">
          <Card titulo="Encuesta por QR o en papel" sub="5 preguntas · 2 minutos · anónima">
            <div className="fila" style={{ gap: 16, alignItems: 'flex-start' }}>
              <Qr semilla={abierto.id} />
              <div className="stack peq" style={{ gap: 8 }}>
                <span className="sec">Se publica en la entrada de cada obra y en la charla semanal.</span>
                <span className="fila" style={{ gap: 6 }}><EyeOff size={14} color="var(--verde)" />No se muestra quién responde</span>
                <span className="fila" style={{ gap: 6 }}><Lock size={14} color="var(--verde)" />Resultados por obra desde 5 respuestas</span>
                <button className="btn sm" style={{ alignSelf: 'flex-start' }} onClick={() => window.print()}><Printer />Imprimir afiche</button>
              </div>
            </div>
          </Card>
          <Card titulo="Evolución del índice de clima" sub="Línea base y mediciones trimestrales">
            <Lineas alto={170} min={2.5} max={5} formato={(v) => num(v)} etiquetas={rondas.map((r, i) => (i === 0 ? 'Línea base' : r.nombre.replace('Pulso CZ · ', '')))}
              meta={{ valor: 4, etiqueta: 'Meta 4,0' }}
              series={[
                { id: 'indice', nombre: 'Índice general', color: 'var(--verde)', valores: rondas.map((r) => r.indice) },
                { id: 'reco', nombre: 'Reconocimiento', color: '#8d5a17', valores: rondas.map((r) => r.dims.reconocimiento), punteada: true },
              ]} />
            <div className="leyenda mt-8"><span><i style={{ background: 'var(--verde)' }} />Índice general</span><span><i style={{ background: '#8d5a17' }} />Reconocimiento</span></div>
          </Card>
        </div>
      </div>

      <Card titulo="Resultados por obra" sub="Medición en curso · se ocultan grupos con menos de 5 respuestas para proteger la confidencialidad" className="mt-16" flush>
        <div className="tabla-wrap">
          <table className="tabla">
            <thead><tr><th>Obra</th><th>Respuestas</th>{DIMENSIONES_CLIMA.map((d) => <th key={d.id} className="derecha">{d.nombre.split(' ')[0]}</th>)}<th className="derecha">eNPS</th></tr></thead>
            <tbody>
              {porObra.map(({ o, a }) => (
                <tr key={o.id}>
                  <td className="b">{o.nombre}</td>
                  <td className="num">{a.n}</td>
                  {a.n < 5
                    ? <td colSpan={DIMENSIONES_CLIMA.length + 1} className="muted peq">Menos de 5 respuestas: resultado agrupado con el total de la empresa</td>
                    : <>
                      {DIMENSIONES_CLIMA.map((d) => {
                        const v = a.dims[d.id]
                        const tono = v < 3 ? 'critical' : v < METAS_CLIMA[d.id] ? 'warning' : 'good'
                        return <td key={d.id} className="derecha"><span className={`badge ${tono}`} style={{ minWidth: 44, justifyContent: 'center' }}>{num(v)}</span></td>
                      })}
                      <td className="derecha num b">{signo(a.enps)}</td>
                    </>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="card-pie"><span>Verde: cumple la meta · ocre: por debajo de la meta · rojo: menor a 3,0</span><span>Escala de 1 a 5</span></div>
      </Card>
    </>
  )
}

function Canal({ lista, obraLider }) {
  const { obraPorId, personaPorId } = useStore()
  const [filtro, setFiltro] = useState('pendientes')
  const [sel, setSel] = useState(null)
  const [nuevo, setNuevo] = useState(false)
  const vista = lista.filter((s) => (filtro === 'pendientes' ? s.estado !== 'respondida' : filtro === 'respondidas' ? s.estado === 'respondida' : true))
  const respondidas = lista.filter((s) => s.estado === 'respondida')
  const enPlazo = respondidas.length ? respondidas.length / lista.filter((s) => s.estado === 'respondida' || diasHasta(s.fechaLimite) < 0).length : 1
  return (
    <>
      <div className="grid g-4" style={{ marginBottom: 16 }}>
        <Kpi etiqueta="Mensajes recibidos" valor={lista.length} icono={MessageCircle} pie="Desde la activación del canal" />
        <Kpi etiqueta="Sin responder" valor={lista.filter((s) => s.estado !== 'respondida').length} icono={Clock} tono="ocre" pie={`${lista.filter((s) => s.estado !== 'respondida' && diasHasta(s.fechaLimite) <= 3).length} vencen en 3 días o menos`} />
        <Kpi etiqueta="Respondidos en plazo" valor={Math.round(enPlazo * 100)} unidad=" %" icono={CheckCircle2} pie="Compromiso: ≤ 15 días" />
        <Kpi etiqueta="Anónimos" valor={lista.filter((s) => s.anonimo).length} icono={EyeOff} pie="Se respeta el anonimato" />
      </div>
      <Card flush titulo="Bandeja del Canal CZ" sub="Sugerencias e inquietudes con responsable y fecha de respuesta"
        accion={<div className="fila"><Segmentado valor={filtro} onChange={setFiltro} opciones={[{ id: 'pendientes', nombre: 'Pendientes' }, { id: 'respondidas', nombre: 'Respondidas' }, { id: 'todas', nombre: 'Todas' }]} /><button className="btn sm primario" onClick={() => setNuevo(true)}><Plus />Registrar</button></div>}>
        {vista.length === 0 && <Vacio titulo="Nada pendiente">Todas las inquietudes tienen respuesta.</Vacio>}
        <ul className="lista">
          {vista.map((s) => {
            const d = diasHasta(s.fechaLimite)
            return (
              <li key={s.id} className="click" onClick={() => setSel(s.id)} style={{ alignItems: 'flex-start' }}>
                <span className={`icono-alerta ${s.categoria === 'Bienestar' || s.categoria === 'Seguridad' ? 'warning' : 'info'}`}><MessageCircle /></span>
                <div className="cuerpo">
                  <div className="titulo">{s.texto}</div>
                  <div className="meta-l">{s.categoria} · {obraPorId[s.obraId].nombre} · {s.anonimo ? 'Anónimo' : personaPorId[s.personaId]?.nombre ?? 'Registrado en charla'} · {fecha(s.fecha)} · Responsable: {s.responsable}</div>
                  {s.respuesta && <div className="peq mt-8" style={{ marginTop: 6, paddingLeft: 10, borderLeft: '2px solid var(--verde-300)' }}><b>Respuesta:</b> {s.respuesta}{s.accion && <> · <b>Acción:</b> {s.accion}</>}</div>}
                </div>
                <div className="stack" style={{ gap: 6, alignItems: 'flex-end' }}>
                  <Badge tono={ESTADOS[s.estado].tono}>{ESTADOS[s.estado].t}</Badge>
                  {s.estado !== 'respondida' && <span className="xs" style={{ color: d <= 3 ? 'var(--rojo)' : 'var(--tinta-3)', fontWeight: d <= 3 ? 600 : 400 }}>{d < 0 ? `Vencida hace ${-d} d` : `Responder ${relativo(s.fechaLimite)}`}</span>}
                </div>
              </li>
            )
          })}
        </ul>
      </Card>
      {sel && <Responder id={sel} onClose={() => setSel(null)} />}
      {nuevo && <SugerenciaForm obraId={obraLider} onClose={() => setNuevo(false)} />}
    </>
  )
}

function Responder({ id, onClose }) {
  const { db, acciones, obraPorId } = useStore()
  const s = db.canal.find((x) => x.id === id)
  const [d, setD] = useState({ estado: s.estado === 'recibida' ? 'en_revision' : s.estado, responsable: s.responsable, respuesta: s.respuesta ?? '', accion: s.accion ?? '', publicar: s.publicar })
  return (
    <Modal titulo="Dar respuesta" sub={`${s.categoria} · ${obraPorId[s.obraId].nombre} · recibido ${fecha(s.fecha)}`} onClose={onClose}
      pie={<><button className="btn" onClick={onClose}>Cancelar</button>
        <button className="btn" onClick={() => { acciones.responderSugerencia(id, { ...d, estado: 'en_revision' }); onClose() }}>Guardar en revisión</button>
        <button className="btn primario" disabled={!d.respuesta} onClick={() => { acciones.responderSugerencia(id, { ...d, estado: 'respondida' }); onClose() }}>Marcar como respondida</button></>}>
      <div className="card" style={{ padding: 14, background: 'var(--fondo)', boxShadow: 'none', marginBottom: 16 }}>“{s.texto}”</div>
      <div className="stack">
        <Campo label="Responsable">
          <div className="toggle-group">{['Gestión Humana', 'SST', 'Líder de obra', 'Administración', 'Almacén', 'Gerencia'].map((r) => <button key={r} className={d.responsable === r ? 'on' : ''} onClick={() => setD({ ...d, responsable: r })}>{r}</button>)}</div>
        </Campo>
        <Campo label="Respuesta a la persona o cuadrilla"><textarea className="textarea" value={d.respuesta} onChange={(e) => setD({ ...d, respuesta: e.target.value })} /></Campo>
        <Campo label="Acción tomada" ayuda="Lo que cambió en la obra o en la empresa."><input className="input" value={d.accion} onChange={(e) => setD({ ...d, accion: e.target.value })} /></Campo>
        <label className="check"><input type="checkbox" checked={d.publicar} onChange={(e) => setD({ ...d, publicar: e.target.checked })} /><span>Publicar en «Qué nos dijeron y qué hicimos» (se lee en la charla semanal)</span></label>
      </div>
    </Modal>
  )
}

function Charlas({ lista, obraLider, activos }) {
  const { db, obraPorId, personaPorId } = useStore()
  const [form, setForm] = useState(false)
  const obras = db.obras.filter((o) => o.estado === 'activa' && (!obraLider || o.id === obraLider))
  const cobertura = useMemo(() => obras.map((o) => {
    const semanas = [0, 1, 2, 3, 4, 5].map((w) => lista.some((c) => c.obraId === o.id && diasHasta(c.fecha) <= -w * 7 && diasHasta(c.fecha) > -(w + 1) * 7))
    const inicio = diasHasta(o.inicio)
    const aplican = semanas.map((_, w) => inicio <= -w * 7)
    return { o, semanas, aplican }
  }), [obras, lista])
  return (
    <>
      <div className="grid g-12">
        <Card titulo="Cobertura de las últimas 6 semanas" sub="Una charla de 10 minutos por semana y por obra">
          <div className="stack" style={{ gap: 14 }}>
            {cobertura.map(({ o, semanas, aplican }) => (
              <div key={o.id}>
                <div className="fila-sb peq" style={{ marginBottom: 6 }}><b className="trunc">{o.nombre}</b><span className="num sec">{semanas.filter(Boolean).length}/{aplican.filter(Boolean).length}</span></div>
                <div className="fila" style={{ gap: 4 }}>
                  {[...semanas].reverse().map((ok, i) => {
                    const ap = [...aplican].reverse()[i]
                    return <span key={i} title={ap ? (ok ? 'Con charla' : 'Sin charla') : 'Obra no iniciada'} style={{ flex: 1, height: 22, borderRadius: 5, background: !ap ? 'var(--gris-100)' : ok ? 'var(--verde)' : 'var(--ocre-100)', border: ap && !ok ? '1px dashed var(--ocre)' : 'none' }} />
                  })}
                </div>
              </div>
            ))}
            <div className="leyenda"><span><i style={{ background: 'var(--verde)' }} />Con charla</span><span><i style={{ background: 'var(--ocre-100)', border: '1px dashed var(--ocre)' }} />Sin charla</span><span><i style={{ background: 'var(--gris-100)' }} />No aplica</span></div>
          </div>
        </Card>
        <Card titulo="Registro de charlas" sub={`${lista.length} charlas registradas`} accion={<button className="btn sm primario" onClick={() => setForm(true)}><Plus />Registrar charla</button>} flush>
          <table className="tabla">
            <thead><tr><th>Fecha</th><th>Obra</th><th>Tema</th><th>Asistencia</th><th>Inquietudes</th></tr></thead>
            <tbody>
              {lista.sort((a, b) => (a.fecha < b.fecha ? 1 : -1)).slice(0, 12).map((c) => {
                const total = activos.filter((p) => p.obraId === c.obraId).length
                return (
                  <tr key={c.id}>
                    <td className="peq muted">{fecha(c.fecha)}</td>
                    <td className="peq">{obraPorId[c.obraId].nombre}<div className="xs muted">{personaPorId[c.liderId]?.nombre}</div></td>
                    <td className="peq">{c.tema}</td>
                    <td className="num peq">{c.asistentes}/{total}</td>
                    <td className="peq">{c.inquietudes === 'Sin inquietudes nuevas' ? <span className="muted">—</span> : c.inquietudes}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </Card>
      </div>
      {form && <CharlaForm obraId={obraLider} onClose={() => setForm(false)} />}
    </>
  )
}

function Mural({ lista }) {
  const { obraPorId } = useStore()
  return (
    <>
      <div className="aviso" style={{ marginBottom: 16 }}><Megaphone /><span>Este mural se socializa en las charlas semanales e impreso en cada obra: muestra que escuchar sí produce cambios.</span></div>
      <div className="grid g-3">
        {lista.map((s) => (
          <div key={s.id} className="card reco">
            <div className="criterio"><MessageCircle />{s.categoria} · {obraPorId[s.obraId].nombre}</div>
            <div>
              <div className="xs muted b" style={{ textTransform: 'uppercase', letterSpacing: '.04em' }}>Nos dijeron</div>
              <div className="mt-8" style={{ marginTop: 4 }}>“{s.texto}”</div>
            </div>
            <div>
              <div className="xs b" style={{ textTransform: 'uppercase', letterSpacing: '.04em', color: 'var(--verde)' }}>Lo que hicimos</div>
              <div className="mt-8 b" style={{ marginTop: 4 }}>{s.accion ?? s.respuesta}</div>
            </div>
            <div className="xs muted" style={{ marginTop: 'auto' }}>{s.responsable} · {fecha(s.fecha)}</div>
          </div>
        ))}
      </div>
    </>
  )
}
