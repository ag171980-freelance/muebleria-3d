/**
 * DATOS DE LA MARCA
 *
 * Tomados de ironwoods.com.ar. El numero de WhatsApp y el Instagram son los que
 * publica el sitio; no encontre un mail publicado, asi que el contacto por mail
 * queda apagado hasta que lo confirmen.
 */
export const MARCA = {
  /** Como se llaman de verdad, segun los datos estructurados de su sitio. */
  nombre: 'IRON & WOOD',
  /** Su propia bajada, tal como la usan bajo el nombre en el encabezado. */
  bajada: 'Muebles de hierro y madera',
  /** Su logo dice "BELLA VISTA": es donde esta el taller. */
  zona: 'Bella Vista',
  whatsapp: '5491154196090',
  instagram: 'iron.woods',
  sitio: 'https://ironwoods.com.ar',
  /** Poner el mail cuando lo confirmen y el pie lo muestra solo. */
  email: '',
} as const

export type TipoEstructura = 'negra' | 'blanca'

export type Estructura = {
  id: TipoEstructura
  nombre: string
  nota: string
  /** Color de la pintura epoxi. */
  color: string
  /**
   * Hierro pintado, no metal desnudo: la componente metalica va baja o el
   * caño se dibuja como un espejo en vez de como un tubo laqueado.
   */
  metalico: number
  rugosidad: number
}

/**
 * Las dos unicas terminaciones de estructura que ofrece la marca, segun su
 * selector `pa_color-del-metal`: "Estructura Blanca" y "Estructura Negra",
 * las dos en pintura epoxi al horno.
 */
export const ESTRUCTURAS: Estructura[] = [
  {
    id: 'negra',
    nombre: 'Estructura negra',
    nota: 'Es la combinacion clasica de la marca.',
    color: '#1b1c1c',
    metalico: 0.22,
    rugosidad: 0.46,
  },
  {
    id: 'blanca',
    nombre: 'Estructura blanca',
    nota: 'Agranda visualmente y va mejor en ambientes chicos.',
    color: '#eceeee',
    metalico: 0.18,
    rugosidad: 0.44,
  },
]

export const ESTRUCTURA_POR_ID = new Map(ESTRUCTURAS.map((e) => [e.id, e]))

/**
 * Secciones de caño que usa cada familia de mueble, en mm. Salen de las fichas
 * de producto: "Estructura de hierro 30x60" en escritorios, "25x25" en el rack
 * y "20x20" en estanteria.
 */
export const CANIO = {
  escritorio: [60, 30] as [number, number],
  rack: [25, 25] as [number, number],
  estanteria: [20, 20] as [number, number],
}

export type TipoPata = 'marco' | 'marco-u' | 'recta'

export type EstiloPata = {
  id: TipoPata
  nombre: string
  nota: string
}

/**
 * Como termina la pata en escritorios y mesas.
 *
 * El marco cerrado es el de la marca: en todas sus fotos la pata no son cuatro
 * postes sueltos sino dos marcos rectangulares de caño chato, uno en cada
 * extremo, con el travesaño de abajo apoyado en el piso. La cara ancha del caño
 * queda de costado, que es lo que le da el aspecto macizo visto de perfil.
 */
export const PATAS: EstiloPata[] = [
  {
    id: 'marco',
    nombre: 'Marco cerrado',
    nota: 'Rectangulo completo de caño, apoyado en el piso de punta a punta. Es el de la casa.',
  },
  {
    id: 'marco-u',
    nombre: 'Marco en U',
    nota: 'El mismo marco sin el travesaño del piso. Deja pasar la aspiradora por debajo.',
  },
  {
    id: 'recta',
    nombre: 'Pata recta',
    nota: 'Cuatro postes sueltos. Mas liviano a la vista y el mas economico.',
  },
]

export const PATA_POR_ID = new Map(PATAS.map((p) => [p.id, p]))
