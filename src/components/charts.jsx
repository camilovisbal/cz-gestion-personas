// Gráficos SVG ligeros: marcas delgadas, extremos redondeados, cuadrícula recesiva
// y tooltip al pasar el cursor (sin librerías externas).
import { useMemo, useRef, useState } from 'react'

function useAncho(defecto = 320) {
  const ref = useRef(null)
  const [w, setW] = useState(defecto)
  const set = (el) => {
    if (!el || ref.current === el) return
    ref.current = el
    const ro = new ResizeObserver(([e]) => setW(Math.max(200, e.contentRect.width)))
    ro.observe(el)
  }
  return [set, w]
}

function escalaNice(max) {
  const p = Math.pow(10, Math.floor(Math.log10(max || 1)))
  const n = max / p
  const step = n <= 2 ? 0.5 : n <= 5 ? 1 : 2
  const top = Math.ceil(n / step) * step * p
  return { top, ticks: Array.from({ length: Math.round(top / (step * p)) + 1 }, (_, i) => i * step * p) }
}

// Columnas (una serie). Los puntos "proyectado" se dibujan con trama.
export function Columnas({ datos, alto = 220, formato = (v) => v, etiquetaX, destacar, meta }) {
  const [ref, w] = useAncho()
  const [hover, setHover] = useState(null)
  const pad = { t: 14, r: 8, b: 26, l: 30 }
  const max = Math.max(...datos.map((d) => d.valor), meta?.valor ?? 0)
  const { top, ticks } = escalaNice(max * 1.08)
  const iw = w - pad.l - pad.r
  const ih = alto - pad.t - pad.b
  const bw = Math.min(34, (iw / datos.length) * 0.56)
  const x = (i) => pad.l + (iw / datos.length) * (i + 0.5)
  const y = (v) => pad.t + ih - (v / top) * ih
  const tickStep = ticks.length > 6 ? 2 : 1
  return (
    <div className="chart" ref={ref}>
      <svg width={w} height={alto} onMouseLeave={() => setHover(null)}>
        <defs>
          <pattern id="trama" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <rect width="6" height="6" fill="var(--verde-100)" />
            <line x1="0" y1="0" x2="0" y2="6" stroke="var(--verde-300)" strokeWidth="2.2" />
          </pattern>
        </defs>
        {ticks.filter((_, i) => i % tickStep === 0).map((t) => (
          <g key={t}>
            <line className={t === 0 ? 'base-line' : 'grid-line'} x1={pad.l} x2={w - pad.r} y1={y(t)} y2={y(t)} />
            <text x={pad.l - 8} y={y(t) + 3.5} textAnchor="end">{formato(t)}</text>
          </g>
        ))}
        {meta && (
          <g>
            <line x1={pad.l} x2={w - pad.r} y1={y(meta.valor)} y2={y(meta.valor)} stroke="var(--ocre)" strokeDasharray="4 4" strokeWidth="1.5" />
            <text x={w - pad.r} y={y(meta.valor) - 6} textAnchor="end" style={{ fill: 'var(--ocre)', fontWeight: 600 }}>{meta.etiqueta}</text>
          </g>
        )}
        {datos.map((d, i) => {
          const h = Math.max(2, (d.valor / top) * ih)
          const r = Math.min(4, bw / 2)
          const x0 = x(i) - bw / 2
          const y0 = pad.t + ih - h
          const path = `M${x0},${y0 + h} V${y0 + r} Q${x0},${y0} ${x0 + r},${y0} H${x0 + bw - r} Q${x0 + bw},${y0} ${x0 + bw},${y0 + r} V${y0 + h} Z`
          const activo = hover === i || destacar === i
          return (
            <g key={i} onMouseEnter={() => setHover(i)}>
              <rect x={x(i) - iw / datos.length / 2} y={pad.t} width={iw / datos.length} height={ih} fill="transparent" />
              <path d={path} fill={d.proyectado ? 'url(#trama)' : activo ? 'var(--verde-700)' : 'var(--verde)'} opacity={hover !== null && hover !== i ? 0.55 : 1} />
              <text x={x(i)} y={alto - 8} textAnchor="middle" style={activo ? { fill: 'var(--tinta)', fontWeight: 600 } : undefined}>{iw / datos.length < 46 ? String(etiquetaX(d)).split(' ')[0] : etiquetaX(d)}</text>
            </g>
          )
        })}
      </svg>
      {hover !== null && (
        <div className="tooltip" style={{ left: x(hover), top: y(datos[hover].valor) }}>
          <span className="muted">{datos[hover].tooltip ?? etiquetaX(datos[hover])}</span>
          <strong>{formato(datos[hover].valor)}{datos[hover].sufijo ?? ''}</strong>
          {datos[hover].proyectado && <span className="muted">Proyección según obras</span>}
        </div>
      )}
    </div>
  )
}

