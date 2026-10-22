export type Madera = {
  id: string
  nombre: string
  nota: string
  /** Color base del material, en sRGB. */
  color: string
  /** Intensidad de la veta, 0 = superficie lisa (melamina), 1 = madera maciza marcada. */
  veta: number
  /** Rugosidad base del acabado. El acabado elegido la modula. */
  rugosidad: number
}

/**
 * Catalogo de materiales del taller. Los colores son aproximaciones de muestra:
 * el cliente ve una referencia, no una carta de color calibrada. Esto se aclara en pantalla.
 */
export const MADERAS: Madera[] = [
  {
    id: 'melamina-blanco',
    nombre: 'Melamina blanca',
    nota: 'La opcion mas economica. Interior de placares y muebles de cocina.',
    color: '#e8e6e1',
    veta: 0,
    rugosidad: 0.55,
  },
  {
    id: 'melamina-grafito',
    nombre: 'Melamina grafito',
    nota: 'Gris oscuro parejo, sin veta. Marca poco las huellas.',
    color: '#33363a',
    veta: 0,
    rugosidad: 0.6,
  },
  {
    id: 'melamina-olmo',
    nombre: 'Melamina olmo',
    nota: 'Simil madera clara impresa. Veta suave y uniforme.',
    color: '#c0a176',
    veta: 0.35,
    rugosidad: 0.62,
  },
  {
    id: 'pino',
    nombre: 'Pino Elliottis',
    nota: 'Maciza, clara y liviana. Nudos a la vista.',
    color: '#d6b183',
    veta: 0.85,
    rugosidad: 0.7,
  },
  {
    id: 'guatambu',
    nombre: 'Guatambu',
    nota: 'Grano cerrado, color parejo. Buena para frentes pintados.',
    color: '#dcc298',
    veta: 0.5,
    rugosidad: 0.6,
  },
  {
    id: 'paraiso',
    nombre: 'Paraiso',
    nota: 'Veta marcada y tono miel. Clasica del Litoral.',
    color: '#bd8f5f',
    veta: 0.9,
    rugosidad: 0.62,
  },
  {
    id: 'eucalipto',
    nombre: 'Eucalipto grandis',
    nota: 'Rosado calido, estable. Muy usada en tableros alistonados.',
    color: '#c58b6e',
    veta: 0.7,
    rugosidad: 0.65,
  },
  {
    id: 'petiribi',
    nombre: 'Petiribi',
    nota: 'Marron medio con vetas oscuras. Dura y pesada.',
    color: '#8d5736',
    veta: 0.95,
    rugosidad: 0.58,
  },
  {
    id: 'nogal',
    nombre: 'Nogal teñido',
    nota: 'Tono oscuro profundo sobre guatambu teñido al agua.',
    color: '#4b3226',
    veta: 0.8,
    rugosidad: 0.5,
  },
]

export const MADERA_POR_ID = new Map(MADERAS.map((m) => [m.id, m]))

export type Acabado = {
  id: string
  nombre: string
  nota: string
  /** Se suma a la rugosidad del material. Valores negativos lo hacen mas brillante. */
  deltaRugosidad: number
  /** Capa de laca por encima, para reflejos nitidos. */
  barniz: number
}

export const ACABADOS: Acabado[] = [
  {
    id: 'natural',
    nombre: 'Natural al aceite',
    nota: 'Se ve y se siente la madera. Requiere mantenimiento anual.',
    deltaRugosidad: 0.12,
    barniz: 0,
  },
  {
    id: 'mate',
    nombre: 'Laca mate',
    nota: 'Protege sin brillo. El acabado mas pedido.',
    deltaRugosidad: 0,
    barniz: 0.25,
  },
  {
    id: 'satinado',
    nombre: 'Laca satinada',
    nota: 'Brillo suave, se limpia facil. Recomendado para cocina y baño.',
    deltaRugosidad: -0.22,
    barniz: 0.7,
  },
]

export const ACABADO_POR_ID = new Map(ACABADOS.map((a) => [a.id, a]))
