import { useEffect } from 'react'
import { X, Inbox, CheckCircle2 } from 'lucide-react'
import { estadoCertificado, iniciales } from '../lib/dominio.js'
import { CERTIFICADOS } from '../data/catalogos.js'

// Isotipo CZ redibujado en SVG a partir del logo de la presentación.
export function Isotipo({ color = 'var(--verde)', ...props }) {
  return (
    <svg viewBox="0 0 806 1006" aria-hidden="true" {...props}>
      <path fill={color} d="M0 269 398 0v223L184 361v281l214 146v218L0 739z" />
      <path fill={color} d="M409 0l397 266v191L592 604v60l214-145v217L409 1006V507l212-143-212-149z" />
    </svg>
  )
}

export function PageHead({ modulo, titulo, descripcion, migas, children }) {
  return (
    <div className="pagina-head">
      <div>
        {migas && <div className="migas">{migas}</div>}
        {modulo && <div className="etiqueta-modulo">{modulo}</div>}
        <h1>{titulo}</h1>
        {descripcion && <p>{descripcion}</p>}
      </div>
      {children && <div className="acciones">{children}</div>}
    </div>
  )
}

export function Card({ titulo, sub, accion, children, pie, flush, className = '', style }) {
  return (
    <section className={`card ${className}`} style={style}>
      {(titulo || accion) && (
        <div className="card-head">
          <div>
            {titulo && <h3>{titulo}</h3>}
            {sub && <div className="sub">{sub}</div>}
          </div>
          {accion}
        </div>
      )}
      <div className={`card-body ${flush ? 'flush' : ''}`}>{children}</div>
      {pie && <div className="card-pie">{pie}</div>}
    </section>
  )
}

export function Kpi({ etiqueta, valor, unidad, icono: Icono, tono, pie, onClick }) {
  return (
    <div className="card kpi" onClick={onClick} style={onClick ? { cursor: 'pointer' } : undefined}>
      <div className="kpi-top">
        <span>{etiqueta}</span>
        {Icono && <span className={`kpi-icono ${tono ?? ''}`}><Icono /></span>}
      </div>
      <div className="kpi-valor">{valor}{unidad && <small>{unidad}</small>}</div>
      {pie && <div className="kpi-pie">{pie}</div>}
    </div>
  )
}

export function Badge({ tono, children, icono: Icono, punto }) {
  return (
    <span className={`badge ${tono ?? ''}`}>
      {punto && <i className="punto" />}
      {Icono && <Icono />}
      {children}
    </span>
  )
}

const TONOS = ['t1', 't2', 't3', 't4']
export function Avatar({ nombre, size = '' }) {
  const h = [...nombre].reduce((s, c) => s + c.charCodeAt(0), 0)
  return <span className={`avatar ${size} ${TONOS[h % 4]}`}>{iniciales(nombre)}</span>
}

export function Persona({ persona, detalle, size }) {
  return (
    <div className="persona">
      <Avatar nombre={persona.nombre} size={size} />
      <div style={{ minWidth: 0 }}>
        <strong className="trunc">{persona.nombre}</strong>
        {detalle && <span className="trunc">{detalle}</span>}
      </div>
    </div>
  )
}

export function Modal({ titulo, sub, onClose, children, pie, ancho, drawer }) {
  useEffect(() => {
    const on = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', on)
    return () => window.removeEventListener('keydown', on)
  }, [onClose])
  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={drawer ? 'drawer' : `modal ${ancho ? 'ancho' : ''}`} role="dialog" aria-modal="true">
        <div className="modal-head">
          <div style={{ minWidth: 0, flex: 1 }}>
            {typeof titulo === 'string' ? <h2>{titulo}</h2> : titulo}
            {sub && <p>{sub}</p>}
          </div>
          <button className="btn fantasma icono" onClick={onClose} aria-label="Cerrar"><X /></button>
        </div>
        <div className="modal-body">{children}</div>
        {pie && <div className="modal-pie">{pie}</div>}
      </div>
    </div>
  )
}

export function Tabs({ tabs, activo, onChange }) {
  return (
    <div className="tabs" role="tablist">
      {tabs.map((t) => (
        <button key={t.id} role="tab" className={activo === t.id ? 'activo' : ''} onClick={() => onChange(t.id)}>
          {t.icono && <t.icono size={15} />}
          {t.nombre}
          {t.n !== undefined && <span className={`badge ${activo === t.id ? 'good' : ''}`}>{t.n}</span>}
        </button>
      ))}
    </div>
  )
}

export function Segmentado({ opciones, valor, onChange }) {
  return (
    <div className="segmentado">
      {opciones.map((o) => (
        <button key={o.id} className={valor === o.id ? 'activo' : ''} onClick={() => onChange(o.id)}>{o.nombre}</button>
      ))}
    </div>
  )
}

export function Campo({ label, ayuda, children, full }) {
  return (
    <div className={`campo ${full ? 'full' : ''}`}>
      {label && <label>{label}</label>}
      {children}
      {ayuda && <span className="ayuda">{ayuda}</span>}
    </div>
  )
}

export function Progreso({ valor, meta, tono }) {
  const v = Math.max(0, Math.min(1, valor))
  return (
    <div className={`progreso ${tono ?? ''}`}>
      <i style={{ width: `${v * 100}%` }} />
      {meta !== undefined && <span className="meta" style={{ left: `calc(${meta * 100}% - 1px)` }} />}
    </div>
  )
}

export function Vacio({ icono: Icono = Inbox, titulo, children }) {
  return (
    <div className="vacio">
      <Icono />
      <strong>{titulo}</strong>
      {children}
    </div>
  )
}

export function Anillo({ valor, size = 46, grosor = 4.5 }) {
  const r = (size - grosor) / 2
  const c = 2 * Math.PI * r
  const color = valor >= 80 ? 'var(--verde)' : valor >= 60 ? 'var(--ocre)' : 'var(--tinta-3)'
  return (
    <div className="anillo" style={{ width: size, height: size }} title={`Puntaje ${valor} / 100`}>
      <svg width={size} height={size}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--gris-100)" strokeWidth={grosor} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={grosor} strokeLinecap="round"
          strokeDasharray={`${(valor / 100) * c} ${c}`} transform={`rotate(-90 ${size / 2} ${size / 2})`} />
      </svg>
      <span style={{ fontSize: size * 0.3 }}>{valor}</span>
    </div>
  )
}

export function EstadoCert({ persona, tipo, conNombre }) {
  const c = persona.certificados.find((x) => x.tipo === tipo)
  const e = estadoCertificado(c)
  return (
    <Badge tono={e.tono} punto>{conNombre ? `${CERTIFICADOS[tipo].nombre} · ` : ''}{e.nombre}</Badge>
  )
}

export function Toasts({ toasts }) {
  return (
    <div className="toasts" aria-live="polite">
      {toasts.map((t) => <div key={t.id} className="toast"><CheckCircle2 />{t.texto}</div>)}
    </div>
  )
}

export function Dato({ label, children }) {
  return <div className="dato"><span>{label}</span><strong>{children ?? '—'}</strong></div>
}
