import { useState } from 'react'
import { Clock, Coffee, HeartPulse, AlertTriangle, ShieldCheck, Plus, Heart, Send, CheckCircle2, Users } from 'lucide-react'
import { useStore } from '../store/Store.jsx'
import { PageHead, Card, Badge, Kpi, Modal, Campo, Segmentado, Vacio, Progreso } from '../components/ui.jsx'
import { Lineas } from '../components/charts.jsx'
import { ReporteBienestarForm } from '../components/Formularios.jsx'
import { agregarPulso, num } from '../lib/dominio.js'
import { diasHasta, fecha, fechaCorta } from '../lib/fechas.js'

// Paleta categórica validada (claridad, croma y separación para daltonismo).
const COLORES_OBRA = { o1: '#1e8a4c', o2: '#3478c0', o3: '#c47a26' }
export const UMBRAL_HORAS = 52

export default function Bienestar() {
  const { db, rol, usuario, acciones, obraPorId, personaPorId } = useStore()
  const obraLider = rol === 'lider' ? usuario.obraId : null
  const obras = db.obras.filter((o) => o.estado === 'activa' && (!obraLider || o.id === obraLider))
  const [reporte, setReporte] = useState(false)
  const [pausas, setPausas] = useState(false)
  const [filtro, setFiltro] = useState('abiertos')
  const [caso, setCaso] = useState(null)

  const semanas = [...new Set(db.jornadas.map((j) => j.semana))].sort()
  const ultima = Object.fromEntries(obras.map((o) => [o.id, db.jornadas.filter((j) => j.obraId === o.id).at(-1)]))
  const altas = obras.filter((o) => ultima[o.id]?.horas > UMBRAL_HORAS)
  const prom = obras.reduce((s, o) => s + (ultima[o.id]?.horas ?? 0), 0) / obras.length
  const pausasSemana = obras.reduce((s, o) => s + (ultima[o.id]?.pausas ?? 0), 0)
  const reportes = db.bienestar.filter((b) => !obraLider || b.obraId === obraLider)
  const vista = reportes.filter((b) => (filtro === 'abiertos' ? b.estado !== 'cerrado' : true))
  const clima = agregarPulso(db.pulsos.find((p) => p.estado === 'abierto'), obraLider ? (r) => r.obraId === obraLider : () => true)

  return (
    <>
      <PageHead modulo="Estrategia 3 · Bienestar en obra" titulo="Bienestar en obra"
        descripcion="Aprovechar la fortaleza en seguridad operativa para cuidar la salud y el día a día: pausas, turnos exigentes en cierres de obra y reporte de molestias sin temor.">
        {rol !== 'trabajador' && <button className="btn" onClick={() => setPausas(true)}><Coffee />Registrar pausas</button>}
        <button className="btn primario" onClick={() => setReporte(true)}><Plus />Nuevo reporte</button>
      </PageHead>

      {altas.map((o) => (
        <div key={o.id} className="aviso rojo" style={{ marginBottom: 12 }}>
          <AlertTriangle />
          <span><b>{o.nombre}</b> promedia <b>{num(ultima[o.id].horas)} h</b> la última semana ({o.fase.toLowerCase()}, termina en {diasHasta(o.fin)} días). Recomendado: revisar turnos con el residente, asegurar relevos y al menos 5 pausas activas por semana.</span>
        </div>
      ))}

      <div className="grid g-4">
        <Kpi etiqueta="Horas promedio por semana" valor={num(prom)} unidad=" h" icono={Clock} tono={prom > UMBRAL_HORAS ? 'rojo' : ''} pie={`Umbral de alerta CZ: ${UMBRAL_HORAS} h · jornada ordinaria 42 h`} />
        <Kpi etiqueta="Pausas activas esta semana" valor={pausasSemana} icono={Coffee} pie={`Meta: 5 por obra (${obras.length * 5})`} />
        <Kpi etiqueta="Reportes abiertos" valor={reportes.filter((b) => b.estado === 'abierto').length} icono={HeartPulse} tono="ocre" pie={`${reportes.filter((b) => b.estado === 'canalizado').length} canalizados con SST o ARL`} />
        <Kpi etiqueta="Salud y carga (Pulso CZ)" valor={num(clima.dims.salud)} unidad=" / 5" icono={Heart} tono={clima.dims.salud < 3.5 ? 'rojo' : ''} pie="Partida 3,2 · meta ≥ 3,8" />
      </div>

      <div className="grid g-21 mt-16">
        <Card titulo="Horas trabajadas por semana" sub="Promedio por trabajador en cada obra · la línea punteada es el umbral de alerta"
          pie={<div className="leyenda">{obras.map((o) => <span key={o.id}><i style={{ background: COLORES_OBRA[o.id] }} />{o.nombre}</span>)}</div>}>
          <Lineas alto={250} min={40} max={60} formato={(v) => `${Math.round(v)} h`} etiquetas={semanas.map((s) => fechaCorta(s))}
            meta={{ valor: UMBRAL_HORAS, etiqueta: `Alerta ${UMBRAL_HORAS} h` }} directas
            series={obras.map((o) => ({ id: o.id, nombre: o.nombre, corto: o.nombre.split(' ').slice(-1)[0], color: COLORES_OBRA[o.id], valores: semanas.map((s) => db.jornadas.find((j) => j.obraId === o.id && j.semana === s)?.horas ?? null) }))} />
        </Card>
        <Card titulo="Pausas activas · última semana" sub="Meta: 5 por obra">
          <div className="stack" style={{ gap: 14 }}>
            {obras.map((o) => {
              const p = ultima[o.id]?.pausas ?? 0
              return (
                <div key={o.id}>
                  <div className="fila-sb peq" style={{ marginBottom: 5 }}><span>{o.nombre}</span><b className="num">{p}/5</b></div>
                  <Progreso valor={p / 5} tono={p < 3 ? 'rojo' : p < 5 ? 'ocre' : ''} />
                </div>
              )
            })}
          </div>
          <div className="divisor" />
          <div className="b peq" style={{ marginBottom: 8 }}>Lo que no debemos perder</div>
          <div className="stack peq" style={{ gap: 8 }}>
            <span className="fila"><ShieldCheck size={15} color="var(--verde)" />Equipos y reporte de riesgos: <b>4,6 / 5</b></span>
            <span className="fila"><Users size={15} color="var(--verde)" />Compromiso y pertenencia: <b>4,2 / 5</b></span>
            <span className="fila"><Heart size={15} color="var(--verde)" />El equipo valora el compañerismo y los proyectos</span>
          </div>
        </Card>
      </div>

      <Card className="mt-16" flush titulo="Reportes de bienestar" sub="Molestias, necesidades y casos que requieren orientación o apoyo"
        accion={<Segmentado valor={filtro} onChange={setFiltro} opciones={[{ id: 'abiertos', nombre: 'En seguimiento' }, { id: 'todos', nombre: 'Todos' }]} />}>
        {vista.length === 0 && <Vacio icono={CheckCircle2} titulo="Sin casos en seguimiento" />}
        <table className="tabla">
          <thead><tr><th>Fecha</th><th>Tipo</th><th>Descripción</th><th>Obra</th><th>Quién</th><th>Estado</th><th></th></tr></thead>
          <tbody>
            {vista.map((b) => (
              <tr key={b.id}>
                <td className="peq muted">{fecha(b.fecha)}</td>
                <td><Badge tono={b.tipo === 'Carga de trabajo' || b.tipo === 'Estrés o ansiedad' ? 'warning' : 'info'}>{b.tipo}</Badge></td>
                <td className="peq">{b.descripcion}</td>
                <td className="peq">{obraPorId[b.obraId].nombre}</td>
                <td className="peq">{b.anonimo ? <span className="muted">Anónimo</span> : personaPorId[b.personaId]?.nombre}</td>
                <td>{b.estado === 'abierto' ? <Badge tono="critical" punto>Abierto</Badge> : b.estado === 'canalizado' ? <Badge tono="warning" punto>{b.canalizadoA}</Badge> : <Badge tono="good" punto>Cerrado</Badge>}</td>
                <td className="derecha">{rol !== 'trabajador' && b.estado !== 'cerrado' && <button className="btn sm" onClick={() => setCaso(b.id)}>{b.estado === 'abierto' ? 'Canalizar' : 'Cerrar'}</button>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {reporte && <ReporteBienestarForm obraId={obraLider} onClose={() => setReporte(false)} />}
      {pausas && <RegistrarPausas obras={obras} onClose={() => setPausas(false)} onSave={(o, n) => { acciones.registrarPausas(o, n); setPausas(false) }} />}
      {caso && <Canalizar id={caso} onClose={() => setCaso(null)} />}
    </>
  )
}

function RegistrarPausas({ obras, onClose, onSave }) {
  const [obra, setObra] = useState(obras[0].id)
  const [n, setN] = useState(1)
  return (
    <Modal titulo="Registrar pausas activas" sub="Pausas y espacios breves para conocer cómo está el personal." onClose={onClose}
      pie={<><button className="btn" onClick={onClose}>Cancelar</button><button className="btn primario" onClick={() => onSave(obra, Number(n))}>Registrar</button></>}>
      <div className="form-grid">
        <Campo label="Obra"><select className="select" value={obra} onChange={(e) => setObra(e.target.value)}>{obras.map((o) => <option key={o.id} value={o.id}>{o.nombre}</option>)}</select></Campo>
        <Campo label="Pausas realizadas"><input className="input num" type="number" min="1" max="10" value={n} onChange={(e) => setN(e.target.value)} /></Campo>
      </div>
    </Modal>
  )
}

function Canalizar({ id, onClose }) {
  const { db, acciones } = useStore()
  const b = db.bienestar.find((x) => x.id === id)
  const [destino, setDestino] = useState('SST · seguimiento')
  return (
    <Modal titulo={b.estado === 'abierto' ? 'Canalizar caso' : 'Cerrar caso'} sub={`${b.tipo} · ${fecha(b.fecha)}`} onClose={onClose}
      pie={<><button className="btn" onClick={onClose}>Cancelar</button>
        {b.estado === 'abierto'
          ? <button className="btn primario" onClick={() => { acciones.actualizarBienestar(id, { estado: 'canalizado', canalizadoA: destino }); onClose() }}><Send />Canalizar</button>
          : <button className="btn primario" onClick={() => { acciones.actualizarBienestar(id, { estado: 'cerrado' }); onClose() }}><CheckCircle2 />Cerrar caso</button>}</>}>
      <div className="card" style={{ padding: 14, background: 'var(--fondo)', boxShadow: 'none', marginBottom: 16 }}>“{b.descripcion}”</div>
      {b.estado === 'abierto'
        ? <Campo label="Canalizar a"><div className="toggle-group">{['SST · seguimiento', 'SST · ajuste de turnos', 'ARL · valoración', 'EPS · orientación', 'Gestión Humana · conversación'].map((d) => <button key={d} className={destino === d ? 'on' : ''} onClick={() => setDestino(d)}>{d}</button>)}</div></Campo>
        : <p className="sec">El caso fue atendido por <b>{b.canalizadoA}</b>. Al cerrarlo queda en el historial de bienestar de la obra.</p>}
    </Modal>
  )
}
