import { useState } from 'react'
import { Sparkles, FileText, Plus, Trash2, ShieldCheck, Upload, Wand2, Info } from 'lucide-react'
import { useStore } from '../../store/Store.jsx'
import { useUi } from '../../store/ui.js'
import { PageHead, Card, Campo, Badge } from '../../components/ui.jsx'
import { CARGOS, cargoPorId, CERTIFICADOS, CIUDADES, DISPONIBILIDAD, TIPOS_PROYECTO } from '../../data/catalogos.js'
import { leerHojaDeVida, HV_EJEMPLO } from '../../lib/lectorHV.js'
import { enDias, enMeses } from '../../lib/fechas.js'
import { ir } from '../../lib/router.js'

const VACIO = {
  nombre: '', documento: '', telefono: '', ciudad: 'Barranquilla', cargo: 'soldador', anios: 1,
  disponibilidad: 'inmediata', viaja: false, aspiracion: '', fuente: 'Hoja de vida física',
  experiencia: [{ tipo: 'edificaciones', anios: 1, proyectos: 1 }], habilidades: [], certificados: [],
}

export default function Registro() {
  const { acciones } = useStore()
  const { verPersona } = useUi()
  const [texto, setTexto] = useState('')
  const [lectura, setLectura] = useState(null)
  const [d, setD] = useState(VACIO)
  const [consent, setConsent] = useState(false)
  const set = (k, v) => setD((s) => ({ ...s, [k]: v }))
  const cargo = cargoPorId[d.cargo]

  const leer = (t = texto) => {
    const r = leerHojaDeVida(t)
    setLectura(r)
    const x = r.datos
    setD((s) => ({
      ...s,
      nombre: x.nombre || s.nombre, documento: x.documento || s.documento, telefono: x.telefono || s.telefono,
      ciudad: x.ciudad || s.ciudad, cargo: x.cargo || s.cargo, anios: x.anios || s.anios,
      disponibilidad: x.disponibilidad, viaja: x.viaja || s.viaja, fuente: 'Hoja de vida digital',
      experiencia: x.experiencia.length ? x.experiencia : s.experiencia,
      habilidades: x.habilidades,
      certificados: x.certificados.map((tipo) => ({ tipo, vence: CERTIFICADOS[tipo].vigenciaMeses ? enMeses(Math.min(CERTIFICADOS[tipo].vigenciaMeses, 8)) : null })),
    }))
  }

  const cargarArchivo = async (e) => {
    const f = e.target.files?.[0]
    if (!f) return
    const t = await f.text()
    setTexto(t)
    leer(t)
  }

  const toggleCert = (tipo) => set('certificados', d.certificados.some((c) => c.tipo === tipo)
    ? d.certificados.filter((c) => c.tipo !== tipo)
    : [...d.certificados, { tipo, vence: CERTIFICADOS[tipo].vigenciaMeses ? enMeses(6) : null }])

  const guardar = () => {
    const id = acciones.registrarPersona({
      ...d, anios: Number(d.anios), aspiracion: Number(String(d.aspiracion).replace(/\D/g, '')) || 0,
      experiencia: d.experiencia.map((e) => ({ ...e, anios: Number(e.anios), proyectos: Number(e.proyectos) })),
      certificados: d.certificados.map((c) => ({ tipo: c.tipo, vence: c.vence, emitido: c.vence ? enMeses(-(CERTIFICADOS[c.tipo].vigenciaMeses ?? 12), new Date(c.vence + 'T00:00')) : enDias(-365), verificado: false })),
      consentimiento: true,
    })
    setD(VACIO); setTexto(''); setLectura(null); setConsent(false)
    verPersona(id)
  }

  const resaltar = (campo) => lectura?.encontrados.includes(campo) ? { borderColor: 'var(--verde-300)', background: 'var(--verde-50)' } : undefined

  return (
    <>
      <PageHead modulo="CZ Talento" titulo="Registrar candidato" descripcion="Cargue la hoja de vida y deje que el asistente proponga los datos. Una persona de Gestión Humana revisa y confirma antes de guardar.">
        <button className="btn" onClick={() => ir('talento/banco')}>Ir al banco de talento</button>
      </PageHead>

      <div className="grid g-12">
        <div className="stack">
          <Card titulo={<span className="fila"><Sparkles size={16} color="var(--verde)" />Lectura asistida de hoja de vida</span>} sub="Función de IA propuesta · en el prototipo funciona con reglas sobre el texto">
            <div className="stack" style={{ gap: 10 }}>
              <div className="fila wrap" style={{ gap: 6 }}>
                <span className="xs muted">Probar con:</span>
                {HV_EJEMPLO.map((h) => <button key={h.titulo} className="btn sm" onClick={() => { setTexto(h.texto); leer(h.texto) }}><FileText />{h.titulo}</button>)}
              </div>
              <textarea className="textarea" rows={14} value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="Pegue aquí el texto de la hoja de vida (desde el PDF o Word)…" style={{ fontSize: 12.5 }} />
              <div className="fila">
                <label className="btn" style={{ flex: 1 }}><Upload />Cargar .txt<input type="file" accept=".txt,text/plain" hidden onChange={cargarArchivo} /></label>
                <button className="btn primario" style={{ flex: 1 }} disabled={!texto.trim()} onClick={() => leer()}><Wand2 />Leer hoja de vida</button>
              </div>
              {lectura && (
                <div className="aviso">
                  <Sparkles />
                  <div>
                    <b>Se identificaron {lectura.encontrados.length} datos</b> ({lectura.confianza} % del perfil): {lectura.encontrados.join(', ')}.
                    <div className="mt-8" style={{ marginTop: 4 }}>Los campos resaltados en verde fueron completados por el asistente. Revíselos antes de guardar.</div>
                  </div>
                </div>
              )}
            </div>
          </Card>
          <div className="aviso ocre"><Info /><span>En una versión real, esta lectura usaría un modelo de IA para leer PDF escaneados. El asistente propone; la decisión y la verificación siempre son de una persona.</span></div>
        </div>

        <Card titulo="Datos del candidato" sub="Campos requeridos para buscarlo por obra, oficio y experiencia"
          pie={<>
            <label className="check" style={{ maxWidth: 520 }}>
              <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
              <span>El candidato autorizó el tratamiento de sus datos personales para procesos de selección de CZ (Ley 1581 de 2012).</span>
            </label>
            <button className="btn primario" disabled={!consent || !d.nombre.trim()} onClick={guardar}><ShieldCheck />Guardar en el banco</button>
          </>}>
          <div className="form-grid">
            <Campo label="Nombre completo"><input className="input" style={resaltar('nombre')} value={d.nombre} onChange={(e) => set('nombre', e.target.value)} /></Campo>
            <Campo label="Documento"><input className="input" value={d.documento} onChange={(e) => set('documento', e.target.value)} /></Campo>
            <Campo label="Teléfono"><input className="input" style={resaltar('teléfono')} value={d.telefono} onChange={(e) => set('telefono', e.target.value)} /></Campo>
            <Campo label="Ciudad de residencia">
              <select className="select" style={resaltar('ciudad')} value={d.ciudad} onChange={(e) => set('ciudad', e.target.value)}>{CIUDADES.map((c) => <option key={c}>{c}</option>)}</select>
            </Campo>
            <Campo label="Cargo u oficio">
              <select className="select" style={resaltar('cargo')} value={d.cargo} onChange={(e) => setD((s) => ({ ...s, cargo: e.target.value, habilidades: s.habilidades.filter((h) => cargoPorId[e.target.value].habilidades.includes(h)) }))}>
                {CARGOS.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
              </select>
            </Campo>
            <Campo label="Años de experiencia en el oficio"><input className="input num" type="number" min="0" style={resaltar('años de experiencia')} value={d.anios} onChange={(e) => set('anios', e.target.value)} /></Campo>
            <Campo label="Disponibilidad">
              <select className="select" value={d.disponibilidad} onChange={(e) => set('disponibilidad', e.target.value)}>{DISPONIBILIDAD.map((x) => <option key={x.id} value={x.id}>{x.nombre}</option>)}</select>
            </Campo>
            <Campo label="Aspiración salarial mensual"><input className="input num" placeholder="$ 2.800.000" value={d.aspiracion} onChange={(e) => set('aspiracion', e.target.value)} /></Campo>

            <Campo label="Experiencia por tipo de obra" ayuda="Cuántos años y proyectos ha trabajado en cada tipo de obra. Es la base de la segmentación." full>
              <div className="stack" style={{ gap: 8 }}>
                {d.experiencia.map((e, i) => (
                  <div key={i} className="fila">
                    <select className="select" style={{ flex: 2, ...resaltar('tipos de proyecto') }} value={e.tipo} onChange={(ev) => set('experiencia', d.experiencia.map((x, j) => (j === i ? { ...x, tipo: ev.target.value } : x)))}>
                      {TIPOS_PROYECTO.map((t) => <option key={t.id} value={t.id}>{t.nombre}</option>)}
                    </select>
                    <input className="input num" type="number" min="0" style={{ flex: 1 }} value={e.anios} onChange={(ev) => set('experiencia', d.experiencia.map((x, j) => (j === i ? { ...x, anios: ev.target.value } : x)))} title="Años" />
                    <span className="xs muted">años</span>
                    <input className="input num" type="number" min="0" style={{ flex: 1 }} value={e.proyectos} onChange={(ev) => set('experiencia', d.experiencia.map((x, j) => (j === i ? { ...x, proyectos: ev.target.value } : x)))} title="Proyectos" />
                    <span className="xs muted">proyectos</span>
                    <button className="btn sm fantasma icono" onClick={() => set('experiencia', d.experiencia.filter((_, j) => j !== i))} aria-label="Quitar"><Trash2 /></button>
                  </div>
                ))}
                <button className="btn sm" style={{ alignSelf: 'flex-start' }} onClick={() => set('experiencia', [...d.experiencia, { tipo: 'cubiertas', anios: 1, proyectos: 1 }])}><Plus />Agregar tipo de obra</button>
              </div>
            </Campo>

            <Campo label={`Habilidades de ${cargo.nombre.toLowerCase()}`} full>
              <div className="toggle-group">
                {cargo.habilidades.map((h) => <button key={h} className={d.habilidades.includes(h) ? 'on' : ''} onClick={() => set('habilidades', d.habilidades.includes(h) ? d.habilidades.filter((x) => x !== h) : [...d.habilidades, h])}>{h}</button>)}
              </div>
            </Campo>

            <Campo label="Certificados que presenta" ayuda="Quedan como «por verificar» hasta que Gestión Humana revise el soporte." full>
              <div className="toggle-group">
                {[...new Set([...cargo.certificados, 'alturas', 'primerosAux', 'confinados'])].map((t) => (
                  <button key={t} className={d.certificados.some((c) => c.tipo === t) ? 'on' : ''} onClick={() => toggleCert(t)}>{CERTIFICADOS[t].nombre}</button>
                ))}
              </div>
              {d.certificados.filter((c) => c.vence).map((c) => (
                <div key={c.tipo} className="fila mt-8 peq">
                  <span style={{ flex: 1 }}>{CERTIFICADOS[c.tipo].nombre}</span>
                  <span className="muted">vence</span>
                  <input className="input" type="date" style={{ width: 160, height: 30 }} value={c.vence} onChange={(e) => set('certificados', d.certificados.map((x) => (x.tipo === c.tipo ? { ...x, vence: e.target.value } : x)))} />
                  <Badge>Por verificar</Badge>
                </div>
              ))}
            </Campo>

            <label className="check full">
              <input type="checkbox" checked={d.viaja} onChange={(e) => set('viaja', e.target.checked)} />
              <span>Puede trasladarse a obras fuera del área metropolitana de Barranquilla</span>
            </label>
          </div>
        </Card>
      </div>
    </>
  )
}
