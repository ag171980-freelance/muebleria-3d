import type { TipoBase, TipoHerraje } from '../data/herrajes'

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
  maderaId: string
  acabadoId: string
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
  herrajeId: TipoHerraje
  terminacionHerrajeId: string
  baseId: TipoBase
  alturaBase: number
}

export type GrupoAjuste = 'cajones' | 'puertas' | 'estantes' | 'barral' | 'fondo' | 'base'

export type RangoMedida = { min: number; max: number; paso: number }

/**
 * Como se reparte el interior del mueble. Define la geometria y tambien
 * si las alturas de cajones llenan el hueco o son un bloque libre.
 */
export type Distribucion = 'cajones' | 'placar' | 'estantes' | 'columnas' | 'mesa'

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
  /** Punto de partida al elegir el mueble. */
  inicial: Omit<Configuracion, 'modeloId'>
}
