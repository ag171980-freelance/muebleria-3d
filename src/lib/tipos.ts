import type { TipoBase, TipoHerraje } from '../data/herrajes'
import type { TipoEstructura, TipoPata } from '../data/marca'

/** Como abre una puerta: a la gringa o corriendose sobre un riel. */
export type TipoPuerta = 'batiente' | 'corrediza'

/** Todas las medidas de la configuracion estan en milimetros. */
export type Configuracion = {
  modeloId: string
  ancho: number
  alto: number
  profundidad: number
  /** Espesor de la placa estructural: 18 o 25 mm. */
  espesor: number
  /** Especie de la madera: eucalipto o pino. */
  maderaId: string
  /** Tono del laqueado. */
  acabadoId: string
  /** Color de la pintura epoxi del hierro: negra o blanca. */
  estructuraId: TipoEstructura
  /** Como termina la pata en escritorios y mesas. */
  tipoPataId: TipoPata
  /** Filas de cajones, de abajo hacia arriba. */
  cantidadCajones: number
  /** Cajones lado a lado dentro de cada fila. */
  columnasCajones: number
  /** Altura de cada fila en mm. Siempre tiene `cantidadCajones` elementos. */
  alturasCajones: number[]
  cantidadPuertas: number
  tipoPuerta: TipoPuerta
  cantidadEstantes: number
  conBarral: boolean
  conFondo: boolean
  /** Escritorios: bandeja lateral para la CPU. */
  conEstanteCpu: boolean
  herrajeId: TipoHerraje
  baseId: TipoBase
  alturaBase: number
}

export type GrupoAjuste = 'cajones' | 'puertas' | 'estantes' | 'barral' | 'fondo' | 'base' | 'cpu'

export type RangoMedida = { min: number; max: number; paso: number }

/** Una de las medidas de catalogo, con la etiqueta tal como la muestra la tienda. */
export type MedidaDeCatalogo = {
  etiqueta: string
  ancho: number
  alto: number
  profundidad: number
}

/**
 * Como se reparte el interior del mueble. Define la geometria y tambien
 * si las alturas de cajones llenan el hueco o son un bloque libre.
 */
export type Distribucion =
  /** Cuerpo cerrado con cajones a la vista. */
  | 'cajones'
  /** Cuerpo con cajones abajo y puertas arriba. */
  | 'placar'
  /** Cuerpo cerrado con estantes. */
  | 'estantes'
  /** Cuerpo con cajonera a un lado y puertas al otro. */
  | 'columnas'
  /** Tapa de madera sobre bastidor de hierro, con retorno opcional en L. */
  | 'escritorio'
  /** Parantes de hierro con estantes de madera pasantes, sin cuerpo cerrado. */
  | 'estanteria-hierro'

export type Modelo = {
  id: string
  nombre: string
  resumen: string
  distribucion: Distribucion
  /** Que grupos de ajustes muestra el panel para este mueble. */
  grupos: GrupoAjuste[]
  rangos: { ancho: RangoMedida; alto: RangoMedida; profundidad: RangoMedida }
  maxCajones: number
  /** Hasta cuantos cajones se pueden poner uno al lado del otro. */
  maxColumnasCajones: number
  puertasPosibles: number[]
  /** Que tipos de puerta ofrece este mueble. Con uno solo, no se muestra la eleccion. */
  tiposPuerta: TipoPuerta[]
  maxEstantes: number
  /**
   * Las medidas que el catalogo ofrece como opcion. Son el punto de partida; el
   * configurador deja moverse entre medias porque todo se fabrica a medida.
   */
  medidas: MedidaDeCatalogo[]
  /** Escritorio en L: suma un ala perpendicular sobre el mismo bastidor. */
  retornoEnL?: boolean
  /** Punto de partida al elegir el mueble. */
  inicial: Omit<Configuracion, 'modeloId'>
}