// Líneas con cruz de lectura. series: [{id, nombre, color, valores:[...] }]
export function Lineas({ etiquetas, series, alto = 220, min = 0, max, formato = (v) => v, meta, directas }) {
  const [ref, w] = useAncho()
  const [hover, setHover] = useState(null)
  const pad = { t: 16, r: directas ? 96 : 14, b: 26, l: 32 }
  const iw = w - pad.l - pad.r
  const ih = alto - pad.t - pad.b
  const vmax = max ?? Math.max(...series.flatMap((s) => s.valores.filter((v) => v !== null)))
  const ticks = useMemo(() => {
    const n = 4
    return Array.from({ length: n + 1 }, (_, i) => min + ((vmax - min) / n) * i)
  }, [min, vmax])
  const x = (i) => pad.l + (etiquetas.length === 1 ? iw / 2 : (iw / (etiquetas.length - 1)) * i)
  const y = (v) => pad.t + ih - ((v - min) / (vmax - min)) * ih
  return (
    <div className="chart" ref={ref}>
      <svg width={w} height={alto}
        onMouseMove={(e) => {
          const r = e.currentTarget.getBoundingClientRect()
          const px = e.clientX - r.left
          const i = Math.round(((px - pad.l) / iw) * (etiquetas.length - 1))
          setHover(Math.max(0, Math.min(etiquetas.length - 1, i)))
        }}
        onMouseLeave={() => setHover(null)}>
        {ticks.map((t) => (
          <g key={t}>
            <line className={t === min ? 'base-line' : 'grid-line'} x1={pad.l} x2={w - pad.r} y1={y(t)} y2={y(t)} />
            <text x={pad.l - 8} y={y(t) + 3.5} textAnchor="end">{formato(t)}</text>
          </g>
        ))}
        {meta && (
          <g>
            <line x1={pad.l} x2={w - pad.r} y1={y(meta.valor)} y2={y(meta.valor)} stroke="var(--ocre)" strokeDasharray="4 4" strokeWidth="1.5" />
            <text x={w - pad.r} y={y(meta.valor) - 6} textAnchor="end" style={{ fill: 'var(--ocre)', fontWeight: 600 }}>{meta.etiqueta}</text>
          </g>
        )}
        {etiquetas.map((e, i) => <text key={i} x={x(i)} y={alto - 8} textAnchor="middle">{e}</text>)}
        {hover !== null && <line x1={x(hover)} x2={x(hover)} y1={pad.t} y2={pad.t + ih} stroke="var(--borde)" />}
        {series.map((s) => {
          const pts = s.valores.map((v, i) => (v === null ? null : [x(i), y(v)])).filter(Boolean)
          return (
            <g key={s.id}>
              <polyline points={pts.map((p) => p.join(',')).join(' ')} fill="none" stroke={s.color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" strokeDasharray={s.punteada ? '5 4' : undefined} />
              {pts.map((p, i) => <circle key={i} cx={p[0]} cy={p[1]} r={hover === i ? 5 : 4} fill={s.color} stroke="#fff" strokeWidth="2" />)}
              {directas && pts.length > 0 && (
                <text x={pts.at(-1)[0] + 10} y={pts.at(-1)[1] + 4} style={{ fill: 'var(--tinta-2)', fontWeight: 600 }}>{s.corto ?? s.nombre}</text>
              )}
            </g>
          )
        })}
      </svg>
      {hover !== null && (
        <div className="tooltip" style={{ left: x(hover), top: pad.t + 6, transform: `translate(${hover > etiquetas.length / 2 ? 'calc(-100% - 12px)' : '12px'}, 0)` }}>
          <span className="muted">{etiquetas[hover]}</span>
          {series.map((s) => s.valores[hover] !== null && (
            <div key={s.id} className="fila" style={{ gap: 6, marginTop: 3 }}>
              <i style={{ width: 8, height: 8, borderRadius: 2, background: s.color, display: 'inline-block' }} />
              <span className="sec">{s.nombre}</span>
              <b className="num" style={{ marginLeft: 'auto', paddingLeft: 10 }}>{formato(s.valores[hover])}</b>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// Barra de bala: valor actual, punto de partida (círculo) y meta (línea).
export function Bala({ etiqueta, valor, inicial, meta, max = 5, formato = (v) => v, tono }) {
  const color = tono === 'warning' ? 'var(--ocre)' : tono === 'critical' ? 'var(--rojo)' : 'var(--verde)'
  return (
    <div className="bala" title={`${etiqueta}: ${formato(valor)} · partida ${inicial !== undefined ? formato(inicial) : '—'} · meta ${meta !== undefined ? formato(meta) : '—'}`}>
      <span className="sec trunc">{etiqueta}</span>
      <div className="pista">
        <i style={{ width: `${(valor / max) * 100}%`, background: color }} />
        {inicial !== undefined && <em style={{ left: `${(inicial / max) * 100}%` }} />}
        {meta !== undefined && <b style={{ left: `calc(${(meta / max) * 100}% - 1px)` }} />}
      </div>
      <strong className="num derecha">{formato(valor)}</strong>
    </div>
  )
}

export function LeyendaBala() {
  return (
    <div className="leyenda">
      <span><i style={{ background: 'var(--verde)' }} />Actual</span>
      <span><i style={{ background: '#fff', border: '1.5px solid var(--tinta-3)', borderRadius: '50%' }} />Punto de partida</span>
      <span><i style={{ background: 'var(--tinta)', width: 2, height: 12, borderRadius: 1 }} />Meta a 6 meses</span>
    </div>
  )
}

// Barras horizontales simples (embudo, distribuciones).
export function Barras({ datos, formato = (v) => v, max }) {
  const m = max ?? Math.max(1, ...datos.map((d) => d.valor))
  return (
    <div className="stack" style={{ gap: 9 }}>
      {datos.map((d) => (
        <div key={d.id ?? d.nombre} title={`${d.nombre}: ${formato(d.valor)}`}>
          <div className="fila-sb peq" style={{ marginBottom: 4 }}>
            <span className="sec">{d.nombre}</span>
            <b className="num">{formato(d.valor)}</b>
          </div>
          <div className="progreso" style={{ height: 8 }}>
            <i style={{ width: `${(d.valor / m) * 100}%`, background: d.color ?? 'var(--verde)' }} />
          </div>
        </div>
      ))}
    </div>
  )
}
