import { useMemo, useState } from 'react'
import { Plus, MapPin, CalendarClock, Users, Check, X, Sparkles, ClipboardList } from 'lucide-react'
import { useStore } from '../../store/Store.jsx'
import { PageHead, Badge, Progreso, Segmentado, Vacio, Avatar } from '../../components/ui.jsx'
import VacanteForm from '../../components/VacanteForm.jsx'
import { cargoPorId, CERTIFICADOS, TIPOS_PROYECTO } from '../../data/catalogos.js'
import { rankingVacante } from '../../lib/dominio.js'
import { fecha, relativo, diasHasta } from '../../lib/fechas.js'
import { ir, useRuta } from '../../lib/router.js'

const ESTADOS = { abierta: { t: 'Abierta', tono: 'good' }, solicitada: { t: 'Por aprobar', tono: 'warning' }, cerrada: { t: 'Cerrada', tono: '' } }

export default function Vacantes({ lider }) {
  const { db, acciones, obraPorId, personaPorId, usuario } = useStore()
  const { query } = useRuta()
  const [form, setForm] = useState(query.nueva === '1')
  const [filtro, setFiltro] = useState(lider ? 'todas' : 'abierta')

  const lista = useMemo(() => db.vacantes
    .filter((v) => !lider || v.obraId === usuario.obraId)
    .filter((v) => filtro === 'todas' || v.estado === filtro)
    .map((v) => {
      const posts = db.postulaciones.filter((p) => p.vacanteId === v.id)
      const ranking = rankingVacante(db.personas, v)
      return {
        v, posts,
        contratados: posts.filter((p) => p.etapa === 'contratado').length,
        enProceso: posts.filter((p) => !['contratado', 'descartado'].includes(p.etapa)).length,
        sugeridos: ranking.filter((r) => r.apto && r.puntaje >= 70 && !posts.some((p) => p.personaId === r.persona.id)).length,
      }
    }), [db, filtro, lider, usuario.obraId])

  const cuenta = (e) => db.vacantes.filter((v) => (!lider || v.obraId === usuario.obraId) && (e === 'todas' || v.estado === e)).length

  return (
    <>
      <PageHead modulo={lider ? 'Mi obra' : 'CZ Talento'} titulo={lider ? 'Solicitudes de personal' : 'Vacantes'}
        descripcion={lider
          ? `Pida el personal que necesita ${obraPorId[usuario.obraId].nombre}. Gestión Humana aprueba la solicitud y busca en el banco de talento.`
          : 'Cada vacante nace de una necesidad de obra. El sistema compara el perfil pedido con el banco de talento y ordena a los candidatos.'}>
        <button className="btn primario" onClick={() => setForm(true)}>{lider ? <><ClipboardList />Solicitar personal</> : <><Plus />Nueva vacante</>}</button>
      </PageHead>

      <div className="filtros">
        <Segmentado valor={filtro} onChange={setFiltro} opciones={[
          { id: 'abierta', nombre: `Abiertas (${cuenta('abierta')})` },
          { id: 'solicitada', nombre: `Por aprobar (${cuenta('solicitada')})` },
          { id: 'cerrada', nombre: `Cerradas (${cuenta('cerrada')})` },
          { id: 'todas', nombre: 'Todas' },
        ]} />
      </div>

      {lista.length === 0 && <div className="card"><Vacio titulo="No hay vacantes en este estado">Cree una nueva vacante cuando una obra necesite personal.</Vacio></div>}

      <div className="grid g-2">
        {lista.map(({ v, posts, contratados, enProceso, sugeridos }) => {
          const obra = obraPorId[v.obraId]
          const dias = diasHasta(v.fechaLimite)
          const est = ESTADOS[v.estado]
          return (
            <div key={v.id} className="card" style={{ cursor: lider ? 'default' : 'pointer' }} onClick={() => !lider && ir(`talento/vacantes/${v.id}`)}>
              <div className="card-body" style={{ paddingTop: 16 }}>
                <div className="fila-sb" style={{ alignItems: 'flex-start' }}>
                  <div>
                    <div className="fila" style={{ gap: 8 }}>
                      <h3 style={{ fontSize: 16 }}>{v.cantidad} × {cargoPorId[v.cargo].nombre}</h3>
                      <Badge tono={est.tono}>{est.t}</Badge>
                    </div>
                    <div className="sec peq mt-8" style={{ marginTop: 3 }}>{obra.nombre} · {TIPOS_PROYECTO.find((t) => t.id === v.tipoProyecto)?.nombre}</div>
                  </div>
                  {v.estado === 'abierta' && sugeridos > 0 && <Badge tono="info" icono={Sparkles}>{sugeridos} {sugeridos === 1 ? 'sugerido' : 'sugeridos'}</Badge>}
                </div>
                <div className="chips mt-12">
                  <span className="chip">≥ {v.expMin} años</span>
                  {v.certificados.map((c) => <span key={c} className="chip">{CERTIFICADOS[c].nombre}</span>)}
                  {v.habilidades.slice(0, 3).map((h) => <span key={h} className="chip">{h}</span>)}
                </div>
                <div className="fila mt-16 peq sec wrap" style={{ gap: 16 }}>
                  <span className="fila" style={{ gap: 5 }}><MapPin size={14} />{v.ciudad}</span>
                  <span className="fila" style={{ gap: 5, color: v.estado === 'abierta' && dias < 5 ? 'var(--rojo)' : undefined }}><CalendarClock size={14} />Cubrir {v.estado === 'cerrada' ? `antes del ${fecha(v.fechaLimite)}` : relativo(v.fechaLimite)}</span>
                  <span className="fila" style={{ gap: 5 }}><Users size={14} />{enProceso} en proceso</span>
                </div>
                <div className="mt-16">
                  <div className="fila-sb xs muted" style={{ marginBottom: 5 }}>
                    <span>Contratados</span><span className="num">{contratados} de {v.cantidad}</span>
                  </div>
                  <Progreso valor={contratados / v.cantidad} />
                </div>
              </div>
              {v.estado === 'solicitada' && (
                <div className="card-pie" onClick={(e) => e.stopPropagation()}>
                  <span className="fila">
                    {v.solicitadaPor && personaPorId[v.solicitadaPor] && <Avatar nombre={personaPorId[v.solicitadaPor].nombre} size="sm" />}
                    Solicitada por {personaPorId[v.solicitadaPor]?.nombre ?? 'líder de obra'} · {fecha(v.creada)}
                  </span>
                  {!lider
                    ? <span className="fila"><button className="btn sm peligro" onClick={() => acciones.cerrarVacante(v.id)}><X />Rechazar</button><button className="btn sm primario" onClick={() => acciones.aprobarVacante(v.id)}><Check />Aprobar</button></span>
                    : <Badge tono="warning">En revisión por Gestión Humana</Badge>}
                </div>
              )}
              {lider && v.estado !== 'solicitada' && (
                <div className="card-pie">
                  <span>{posts.length} candidatos en total</span>
                  <span>{contratados > 0 ? `${contratados} ya contratados` : 'Gestión Humana está seleccionando'}</span>
                </div>
              )}
            </div>
          )
        })}
      </div>
      {form && <VacanteForm onClose={() => setForm(false)} obraFija={lider ? usuario.obraId : null} solicitud={lider} />}
    </>
  )
}
