import { useState } from 'react'
import { Award, ShieldCheck, Users, CheckSquare, HandHeart, Plus, MessageSquareHeart, ThumbsUp, Sparkles, Scale } from 'lucide-react'
import { useStore } from '../store/Store.jsx'
import { useUi } from '../store/ui.js'
import { PageHead, Card, Badge, Kpi, Avatar, Vacio } from '../components/ui.jsx'
import { Barras } from '../components/charts.jsx'
import { NominarForm, RetroForm } from '../components/Formularios.jsx'
import { cargoPorId, CRITERIOS_RECONOCIMIENTO } from '../data/catalogos.js'
import { fecha, inicioMes, mesLargo } from '../lib/fechas.js'
import { agregarPulso, num } from '../lib/dominio.js'

const ICONO = { seguridad: ShieldCheck, equipo: Users, cumplimiento: CheckSquare, apoyo: HandHeart }

export default function Reconoce() {
  const { db, rol, usuario, acciones, personaPorId, obraPorId } = useStore()
  const { verPersona } = useUi()
  const obraLider = rol === 'lider' ? usuario.obraId : null
  const [nominar, setNominar] = useState(false)
  const [retro, setRetro] = useState(false)
  const mesActual = inicioMes(0)
  const mesAnterior = inicioMes(-1)
  const enAlcance = (n) => !obraLider || personaPorId[n.personaId]?.obraId === obraLider

  const reconocidos = db.nominaciones.filter((n) => n.estado === 'reconocido' && enAlcance(n))
  const delMesAnterior = reconocidos.filter((n) => n.mes === mesAnterior)
  const nominados = db.nominaciones.filter((n) => n.mes === mesActual && enAlcance(n))
  const retros = db.retro.filter((r) => !obraLider || personaPorId[r.personaId]?.obraId === obraLider)
  const positivas = retros.filter((r) => r.tipo === 'positivo').length
  const clima = agregarPulso(db.pulsos.find((p) => p.estado === 'abierto'))
  const base = agregarPulso(db.pulsos[0])

  const todos = db.nominaciones.filter(enAlcance)
  const porObra = db.obras.filter((o) => ['activa', 'oficina'].includes(o.estado) && (!obraLider || o.id === obraLider)).map((o) => ({ id: o.id, nombre: o.nombre, valor: todos.filter((n) => personaPorId[n.personaId]?.obraId === o.id).length }))
  const cargos = [...new Set(todos.map((n) => personaPorId[n.personaId]?.cargo))].filter(Boolean)
  const porCargo = cargos.map((c) => ({ id: c, nombre: cargoPorId[c].nombre, valor: todos.filter((n) => personaPorId[n.personaId]?.cargo === c).length })).sort((a, b) => b.valor - a.valor)

  return (
    <>
      <PageHead modulo="Estrategia 1 · Reconocer" titulo="Reconoce CZ"
        descripcion="Reconocer cada mes las buenas prácticas de seguridad, trabajo en equipo, cumplimiento y apoyo a compañeros, con criterios visibles para que no dependa de favoritismos.">
        <button className="btn" onClick={() => setRetro(true)}><MessageSquareHeart />Retroalimentación</button>
        <button className="btn primario" onClick={() => setNominar(true)}><Plus />Nominar</button>
      </PageHead>

      <div className="grid g-4">
        <Kpi etiqueta="Reconocimientos otorgados" valor={reconocidos.length} icono={Award} pie="Desde que se activó Reconoce CZ" />
        <Kpi etiqueta={`Nominaciones de ${mesLargo(mesActual).split(' ')[0]}`} valor={nominados.length} icono={Sparkles} pie={`${nominados.filter((n) => n.estado === 'nominado').length} por decidir`} />
        <Kpi etiqueta="Retroalimentación positiva" valor={retros.length ? Math.round((positivas / retros.length) * 100) : 0} unidad=" %" icono={ThumbsUp} pie={`${positivas} de ${retros.length} mensajes · no solo llamados de atención`} />
        <Kpi etiqueta="Reconocimiento (Pulso CZ)" valor={num(clima.dims.reconocimiento)} unidad=" / 5" icono={Scale} pie={`Partida ${num(base.dims.reconocimiento)} · meta a 6 meses ≥ 3,5`} />
      </div>

      <Card titulo="Criterios visibles" sub="Se publican en cada obra; cualquier cargo puede ser nominado por su líder o compañeros" className="mt-16">
        <div className="grid g-4">
          {CRITERIOS_RECONOCIMIENTO.map((c) => {
            const I = ICONO[c.id]
            return (
              <div key={c.id} className="fila" style={{ alignItems: 'flex-start', gap: 12 }}>
                <span className="kpi-icono" style={{ width: 36, height: 36 }}><I /></span>
                <div><div className="b">{c.nombre}</div><div className="peq muted">{c.descripcion}</div></div>
              </div>
            )
          })}
        </div>
      </Card>

      <div className="fila-sb mt-24" style={{ marginBottom: 12 }}>
        <h3 style={{ fontSize: 15 }}>Reconocidos de {mesLargo(mesAnterior)}</h3>
        <span className="peq muted">Se anuncian en la charla semanal y en el tablero de cada obra</span>
      </div>
      {delMesAnterior.length === 0 ? <Card><Vacio icono={Award} titulo="Sin reconocimientos ese mes" /></Card> : (
        <div className="muro">
          {delMesAnterior.map((n) => {
            const p = personaPorId[n.personaId]
            const crit = CRITERIOS_RECONOCIMIENTO.find((c) => c.id === n.criterio)
            const I = ICONO[n.criterio]
            return (
              <div key={n.id} className="card reco" style={{ cursor: 'pointer' }} onClick={() => verPersona(p.id)}>
                <div className="criterio"><I />{crit.nombre}</div>
                <div className="fila"><Avatar nombre={p.nombre} size="lg" /><div><div className="b">{p.nombre}</div><div className="peq muted">{cargoPorId[p.cargo].nombre}</div><div className="xs muted">{obraPorId[p.obraId]?.nombre}</div></div></div>
                <div className="peq sec">“{n.motivo}”</div>
                <div className="xs muted" style={{ marginTop: 'auto' }}>Nominado por {personaPorId[n.nominadoPor]?.nombre}</div>
              </div>
            )
          })}
        </div>
      )}

      <div className="grid g-21 mt-16">
        <Card titulo={`Nominaciones de ${mesLargo(mesActual)}`} sub={rol === 'admin' ? 'Gerencia y jefes de área deciden con base en los criterios' : 'Su líder y Gestión Humana revisan cada nominación'} flush>
          {nominados.length === 0 && <Vacio titulo="Aún no hay nominaciones este mes" />}
          <ul className="lista">
            {nominados.map((n) => {
              const p = personaPorId[n.personaId]
              const crit = CRITERIOS_RECONOCIMIENTO.find((c) => c.id === n.criterio)
              return (
                <li key={n.id} style={{ alignItems: 'flex-start' }}>
                  <Avatar nombre={p.nombre} />
                  <div className="cuerpo">
                    <div className="titulo"><span style={{ cursor: 'pointer' }} onClick={() => verPersona(p.id)}>{p.nombre}</span> <span className="muted" style={{ fontWeight: 400 }}>· {cargoPorId[p.cargo].nombre} · {obraPorId[p.obraId]?.nombre}</span></div>
                    <div className="peq mt-8" style={{ marginTop: 3 }}>“{n.motivo}”</div>
                    <div className="xs muted mt-8" style={{ marginTop: 4 }}>Nominado por {personaPorId[n.nominadoPor]?.nombre}</div>
                  </div>
                  <div className="stack" style={{ gap: 6, alignItems: 'flex-end' }}>
                    <Badge tono="info">{crit.nombre}</Badge>
                    {n.estado === 'reconocido'
                      ? <Badge tono="good" icono={Award}>Reconocido</Badge>
                      : rol === 'admin' && <button className="btn sm primario" onClick={() => acciones.reconocer(n.id)}><Award />Reconocer</button>}
                  </div>
                </li>
              )
            })}
          </ul>
        </Card>
        <div className="stack">
          <Card titulo="Transparencia" sub="Distribución de nominaciones · ayuda a evitar que se concentren en pocas personas u obras">
            <div className="seccion-t" style={{ marginTop: 0 }}>Por obra</div>
            <Barras datos={porObra} />
            <div className="seccion-t">Por cargo</div>
            <Barras datos={porCargo.slice(0, 5)} />
          </Card>
          <Card titulo="Retroalimentación reciente" flush>
            <ul className="lista">
              {retros.slice(0, 5).map((r) => (
                <li key={r.id} style={{ alignItems: 'flex-start' }}>
                  <span className={`icono-alerta ${r.tipo === 'positivo' ? 'good' : 'warning'}`}>{r.tipo === 'positivo' ? <ThumbsUp /> : <Sparkles />}</span>
                  <div className="cuerpo"><div className="titulo">{personaPorId[r.personaId]?.nombre}</div><div className="peq sec">{r.texto}</div><div className="xs muted">{fecha(r.fecha)}</div></div>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
      {nominar && <NominarForm obraId={obraLider} onClose={() => setNominar(false)} />}
      {retro && <RetroForm obraId={obraLider} onClose={() => setRetro(false)} />}
    </>
  )
}
