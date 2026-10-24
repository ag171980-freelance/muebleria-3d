import { medidaDePata } from './geometria'
import type { Despiece, Material, V3 } from './geometria'

export type PiezaDeLista = {
  /** Clave de agrupacion: mismo nombre y misma medida. */
  clave: string
  nombre: string
  /** Medidas en mm, de mayor a menor, que es como se cantea una placa. */
  largo: number
  ancho: number
  espesor: number
  cantidad: number
  material: Material
  /** Ids de las piezas del visor que entran en esta fila, para destacarlas. */
  ids: string[]
}

export type Despiece3D = {
  piezas: PiezaDeLista[]
  total: number
}

const NOMBRE_MATERIAL: Record<Material, string> = {
  placa: 'Placa',
  fondo: 'Fibrofacil 6 mm',
  metal: 'Hierro',
}

export function nombreDeMaterial(material: Material): string {
  return NOMBRE_MATERIAL[material]
}

/** Largo, ancho y espesor: las tres medidas ordenadas de mayor a menor. */
function ordenar(medida: V3): [number, number, number] {
  const [largo, ancho, espesor] = [...medida].sort((a, b) => b - a).map((n) => Math.round(n))
  return [largo, ancho, espesor]
}

/**
 * Lista de corte del mueble. Agrupa las piezas que salen iguales (los dos
 * laterales, los cinco estantes) porque asi se pide la placa y asi se marca
 * en el taller. Dos frentes de cajon de distinta altura quedan en filas
 * separadas, que es justamente lo que hay que saber antes de cortar.
 */
export function listaDePiezas(d: Despiece): Despiece3D {
  const filas = new Map<string, PiezaDeLista>()

  const sumar = (nombre: string, medida: V3, material: Material, id: string) => {
    const [largo, ancho, espesor] = ordenar(medida)
    const clave = [nombre, largo, ancho, espesor, material].join('|')
    const fila = filas.get(clave)
    if (fila) {
      fila.cantidad++
      fila.ids.push(id)
      return
    }
    filas.set(clave, { clave, nombre, largo, ancho, espesor, cantidad: 1, material, ids: [id] })
  }

  for (const panel of d.paneles) sumar(panel.nombre, panel.medida, panel.mat, panel.id)

  // El conjunto soldado va como una sola pieza, con la medida del marco entero.
  for (const conjunto of d.conjuntos) sumar(conjunto.nombre, conjunto.medida, conjunto.mat, conjunto.id)

  // Los postes del marco se piden por el largo de caño, igual que un listón.
  for (const pata of d.patas) sumar(pata.nombre, medidaDePata(pata), pata.mat, pata.id)

  for (const cajon of d.cajones) {
    sumar('Frente de cajon', cajon.frente.medida, 'placa', cajon.id + '-frente')
    for (const pieza of cajon.interior) sumar(pieza.nombre, pieza.medida, pieza.mat, cajon.id + '/' + pieza.id)
  }

  for (const puerta of d.puertas) sumar('Puerta', puerta.hoja.medida, 'placa', puerta.id + '-hoja')

  const piezas = [...filas.values()].sort((a, b) => {
    const orden: Material[] = ['placa', 'fondo', 'metal']
    const porMaterial = orden.indexOf(a.material) - orden.indexOf(b.material)
    if (porMaterial !== 0) return porMaterial
    return b.largo * b.ancho - a.largo * a.ancho
  })

  return { piezas, total: piezas.reduce((suma, fila) => suma + fila.cantidad, 0) }
}

/** Fila a la que pertenece una pieza del visor, para ir del 3D a la lista. */
export function filaDePieza(lista: PiezaDeLista[], id: string): PiezaDeLista | null {
  return lista.find((fila) => fila.ids.includes(id)) ?? null
}
