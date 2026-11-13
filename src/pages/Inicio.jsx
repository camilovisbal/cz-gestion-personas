import { useMemo } from 'react'
import { Users, Briefcase, SmilePlus, GraduationCap, ShieldAlert, Clock, MessageCircle, UserCheck, HeartPulse, ArrowRight, Plus, UserPlus, TrendingUp, TrendingDown } from 'lucide-react'
import { useStore } from '../store/Store.jsx'
import { useUi } from '../store/ui.js'
import { PageHead, Card, Kpi, Badge, Progreso } from '../components/ui.jsx'
import { Columnas, Barras } from '../components/charts.jsx'
import { cargoPorId, ETAPAS } from '../data/catalogos.js'
import { agregarPulso, alertasCertificados, cumplimientoPlan, num, proyeccionPersonal, requeridosTotales } from '../lib/dominio.js'
import { diasHasta, enDias, fecha, inicioMes, mesCorto, mesLargo } from '../lib/fechas.js'
import { ir } from '../lib/router.js'

export function seriePersonal(db, activos) {
  return [
    ...db.historicoPersonal.map((h) => ({ mes: h.mes, total: h.total })),
    { mes: inicioMes(0), total: activos.length, actual: true },
    ...proyeccionPersonal(db.obras, 3),
  ].map((d) => ({ valor: d.total, mes: d.mes, proyectado: d.proyectado, tooltip: mesLargo(d.mes) + (d.actual ? ' (actual)' : ''), sufijo: ' personas' }))
}

