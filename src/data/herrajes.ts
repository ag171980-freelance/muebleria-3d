export type TipoHerraje = 'perilla' | 'barral' | 'tirador-c' | 'perfil-j' | 'uñero'

export type Herraje = {
  id: TipoHerraje
  nombre: string
  nota: string
  /** Largo nominal en mm. El perfil J toma el ancho del frente. */
  largo: number
}

export const HERRAJES: Herraje[] = [
  {
    id: 'perilla',
    nombre: 'Perilla redonda',
    nota: 'Una sola fijacion. Clasica para cajoneras y mesas de luz.',
    largo: 32,
  },
  {
    id: 'barral',
    nombre: 'Barral recto',
    nota: 'Tubo con dos soportes. Comodo para cajones cargados.',
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
    nota: 'Se amura al canto superior del frente. Linea sin interrupciones.',
    largo: 0,
  },
  {
    id: 'uñero',
    nombre: 'Sin herraje (uñero)',
    nota: 'Se abre desde una luz calada en el frente. Nada sobresale.',
    largo: 0,
  },
]

export const HERRAJE_POR_ID = new Map(HERRAJES.map((h) => [h.id, h]))

export type TerminacionHerraje = {
  id: string
  nombre: string
  color: string
  metalico: number
  rugosidad: number
}

/**
 * Los valores de `metalico` quedan por debajo de 0,8 a proposito. Un metal puro
 * casi no tiene componente difusa: si el mapa de entorno no llega a generarse,
 * el herraje se dibuja negro. Asi se ve bien con luz directa sola y gana brillo
 * cuando el entorno esta disponible.
 */
export const TERMINACIONES: TerminacionHerraje[] = [
  { id: 'acero', nombre: 'Acero inoxidable', color: '#c2c6c9', metalico: 0.72, rugosidad: 0.3 },
  { id: 'negro', nombre: 'Negro mate', color: '#2b2d2f', metalico: 0.4, rugosidad: 0.62 },
  { id: 'bronce', nombre: 'Bronce envejecido', color: '#9a7743', metalico: 0.7, rugosidad: 0.44 },
  { id: 'aluminio', nombre: 'Aluminio anodizado', color: '#a7adb0', metalico: 0.68, rugosidad: 0.42 },
]

export const TERMINACION_POR_ID = new Map(TERMINACIONES.map((t) => [t.id, t]))

export type TipoBase = 'zocalo' | 'patas-metal' | 'patas-madera' | 'ninguna'

export type Base = {
  id: TipoBase
  nombre: string
  nota: string
  /** Altura por defecto en mm. */
  altura: number
}

export const BASES: Base[] = [
  {
    id: 'zocalo',
    nombre: 'Zocalo retirado',
    nota: 'El mueble apoya sobre un cajon de madera retirado del frente.',
    altura: 80,
  },
  {
    id: 'patas-metal',
    nombre: 'Patas de hierro',
    nota: 'Caño de seccion cuadrada pintado. Se ve el piso por debajo.',
    altura: 140,
  },
  {
    id: 'patas-madera',
    nombre: 'Patas de madera',
    nota: 'Torneadas y conicas, en la misma madera del mueble.',
    altura: 150,
  },
  {
    id: 'ninguna',
    nombre: 'Apoyo directo',
    nota: 'El lateral llega al piso. Para muebles que van amurados.',
    altura: 0,
  },
]

export const BASE_POR_ID = new Map(BASES.map((b) => [b.id, b]))
