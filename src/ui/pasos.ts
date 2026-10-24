import type { Modelo } from '../lib/tipos'

export type PasoId = 'medidas' | 'madera' | 'estructura' | 'interior' | 'pedido'

export type Paso = {
  id: PasoId
  titulo: string
  /** Lo que se decide en este paso, para la ayuda de arriba del panel. */
  bajada: string
}

const TODOS: Paso[] = [
  { id: 'medidas', titulo: 'Medidas', bajada: 'Las medidas del mueble, al centimetro.' },
  { id: 'madera', titulo: 'Madera', bajada: 'La especie y el tono del laqueado.' },
  { id: 'estructura', titulo: 'Hierro', bajada: 'El color de la pintura y como termina la pata.' },
  { id: 'interior', titulo: 'Interior', bajada: 'Cajones, puertas, estantes y tiradores.' },
  { id: 'pedido', titulo: 'Pedido', bajada: 'Revisá lo que armaste y pedí el presupuesto.' },
]

/**
 * Los pasos que corresponden a este mueble.
 *
 * Un mueble sin cajones, puertas, estantes ni bandeja no tiene cuarto paso:
 * mostrar un paso vacio con un cartel de "este mueble no lleva nada adentro"
 * es hacerle perder un clic al cliente.
 *
 * El cuarto paso cambia de nombre segun lo que haya adentro. En un escritorio
 * lo unico que se agrega es la bandeja para la CPU, y llamar "Interior" a eso
 * hace buscar cajones que no existen.
 */
export function pasosDe(modelo: Modelo): Paso[] {
  const guardado =
    modelo.grupos.includes('cajones') || modelo.grupos.includes('puertas') || modelo.grupos.includes('estantes')
  const tieneCuarto = guardado || modelo.grupos.includes('cpu')

  return TODOS.filter((p) => p.id !== 'interior' || tieneCuarto).map((p) =>
    p.id === 'interior' && !guardado
      ? { ...p, titulo: 'Agregados', bajada: 'Lo que se le suma al mueble.' }
      : p,
  )
}
