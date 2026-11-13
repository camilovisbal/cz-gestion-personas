import { useEffect, useMemo, useRef, useState } from 'react'
import {
  LayoutDashboard, Briefcase, KanbanSquare, Users, UserPlus, HardHat, Building2, MessageCircle,
  Award, GraduationCap, HeartPulse, Target, Search, ShieldCheck, Wrench, RotateCcw, Smartphone, ClipboardList, Menu,
} from 'lucide-react'
import { useStore } from './store/Store.jsx'
import { UiCtx, useUi } from './store/ui.js'
import { useRuta, ir } from './lib/router.js'
import { Isotipo, Avatar, Toasts } from './components/ui.jsx'
import { cargoPorId } from './data/catalogos.js'
import PerfilPersona from './components/PerfilPersona.jsx'

import Inicio from './pages/Inicio.jsx'
import Vacantes from './pages/talento/Vacantes.jsx'
import VacanteDetalle from './pages/talento/VacanteDetalle.jsx'
import Proceso from './pages/talento/Proceso.jsx'
import Banco from './pages/talento/Banco.jsx'
import Registro from './pages/talento/Registro.jsx'
import Personal from './pages/Personal.jsx'
import Obras from './pages/Obras.jsx'
import Escucha from './pages/Escucha.jsx'
import Reconoce from './pages/Reconoce.jsx'
import Formacion from './pages/Formacion.jsx'
import Bienestar from './pages/Bienestar.jsx'
import Indicadores from './pages/Indicadores.jsx'
import MiObra from './pages/lider/MiObra.jsx'
import Portal from './pages/trabajador/Portal.jsx'

function menu(rol, db) {
  const abiertas = db.vacantes.filter((v) => v.estado === 'abierta').length
  const solicitudes = db.vacantes.filter((v) => v.estado === 'solicitada').length
  const sinResponder = db.canal.filter((s) => s.estado !== 'respondida').length
  if (rol === 'admin') {
    return [
      { grupo: 'General', items: [
        { ruta: 'inicio', nombre: 'Inicio', icono: LayoutDashboard },
        { ruta: 'indicadores', nombre: 'Plan de mejora', icono: Target },
      ] },
      { grupo: 'CZ Talento', items: [
        { ruta: 'talento/vacantes', nombre: 'Vacantes', icono: Briefcase, n: abiertas, n2: solicitudes },
        { ruta: 'talento/proceso', nombre: 'Proceso de selección', icono: KanbanSquare },
        { ruta: 'talento/banco', nombre: 'Banco de talento', icono: Users },
        { ruta: 'talento/registro', nombre: 'Registrar candidato', icono: UserPlus },
      ] },
      { grupo: 'Personas', items: [
        { ruta: 'personal', nombre: 'Trabajadores', icono: HardHat },
        { ruta: 'obras', nombre: 'Obras', icono: Building2 },
      ] },
      { grupo: 'Estrategias', items: [
        { ruta: 'escucha', nombre: 'Pulso y Canal CZ', icono: MessageCircle, n: sinResponder, ocre: true },
        { ruta: 'reconoce', nombre: 'Reconoce CZ', icono: Award },
        { ruta: 'formacion', nombre: 'Ruta de formación', icono: GraduationCap },
        { ruta: 'bienestar', nombre: 'Bienestar en obra', icono: HeartPulse },
      ] },
    ]
  }
  if (rol === 'lider') {
    return [
      { grupo: 'Mi obra', items: [
        { ruta: 'lider', nombre: 'Mi cuadrilla', icono: HardHat },
        { ruta: 'lider/solicitudes', nombre: 'Solicitar personal', icono: ClipboardList },
      ] },
      { grupo: 'Estrategias', items: [
        { ruta: 'escucha', nombre: 'Escuchar a la cuadrilla', icono: MessageCircle },
        { ruta: 'reconoce', nombre: 'Reconoce CZ', icono: Award },
        { ruta: 'formacion', nombre: 'Formación', icono: GraduationCap },
        { ruta: 'bienestar', nombre: 'Bienestar', icono: HeartPulse },
      ] },
    ]
  }
  return [{ grupo: 'Portal del trabajador', items: [{ ruta: 'portal', nombre: 'Mi CZ', icono: Smartphone }] }]
}

const INICIO = { admin: 'inicio', lider: 'lider', trabajador: 'portal' }
const PERMITIDAS = {
  admin: ['inicio', 'talento', 'personal', 'obras', 'escucha', 'reconoce', 'formacion', 'bienestar', 'indicadores'],
  lider: ['lider', 'escucha', 'reconoce', 'formacion', 'bienestar'],
  trabajador: ['portal'],
}

