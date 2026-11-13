import { useMemo, useState } from 'react'
import { Sparkles } from 'lucide-react'
import { useStore } from '../store/Store.jsx'
import { Modal, Campo } from './ui.jsx'
import { CARGOS, cargoPorId, CERTIFICADOS, CIUDADES, DISPONIBILIDAD, TIPOS_PROYECTO } from '../data/catalogos.js'
import { rankingVacante } from '../lib/dominio.js'
import { enDias } from '../lib/fechas.js'
import { ir } from '../lib/router.js'

export default function VacanteForm({ onClose, obraFija, solicitud }) {
  const { db, acciones, usuario } = useStore()
  const obras = db.obras.filter((o) => ['activa', 'planeacion', 'oficina'].includes(o.estado))
  const obraInicial = obras.find((o) => o.id === obraFija) ?? obras.find((o) => o.estado === 'planeacion') ?? obras[0]
  const [v, setV] = useState({
    obraId: obraInicial.id, cargo: 'soldador', cantidad: 2, expMin: 3,
    tipoProyecto: obraInicial.tipo ?? 'edificaciones', habilidades: ['Estructuras metálicas', 'Cubiertas'],
    certificados: ['alturas'], ciudad: obraInicial.ciudad, aceptaViajeros: true, disponibilidad: 'inmediata',
    fechaLimite: enDias(14), descripcion: '',
  })
  const set = (k, val) => setV((s) => ({ ...s, [k]: val }))
  const cargo = cargoPorId[v.cargo]
  const toggle = (k, x) => set(k, v[k].includes(x) ? v[k].filter((y) => y !== x) : [...v[k], x])

  const ranking = useMemo(() => rankingVacante(db.personas, { ...v, cantidad: Number(v.cantidad), expMin: Number(v.expMin) }), [db.personas, v])
  const aptos = ranking.filter((r) => r.apto)
  const altos = aptos.filter((r) => r.puntaje >= 70)

  const guardar = () => {
    const id = acciones.crearVacante({ ...v, cantidad: Number(v.cantidad), expMin: Number(v.expMin), solicitadaPor: solicitud ? usuario.persona?.id : null }, solicitud)
    onClose()
    if (!solicitud) ir(`talento/vacantes/${id}`)
  }

  return (
    <Modal ancho titulo={solicitud ? 'Solicitar personal para la obra' : 'Nueva vacante'}
      sub={solicitud ? 'Gestión Humana revisa la solicitud y busca candidatos en el banco de talento.' : 'Defina el perfil según la necesidad real de la obra, no solo el cargo.'}
      onClose={onClose}
      pie={<>
        <span className="peq sec" style={{ marginRight: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Sparkles size={15} color="var(--verde)" />
          <b className="num" style={{ color: 'var(--tinta)' }}>{aptos.length}</b> personas del banco cumplen los requisitos · <b className="num" style={{ color: 'var(--tinta)' }}>{altos.length}</b> con coincidencia alta
        </span>
        <button className="btn" onClick={onClose}>Cancelar</button>
        <button className="btn primario" onClick={guardar}>{solicitud ? 'Enviar solicitud' : 'Publicar y ver candidatos'}</button>
      </>}>
      <div className="form-grid">
        <Campo label="Obra">
          <select className="select" value={v.obraId} disabled={!!obraFija} onChange={(e) => {
            const o = obras.find((x) => x.id === e.target.value)
            setV((s) => ({ ...s, obraId: o.id, ciudad: o.ciudad, tipoProyecto: o.tipo ?? s.tipoProyecto }))
          }}>
            {obras.map((o) => <option key={o.id} value={o.id}>{o.nombre}</option>)}
          </select>
        </Campo>
        <Campo label="Cargo">
          <select className="select" value={v.cargo} onChange={(e) => {
            const c = cargoPorId[e.target.value]
            setV((s) => ({ ...s, cargo: c.id, habilidades: c.habilidades.slice(0, 2), certificados: c.certificados.filter((x) => x === 'alturas' || x === 'copnia') }))
          }}>
            {CARGOS.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
          </select>
        </Campo>
        <Campo label="Personas requeridas">
          <input className="input num" type="number" min="1" max="30" value={v.cantidad} onChange={(e) => set('cantidad', e.target.value)} />
        </Campo>
        <Campo label="Experiencia mínima en el oficio (años)">
          <input className="input num" type="number" min="0" max="20" value={v.expMin} onChange={(e) => set('expMin', e.target.value)} />
        </Campo>
        <Campo label="Tipo de obra (experiencia específica)" ayuda="Se valora la experiencia en trabajos similares, no solo en el oficio.">
          <select className="select" value={v.tipoProyecto} onChange={(e) => set('tipoProyecto', e.target.value)}>
            {TIPOS_PROYECTO.map((t) => <option key={t.id} value={t.id}>{t.nombre}</option>)}
          </select>
        </Campo>
        <Campo label="Disponibilidad requerida">
          <select className="select" value={v.disponibilidad} onChange={(e) => set('disponibilidad', e.target.value)}>
            {DISPONIBILIDAD.filter((d) => d.id !== 'no').map((d) => <option key={d.id} value={d.id}>{d.nombre}</option>)}
          </select>
        </Campo>
        <Campo label="Habilidades requeridas" full>
          <div className="toggle-group">
            {cargo.habilidades.map((h) => <button key={h} className={v.habilidades.includes(h) ? 'on' : ''} onClick={() => toggle('habilidades', h)}>{h}</button>)}
          </div>
        </Campo>
        <Campo label="Certificados obligatorios" ayuda="Quien no los tenga vigentes queda fuera de la lista (con el motivo visible)." full>
          <div className="toggle-group">
            {[...new Set([...cargo.certificados, 'alturas', 'confinados', 'primerosAux'])].map((c) => (
              <button key={c} className={v.certificados.includes(c) ? 'on' : ''} onClick={() => toggle('certificados', c)}>{CERTIFICADOS[c].nombre}</button>
            ))}
          </div>
        </Campo>
        <Campo label="Ciudad de la obra">
          <select className="select" value={v.ciudad} onChange={(e) => set('ciudad', e.target.value)}>
            {CIUDADES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </Campo>
        <Campo label="Fecha límite para cubrir">
          <input className="input" type="date" value={v.fechaLimite} onChange={(e) => set('fechaLimite', e.target.value)} />
        </Campo>
        <Campo label="Descripción de las labores" full>
          <textarea className="textarea" rows={2} value={v.descripcion} onChange={(e) => set('descripcion', e.target.value)} placeholder="Ej.: Montaje de cerchas y cubierta termoacústica en el coliseo…" />
        </Campo>
        <label className="check full">
          <input type="checkbox" checked={v.aceptaViajeros} onChange={(e) => set('aceptaViajeros', e.target.checked)} />
          <span>Aceptar personas de otras ciudades que puedan trasladarse</span>
        </label>
      </div>
    </Modal>
  )
}
