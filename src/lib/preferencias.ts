import { useEffect, useState } from 'react'

function consultar(consulta: string): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false
  return window.matchMedia(consulta).matches
}

function useMedia(consulta: string): boolean {
  const [activo, setActivo] = useState(() => consultar(consulta))
  useEffect(() => {
    if (!window.matchMedia) return
    const mq = window.matchMedia(consulta)
    const alCambiar = () => setActivo(mq.matches)
    alCambiar()
    mq.addEventListener('change', alCambiar)
    return () => mq.removeEventListener('change', alCambiar)
  }, [consulta])
  return activo
}

/** Si el visitante pidio menos movimiento, las transiciones del visor pasan a ser instantaneas. */
export function useMenosMovimiento(): boolean {
  return useMedia('(prefers-reduced-motion: reduce)')
}

export function useEsAngosto(): boolean {
  return useMedia('(max-width: 900px)')
}
