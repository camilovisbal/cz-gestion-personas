import { useState } from 'react'
import { CalendarCheck, Award, MessageSquareHeart, ClipboardList, HeartPulse, MessagesSquare, Users, ShieldAlert, Clock, Gauge, CalendarRange, LogOut, MessageCircle, GraduationCap } from 'lucide-react'
import { useStore } from '../../store/Store.jsx'
import { useUi } from '../../store/ui.js'
import { PageHead, Card, Badge, Kpi, Persona, Progreso, Vacio } from '../../components/ui.jsx'
import { CharlaForm, NominarForm, RetroForm, DesempenoForm, ReporteBienestarForm } from '../../components/Formularios.jsx'
import { Retiro } from '../../components/PerfilPersona.jsx'
import { cargoPorId, cursoPorId } from '../../data/catalogos.js'
import { agregarPulso, alertasCertificados, cumplimientoPersona, requeridosTotales, num } from '../../lib/dominio.js'
import { diasHasta, enDias, fecha, relativo } from '../../lib/fechas.js'
import { ir } from '../../lib/router.js'
import { UMBRAL_HORAS } from '../Bienestar.jsx'

export default function MiObra() {
  const { db, usuario, activos, obraPorId, personaPorId } = useStore()
  const { verPersona } = useUi()
  const obra = obraPorId[usuario.obraId]
  const [modal, setModal] = useState(null)
  const [retiro, setRetiro] = useState(null)
  const equipo = activos.filter((p) => p.obraId === obra.id && p.id !== usuario.persona.id)
  const alertas = alertasCertificados(equipo)
  const pulso = agregarPulso(db.pulsos.find((p) => p.estado === 'abierto'), (r) => r.obraId === obra.id)
  const jornada = db.jornadas.filter((j) => j.obraId === obra.id).at(-1)
  const canal = db.canal.filter((s) => s.obraId === obra.id && s.estado !== 'respondida')
  const sesiones = db.sesiones.filter((s) => s.asistentes === null && s.fecha >= enDias(0) && s.inscritos.some((id) => equipo.some((p) => p.id === id)))
  const ultimaCharla = db.charlas.filter((c) => c.obraId === obra.id).sort((a, b) => (a.fecha < b.fecha ? 1 : -1))[0]
  const enCierre = obra.fin && diasHasta(obra.fin) < 40
  const evaluados = db.personas.filter((p) => p.historial.some((h) => h.obraId === obra.id))

  const ACCIONES = [
    { id: 'charla', t: 'Charla semanal', d: ultimaCharla ? `Última ${relativo(ultimaCharla.fecha)}` : 'Sin registro', icono: CalendarCheck },
    { id: 'nominar', t: 'Nominar a Reconoce CZ', d: 'Seguridad, equipo, cumplimiento o apoyo', icono: Award },
    { id: 'retro', t: 'Retroalimentación', d: 'Reconocer o señalar una mejora', icono: MessageSquareHeart },
    { id: 'desempeno', t: 'Conversación trimestral', d: 'Fortalezas y aprendizajes', icono: MessagesSquare },
    { id: 'bienestar', t: 'Reportar bienestar', d: 'Carga, molestias o necesidades', icono: HeartPulse },
    { id: 'personal', t: 'Solicitar personal', d: 'Pedir a Gestión Humana', icono: ClipboardList },
  ]

  return (
    <>
      <PageHead modulo="Líder de obra" titulo={obra.nombre} descripcion={`${obra.cliente} · ${obra.ciudad} · Fase: ${obra.fase}`}>
        <span className="fila peq sec" style={{ gap: 6 }}><CalendarRange size={15} />Entrega {fecha(obra.fin)} · {relativo(obra.fin)}</span>
      </PageHead>

      {enCierre && (
        <div className="aviso ocre" style={{ marginBottom: 16 }}>
          <Clock />
          <span><b>Cierre de obra en {diasHasta(obra.fin)} días.</b> Registre la evaluación de cierre de cada trabajador ({evaluados.length === 0 ? 'ninguno evaluado aún' : evaluados.length === 1 ? '1 evaluado' : `${evaluados.length} evaluados`}): así CZ sabe a quién volver a llamar en las próximas obras. Vigile también jornadas y pausas.</span>
        </div>
      )}

      <div className="grid g-4">
        <Kpi etiqueta="Mi cuadrilla" valor={equipo.length + 1} unidad={` / ${requeridosTotales(obra)}`} icono={Users} pie="Personas asignadas frente a requeridas" />
        <Kpi etiqueta="Certificados por atender" valor={alertas.filter((a) => a.estado.id !== 'pendiente').length} icono={ShieldAlert} tono="rojo" pie={alertas[0] ? `${alertas[0].persona.nombre.split(' ').slice(0, 2).join(' ')} · ${alertas[0].estado.nombre.toLowerCase()}` : 'Todo al día'} />
        <Kpi etiqueta="Horas promedio última semana" valor={num(jornada?.horas)} unidad=" h" icono={Clock} tono={jornada?.horas > UMBRAL_HORAS ? 'rojo' : ''} pie={`${jornada?.pausas ?? 0} pausas activas · alerta > ${UMBRAL_HORAS} h`} onClick={() => ir('bienestar')} />
        <Kpi etiqueta="Pulso CZ de la obra" valor={pulso.n} unidad={` / ${equipo.length + 1}`} icono={Gauge} pie={pulso.n >= 5 ? `Índice ${num(pulso.indice)} · salud y carga ${num(pulso.dims.salud)}` : 'Se muestra desde 5 respuestas'} onClick={() => ir('escucha')} />
      </div>

      <div className="grid g-3 mt-16" style={{ gridTemplateColumns: 'repeat(6, minmax(0, 1fr))', gap: 10 }}>
        {ACCIONES.map((a) => (
          <button key={a.id} className="acceso" onClick={() => (a.id === 'personal' ? ir('lider/solicitudes') : setModal(a.id))}>
            <a.icono />
            <strong>{a.t}</strong>
            <span>{a.d}</span>
          </button>
        ))}
      </div>

      <div className="grid g-21 mt-16">
        <Card titulo="Mi cuadrilla" sub="Certificados, formación y evaluación de cierre" flush>
          <div className="tabla-wrap">
            <table className="tabla">
              <thead><tr><th>Trabajador</th><th>Certificados</th><th style={{ width: 140 }}>Formación</th><th></th></tr></thead>
              <tbody>
                {equipo.sort((a, b) => a.cargo.localeCompare(b.cargo)).map((p) => {
                  const al = alertas.filter((a) => a.persona.id === p.id)
                  const c = cumplimientoPersona(p)
                  return (
                    <tr key={p.id}>
                      <td className="click" style={{ cursor: 'pointer' }} onClick={() => verPersona(p.id)}><Persona persona={p} detalle={cargoPorId[p.cargo].nombre} /></td>
                      <td>{al[0] ? <Badge tono={al[0].estado.tono} punto>{al[0].corto} · {al[0].estado.nombre.toLowerCase()}</Badge> : <Badge tono="good" punto>Al día</Badge>}</td>
                      <td><div className="fila"><div style={{ flex: 1 }}><Progreso valor={c.pct} tono={c.pct < 0.6 ? 'ocre' : ''} /></div><span className="xs muted num">{c.hechos}/{c.total}</span></div></td>
                      <td className="derecha">{enCierre && <button className="btn sm" onClick={() => setRetiro(p.id)}><LogOut />Evaluar cierre</button>}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          {evaluados.length > 0 && <div className="card-pie"><span>{evaluados.length} personas evaluadas al cierre ya están en el banco de talento</span></div>}
        </Card>
        <div className="stack">
          <Card titulo="Canal CZ · mi obra" sub={`${canal.length} inquietudes sin respuesta`} flush pie={<><span>Responder en ≤ 15 días</span><a href="#/escucha?tab=canal">Ver todas</a></>}>
            {canal.length === 0 && <Vacio titulo="Sin pendientes" />}
            <ul className="lista">
              {canal.slice(0, 4).map((s) => (
                <li key={s.id}>
                  <span className="icono-alerta warning"><MessageCircle /></span>
                  <div className="cuerpo"><div className="titulo trunc">{s.texto}</div><div className="meta-l">{s.categoria} · responder {relativo(s.fechaLimite)}</div></div>
                </li>
              ))}
            </ul>
          </Card>
          <Card titulo="Capacitaciones de mi cuadrilla" flush>
            {sesiones.length === 0 && <Vacio titulo="Nada programado" />}
            <ul className="lista">
              {sesiones.map((s) => (
                <li key={s.id}>
                  <span className="icono-alerta good"><GraduationCap /></span>
                  <div className="cuerpo"><div className="titulo">{cursoPorId[s.cursoId].nombre}</div><div className="meta-l">{fecha(s.fecha)} · {s.lugar}</div></div>
                  <span className="xs muted num">{s.inscritos.filter((id) => equipo.some((p) => p.id === id)).length} de mi obra</span>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>

      {modal === 'charla' && <CharlaForm obraId={obra.id} onClose={() => setModal(null)} />}
      {modal === 'nominar' && <NominarForm obraId={obra.id} onClose={() => setModal(null)} />}
      {modal === 'retro' && <RetroForm obraId={obra.id} onClose={() => setModal(null)} />}
      {modal === 'desempeno' && <DesempenoForm obraId={obra.id} onClose={() => setModal(null)} />}
      {modal === 'bienestar' && <ReporteBienestarForm obraId={obra.id} personaId={usuario.persona.id} onClose={() => setModal(null)} />}
      {retiro && <Retiro persona={personaPorId[retiro]} onClose={() => setRetiro(null)} onDone={() => setRetiro(null)} />}
    </>
  )
}
