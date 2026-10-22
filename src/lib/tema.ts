import { useCallback, useEffect, useState } from 'react'

export type Tema = 'auto' | 'claro' | 'oscuro'
const CLAVE = 'mendia.tema.v1'

/** Fondo de la escena 3D por tema. Tiene que coincidir con --papel-2 de tokens.css. */
export const FONDO_ESCENA: Record<'claro' | 'oscuro', string> = {
  claro: '#e7eae8',
  oscuro: '#171b1a',
}

/** Acento para el contorno de la pieza señalada. Es el mismo --acento de tokens.css. */
export const ACENTO_ESCENA: Record<'claro' | 'oscuro', string> = {
  claro: '#1f6b4c',
  oscuro: '#4fa37a',
}

function leerPreferencia(): Tema {
  try {
    const guardado = window.localStorage.getItem(CLAVE)
    if (guardado === 'claro' || guardado === 'oscuro' || guardado === 'auto') return guardado
  } catch {
    // Navegacion privada: se usa el tema del sistema.
  }
  return 'auto'
}

function resolver(tema: Tema): 'claro' | 'oscuro' {
  if (tema !== 'auto') return tema
  if (typeof window === 'undefined' || !window.matchMedia) return 'claro'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'oscuro' : 'claro'
}

export function useTema() {
  const [tema, setTema] = useState<Tema>(() => leerPreferencia())
  const [resuelto, setResuelto] = useState<'claro' | 'oscuro'>(() => resolver(leerPreferencia()))

  useEffect(() => {
    const aplicar = () => {
      const efectivo = resolver(tema)
      setResuelto(efectivo)
      document.documentElement.dataset.tema = efectivo
    }
    aplicar()
    if (tema !== 'auto' || !window.matchMedia) return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    mq.addEventListener('change', aplicar)
    return () => mq.removeEventListener('change', aplicar)
  }, [tema])

  const cambiar = useCallback((siguiente: Tema) => {
    setTema(siguiente)
    try {
      window.localStorage.setItem(CLAVE, siguiente)
    } catch {
      // Si no se puede guardar, la eleccion vale para esta visita.
    }
  }, [])

  const alternar = useCallback(() => {
    cambiar(resolver(leerPreferencia()) === 'oscuro' ? 'claro' : 'oscuro')
  }, [cambiar])

  return { tema, resuelto, cambiar, alternar }
}
