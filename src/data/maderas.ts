/**
 * MADERAS Y LAQUEADOS
 *
 * Son dos cosas distintas y conviene no mezclarlas:
 *
 *   - La ESPECIE: eucalipto o pino. Define la veta, los nudos y el tono de base
 *     de la madera.
 *   - El LAQUEADO: Natural, Cedro, Nogal, Roble claro o Roble oscuro. Es el
 *     color con el que se laquea esa madera.
 *
 * Los espesores son los de uso corriente: 30 mm en tapas de escritorio y mesa,
 * 20 mm en estantes, rack y cajonera.
 *
 * Los valores hexadecimales son aproximaciones de pantalla para que el cliente
 * se haga una idea del tono. No son una carta de color calibrada, y la pantalla
 * lo aclara: antes de laquear, el taller muestra la muestra real.
 */

export type Madera = {
  id: string
  nombre: string
  nota: string
  /** Intensidad de la veta, 0 = lisa, 1 = muy marcada. */
  veta: number
  /** Si la especie muestra nudos a la vista. */
  nudos: boolean
  /**
   * Correccion de tono que aporta la especie sobre el color del laqueado.
   * El pino tira a amarillo y el eucalipto a rosado, y eso se nota incluso
   * debajo de un laqueado oscuro.
   */
  tinte: [number, number, number]
}

export const MADERAS: Madera[] = [
  {
    id: 'eucalipto',
    nombre: 'Madera de Eucalipto',
    nota: 'Grano cerrado y parejo, tono rosado. Es la que mas usan en tapas y estantes.',
    veta: 0.6,
    nudos: false,
    tinte: [1.03, 0.98, 0.96],
  },
  {
    id: 'pino',
    nombre: 'Madera de Pino',
    nota: 'Mas clara y liviana, con nudos a la vista y veta marcada.',
    veta: 0.95,
    nudos: true,
    tinte: [1.02, 1.0, 0.92],
  },
]

export const MADERA_POR_ID = new Map(MADERAS.map((m) => [m.id, m]))

export type Acabado = {
  id: string
  nombre: string
  nota: string
  /** Color del laqueado, en sRGB. */
  color: string
  /** Rugosidad de la superficie laqueada. */
  rugosidad: number
  /** Capa de laca por encima, para los reflejos. */
  barniz: number
}

/** Los cinco tonos del selector de laqueado de la tienda. */
export const ACABADOS: Acabado[] = [
  {
    id: 'natural',
    nombre: 'Natural',
    nota: 'Laca transparente. Se ve la madera como es, sin teñir.',
    color: '#d6b689',
    rugosidad: 0.52,
    barniz: 0.45,
  },
  {
    id: 'roble-claro',
    nombre: 'Roble claro',
    nota: 'Miel suave, el tono mas pedido para escritorios.',
    color: '#c39a62',
    rugosidad: 0.5,
    barniz: 0.5,
  },
  {
    id: 'cedro',
    nombre: 'Cedro',
    nota: 'Rojizo calido, levanta la veta.',
    color: '#b06f3d',
    rugosidad: 0.5,
    barniz: 0.5,
  },
  {
    id: 'roble-oscuro',
    nombre: 'Roble oscuro',
    nota: 'Marron tabaco. Contrasta fuerte con la estructura blanca.',
    color: '#7a5433',
    rugosidad: 0.48,
    barniz: 0.52,
  },
  {
    id: 'nogal',
    nombre: 'Nogal',
    nota: 'El mas oscuro. Con estructura negra el mueble se lee como una pieza sola.',
    color: '#5b3922',
    rugosidad: 0.46,
    barniz: 0.55,
  },
]

export const ACABADO_POR_ID = new Map(ACABADOS.map((a) => [a.id, a]))
