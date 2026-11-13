import { useMemo, useState } from 'react'
import { Search, Download, MessagesSquare, TrendingUp, Users, Sparkles, ClipboardCheck } from 'lucide-react'
import { useStore } from '../store/Store.jsx'
import { useUi } from '../store/ui.js'
import { PageHead, Card, Badge, Persona, Kpi, Progreso, Tabs, Vacio } from '../components/ui.jsx'
import { DesempenoForm } from '../components/Formularios.jsx'
import { CARGOS, cargoPorId } from '../data/catalogos.js'
import { alertasCertificados, antiguedad, cumplimientoPersona, esNuevo, num, promedio } from '../lib/dominio.js'
import { diasHasta, fecha } from '../lib/fechas.js'
import { useRuta } from '../lib/router.js'
import { exportarCSV } from './talento/VacanteDetalle.jsx'

export default function Personal() {
  const { db, activos, obraPorId, personaPorId } = useStore()
  const { verPersona } = useUi()
  const { query } = useRuta()
  const [tab, setTab] = useState(query.tab ?? 'directorio')
  const [q, setQ] = useState('')
  const [obra, setObra] = useState(query.obra ?? '')
  const [cargo, setCargo] = useState('')
  const [form, setForm] = useState(false)

  const alertas = useMemo(() => alertasCertificados(activos), [activos])
  const lista = activos.filter((p) => (!q || p.nombre.toLowerCase().includes(q.toLowerCase())) && (!obra || p.obraId === obra) && (!cargo || p.cargo === cargo))
    .sort((a, b) => a.obraId.localeCompare(b.obraId) || a.cargo.localeCompare(b.cargo))

  const recientes = db.desempeno.filter((d) => diasHasta(d.fecha) > -90 && personaPorId[d.personaId]?.estado === 'activo')
  const conConversacion = new Set(recientes.map((d) => d.personaId))
  const elegibles = activos.filter((p) => diasHasta(p.ingreso) < -60)
  const pendientes = elegibles.filter((p) => !conConversacion.has(p.id))

  return (
    <>
      <PageHead modulo="Personas" titulo="Trabajadores" descripcion="Personal vinculado a las obras activas y la oficina. Cada perfil reúne certificados, formación, desempeño y reconocimientos.">
        {tab === 'desempeno' && <button className="btn primario" onClick={() => setForm(true)}><MessagesSquare />Registrar conversación</button>}
        {tab === 'directorio' && <button className="btn" onClick={() => exportarCSV('trabajadores-cz.csv', [['Nombre', 'Cargo', 'Obra', 'Ingreso', 'Teléfono'], ...lista.map((p) => [p.nombre, cargoPorId[p.cargo].nombre, obraPorId[p.obraId].nombre, p.ingreso, p.telefono])])}><Download />Exportar</button>}
      </PageHead>

      <Tabs activo={tab} onChange={setTab} tabs={[
        { id: 'directorio', nombre: 'Directorio', n: activos.length },
        { id: 'desempeno', nombre: 'Desempeño trimestral', n: pendientes.length },
      ]} />

      {tab === 'directorio' && (
        <Card flush>
          <div className="filtros" style={{ padding: '4px 16px 0', marginBottom: 6 }}>
            <div className="buscar"><Search /><input className="input" placeholder="Buscar trabajador" value={q} onChange={(e) => setQ(e.target.value)} /></div>
            <select className="select" value={obra} onChange={(e) => setObra(e.target.value)}>
              <option value="">Todas las obras</option>
              {db.obras.filter((o) => ['activa', 'oficina'].includes(o.estado)).map((o) => <option key={o.id} value={o.id}>{o.nombre}</option>)}
            </select>
            <select className="select" value={cargo} onChange={(e) => setCargo(e.target.value)}>
              <option value="">Todos los cargos</option>
              {CARGOS.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </select>
          </div>
          <div className="tabla-wrap">
            <table className="tabla">
              <thead><tr><th>Trabajador</th><th>Obra</th><th>Antigüedad</th><th>Certificados</th><th style={{ width: 170 }}>Ruta de formación</th><th>Último desempeño</th></tr></thead>
              <tbody>
                {lista.map((p) => {
                  const al = alertas.filter((a) => a.persona.id === p.id)
                  const peor = al[0]?.estado
                  const c = cumplimientoPersona(p)
                  const d = db.desempeno.find((x) => x.personaId === p.id)
                  return (
                    <tr key={p.id} className="click" onClick={() => verPersona(p.id)}>
                      <td><Persona persona={p} detalle={cargoPorId[p.cargo].nombre} /></td>
                      <td className="peq">{obraPorId[p.obraId].nombre}</td>
                      <td className="peq">{esNuevo(p) ? <Badge tono="info">Nuevo · {antiguedad(p)}</Badge> : antiguedad(p)}</td>
                      <td>{peor ? <Badge tono={peor.tono} punto>{al.length > 1 ? `${al.length} por atender` : `${al[0].corto} · ${peor.nombre.toLowerCase()}`}</Badge> : <Badge tono="good" punto>Al día</Badge>}</td>
                      <td><div className="fila"><div style={{ flex: 1 }}><Progreso valor={c.pct} meta={0.9} tono={c.pct < 0.6 ? 'ocre' : ''} /></div><span className="xs num muted">{c.hechos}/{c.total}</span></div></td>
                      <td className="peq">{d ? <span className="fila" style={{ gap: 6 }}><b className="num">{num(d.calificacion)}</b><span className="muted">· {fecha(d.fecha)}</span>{d.potencial && <Badge tono="info">Potencial</Badge>}</span> : <span className="muted">—</span>}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <div className="card-pie"><span>{lista.length} trabajadores</span><span>Clic en una fila para ver el perfil completo</span></div>
        </Card>
      )}

      {tab === 'desempeno' && (
        <>
          <div className="grid g-4" style={{ marginBottom: 16 }}>
            <Kpi etiqueta="Conversaciones del trimestre" valor={conConversacion.size} unidad={` / ${elegibles.length}`} icono={ClipboardCheck}
              pie={<div style={{ width: '100%' }}><Progreso valor={conConversacion.size / Math.max(1, elegibles.length)} /></div>} />
            <Kpi etiqueta="Valoración promedio" valor={num(promedio(recientes.map((d) => d.calificacion)))} unidad=" / 5" icono={TrendingUp} pie="Escala de 1 a 5" />
            <Kpi etiqueta="Con potencial de crecimiento" valor={recientes.filter((d) => d.potencial).length} icono={Sparkles} pie="Pueden asumir nuevas responsabilidades" />
            <Kpi etiqueta="Pendientes de conversación" valor={pendientes.length} icono={Users} tono="ocre" pie="Más de 60 días en CZ y sin conversación" />
          </div>
          <div className="grid g-21">
            <Card titulo="Conversaciones recientes" sub="Retroalimentación con metas claras · alimentan la ruta de formación" flush>
              <table className="tabla">
                <thead><tr><th>Trabajador</th><th>Fecha</th><th>Valoración</th><th>Fortaleza</th><th>Por aprender</th></tr></thead>
                <tbody>
                  {recientes.sort((a, b) => (a.fecha < b.fecha ? 1 : -1)).map((d) => {
                    const p = personaPorId[d.personaId]
                    return (
                      <tr key={d.id} className="click" onClick={() => verPersona(p.id)}>
                        <td><Persona persona={p} detalle={`${cargoPorId[p.cargo].nombre} · ${obraPorId[p.obraId]?.nombre}`} /></td>
                        <td className="peq muted">{fecha(d.fecha)}</td>
                        <td><span className="fila" style={{ gap: 6 }}><b className="num">{num(d.calificacion)}</b>{d.potencial && <Badge tono="info">Potencial</Badge>}</span></td>
                        <td className="peq">{d.fortalezas}</td>
                        <td className="peq">{d.pendientes}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              {recientes.length === 0 && <Vacio titulo="Aún no hay conversaciones este trimestre" />}
            </Card>
            <Card titulo="Pendientes" sub="Programar con su líder" flush>
              <ul className="lista" style={{ maxHeight: 520, overflowY: 'auto' }}>
                {pendientes.map((p) => (
                  <li key={p.id} className="click" onClick={() => verPersona(p.id)}>
                    <Persona persona={p} size="sm" detalle={`${cargoPorId[p.cargo].nombre} · ${obraPorId[p.obraId].nombre}`} />
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        </>
      )}
      {form && <DesempenoForm onClose={() => setForm(false)} />}
    </>
  )
}
