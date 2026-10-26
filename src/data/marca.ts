/**
 * DATOS DE LA MARCA
 *
 * Esta es la demo generica: no es el taller de nadie. Para mostrarsela a una
 * marca, completar este objeto con sus datos y el encabezado, el pie y la hoja
 * en PDF quedan a su nombre solos. Es el unico archivo que hay que tocar.
 *
 * Los datos de contacto van vacios a proposito. Cada campo vacio se esconde en
 * vez de quedar como un enlace roto, asi que la demo no manda a nadie a un
 * telefono ni a un sitio que no es suyo.
 */
export type Marca = {
  nombre: string
  bajada: string
  zona: string
  whatsapp: string
  instagram: string
  sitio: string
  email: string
}

export const MARCA: Marca = {
  /** Va en la serif, arriba de todo, y encabeza la hoja en PDF. */
  nombre: 'TALLER DE MUEBLES',
  /** La linea chica debajo del nombre. Se muestra en mayusculas. */
  bajada: 'Hierro y madera',
  /** Ciudad o barrio del taller. Vacio: el pie no la nombra. */
  zona: '',
  /** Con codigo de pais y sin signos, por ejemplo 5491122223333. */
  whatsapp: '',
  /** Usuario, sin la arroba. */
  instagram: '',
  /** Con https:// adelante. */
  sitio: '',
  /** Solo lo usa el pie, y recien cuando esta completo. */
  email: '',
}

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
 * Las dos terminaciones de estructura del catalogo: blanca y negra, las dos en
 * pintura epoxi al horno. Alcanzan para casi cualquier taller de hierro.
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
 * Secciones de caño que usa cada familia de mueble, en mm. Son las medidas
 * habituales del rubro: 30x60 en escritorios, 25x25 en el rack y 20x20 en
 * estanteria, donde el caño carga menos.
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
 * El marco cerrado es el clasico del rubro: la pata no son cuatro postes
 * sueltos sino dos marcos rectangulares de caño chato, uno en cada extremo, con
 * el travesaño de abajo apoyado en el piso. La cara ancha del caño queda de
 * costado, que es lo que le da el aspecto macizo visto de perfil.
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