function Buscador() {
  const { db } = useStore()
  const { verPersona } = useUi()
  const [q, setQ] = useState('')
  const [abierto, setAbierto] = useState(false)
  const [sel, setSel] = useState(0)
  const ref = useRef(null)
  useEffect(() => {
    const on = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); ref.current?.focus() }
    }
    window.addEventListener('keydown', on)
    return () => window.removeEventListener('keydown', on)
  }, [])
  const res = useMemo(() => {
    if (q.trim().length < 2) return []
    const t = q.toLowerCase()
    const personas = db.personas.filter((p) => p.nombre.toLowerCase().includes(t) || cargoPorId[p.cargo].nombre.toLowerCase().includes(t)).slice(0, 7)
      .map((p) => ({ tipo: 'persona', id: p.id, titulo: p.nombre, sub: `${cargoPorId[p.cargo].nombre} · ${p.estado === 'activo' ? db.obras.find((o) => o.id === p.obraId)?.nombre : 'Banco de talento'}` }))
    const vacs = db.vacantes.filter((v) => cargoPorId[v.cargo].nombre.toLowerCase().includes(t) || db.obras.find((o) => o.id === v.obraId).nombre.toLowerCase().includes(t)).slice(0, 3)
      .map((v) => ({ tipo: 'vacante', id: v.id, titulo: `${v.cantidad} × ${cargoPorId[v.cargo].nombre}`, sub: `Vacante · ${db.obras.find((o) => o.id === v.obraId).nombre}` }))
    return [...vacs, ...personas]
  }, [q, db])
  const elegir = (r) => {
    if (r.tipo === 'persona') verPersona(r.id)
    else ir(`talento/vacantes/${r.id}`)
    setQ(''); setAbierto(false)
  }
  return (
    <div className="buscador">
      <Search />
      <input ref={ref} value={q} placeholder="Buscar personas, cargos o vacantes…"
        onChange={(e) => { setQ(e.target.value); setAbierto(true); setSel(0) }}
        onFocus={() => setAbierto(true)} onBlur={() => setTimeout(() => setAbierto(false), 150)}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown') { e.preventDefault(); setSel((s) => Math.min(res.length - 1, s + 1)) }
          if (e.key === 'ArrowUp') { e.preventDefault(); setSel((s) => Math.max(0, s - 1)) }
          if (e.key === 'Enter' && res[sel]) elegir(res[sel])
          if (e.key === 'Escape') e.currentTarget.blur()
        }} />
      {!q && <kbd>Ctrl K</kbd>}
      {abierto && res.length > 0 && (
        <div className="resultados">
          {res.map((r, i) => (
            <button key={r.tipo + r.id} className={i === sel ? 'sel' : ''} onMouseDown={() => elegir(r)}>
              {r.tipo === 'persona' ? <Avatar nombre={r.titulo} size="sm" /> : <span className="kpi-icono" style={{ width: 26, height: 26 }}><Briefcase /></span>}
              <div style={{ minWidth: 0 }}>
                <div className="b trunc">{r.titulo}</div>
                <div className="xs muted trunc">{r.sub}</div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default function App() {
  const { db, rol, setRol, acciones, toasts, usuario, obraPorId } = useStore()
  const { partes, raw } = useRuta()
  const [perfil, setPerfil] = useState(null)
  const [menuAbierto, setMenuAbierto] = useState(false)
  const ui = useMemo(() => ({ verPersona: setPerfil }), [])
  // En celular el menú lateral se cierra al cambiar de página.
  useEffect(() => { setMenuAbierto(false) }, [raw, rol])

  const ruta = partes.join('/')
  // Si la ruta no corresponde al rol, se envía al inicio del rol (y no se pinta nada mientras tanto).
  const permitida = partes.length > 0 && PERMITIDAS[rol].includes(partes[0])
  useEffect(() => {
    if (!permitida) ir(INICIO[rol])
  }, [rol, permitida])

  const grupos = menu(rol, db)
  const activa = (r) => ruta === r || (ruta.startsWith(r + '/') && !grupos.some((g) => g.items.some((i) => i.ruta !== r && ruta.startsWith(i.ruta) && i.ruta.length > r.length)))

  let pagina = null
  const [a, b, c] = partes
  if (!permitida) pagina = null
  else if (a === 'inicio') pagina = <Inicio />
  else if (a === 'talento' && b === 'vacantes' && c) pagina = <VacanteDetalle id={c} />
  else if (a === 'talento' && b === 'vacantes') pagina = <Vacantes />
  else if (a === 'talento' && b === 'proceso') pagina = <Proceso />
  else if (a === 'talento' && b === 'banco') pagina = <Banco />
  else if (a === 'talento' && b === 'registro') pagina = <Registro />
  else if (a === 'personal') pagina = <Personal />
  else if (a === 'obras') pagina = <Obras />
  else if (a === 'escucha') pagina = <Escucha />
  else if (a === 'reconoce') pagina = <Reconoce />
  else if (a === 'formacion') pagina = <Formacion />
  else if (a === 'bienestar') pagina = <Bienestar />
  else if (a === 'indicadores') pagina = <Indicadores />
  else if (a === 'lider' && b === 'solicitudes') pagina = <Vacantes lider />
  else if (a === 'lider') pagina = <MiObra />
  else if (a === 'portal') pagina = <Portal />

  const ROLES = [
    { id: 'admin', nombre: 'Gestión Humana', icono: ShieldCheck },
    { id: 'lider', nombre: 'Líder de obra', icono: Wrench },
    { id: 'trabajador', nombre: 'Trabajador', icono: HardHat },
  ]
  const nombreUsuario = rol === 'admin' ? usuario.nombre : usuario.persona.nombre
  const detalleUsuario = rol === 'admin' ? usuario.cargo : rol === 'lider' ? `Residente · ${obraPorId[usuario.obraId].nombre}` : `${cargoPorId[usuario.persona.cargo].nombre} · ${obraPorId[usuario.persona.obraId].nombre}`

  return (
    <UiCtx.Provider value={ui}>
      <div className="app">
        {menuAbierto && <div className="sidebar-fondo" onClick={() => setMenuAbierto(false)} />}
        <aside className={`sidebar ${menuAbierto ? 'abierto' : ''}`}>
          <div className="brand">
            <Isotipo />
            <div className="brand-txt">
              <strong>CZ Personas</strong>
              <span>Gestión de Personas</span>
            </div>
          </div>
          <nav className="nav">
            {grupos.map((g) => (
              <div key={g.grupo}>
                <div className="nav-grupo">{g.grupo}</div>
                {g.items.map((it) => (
                  <a key={it.ruta} href={`#/${it.ruta}`} className={activa(it.ruta) ? 'activo' : ''}>
                    <it.icono />
                    {it.nombre}
                    {it.n2 > 0 && <span className="contador ocre" title="Solicitudes por aprobar">{it.n2}</span>}
                    {it.n > 0 && !it.n2 && <span className={`contador ${it.ocre ? 'ocre' : ''}`}>{it.n}</span>}
                  </a>
                ))}
              </div>
            ))}
          </nav>
          <div className="sidebar-pie">
            <div style={{ marginBottom: 8 }}>CZ Construcciones Ltda · Barranquilla</div>
            <button onClick={() => { if (confirm('¿Restablecer los datos de demostración? Se perderán los cambios hechos en el prototipo.')) acciones.reiniciar() }}>
              <RotateCcw size={13} /> Restablecer datos demo
            </button>
          </div>
        </aside>

        <div className="principal">
          <header className="topbar">
            <button className="btn fantasma icono btn-menu" onClick={() => setMenuAbierto(true)} aria-label="Abrir menú"><Menu /></button>
            <span className="marca-movil"><Isotipo /></span>
            {rol !== 'trabajador' ? <Buscador /> : <div className="sec peq solo-escritorio">Vista móvil del trabajador · se abre desde el QR de la obra</div>}
            <div className="topbar-der">
              <div className="rol-switch" title="Cambiar la vista del prototipo">
                {ROLES.map((r) => (
                  <button key={r.id} className={rol === r.id ? 'activo' : ''} onClick={() => { setRol(r.id); ir(INICIO[r.id]) }}>
                    <r.icono /><span className="rol-txt">{r.nombre}</span>
                  </button>
                ))}
              </div>
              <div className="usuario">
                <Avatar nombre={nombreUsuario} />
                <div>
                  <strong>{nombreUsuario}</strong>
                  <span>{detalleUsuario}</span>
                </div>
              </div>
            </div>
          </header>
          <main className="main">
            <div className="contenido" key={rol + raw}>{pagina}</div>
          </main>
        </div>
      </div>
      {perfil && <PerfilPersona id={perfil} onClose={() => setPerfil(null)} />}
      <Toasts toasts={toasts} />
    </UiCtx.Provider>
  )
}
