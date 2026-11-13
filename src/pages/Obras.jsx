import { useState } from 'react'
import { Building2, MapPin, CalendarRange, HardHat, Plus, AlertTriangle } from 'lucide-react'
import { useStore } from '../store/Store.jsx'
import { useUi } from '../store/ui.js'
import { PageHead, Card, Badge, Progreso, Avatar, Segmentado } from '../components/ui.jsx'
import { Columnas } from '../components/charts.jsx'
import VacanteForm from '../components/VacanteForm.jsx'
import { cargoPorId, TIPOS_PROYECTO } from '../data/catalogos.js'
import { requeridosTotales } from '../lib/dominio.js'
import { fecha, relativo, mesCorto, diasHasta } from '../lib/fechas.js'
import { ir } from '../lib/router.js'
import { seriePersonal } from './Inicio.jsx'

const ESTADO = { activa: { t: 'En ejecución', tono: 'good' }, planeacion: { t: 'En planeación', tono: 'info' }, oficina: { t: 'Permanente', tono: '' }, finalizada: { t: 'Finalizada', tono: '' } }

export default function Obras() {
  const { db, activos, personaPorId } = useStore()
  const { verPersona } = useUi()
  const [filtro, setFiltro] = useState('vigentes')
  const [vacante, setVacante] = useState(null)
  const obras = db.obras.filter((o) => (filtro === 'vigentes' ? o.estado !== 'finalizada' : o.estado === 'finalizada'))

  return (
    <>
      <PageHead modulo="Personas" titulo="Obras" descripcion="CZ cambia de tamaño según los proyectos en curso. Compare el personal requerido con el asignado y anticipe las contrataciones.">
        <Segmentado valor={filtro} onChange={setFiltro} opciones={[{ id: 'vigentes', nombre: 'Vigentes' }, { id: 'finalizadas', nombre: 'Finalizadas' }]} />
      </PageHead>

      {filtro === 'vigentes' && (
        <Card titulo="Personal real y proyectado" sub="Los meses rayados suman lo requerido por las obras programadas (incluye la Cubierta Colegio Soledad)" style={{ marginBottom: 16 }}>
          <Columnas datos={seriePersonal(db, activos).slice(6)} alto={190} etiquetaX={(d) => mesCorto(d.mes)} destacar={5} />
        </Card>
      )}

      <div className="stack">
        {obras.map((o) => {
          const equipo = activos.filter((p) => p.obraId === o.id)
          const req = requeridosTotales(o)
          const lider = personaPorId[o.liderId]
          const est = ESTADO[o.estado]
          const faltan = Object.entries(o.requeridos).map(([c, n]) => ({ c, n, a: equipo.filter((p) => p.cargo === c).length })).filter((x) => x.a < x.n)
          const exHist = db.personas.filter((p) => p.historial.some((h) => h.obraId === o.id))
          const finCerca = o.fin && o.estado === 'activa' && diasHasta(o.fin) < 40
          return (
            <Card key={o.id}>
              <div className="obra-grid">
                <div>
                  <div className="fila" style={{ gap: 10 }}>
                    <span className="kpi-icono"><Building2 /></span>
                    <div>
                      <div className="fila" style={{ gap: 8 }}><h3 style={{ fontSize: 16 }}>{o.nombre}</h3><Badge tono={est.tono}>{est.t}</Badge></div>
                      <div className="peq muted">{o.cliente}</div>
                    </div>
                  </div>
                  <div className="stack peq sec mt-16" style={{ gap: 6 }}>
                    <span className="fila" style={{ gap: 6 }}><MapPin size={14} />{o.ciudad}{o.tipo ? ` · ${TIPOS_PROYECTO.find((t) => t.id === o.tipo)?.nombre}` : ''}</span>
                    {o.fin && <span className="fila" style={{ gap: 6 }}><CalendarRange size={14} />{fecha(o.inicio)} → {fecha(o.fin)} <span className="muted">({o.estado === 'planeacion' ? `inicia ${relativo(o.inicio)}` : o.estado === 'activa' ? `termina ${relativo(o.fin)}` : 'entregada'})</span></span>}
                    <span className="fila" style={{ gap: 6 }}><HardHat size={14} />Fase: {o.fase}</span>
                  </div>
                  {lider && <div className="fila mt-16" style={{ cursor: 'pointer' }} onClick={() => verPersona(lider.id)}><Avatar nombre={lider.nombre} size="sm" /><span className="peq"><span className="muted">Líder:</span> {lider.nombre}</span></div>}
                  {o.avance !== null && o.estado !== 'oficina' && (
                    <div className="mt-16">
                      <div className="fila-sb xs muted" style={{ marginBottom: 5 }}><span>Avance de obra</span><span className="num">{o.avance} %</span></div>
                      <Progreso valor={o.avance / 100} />
                    </div>
                  )}
                  {finCerca && <div className="aviso ocre mt-16"><AlertTriangle /><span>Cierre de obra en {diasHasta(o.fin)} días: planear evaluaciones de cierre, reubicación del personal y vigilar jornadas.</span></div>}
                </div>
                <div>
                  {o.estado === 'finalizada' ? (
                    <>
                      <div className="seccion-t" style={{ marginTop: 0 }}>Personas evaluadas al cierre ({exHist.length})</div>
                      <div className="chips">{exHist.map((p) => <button key={p.id} className="chip" style={{ cursor: 'pointer' }} onClick={() => verPersona(p.id)}>{p.nombre} · {p.historial.find((h) => h.obraId === o.id).calificacion.toFixed(1).replace('.', ',')}</button>)}</div>
                    </>
                  ) : (
                    <>
                      <div className="fila-sb" style={{ marginBottom: 10 }}>
                        <span className="b">Personal por cargo</span>
                        <span className="num sec">{equipo.length} de {req} asignados</span>
                      </div>
                      <table className="tabla" style={{ border: '1px solid var(--borde-suave)', borderRadius: 8 }}>
                        <thead><tr><th>Cargo</th><th>Requerido</th><th>Asignado</th><th style={{ width: '38%' }}></th></tr></thead>
                        <tbody>
                          {Object.entries(o.requeridos).map(([c, n]) => {
                            const a = equipo.filter((p) => p.cargo === c).length
                            return (
                              <tr key={c}>
                                <td className="peq">{cargoPorId[c].nombre}</td>
                                <td className="num">{n}</td>
                                <td className="num">{a}{a < n && <span style={{ color: 'var(--ocre)', fontWeight: 600 }}> (−{n - a})</span>}</td>
                                <td><Progreso valor={a / n} tono={a < n ? 'ocre' : ''} /></td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                      <div className="fila-sb mt-12">
                        <a href={`#/personal?obra=${o.id}`} onClick={(e) => { e.preventDefault(); ir(`personal?obra=${o.id}`) }} className="peq">Ver equipo</a>
                        {faltan.length > 0 && <button className="btn sm primario" onClick={() => setVacante(o.id)}><Plus />Crear vacante ({faltan.reduce((s, x) => s + x.n - x.a, 0)} faltantes)</button>}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </Card>
          )
        })}
      </div>
      {vacante && <VacanteForm obraFija={vacante} onClose={() => setVacante(null)} />}
    </>
  )
}
