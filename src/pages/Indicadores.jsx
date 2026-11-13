import { CheckCircle2, Circle, ArrowRight, FileText, Flag } from 'lucide-react'
import { useStore } from '../store/Store.jsx'
import { PageHead, Card, Badge, Progreso } from '../components/ui.jsx'
import { RADAR_RRHH } from '../data/catalogos.js'
import { agregarPulso, cumplimientoPlan, num, signo } from '../lib/dominio.js'
import { diasHasta, fecha } from '../lib/fechas.js'
import { ir } from '../lib/router.js'

export default function Indicadores() {
  const { db, activos, acciones } = useStore()
  const base = agregarPulso(db.pulsos[0])
  const actual = agregarPulso(db.pulsos.find((p) => p.estado === 'abierto'))
  const cumpl = cumplimientoPlan(activos)
  const mesPlan = Math.min(6, Math.floor(-diasHasta(db.plan[0].desde) / 30) + 1)

  // Indicadores de la diapositiva 10, conectados con datos vivos del prototipo.
  const indicadores = [
    { nombre: 'Recursos Humanos · radar empresarial', partida: 2.56, actual: db.radarActual, meta: 3.5, f: (v) => `${num(v, 2)} / 5`, fuente: 'Reevaluación del radar (parcial)', ruta: null },
    { nombre: 'Índice general del clima', partida: base.indice, actual: actual.indice, meta: 4.0, f: (v) => `${num(v)} / 5`, fuente: 'Pulso CZ', ruta: 'escucha' },
    { nombre: 'Reconocimiento · encuesta', partida: base.dims.reconocimiento, actual: actual.dims.reconocimiento, meta: 3.5, f: (v) => `${num(v)} / 5`, fuente: 'Pulso CZ · Reconoce CZ', ruta: 'reconoce' },
    { nombre: 'Formación y desarrollo · encuesta', partida: base.dims.formacion, actual: actual.dims.formacion, meta: 3.7, f: (v) => `${num(v)} / 5`, fuente: 'Pulso CZ · Ruta de formación', ruta: 'formacion' },
    { nombre: 'Salud y carga laboral · ítems 11–12', partida: base.dims.salud, actual: actual.dims.salud, meta: 3.8, f: (v) => `${num(v)} / 5`, fuente: 'Pulso CZ · Bienestar', ruta: 'bienestar' },
    { nombre: 'eNPS · recomendar CZ como empleador', partida: base.enps, actual: actual.enps, meta: 30, f: (v) => signo(Math.round(v)), fuente: 'Pulso CZ', ruta: 'escucha' },
    { nombre: 'Cumplimiento del plan de capacitación', partida: null, actual: cumpl, meta: 0.9, f: (v) => `${Math.round(v * 100)} %`, fuente: 'Ruta de formación', ruta: 'formacion' },
  ].map((i) => {
    const desde = i.partida ?? 0
    const avance = Math.max(0, Math.min(1, (i.actual - desde) / (i.meta - desde)))
    const estado = i.actual >= i.meta ? { t: 'Meta cumplida', tono: 'good' } : i.partida !== null && i.actual < i.partida ? { t: 'Retrocede', tono: 'critical' } : avance >= 0.3 ? { t: 'En camino', tono: 'info' } : { t: 'En riesgo', tono: 'warning' }
    return { ...i, avance, estado }
  })

  const tareas = db.plan.flatMap((p) => p.tareas)

  return (
    <>
      <PageHead modulo="Diagnóstico y plan de mejora" titulo="¿Cómo sabremos si mejoró?"
        descripcion="Indicadores conectados con los problemas identificados en el radar empresarial y la encuesta de clima. Se alimentan con lo que se registra en cada módulo.">
        <Badge tono="solido">Mes {mesPlan} de 6</Badge>
      </PageHead>

      <div className="grid g-3">
        <Card>
          <div className="peq muted">Radar empresarial · Recursos Humanos</div>
          <div className="fila mt-8" style={{ alignItems: 'baseline', gap: 10 }}><span className="hero-num">2,56</span><span className="muted">/ 5 · factor más débil</span></div>
          <div className="peq sec mt-12">Desempeño, motivación, compensación, medición del clima y rotación reciben 2 / 5.</div>
        </Card>
        <Card>
          <div className="peq muted">Encuesta de clima · Personas</div>
          <div className="fila mt-8" style={{ alignItems: 'baseline', gap: 10 }}><span className="hero-num">3,5</span><span className="muted">/ 5 · índice general</span></div>
          <div className="peq sec mt-12">Hay pertenencia (4,2), pero faltan valoración (2,9) y desarrollo (3,1).</div>
        </Card>
        <Card>
          <div className="peq muted">Conclusión del diagnóstico</div>
          <div className="b mt-8" style={{ fontSize: 17, lineHeight: 1.35, letterSpacing: '-0.01em' }}>El reto principal no es técnico: es mejorar la experiencia del trabajador.</div>
          <div className="peq sec mt-12">Escuchar, reconocer, formar con sentido y cuidar las condiciones.</div>
        </Card>
      </div>

      <Card className="mt-16" titulo="Indicadores a 6 meses" sub="Valores actuales calculados con los datos del prototipo · las metas son propuestas del grupo" flush>
        <div className="tabla-wrap">
          <table className="tabla">
            <thead><tr><th>Indicador</th><th className="derecha">Punto de partida</th><th className="derecha">Actual</th><th className="derecha">Meta</th><th style={{ width: 200 }}>Avance hacia la meta</th><th>Estado</th><th>Fuente</th></tr></thead>
            <tbody>
              {indicadores.map((i) => (
                <tr key={i.nombre} className={i.ruta ? 'click' : ''} onClick={() => i.ruta && ir(i.ruta)}>
                  <td className="b">{i.nombre}</td>
                  <td className="derecha num muted" style={{ whiteSpace: 'nowrap' }}>{i.partida === null ? 'Sin medición' : i.f(i.partida)}</td>
                  <td className="derecha num b" style={{ fontSize: 15, whiteSpace: 'nowrap' }}>{i.f(i.actual)}</td>
                  <td className="derecha num" style={{ whiteSpace: 'nowrap' }}>≥ {i.f(i.meta)}</td>
                  <td><div className="fila"><div style={{ flex: 1 }}><Progreso valor={i.avance} tono={i.estado.tono === 'critical' ? 'rojo' : i.estado.tono === 'warning' ? 'ocre' : ''} /></div><span className="xs muted num" style={{ width: 34, textAlign: 'right' }}>{Math.round(i.avance * 100)} %</span></div></td>
                  <td><Badge tono={i.estado.tono}>{i.estado.t}</Badge></td>
                  <td className="peq sec">{i.fuente}{i.ruta && <ArrowRight size={13} style={{ verticalAlign: -2, marginLeft: 4 }} />}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="grid g-2 mt-16">
        <Card titulo="Plan de trabajo y seguimiento" sub={`${tareas.filter((t) => t.ok).length} de ${tareas.length} acciones cumplidas · revisión mensual`}>
          <div className="stack" style={{ gap: 18 }}>
            {db.plan.map((p) => {
              const ok = p.tareas.filter((t) => t.ok).length
              const futuro = diasHasta(p.desde) > 0
              return (
                <div key={p.id}>
                  <div className="fila-sb">
                    <div className="fila" style={{ gap: 8 }}>
                      <Badge tono={ok === p.tareas.length ? 'good' : futuro ? '' : 'warning'}>{p.periodo}</Badge>
                      <b className="peq">{p.accion}</b>
                    </div>
                    <span className="xs muted num">{ok}/{p.tareas.length}</span>
                  </div>
                  <div className="xs muted mt-8" style={{ marginTop: 4 }}>{p.responsable} · Evidencia: {p.evidencia} · desde {fecha(p.desde)}</div>
                  <div className="stack mt-8" style={{ gap: 2 }}>
                    {p.tareas.map((t, i) => (
                      <button key={i} className="fila" onClick={() => acciones.marcarTarea(p.id, i)}
                        style={{ border: 0, background: 'none', padding: '4px 0', cursor: 'pointer', textAlign: 'left', fontSize: 13, color: t.ok ? 'var(--tinta)' : 'var(--tinta-2)' }}>
                        {t.ok ? <CheckCircle2 size={17} color="var(--verde-500)" /> : <Circle size={17} color="var(--borde)" />}{t.t}
                      </button>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
        <Card titulo="Cómo responde el software al diagnóstico" sub="Aspectos del radar de Recursos Humanos (escala 1 a 5) y el módulo que los atiende" flush>
          <table className="tabla">
            <thead><tr><th>Aspecto del radar</th><th className="derecha">Puntaje</th><th>Módulo de CZ Personas</th></tr></thead>
            <tbody>
              {RADAR_RRHH.map((r) => (
                <tr key={r.aspecto} className="click" onClick={() => ir(r.ruta)}>
                  <td><div className="b peq">{r.aspecto}</div><div className="xs muted">{r.mejora}</div></td>
                  <td className="derecha"><span className={`badge ${r.inicial <= 2 ? 'critical' : r.inicial === 3 ? 'warning' : 'good'}`}>{r.inicial}</span></td>
                  <td className="peq"><span className="fila" style={{ gap: 6, color: 'var(--verde)', fontWeight: 550 }}>{r.modulo}<ArrowRight size={13} /></span></td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="card-pie"><span className="fila" style={{ gap: 6 }}><Flag size={13} />Idea final: escuchar, reconocer, formar con sentido y cuidar.</span><span className="fila" style={{ gap: 6 }}><FileText size={13} />Fuente: Diagnóstico CZ</span></div>
        </Card>
      </div>
    </>
  )
}
