import { useCallback, useEffect, useState } from 'react'

export type Tema = 'auto' | 'claro' | 'oscuro'
const CLAVE = 'configurador.tema.v1'

/** Fondo de la escena 3D por tema. Tiene que coincidir con --papel-2 de tokens.css. */
export const FONDO_ESCENA: Record<'claro' | 'oscuro', string> = {
  claro: '#f6f6f6',
  oscuro: '#1c1d1d',
}

/**
 * Piso y pared del ambiente que rodea al mueble.
 *
 * La pared va casi blanca y el piso bastante mas oscuro. No es solo gusto: la
 * estructura es hierro pintado de negro o de blanco, y la pata se ve parada
 * contra la pared, no contra el piso. Con la pared clara el hierro negro se
 * recorta, y con el piso oscuro el hierro blanco tambien.
 *
 * En modo oscuro el negro sobre un piso oscuro da 1,1 de contraste: no hay
 * valor de piso que lo salve, es negro sobre negro. Por eso ahi el contraste lo
 * carga la pared, que va bastante mas clara que el resto del tema, y el piso
 * queda apenas por encima del negro para que el travesaño de abajo se lea.
 */
/*
 * Ojo con estos valores: son albedo, no el gris que termina en pantalla. El
 * piso mira de frente al foco, asi que la luz lo levanta bastante. Para que se
 * vea gris medio hay que pintarlo mas oscuro de lo que uno esperaria.
 */
export const AMBIENTE: Record<'claro' | 'oscuro', { piso: string; pared: string }> = {
  claro: { piso: '#6f6f6c', pared: '#f6f6f5' },
  oscuro: { piso: '#232424', pared: '#4a4b4b' },
}

/**
 * Contorno de la pieza señalada en el visor. Es el mismo --acento de tokens.css.
 * La marca es monocromatica, asi que el contorno va en su casi negro sobre claro
 * y en su blanco roto sobre oscuro. Contra un laqueado del mismo extremo (nogal
 * en claro, natural en oscuro) queda sutil, y por eso la identificacion de la
 * pieza se apoya ademas en la franja de abajo y en la fila de la lista.
 */
export const ACENTO_ESCENA: Record<'claro' | 'oscuro', string> = {
  claro: '#151616',
  oscuro: '#f6f6f6',
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
