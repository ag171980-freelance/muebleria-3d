import { modeloDe } from '../data/modelos'
import { BASE_POR_ID } from '../data/herrajes'
import type { Configuracion } from './tipos'

/** Un cajon mas bajo que esto no se puede usar. */
export const ALTO_MIN_CAJON = 80
export const ALTO_MAX_CAJON = 420
/** Espesor del fondo de fibrofacil. */
export const ESPESOR_FONDO = 6
/**
 * Luz entre frentes superpuestos. Con 3 mm el corte real cierra bien, pero en
 * pantalla la junta no se ve y las puertas se leen como una chapa lisa. 5 mm
 * es una luz de taller igual de valida y deja la sombra visible.
 */
export const LUZ_FRENTE = 5

export function alturaBaseReal(c: Configuracion): number {
  const b = BASE_POR_ID.get(c.baseId)
  if (!b || b.id === 'ninguna') return 0
  return c.alturaBase
}

/** Alto interior libre de la caja, descontando base, piso y techo. */
export function altoInterior(c: Configuracion): number {
  return Math.max(0, c.alto - alturaBaseReal(c) - 2 * c.espesor)
}

export function anchoInterior(c: Configuracion): number {
  return Math.max(0, c.ancho - 2 * c.espesor)
}

/** En comodas y columnas los cajones llenan todo el hueco; en el placard son un bloque suelto. */
export function cajonesLlenanHueco(modeloId: string): boolean {
  const d = modeloDe(modeloId).distribucion
  return d === 'cajones' || d === 'columnas'
}

/**
 * Alto de la cara frontal que hay para repartir entre frentes.
 * Los frentes van superpuestos: tapan los laterales, el piso y el techo de la caja.
 */
export function altoFrentes(c: Configuracion): number {
  return Math.max(0, c.alto - alturaBaseReal(c))
}

/** Alto total que los frentes de cajon tienen que cubrir cuando llenan el hueco. */
export function objetivoAlturaCajones(c: Configuracion): number {
  return altoFrentes(c)
}

function repartoParejo(cantidad: number, total: number): number[] {
  if (cantidad <= 0) return []
  const base = Math.floor(total / cantidad)
  const resto = total - base * cantidad
  return Array.from({ length: cantidad }, (_, i) => base + (i < resto ? 1 : 0))
}

/**
 * Devuelve `cantidad` alturas validas que suman exactamente `total`.
 * Parte de las alturas que ya habia para no mover lo que el cliente ajusto a mano.
 */
export function ajustarALlenar(previas: number[], cantidad: number, total: number): number[] {
  if (cantidad <= 0) return []
  const minimo = ALTO_MIN_CAJON * cantidad
  if (total < minimo) return repartoParejo(cantidad, Math.max(total, minimo))

  let alturas = Array.from({ length: cantidad }, (_, i) => previas[i] ?? 0)
  const sumaPrevia = alturas.reduce((a, b) => a + b, 0)
  if (sumaPrevia <= 0) return repartoParejo(cantidad, total)

  // Escalado proporcional, despues piso minimo, y el redondeo cae en el mas alto.
  const escala = total / sumaPrevia
  alturas = alturas.map((h) => Math.max(ALTO_MIN_CAJON, Math.round(h * escala)))
  let diferencia = total - alturas.reduce((a, b) => a + b, 0)
  let vueltas = 0
  while (diferencia !== 0 && vueltas < 200) {
    vueltas++
    const paso = Math.sign(diferencia)
    const indices = alturas
      .map((h, i) => ({ h, i }))
      .filter(({ h }) => (paso > 0 ? true : h > ALTO_MIN_CAJON))
      .sort((a, b) => b.h - a.h)
    if (!indices.length) break
    const objetivo = indices[0].i
    alturas[objetivo] += paso
    diferencia -= paso
  }
  return alturas
}

/** Bloque de cajones del placard: alturas libres, con tope para que quede lugar para colgar. */
export function ajustarBloque(previas: number[], cantidad: number, frente: number): number[] {
  if (cantidad <= 0) return []
  // Se reserva 700 mm para que arriba quede un hueco util para colgar.
  const tope = Math.max(ALTO_MIN_CAJON, Math.min(ALTO_MAX_CAJON, Math.floor((frente - 700) / cantidad)))
  return Array.from({ length: cantidad }, (_, i) => {
    const valor = previas[i] ?? 180
    return Math.max(ALTO_MIN_CAJON, Math.min(tope, Math.round(valor)))
  })
}

/** Unica puerta de entrada: deja `alturasCajones` siempre coherente con el resto. */
export function normalizarAlturas(c: Configuracion): number[] {
  if (c.cantidadCajones <= 0) return []
  return cajonesLlenanHueco(c.modeloId)
    ? ajustarALlenar(c.alturasCajones, c.cantidadCajones, objetivoAlturaCajones(c))
    : ajustarBloque(c.alturasCajones, c.cantidadCajones, altoFrentes(c))
}

/**
 * Cambia la altura de un cajon y reacomoda los demas para que el total siga cerrando.
 * Si el hueco es libre (placard) solo aplica el tope de ese cajon.
 */
export function fijarAlturaCajon(c: Configuracion, indice: number, mm: number): number[] {
  const alturas = normalizarAlturas(c)
  if (indice < 0 || indice >= alturas.length) return alturas

  if (!cajonesLlenanHueco(c.modeloId)) {
    const copia = [...alturas]
    copia[indice] = mm
    return ajustarBloque(copia, c.cantidadCajones, altoFrentes(c))
  }

  const total = objetivoAlturaCajones(c)
  const otros = alturas.length - 1
  const maximo = total - ALTO_MIN_CAJON * otros
  const fijo = Math.max(ALTO_MIN_CAJON, Math.min(maximo, Math.round(mm)))
  if (otros === 0) return [total]

  const resto = total - fijo
  const previos = alturas.filter((_, i) => i !== indice)
  const repartidos = ajustarALlenar(previos, otros, resto)
  const salida: number[] = []
  let k = 0
  for (let i = 0; i < alturas.length; i++) salida.push(i === indice ? fijo : repartidos[k++])
  return salida
}
