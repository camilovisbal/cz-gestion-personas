import { useEffect, useState } from 'react'

// Enrutador mínimo basado en el hash (#/talento/vacantes/v1?tab=x).
function leer() {
  const raw = window.location.hash.replace(/^#\/?/, '')
  const [ruta, query = ''] = raw.split('?')
  return { raw, partes: ruta.split('/').filter(Boolean), query: Object.fromEntries(new URLSearchParams(query)) }
}

export function useRuta() {
  const [r, setR] = useState(leer)
  useEffect(() => {
    const on = () => { setR(leer()); document.querySelector('.main')?.scrollTo({ top: 0 }) }
    window.addEventListener('hashchange', on)
    return () => window.removeEventListener('hashchange', on)
  }, [])
  return r
}

export function ir(ruta) {
  window.location.hash = `/${ruta.replace(/^\//, '')}`
}
