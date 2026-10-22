import { HERRAJE_POR_ID } from '../data/herrajes'
import { CORTE } from '../data/corte'
import type { Caja, Despiece, V3 } from './geometria'
import type { Configuracion } from './tipos'

/**
 * Lo que lleva el mueble, en materiales y herrajes. Son cantidades, no plata:
 * el precio lo pone el carpintero cuando recibe el pedido.
 */
export type Computo = {
  /** Superficie neta de placa, en metros cuadrados. */
  placaM2: number
  /** Superficie de fibrofacil de 6 mm, en metros cuadrados. */
  fondoM2: number
  /** Tapacanto, en metros lineales. */
  cantoMl: number
  placasEnteras: number
  bisagras: number
  correderas: number
  barrales: number
  tiradores: number
  /** Perfil J continuo, en metros lineales. */
  perfilMl: number
  piezas: number
  /** Peso aproximado del mueble armado, en kilos. */
  pesoKg: number
}

/** Cara mas grande de la pieza: es la que se descuenta de la placa. */
function caraMayor([a, b, c]: V3): number {
  return Math.max(a * b, a * c, b * c) / 1e6
}

/** Perimetro de la cara mas grande, para el tapacanto. */
function perimetroMayor([a, b, c]: V3): number {
  const caras: [number, number][] = [
    [a, b],
    [a, c],
    [b, c],
  ]
  const mayor = caras.reduce((mejor, par) => (par[0] * par[1] > mejor[0] * mejor[1] ? par : mejor))
  return (2 * (mayor[0] + mayor[1])) / 1000
}

/** Densidad aproximada de cada material, en kg por metro cuadrado de placa de 18 mm. */
const PESO_M2 = { placa: 12.5, fondo: 4.2, metal: 0 }

export function computar(c: Configuracion, d: Despiece): Computo {
  let placaM2 = 0
  let fondoM2 = 0
  let cantoMl = 0
  let pesoKg = 0
  let piezas = 0

  const sumar = (caja: { medida: V3; mat: Caja['mat'] }, cantoCompleto: boolean) => {
    const area = caraMayor(caja.medida)
    piezas++
    if (caja.mat === 'fondo') {
      fondoM2 += area
      pesoKg += area * PESO_M2.fondo
      return
    }
    if (caja.mat === 'metal') return
    placaM2 += area
    pesoKg += area * PESO_M2.placa * (c.espesor / 18)
    // En la carcasa solo se cantea el canto del frente; en frentes y estantes, todo el contorno.
    cantoMl += cantoCompleto ? perimetroMayor(caja.medida) : perimetroMayor(caja.medida) / 3
  }

  for (const panel of d.paneles) {
    const contornoVisible = panel.id.includes('estante') || panel.id === 'tapa' || panel.id.startsWith('travesanio')
    sumar(panel, contornoVisible)
  }
  for (const cajon of d.cajones) {
    sumar({ medida: cajon.frente.medida, mat: 'placa' }, true)
    for (const pieza of cajon.interior) sumar(pieza, false)
  }
  for (const puerta of d.puertas) sumar({ medida: puerta.hoja.medida, mat: 'placa' }, true)
  for (const pata of d.patas) {
    piezas++
    if (pata.mat === 'placa') {
      const area = (pata.seccion * pata.altura * 4) / 1e6
      placaM2 += area
      pesoKg += area * PESO_M2.placa
    }
  }

  const herraje = HERRAJE_POR_ID.get(c.herrajeId)
  const esPerfil = c.herrajeId === 'perfil-j'
  const esUniero = c.herrajeId === 'uñero'
  let perfilMl = 0
  let tiradores = 0
  if (esPerfil) {
    for (const cajon of d.cajones) perfilMl += cajon.frente.medida[0] / 1000
    for (const puerta of d.puertas) perfilMl += puerta.hoja.medida[1] / 1000
  } else if (!esUniero && herraje) {
    for (const cajon of d.cajones) tiradores += cajon.herrajes.length
    for (const puerta of d.puertas) tiradores += puerta.herrajes.length
  }

  // Tres bisagras por hoja desde 1,6 m de alto: con dos, la puerta se vence.
  const bisagras = d.puertas.reduce((total, p) => total + (p.hoja.medida[1] > 1600 ? 3 : 2), 0)

  const superficieBruta = placaM2 * (1 + CORTE.desperdicio)
  const areaPlaca = CORTE.placaEstandar.ancho * CORTE.placaEstandar.alto

  return {
    placaM2: Math.round(placaM2 * 100) / 100,
    fondoM2: Math.round(fondoM2 * 100) / 100,
    cantoMl: Math.round(cantoMl * 10) / 10,
    placasEnteras: Math.max(1, Math.ceil(superficieBruta / areaPlaca)),
    bisagras,
    correderas: d.cajones.length,
    barrales: d.barrales.length,
    tiradores,
    perfilMl: Math.round(perfilMl * 10) / 10,
    piezas,
    pesoKg: Math.round(pesoKg),
  }
}