export default function Inicio() {
  const { db, activos, usuario, obraPorId, personaPorId } = useStore()
  const { verPersona } = useUi()

  const datos = useMemo(() => {
    const vacAbiertas = db.vacantes.filter((v) => v.estado === 'abierta')
    const posiciones = vacAbiertas.reduce((s, v) => s + v.cantidad - db.postulaciones.filter((p) => p.vacanteId === v.id && p.etapa === 'contratado').length, 0)
    const pulsoAbierto = agregarPulso(db.pulsos.find((p) => p.estado === 'abierto'))
    const base = agregarPulso(db.pulsos[0])
    const cumpl = cumplimientoPlan(activos)
    const certs = alertasCertificados(activos)
    const vencidasCanal = db.canal.filter((s) => s.estado !== 'respondida' && diasHasta(s.fechaLimite) < 3)
    const sinResponder = db.canal.filter((s) => s.estado !== 'respondida')
    const solicitudes = db.vacantes.filter((v) => v.estado === 'solicitada')
    const ultimaJornada = {}
    db.jornadas.forEach((j) => { ultimaJornada[j.obraId] = j })
    const jornadasAltas = Object.values(ultimaJornada).filter((j) => j.horas > 52)
    const sinInduccion = db.mentorias.filter((m) => !m.checklist.induccion)
    return { vacAbiertas, posiciones, pulsoAbierto, base, cumpl, certs, vencidasCanal, sinResponder, solicitudes, jornadasAltas, sinInduccion }
  }, [db, activos])

  const serie = seriePersonal(db, activos)
  const obrasActivas = db.obras.filter((o) => ['activa', 'planeacion', 'oficina'].includes(o.estado))
  const embudo = ETAPAS.filter((e) => e.id !== 'descartado').map((e) => ({
    id: e.id, nombre: e.nombre,
    valor: db.postulaciones.filter((p) => p.etapa === e.id && db.vacantes.find((v) => v.id === p.vacanteId)?.estado !== 'cerrada').length,
  }))
  const tareas = db.plan.flatMap((p) => p.tareas)
  const hechas = tareas.filter((t) => t.ok).length
  const mesPlan = Math.min(6, Math.floor(-diasHasta(db.plan[0].desde) / 30) + 1)

  const alertas = [
    ...datos.solicitudes.map((v) => ({ tono: 'info', icono: Briefcase, titulo: `Solicitud de personal: ${v.cantidad} × ${cargoPorId[v.cargo].nombre}`, meta: `${obraPorId[v.obraId].nombre} · por aprobar`, ir: () => ir(`talento/vacantes/${v.id}`) })),
    ...datos.jornadasAltas.map((j) => ({ tono: 'critical', icono: Clock, titulo: `Jornadas de ${num(j.horas)} h/semana en ${obraPorId[j.obraId].nombre}`, meta: `${obraPorId[j.obraId].fase} · revisar turnos y pausas`, ir: () => ir('bienestar') })),
    ...datos.certs.filter((c) => c.estado.id === 'vencido').slice(0, 3).map((c) => ({ tono: 'critical', icono: ShieldAlert, titulo: `${c.nombre} vencido`, meta: `${c.persona.nombre} · ${obraPorId[c.persona.obraId]?.nombre}`, ir: () => verPersona(c.persona.id) })),
    ...(datos.vencidasCanal.length ? [{ tono: 'warning', icono: MessageCircle, titulo: `${datos.vencidasCanal.length} inquietudes cerca del plazo de respuesta`, meta: 'Compromiso: responder en ≤ 15 días', ir: () => ir('escucha?tab=canal') }] : []),
    ...datos.certs.filter((c) => c.estado.id === 'porVencer').slice(0, 3).map((c) => ({ tono: 'warning', icono: ShieldAlert, titulo: `${c.nombre} · ${c.estado.nombre.toLowerCase()}`, meta: `${c.persona.nombre} · ${obraPorId[c.persona.obraId]?.nombre}`, ir: () => verPersona(c.persona.id) })),
    ...(datos.sinInduccion.length ? [{ tono: 'info', icono: UserCheck, titulo: `${datos.sinInduccion.length} personas nuevas sin inducción`, meta: 'Inscritas en la próxima sesión', ir: () => ir('formacion?tab=acompanamiento') }] : []),
  ]

  const deltaClima = datos.pulsoAbierto.indice - datos.base.indice
  const hora = new Date().getHours()
  const saludo = hora < 12 ? 'Buenos días' : hora < 19 ? 'Buenas tardes' : 'Buenas noches'

  return (
    <>
      <PageHead titulo={`${saludo}, ${usuario.nombre.split(' ')[0]}`} descripcion={`Resumen de gestión de personas de CZ Construcciones · ${fecha(enDias(0))}`}>
        <button className="btn" onClick={() => ir('talento/registro')}><UserPlus />Registrar candidato</button>
        <button className="btn primario" onClick={() => ir('talento/vacantes?nueva=1')}><Plus />Nueva vacante</button>
      </PageHead>

      <div className="grid g-4">
        <Kpi etiqueta="Personal activo" valor={activos.length} unidad=" personas" icono={Users}
          pie={<>{db.obras.filter((o) => o.estado === 'activa').length} obras activas · {db.obras.filter((o) => o.estado === 'planeacion').length} en planeación</>} onClick={() => ir('personal')} />
        <Kpi etiqueta="Posiciones por cubrir" valor={datos.posiciones} icono={Briefcase} tono="ocre"
          pie={<>{datos.vacAbiertas.length} vacantes abiertas{datos.solicitudes.length ? ` · ${datos.solicitudes.length} por aprobar` : ''}</>} onClick={() => ir('talento/vacantes')} />
        <Kpi etiqueta="Índice de clima (Pulso CZ)" valor={num(datos.pulsoAbierto.indice)} unidad=" / 5" icono={SmilePlus}
          pie={<><span className={`delta ${deltaClima >= 0 ? 'up' : 'down'}`}>{deltaClima >= 0 ? <TrendingUp size={13} /> : <TrendingDown size={13} />}{num(Math.abs(deltaClima))}</span> vs. línea base {num(datos.base.indice)} · meta ≥ 4,0</>} onClick={() => ir('escucha')} />
        <Kpi etiqueta="Cumplimiento plan de formación" valor={Math.round(datos.cumpl * 100)} unidad=" %" icono={GraduationCap} tono={datos.cumpl < 0.9 ? 'ocre' : ''}
          pie={<div style={{ width: '100%' }}><Progreso valor={datos.cumpl} meta={0.9} tono={datos.cumpl < 0.9 ? 'ocre' : ''} /><div className="mt-8" style={{ marginTop: 6 }}>Meta ≥ 90 %</div></div>} onClick={() => ir('formacion')} />
      </div>

      <div className="grid g-21 mt-16">
        <Card titulo="Personal por mes" sub="La plantilla cambia según las obras en ejecución · los meses rayados son la proyección según obras programadas"
          accion={<div className="leyenda"><span><i style={{ background: 'var(--verde)' }} />Real</span><span><i style={{ background: 'repeating-linear-gradient(45deg, var(--verde-300) 0 2px, var(--verde-100) 2px 5px)' }} />Proyección</span></div>}>
          <Columnas datos={serie} alto={250} etiquetaX={(d) => mesCorto(d.mes).split(' ')[0]} destacar={11} meta={{ valor: 60, etiqueta: 'Tope de referencia: 60' }} />
        </Card>
        <Card titulo="Requiere atención" sub={`${alertas.length} pendientes`} flush>
          <ul className="lista" style={{ maxHeight: 290, overflowY: 'auto' }}>
            {alertas.slice(0, 8).map((a, i) => (
              <li key={i} className="click" onClick={a.ir}>
                <span className={`icono-alerta ${a.tono}`}><a.icono /></span>
                <div className="cuerpo">
                  <div className="titulo trunc">{a.titulo}</div>
                  <div className="meta-l trunc">{a.meta}</div>
                </div>
                <ArrowRight size={15} color="var(--tinta-3)" />
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <div className="grid g-3 mt-16">
        <Card titulo="Personal por obra" sub="Asignado frente a lo requerido" pie={<><span>Total requerido: {obrasActivas.filter((o) => o.estado !== 'planeacion').reduce((s, o) => s + requeridosTotales(o), 0)}</span><a href="#/obras">Ver obras</a></>}>
          <div className="stack" style={{ gap: 13 }}>
            {obrasActivas.map((o) => {
              const asignados = activos.filter((p) => p.obraId === o.id).length
              const req = requeridosTotales(o)
              return (
                <div key={o.id}>
                  <div className="fila-sb peq" style={{ marginBottom: 5 }}>
                    <span className="trunc"><b>{o.nombre}</b> <span className="muted">· {o.fase}</span></span>
                    <span className="num sec">{asignados}/{req}</span>
                  </div>
                  <Progreso valor={asignados / req} tono={asignados < req ? 'ocre' : ''} />
                </div>
              )
            })}
          </div>
        </Card>
        <Card titulo="Proceso de selección" sub="Candidatos en vacantes abiertas" pie={<><span>{db.postulaciones.filter((p) => p.etapa === 'descartado').length} descartados con motivo registrado</span><a href="#/talento/proceso">Ver tablero</a></>}>
          <Barras datos={embudo} />
        </Card>
        <Card titulo="Plan de mejora a 6 meses" sub={`Mes ${mesPlan} de 6 · ${hechas} de ${tareas.length} acciones cumplidas`} pie={<><span>Revisión mensual con gerencia</span><a href="#/indicadores">Ver plan</a></>}>
          <div className="stack" style={{ gap: 12 }}>
            {db.plan.map((p) => {
              const ok = p.tareas.filter((t) => t.ok).length
              const estado = ok === p.tareas.length ? { t: 'Cumplido', tono: 'good' } : diasHasta(p.desde) > 0 ? { t: 'Próximo', tono: '' } : { t: 'En curso', tono: 'warning' }
              return (
                <div key={p.id}>
                  <div className="fila-sb peq" style={{ marginBottom: 5 }}>
                    <span className="trunc"><b>{p.periodo}</b> <span className="muted">· {p.accion}</span></span>
                    <Badge tono={estado.tono}>{estado.t}</Badge>
                  </div>
                  <Progreso valor={ok / p.tareas.length} />
                </div>
              )
            })}
          </div>
        </Card>
      </div>

      <div className="grid g-2 mt-16">
        <Card titulo="Nuevos en CZ" sub="Inducción y acompañamiento de un trabajador experimentado" flush>
          <ul className="lista">
            {db.mentorias.slice(0, 5).map((m) => {
              const p = personaPorId[m.nuevoId]
              const mentor = personaPorId[m.mentorId]
              const pasos = Object.values(m.checklist).filter(Boolean).length
              return (
                <li key={m.id} className="click" onClick={() => verPersona(p.id)}>
                  <div className="cuerpo">
                    <div className="titulo">{p.nombre}</div>
                    <div className="meta-l">{cargoPorId[p.cargo].nombre} · {obraPorId[p.obraId]?.nombre} · acompaña {mentor?.nombre.split(' ').slice(0, 2).join(' ') ?? 'sin asignar'}</div>
                  </div>
                  <div style={{ width: 90 }}><Progreso valor={pasos / 5} /></div>
                  <span className="xs muted num">{pasos}/5</span>
                </li>
              )
            })}
          </ul>
        </Card>
        <Card titulo="Lo que dicen las obras" sub="Últimos mensajes del Canal CZ" flush pie={<><span>{datos.sinResponder.length} sin respuesta</span><a href="#/escucha?tab=canal">Abrir Canal CZ</a></>}>
          <ul className="lista">
            {db.canal.slice(0, 4).map((s) => (
              <li key={s.id} className="click" onClick={() => ir('escucha?tab=canal')}>
                <span className={`icono-alerta ${s.categoria === 'Bienestar' ? 'warning' : 'info'}`}>{s.categoria === 'Bienestar' ? <HeartPulse /> : <MessageCircle />}</span>
                <div className="cuerpo">
                  <div className="titulo trunc">{s.texto}</div>
                  <div className="meta-l">{obraPorId[s.obraId].nombre} · {s.anonimo ? 'Anónimo' : personaPorId[s.personaId]?.nombre ?? 'Cuadrilla'} · {fecha(s.fecha)}</div>
                </div>
                <Badge tono={s.estado === 'respondida' ? 'good' : s.estado === 'en_revision' ? 'warning' : ''}>{{ recibida: 'Recibida', en_revision: 'En revisión', respondida: 'Respondida' }[s.estado]}</Badge>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </>
  )
}
