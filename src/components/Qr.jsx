// Código QR ilustrativo para el prototipo (patrón determinístico con marcadores de posición).
// En producción se generaría un QR real con la URL de la encuesta de cada obra.
export default function Qr({ semilla = 'pulso', size = 112 }) {
  const n = 25
  let h = [...semilla].reduce((s, c) => (s * 31 + c.charCodeAt(0)) >>> 0, 7)
  const rnd = () => { h ^= h << 13; h ^= h >>> 17; h ^= h << 5; return (h >>> 0) / 4294967296 }
  const celdas = []
  const enFinder = (x, y) => (x < 8 && y < 8) || (x > n - 9 && y < 8) || (x < 8 && y > n - 9)
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (!enFinder(x, y) && rnd() < 0.48) celdas.push([x, y])
  const finder = (x, y) => (
    <g key={`${x}-${y}`}>
      <rect x={x} y={y} width="7" height="7" fill="var(--tinta)" />
      <rect x={x + 1} y={y + 1} width="5" height="5" fill="#fff" />
      <rect x={x + 2} y={y + 2} width="3" height="3" fill="var(--tinta)" />
    </g>
  )
  return (
    <svg className="qr" viewBox={`-2 -2 ${n + 4} ${n + 4}`} width={size} height={size} role="img" aria-label="Código QR de la encuesta">
      <rect x="-2" y="-2" width={n + 4} height={n + 4} fill="#fff" rx="1.5" />
      {celdas.map(([x, y]) => <rect key={`${x}.${y}`} x={x} y={y} width="1.02" height="1.02" fill="var(--tinta)" />)}
      {finder(0, 0)}{finder(n - 7, 0)}{finder(0, n - 7)}
    </svg>
  )
}
