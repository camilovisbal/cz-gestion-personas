import { useMemo, useState } from 'react'
import { Search, Download, UserPlus, Star, Users, Zap, RotateCcw, FileCheck2 } from 'lucide-react'
import { useStore } from '../../store/Store.jsx'
import { useUi } from '../../store/ui.js'
import { PageHead, Card, Badge, Persona, Kpi, Vacio } from '../../components/ui.jsx'
import { CARGOS, cargoPorId, CERTIFICADOS, CIUDADES, DISPONIBILIDAD, TIPOS_PROYECTO } from '../../data/catalogos.js'
import { certificadoValido, estadoCertificado, num } from '../../lib/dominio.js'
import { ir } from '../../lib/router.js'
import { exportarCSV } from './VacanteDetalle.jsx'

const CORTO_TIPO = { cubiertas: 'Cubiertas', edificaciones: 'Edificaciones', industrial: 'Industrial', remodelacion: 'Remodelación', civil: 'Obra civil' }

export default function Banco() {
  const { banco } = useStore()
  const { verPersona } = useUi()
  const [f, setF] = useState({ q: '', cargo: '', ciudad: '', disp: '', exp: 0, tipo: '', alturas: false, exCz: false })
  const set = (k, v) => setF((s) => ({ ...s, [k]: v }))

  const lista = useMemo(() => banco.filter((p) => {
    if (f.q && !p.nombre.toLowerCase().includes(f.q.toLowerCase())) return false
    if (f.cargo && p.cargo !== f.cargo) return false
    if (f.ciudad && p.ciudad !== f.ciudad) return false
    if (f.disp && p.disponibilidad !== f.disp) return false
    if (p.anios < f.exp) return false
    if (f.tipo && !p.experiencia.some((e) => e.tipo === f.tipo)) return false
    if (f.alturas && !certificadoValido(p, 'alturas')) return false
    if (f.exCz && !p.historial.length) return false
    return true
  }).sort((a, b) => (a.fechaRegistro < b.fechaRegistro ? 1 : -1)), [banco, f])

  const hayFiltros = f.q || f.cargo || f.ciudad || f.disp || f.exp || f.tipo || f.alturas || f.exCz
  const porVerificar = banco.filter((p) => p.certificados.some((c) => !c.verificado)).length

  const exportar = () => exportarCSV('banco-de-talento-cz.csv', [
    ['Nombre', 'Cargo', 'Años', 'Tipos de obra', 'Ciudad', 'Disponibilidad', 'Traslado', 'Teléfono', 'Alturas', 'Historial CZ'],
    ...lista.map((p) => [p.nombre, cargoPorId[p.cargo].nombre, p.anios, p.experiencia.map((e) => TIPOS_PROYECTO.find((t) => t.id === e.tipo)?.nombre).join(', '), p.ciudad, DISPONIBILIDAD.find((d) => d.id === p.disponibilidad)?.nombre, p.viaja ? 'Sí' : 'No', p.telefono, estadoCertificado(p.certificados.find((c) => c.tipo === 'alturas')).nombre, p.historial.length ? num(p.historial[0].calificacion) : '']),
  ])

  return (
    <>
      <PageHead modulo="CZ Talento" titulo="Banco de talento" descripcion="Candidatos y ex trabajadores disponibles para futuras obras. Filtre por oficio, experiencia específica, certificados y disponibilidad.">
        <button className="btn" onClick={exportar}><Download />Exportar</button>
        <button className="btn primario" onClick={() => ir('talento/registro')}><UserPlus />Registrar candidato</button>
      </PageHead>

      <div className="grid g-4" style={{ marginBottom: 16 }}>
        <Kpi etiqueta="Personas en el banco" valor={banco.length} icono={Users} pie={`${CARGOS.filter((c) => banco.some((p) => p.cargo === c.id)).length} oficios distintos`} />
        <Kpi etiqueta="Disponibles de inmediato" valor={banco.filter((p) => p.disponibilidad === 'inmediata').length} icono={Zap} pie="Listos para una obra nueva" onClick={() => set('disp', 'inmediata')} />
        <Kpi etiqueta="Ex trabajadores recontratables" valor={banco.filter((p) => p.historial.length && p.historial.every((h) => h.recontratable)).length} icono={RotateCcw} pie="Talento conocido por CZ" onClick={() => set('exCz', true)} />
        <Kpi etiqueta="Con documentos por verificar" valor={porVerificar} icono={FileCheck2} tono="ocre" pie="Verificar antes de contratar" />
      </div>

      <Card flush>
        <div className="filtros" style={{ padding: '4px 16px 0', marginBottom: 6 }}>
          <div className="buscar"><Search /><input className="input" placeholder="Buscar por nombre" value={f.q} onChange={(e) => set('q', e.target.value)} /></div>
          <select className="select" value={f.cargo} onChange={(e) => set('cargo', e.target.value)}>
            <option value="">Todos los cargos</option>
            {CARGOS.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
          </select>
          <select className="select" value={f.tipo} onChange={(e) => set('tipo', e.target.value)}>
            <option value="">Cualquier tipo de obra</option>
            {TIPOS_PROYECTO.map((t) => <option key={t.id} value={t.id}>{t.nombre}</option>)}
          </select>
          <select className="select" value={f.exp} onChange={(e) => set('exp', Number(e.target.value))}>
            <option value={0}>Cualquier experiencia</option>
            {[1, 2, 3, 5, 8].map((n) => <option key={n} value={n}>≥ {n} años</option>)}
          </select>
          <select className="select" value={f.disp} onChange={(e) => set('disp', e.target.value)}>
            <option value="">Cualquier disponibilidad</option>
            {DISPONIBILIDAD.map((d) => <option key={d.id} value={d.id}>{d.nombre}</option>)}
          </select>
          <select className="select" value={f.ciudad} onChange={(e) => set('ciudad', e.target.value)}>
            <option value="">Todas las ciudades</option>
            {CIUDADES.map((c) => <option key={c}>{c}</option>)}
          </select>
          <label className="check"><input type="checkbox" checked={f.alturas} onChange={(e) => set('alturas', e.target.checked)} />Alturas vigente</label>
          <label className="check"><input type="checkbox" checked={f.exCz} onChange={(e) => set('exCz', e.target.checked)} />Trabajó en CZ</label>
          {hayFiltros && <button className="btn sm fantasma" onClick={() => setF({ q: '', cargo: '', ciudad: '', disp: '', exp: 0, tipo: '', alturas: false, exCz: false })}>Limpiar filtros</button>}
        </div>
        <div className="tabla-wrap">
          <table className="tabla">
            <thead>
              <tr><th>Persona</th><th>Experiencia · tipos de obra (proyectos)</th><th>Certificados</th><th>Disponibilidad</th><th>Historial CZ</th></tr>
            </thead>
            <tbody>
              {lista.map((p) => (
                <tr key={p.id} className="click" onClick={() => verPersona(p.id)}>
                  <td><Persona persona={p} detalle={`${cargoPorId[p.cargo].nombre} · ${p.ciudad}`} /></td>
                  <td><div className="fila wrap" style={{ gap: 6, maxWidth: 270 }}><b className="num" style={{ minWidth: 52, whiteSpace: 'nowrap' }}>{p.anios} {p.anios === 1 ? 'año' : 'años'}</b>{p.experiencia.slice(0, 2).map((e) => <span key={e.tipo} className="chip" style={{ whiteSpace: 'nowrap' }}>{CORTO_TIPO[e.tipo]} · {e.proyectos}</span>)}</div></td>
                  <td>
                    <div className="fila wrap" style={{ gap: 4, maxWidth: 200 }}>
                      {cargoPorId[p.cargo].certificados.map((t) => {
                        const e = estadoCertificado(p.certificados.find((c) => c.tipo === t))
                        return <span key={t} title={`${CERTIFICADOS[t].nombre}: ${e.nombre}`} className={`badge ${e.tono}`} style={{ padding: '0 7px' }}><i className="punto" />{CERTIFICADOS[t].corto}</span>
                      })}
                    </div>
                  </td>
                  <td><Badge tono={p.disponibilidad === 'inmediata' ? 'good' : p.disponibilidad === 'no' ? '' : 'warning'} punto>{DISPONIBILIDAD.find((d) => d.id === p.disponibilidad)?.nombre}</Badge></td>
                  <td>{p.historial.length
                    ? <span className="fila" style={{ gap: 5 }}><Star size={13} color={p.historial.every((h) => h.recontratable) ? 'var(--ocre)' : 'var(--rojo)'} fill={p.historial.every((h) => h.recontratable) ? 'var(--ocre)' : 'none'} /><span className="num">{num(p.historial[0].calificacion)}</span>{!p.historial.every((h) => h.recontratable) && <Badge tono="critical">No recontratable</Badge>}</span>
                    : <span className="muted">—</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {lista.length === 0 && <Vacio titulo="Sin resultados">Ajuste los filtros para ver más personas.</Vacio>}
        </div>
        <div className="card-pie"><span>{lista.length} de {banco.length} personas</span><span>Los datos se tratan con autorización conforme a la Ley 1581 de 2012</span></div>
      </Card>
    </>
  )
}
