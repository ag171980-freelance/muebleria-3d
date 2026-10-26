export type TipoHerraje = 'perilla' | 'barral' | 'tirador-c' | 'perfil-j' | 'uñero'

export type Herraje = {
  id: TipoHerraje
  nombre: string
  nota: string
  /** Largo nominal en mm. El perfil J toma el ancho del frente. */
  largo: number
}

/**
 * Tiradores. Van siempre en la misma pintura epoxi que la estructura: en un
 * mueble de hierro y madera el herraje es parte del hierro, no una pieza
 * suelta, y por eso no hay una eleccion aparte de terminacion del metal.
 */
export const HERRAJES: Herraje[] = [
  {
    id: 'barral',
    nombre: 'Barral de hierro',
    nota: 'Caño con dos soportes, al tono de la estructura. Es el de la casa.',
    largo: 160,
  },
  {
    id: 'tirador-c',
    nombre: 'Tirador tipo C',
    nota: 'Asa cerrada y maciza. Buen agarre con la mano llena.',
    largo: 128,
  },
  {
    id: 'perfil-j',
    nombre: 'Perfil J continuo',
    nota: 'Se amura al canto del frente. Linea sin interrupciones.',
    largo: 0,
  },
  {
    id: 'perilla',
    nombre: 'Perilla redonda',
    nota: 'Una sola fijacion. Para mesas de luz y cajoneras chicas.',
    largo: 32,
  },
  {
    id: 'uñero',
    nombre: 'Sin herraje (uñero)',
    nota: 'Se abre desde una luz calada en el frente. Nada sobresale.',
    largo: 0,
  },
]

export const HERRAJE_POR_ID = new Map(HERRAJES.map((h) => [h.id, h]))

export type TipoBase = 'patas-hierro' | 'ruedas' | 'ninguna'

export type Base = {
  id: TipoBase
  nombre: string
  nota: string
  /** Altura por defecto en mm. */
  altura: number
}

/**
 * Como apoya el mueble. Las tres del catalogo: caño de hierro en el rack y las
 * mesas de luz, ruedas giratorias en la cajonera movil, y apoyo directo cuando
 * el mueble va amurado.
 */
export const BASES: Base[] = [
  {
    id: 'patas-hierro',
    nombre: 'Patas de hierro',
    nota: 'Caño de seccion cuadrada, en la misma pintura que la estructura.',
    altura: 140,
  },
  {
    id: 'ruedas',
    nombre: 'Ruedas giratorias',
    nota: 'Cuatro ruedas, dos con freno. Es lo que lleva la cajonera movil.',
    altura: 75,
  },
  {
    id: 'ninguna',
    nombre: 'Apoyo directo',
    nota: 'El lateral llega al piso. Para muebles que van contra la pared.',
    altura: 0,
  },
]

export const BASE_POR_ID = new Map(BASES.map((b) => [b.id, b]))
