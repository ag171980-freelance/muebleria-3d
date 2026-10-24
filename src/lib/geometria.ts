import { modeloDe } from '../data/modelos'
import { HERRAJE_POR_ID, type TipoHerraje } from '../data/herrajes'
import { CANIO } from '../data/marca'
import {
  ESPESOR_FONDO,
  LUZ_FRENTE,
  alturaBaseReal,
  altoFrentes,
  anchoInterior,
  normalizarAlturas,
} from './cajones'
import type { Configuracion, TipoPuerta } from './tipos'

export type V3 = [number, number, number]
export type Eje = 'x' | 'y' | 'z'
export type Material = 'placa' | 'fondo' | 'metal'

export type Caja = {
  id: string
  /** Nombre de taller de la pieza. Sin numerar: el despiece agrupa por nombre y medida. */
  nombre: string
  pos: V3
  medida: V3
  grano: Eje
  mat: Material
  /** Donde queda la pieza cuando el mueble se desarma. Lo calcula acostarEnElPiso(). */
  tendido?: Tendido
}

/**
 * Posicion y giro de una pieza acostada en el piso.
 *
 * El despiece no explota en el aire: las piezas se acuestan sobre el piso, de
 * canto para abajo, como quedan en el taller cuando se corta la placa. Asi se
 * cuentan y se miden de verdad.
 */
export type Tendido = { pos: V3; rot: V3 }

export const TENDIDO_CERO: Tendido = { pos: [0, 0, 0], rot: [0, 0, 0] }

export type HerrajeColocado = {
  id: string
  /** Eje sobre el que se extiende el tirador. */
  eje: 'x' | 'y'
  pos: V3
  largo: number
}

export type CajonArmado = {
  id: string
  /** Centro del frente cerrado, en coordenadas globales. */
  ancla: V3
  frente: { medida: V3; grano: Eje; tendido?: Tendido }
  /** Piezas del cajon, relativas al ancla. */
  interior: Caja[]
  /** Herrajes relativos al ancla. */
  herrajes: HerrajeColocado[]
  tipoHerraje: TipoHerraje
  recorrido: number
  utiles: { ancho: number; alto: number; profundidad: number }
}

export type PuertaArmada = {
  id: string
  tipo: TipoPuerta
  /** Batiente: eje de giro. Corrediza: centro de la hoja cerrada. */
  bisagra: V3
  /** Batiente: 1 abre hacia +X, -1 hacia -X. Sin uso en corredizas. */
  sentido: 1 | -1
  hoja: { medida: V3; grano: Eje; centro: V3; tendido?: Tendido }
  herrajes: HerrajeColocado[]
  tipoHerraje: TipoHerraje
  /** Corrediza: cuanto corre sobre X al abrirse, en mm. */
  corrimiento: number
}

export type Pata = {
  id: string
  nombre: string
  pos: V3
  altura: number
  /** Lado del caño cuando es cuadrado. Sirve de medida y para el cubicaje. */
  seccion: number
  /** Medida real del caño cuando no es cuadrado, por ejemplo el 30x60. */
  medida?: V3
  forma: 'tubo' | 'rueda'
  mat: Material
  tendido?: Tendido
}

/** Medida con la que se dibuja y se cubica una pata. */
export function medidaDePata(pata: Pata): V3 {
  return pata.medida ?? [pata.seccion, pata.altura, pata.seccion]
}

export type Barral = { id: string; pos: V3; largo: number; radio: number; tendido?: Tendido }

/**
 * Un conjunto soldado: varios caños que forman una sola pieza.
 *
 * El marco de un escritorio llega del herrero soldado y entero. Mostrarlo
 * partido en cuatro barras en el despiece, o contarlo como cuatro renglones en
 * la lista de corte, es describir algo que no existe: nadie corta ni pide esas
 * cuatro barras por separado.
 */
export type Conjunto = {
  id: string
  nombre: string
  /** Centro del conjunto, en coordenadas globales. */
  pos: V3
  /** Envolvente del conjunto armado. Es la medida con la que se pide. */
  medida: V3
  /** Los caños soldados, con su posicion relativa al centro del conjunto. */
  piezas: Caja[]
  mat: Material
  tendido?: Tendido
}

/** Envolvente de un grupo de piezas acomodadas alrededor de un centro. */
function envolvente(piezas: Caja[]): V3 {
  const limite = (eje: 0 | 1 | 2) =>
    Math.max(...piezas.map((pz) => Math.abs(pz.pos[eje]) + pz.medida[eje] / 2)) * 2
  return [limite(0), limite(1), limite(2)]
}

/** Caja envolvente del mueble, en mm. `centroY` es la altura de su centro. */
export type Bulto = { ancho: number; alto: number; profundidad: number; centroY: number }

export type Despiece = {
  paneles: Caja[]
  /** Conjuntos soldados, que cuentan como una pieza sola. */
  conjuntos: Conjunto[]
  cajones: CajonArmado[]
  puertas: PuertaArmada[]
  patas: Pata[]
  barrales: Barral[]
  /** Rieles de las corredizas. Son herraje, no van a la lista de corte. */
  rieles: Caja[]
  bulto: Bulto
  /** Envolvente con todas las piezas separadas, para encuadrar la vista de despiece. */
  bultoDesarmado: Bulto
  avisos: string[]
}

/** Luz lateral del cajon para las correderas. */
const LUZ_CORREDERA = 13
/** Espesor de las paredes del cajon. */
const PARED_CAJON = 15
/** Abajo de esto un cajon no se puede usar, asi que no se abre otra columna. */
const ANCHO_MIN_CAJON = 230
/** Cuanto se pisan dos hojas corredizas vecinas. */
const SOLAPE_CORREDIZA = 35
/** Luz entre carriles del riel. */
const LUZ_CARRIL = 4
/** Alto del perfil del riel, arriba y abajo. */
const ALTO_RIEL = 16


/** Lo que sobresale el conjunto de hojas corredizas por delante de la caja. */
function vueloCorredizas(c: Configuracion, cantidad: number): number {
  return Math.max(1, cantidad) * (c.espesor + LUZ_CARRIL) + 6
}

function herrajesDeFrente(opts: {
  id: string
  tipo: TipoHerraje
  ancho: number
  alto: number
  /** Cara externa del frente, relativa al centro del frente. */
  z: number
  /** En puertas, de que lado queda el canto libre. */
  ladoLibre?: 1 | -1
}): HerrajeColocado[] {
  const { id, tipo, ancho, alto, z, ladoLibre } = opts
  const herraje = HERRAJE_POR_ID.get(tipo)
  if (!herraje || tipo === 'uñero') return []

  if (tipo === 'perfil-j') {
    return ladoLibre
      ? [{ id, eje: 'y', pos: [ladoLibre * (ancho / 2 - 12), 0, z], largo: alto - 20 }]
      : [{ id, eje: 'x', pos: [0, alto / 2 - 12, z], largo: ancho - 20 }]
  }

  if (tipo === 'perilla') {
    // En frentes anchos van dos perillas, si no el cajon se tuerce al tirar de un lado.
    if (!ladoLibre && ancho > 700) {
      return [
        { id: id + '-a', eje: 'x', pos: [-ancho / 4, 0, z], largo: 0 },
        { id: id + '-b', eje: 'x', pos: [ancho / 4, 0, z], largo: 0 },
      ]
    }
    const x = ladoLibre ? ladoLibre * (ancho / 2 - 55) : 0
    return [{ id, eje: 'x', pos: [x, 0, z], largo: 0 }]
  }

  // Barral y tirador tipo C.
  if (ladoLibre) {
    const largo = Math.min(herraje.largo, Math.max(96, alto * 0.35))
    return [{ id, eje: 'y', pos: [ladoLibre * (ancho / 2 - 50), 0, z], largo }]
  }
  const largo = Math.min(Math.max(herraje.largo, 96), Math.max(96, ancho * 0.6))
  // En un frente de mas de 90 cm un solo tirador al medio queda perdido y hace
  // palanca de un lado: el taller pone dos, a un cuarto de cada punta.
  if (ancho > 900) {
    return [
      { id: id + '-a', eje: 'x', pos: [-ancho / 4, 0, z], largo },
      { id: id + '-b', eje: 'x', pos: [ancho / 4, 0, z], largo },
    ]
  }
  return [{ id, eje: 'x', pos: [0, 0, z], largo }]
}

function armarCajon(opts: {
  id: string
  c: Configuracion
  /** Centro en X del frente. */
  cx: number
  anchoFrente: number
  /** Luz libre de la columna donde entra el cajon. */
  anchoHueco: number
  /** Base del hueco del frente, en Y global. */
  yBase: number
  altoHueco: number
  profundidadUtil: number
  /** Plano exterior del frente, en Z global. */
  zCara: number
  /** False si tiene una hoja cerrada por delante y no puede salir. */
  puedeAbrir: boolean
}): CajonArmado {
  const { id, c, cx, anchoFrente, anchoHueco, yBase, altoHueco, profundidadUtil, zCara, puedeAbrir } = opts
  const t = c.espesor
  const altoFrente = Math.max(40, altoHueco - LUZ_FRENTE)
  const cy = yBase + altoHueco / 2

  const anchoCaja = Math.max(120, anchoHueco - 2 * LUZ_CORREDERA)
  const profCaja = Math.max(150, profundidadUtil - 30)
  const altoCaja = Math.max(70, Math.min(altoFrente - 24, 180))
  // El frente se dibuja en el origen del grupo, asi que la caja va hacia -Z.
  const zCentroCaja = -(profCaja / 2 + t / 2)

  const interior: Caja[] = [
    {
      id: id + '-izq',
      nombre: 'Lateral de cajon',
      pos: [-(anchoCaja - PARED_CAJON) / 2, 0, zCentroCaja],
      medida: [PARED_CAJON, altoCaja, profCaja],
      grano: 'z',
      mat: 'placa',
    },
    {
      id: id + '-der',
      nombre: 'Lateral de cajon',
      pos: [(anchoCaja - PARED_CAJON) / 2, 0, zCentroCaja],
      medida: [PARED_CAJON, altoCaja, profCaja],
      grano: 'z',
      mat: 'placa',
    },
    {
      id: id + '-contrafrente',
      nombre: 'Contrafrente de cajon',
      pos: [0, 0, zCentroCaja - profCaja / 2 + PARED_CAJON / 2],
      medida: [anchoCaja - 2 * PARED_CAJON, altoCaja, PARED_CAJON],
      grano: 'x',
      mat: 'placa',
    },
    {
      id: id + '-piso',
      nombre: 'Piso de cajon',
      pos: [0, -altoCaja / 2 + ESPESOR_FONDO / 2, zCentroCaja],
      medida: [anchoCaja - 2 * PARED_CAJON, ESPESOR_FONDO, profCaja - PARED_CAJON],
      grano: 'x',
      mat: 'fondo',
    },
  ]

  return {
    id,
    ancla: [cx, cy, zCara + t / 2],
    frente: { medida: [anchoFrente, altoFrente, t], grano: 'x' },
    interior,
    herrajes: herrajesDeFrente({
      id: id + '-h',
      tipo: c.herrajeId,
      ancho: anchoFrente,
      alto: altoFrente,
      z: t / 2 + 1,
    }),
    tipoHerraje: c.herrajeId,
    recorrido: puedeAbrir ? Math.round(profCaja * 0.78) : 0,
    utiles: {
      ancho: Math.round(anchoCaja - 2 * PARED_CAJON),
      alto: Math.round(altoCaja - ESPESOR_FONDO),
      profundidad: Math.round(profCaja - PARED_CAJON),
    },
  }
}

/**
 * Cajones en grilla: filas a lo alto, columnas a lo ancho.
 *
 * Cada columna de mas lleva su parante, porque las correderas se amuran a los
 * costados y sin un parante en el medio no hay donde atornillarlas. La cantidad
 * de columnas se recorta sola si el mueble no da el ancho para cajones usables.
 */
function armarGrillaCajones(opts: {
  c: Configuracion
  alturas: number[]
  /** Borde izquierdo de la zona de frentes, X global. */
  xDesde: number
  anchoZona: number
  /** Base de la fila de mas abajo, Y global. */
  yBase: number
  profundidadUtil: number
  /** Plano exterior de los frentes, Z global. */
  zCara: number
  /** True cuando los frentes van dentro de la caja, detras de las puertas. */
  adentro: boolean
  /**
   * Tramo de X que queda descubierto al abrir las corredizas. Un cajon tapado
   * por una hoja no puede salir: atravesaria la puerta.
   */
  zonaAbierta?: [number, number]
}): { cajones: CajonArmado[]; paneles: Caja[]; columnas: number } {
  const { c, alturas, xDesde, anchoZona, yBase, profundidadUtil, zCara, adentro, zonaAbierta } = opts
  if (alturas.length === 0 || anchoZona <= 0) return { cajones: [], paneles: [], columnas: 0 }

  const t = c.espesor
  const columnas = Math.max(
    1,
    Math.min(Math.round(c.columnasCajones), Math.max(1, Math.floor(anchoZona / ANCHO_MIN_CAJON))),
  )

  // Luz libre de cada columna, descontando los laterales de la caja y los parantes.
  const huecoTotal = adentro ? anchoZona : anchoZona - 2 * t
  const anchoHueco = Math.max(120, (huecoTotal - (columnas - 1) * t) / columnas)
  const xHueco = xDesde + (adentro ? 0 : t)
  const altoBloque = alturas.reduce((a, b) => a + b, 0)

  const cajones: CajonArmado[] = []
  const paneles: Caja[] = []

  for (let j = 0; j < columnas - 1; j++) {
    const x = xHueco + (j + 1) * anchoHueco + j * t + t / 2
    paneles.push({
      id: 'parante-cajonera-' + j,
      nombre: 'Parante de cajonera',
      pos: [x, yBase + altoBloque / 2, zCara - profundidadUtil / 2 - t / 2],
      medida: [t, altoBloque, profundidadUtil],
      grano: 'y',
      mat: 'placa',
      // Mas afuera que el parante central, para que no se monten en el despiece.
    })
  }

  alturas.forEach((altoHueco, fila) => {
    const yFila = yBase + alturas.slice(0, fila).reduce((a, b) => a + b, 0)
    for (let j = 0; j < columnas; j++) {
      const cx = xHueco + j * (anchoHueco + t) + anchoHueco / 2
      // El frente superpuesto tapa el lateral de la caja o medio parante.
      const bordeIzq = adentro ? 0 : j === 0 ? t : t / 2
      const bordeDer = adentro ? 0 : j === columnas - 1 ? t : t / 2
      const anchoFrente = Math.max(80, anchoHueco + bordeIzq + bordeDer - LUZ_FRENTE)
      const puedeAbrir = !zonaAbierta || (cx > zonaAbierta[0] && cx < zonaAbierta[1])
      cajones.push(
        armarCajon({
          id: 'cajon-' + fila + '-' + j,
          c,
          cx,
          anchoFrente,
          anchoHueco,
          yBase: yFila,
          altoHueco,
          profundidadUtil,
          zCara,
          puedeAbrir,
        }),
      )
    }
  })

  return { cajones, paneles, columnas }
}

function armarPuertasBatientes(opts: {
  c: Configuracion
  cantidad: number
  xDesde: number
  anchoZona: number
  yBase: number
  altoZona: number
}): PuertaArmada[] {
  const { c, cantidad, xDesde, anchoZona, yBase, altoZona } = opts
  if (cantidad <= 0) return []
  const t = c.espesor
  const altoHoja = Math.max(60, altoZona - LUZ_FRENTE)
  const anchoHoja = Math.max(80, (anchoZona - LUZ_FRENTE * (cantidad + 1)) / cantidad)
  const cy = yBase + altoZona / 2
  const zCara = c.profundidad / 2

  return Array.from({ length: cantidad }, (_, i) => {
    // Las hojas van de a pares enfrentadas: la primera abre a la izquierda, la segunda a la derecha.
    const sentido: 1 | -1 = i % 2 === 0 ? -1 : 1
    const x0 = xDesde + LUZ_FRENTE + i * (anchoHoja + LUZ_FRENTE)
    const centroX = x0 + anchoHoja / 2
    const xBisagra = sentido === -1 ? x0 : x0 + anchoHoja
    const offsetX = centroX - xBisagra
    const ladoLibre: 1 | -1 = sentido === -1 ? 1 : -1
    return {
      id: 'puerta-' + i,
      tipo: 'batiente' as TipoPuerta,
      bisagra: [xBisagra, cy, zCara] as V3,
      sentido,
      hoja: { medida: [anchoHoja, altoHoja, t] as V3, grano: 'y' as Eje, centro: [offsetX, 0, t / 2] as V3 },
      herrajes: herrajesDeFrente({
        id: 'puerta-' + i + '-h',
        tipo: c.herrajeId,
        ancho: anchoHoja,
        alto: altoHoja,
        z: t + 1,
        ladoLibre,
      }).map((h) => ({ ...h, pos: [h.pos[0] + offsetX, h.pos[1], h.pos[2]] as V3 })),
      tipoHerraje: c.herrajeId,
      corrimiento: 0,
    }
  })
}

/**
 * Hojas corredizas, cada una en su carril.
 *
 * Las hojas se pisan entre si y, al abrirse, corren hacia la derecha hasta
 * apilarse contra la ultima, que es lo que hace un placard de riel. El tirador
 * va siempre al ras: una perilla que sobresalga choca con la hoja de al lado.
 */
function armarPuertasCorredizas(opts: {
  c: Configuracion
  cantidad: number
  xDesde: number
  anchoZona: number
  yBase: number
  altoZona: number
}): { puertas: PuertaArmada[]; rieles: Caja[] } {
  const { c, cantidad, xDesde, anchoZona, yBase, altoZona } = opts
  if (cantidad <= 0) return { puertas: [], rieles: [] }
  const t = c.espesor
  const anchoHoja = Math.max(120, (anchoZona + (cantidad - 1) * SOLAPE_CORREDIZA) / cantidad)
  const salto = anchoHoja - SOLAPE_CORREDIZA
  const altoHoja = Math.max(60, altoZona - 2 * ALTO_RIEL - 6)
  const cy = yBase + altoZona / 2
  const zFrenteCaja = c.profundidad / 2
  const vuelo = vueloCorredizas(c, cantidad)

  const puertas: PuertaArmada[] = Array.from({ length: cantidad }, (_, i) => {
    const centroX = xDesde + i * salto + anchoHoja / 2
    const zCarril = zFrenteCaja + 2 + i * (t + LUZ_CARRIL)
    // El tirador va sobre el canto que se enfrenta con la hoja vecina.
    const ladoLibre: 1 | -1 = i < cantidad - 1 ? 1 : -1
    return {
      id: 'puerta-' + i,
      tipo: 'corrediza',
      bisagra: [centroX, cy, zCarril] as V3,
      sentido: 1,
      hoja: { medida: [anchoHoja, altoHoja, t] as V3, grano: 'y' as Eje, centro: [0, 0, t / 2] as V3 },
      herrajes: [
        {
          id: 'puerta-' + i + '-h',
          eje: 'y' as const,
          pos: [ladoLibre * (anchoHoja / 2 - 16), 0, t + 1] as V3,
          largo: Math.max(120, altoHoja - 60),
        },
      ],
      // Siempre al ras, sin importar que herraje se eligio para los cajones.
      tipoHerraje: 'perfil-j',
      corrimiento: (cantidad - 1 - i) * salto,
    }
  })

  const centroZona = xDesde + anchoZona / 2
  const zRiel = zFrenteCaja + 2 + vuelo / 2 - 4
  const rieles: Caja[] = [
    {
      id: 'riel-superior',
      nombre: 'Riel superior',
      pos: [centroZona, yBase + altoZona - ALTO_RIEL / 2, zRiel],
      medida: [anchoZona, ALTO_RIEL, vuelo],
      grano: 'x',
      mat: 'metal',
    },
    {
      id: 'riel-inferior',
      nombre: 'Riel inferior',
      pos: [centroZona, yBase + ALTO_RIEL / 2, zRiel],
      medida: [anchoZona, ALTO_RIEL, vuelo],
      grano: 'x',
      mat: 'metal',
    },
  ]

  return { puertas, rieles }
}

function armarBase(c: Configuracion): { patas: Pata[]; paneles: Caja[] } {
  const hb = alturaBaseReal(c)
  if (hb <= 0) return { patas: [], paneles: [] }
  const { ancho: W, profundidad: D } = c

  const ruedas = c.baseId === 'ruedas'
  // Caño 25x25, que es el que la marca usa en rack y mesas de luz.
  const seccion = ruedas ? 48 : CANIO.rack[0]
  const retiro = ruedas ? 60 : 45
  const esquinas: V3[] = [
    [-(W / 2 - retiro), hb / 2, -(D / 2 - retiro)],
    [W / 2 - retiro, hb / 2, -(D / 2 - retiro)],
    [-(W / 2 - retiro), hb / 2, D / 2 - retiro],
    [W / 2 - retiro, hb / 2, D / 2 - retiro],
  ]
  return {
    patas: esquinas.map((pos, i) => ({
      id: 'pata-' + i,
      nombre: ruedas ? 'Rueda giratoria' : 'Pata de hierro',
      pos,
      altura: hb,
      seccion,
      forma: ruedas ? 'rueda' : 'tubo',
      mat: 'metal',
    })),
    paneles: [],
  }
}

function armarCarcasa(c: Configuracion): Caja[] {
  const t = c.espesor
  const { ancho: W, profundidad: D } = c
  const hb = alturaBaseReal(c)
  const hc = c.alto - hb
  const Wi = anchoInterior(c)
  const piezas: Caja[] = [
    {
      id: 'lat-izq',
      nombre: 'Lateral',
      pos: [-(W - t) / 2, hb + hc / 2, 0],
      medida: [t, hc, D],
      grano: 'y',
      mat: 'placa',
    },
    {
      id: 'lat-der',
      nombre: 'Lateral',
      pos: [(W - t) / 2, hb + hc / 2, 0],
      medida: [t, hc, D],
      grano: 'y',
      mat: 'placa',
    },
    {
      id: 'techo',
      nombre: 'Techo',
      pos: [0, hb + hc - t / 2, 0],
      medida: [Wi, t, D],
      grano: 'x',
      mat: 'placa',
    },
    {
      id: 'piso',
      nombre: 'Piso',
      pos: [0, hb + t / 2, 0],
      medida: [Wi, t, D],
      grano: 'x',
      mat: 'placa',
    },
  ]
  if (c.conFondo) {
    piezas.push({
      id: 'fondo',
      nombre: 'Fondo',
      pos: [0, hb + hc / 2, -(D / 2 - ESPESOR_FONDO / 2)],
      medida: [Wi, hc - 2 * t, ESPESOR_FONDO],
      grano: 'x',
      mat: 'fondo',
    })
  }
  return piezas
}

function repartirEstantes(opts: {
  c: Configuracion
  cantidad: number
  xCentro: number
  ancho: number
  yDesde: number
  yHasta: number
  prefijo: string
}): Caja[] {
  const { c, cantidad, xCentro, ancho, yDesde, yHasta, prefijo } = opts
  if (cantidad <= 0 || ancho <= 0) return []
  const t = c.espesor
  const prof = (c.conFondo ? c.profundidad - ESPESOR_FONDO : c.profundidad) - 12
  const luz = (yHasta - yDesde) / (cantidad + 1)
  return Array.from({ length: cantidad }, (_, i) => ({
    id: prefijo + '-estante-' + i,
    nombre: 'Estante',
    pos: [xCentro, yDesde + luz * (i + 1), c.conFondo ? ESPESOR_FONDO / 2 - 6 : -6] as V3,
    medida: [ancho, t, prof] as V3,
    grano: 'x' as Eje,
    mat: 'placa' as Material,
    // Salen de a uno hacia adelante, en escalera, para que se cuenten de un vistazo.
  }))
}

function avisosDe(c: Configuracion, luzEstante: number, columnas: number): string[] {
  const avisos: string[] = []
  const modelo = modeloDe(c.modeloId)
  const corrediza = c.tipoPuerta === 'corrediza' && c.cantidadPuertas > 0

  if (luzEstante > 900) {
    avisos.push(
      'Con mas de 90 cm de luz libre el estante se flecha con peso. Conviene un parante central o placa de 25 mm.',
    )
  }
  if (c.espesor === 20 && c.ancho > 1800 && modelo.distribucion !== 'estanteria-hierro') {
    avisos.push('Arriba de 1,80 m de ancho la madera de 20 mm se arquea. A esta medida la hacemos en 30 mm.')
  }
  if (modelo.distribucion === 'placar' && c.profundidad < 500) {
    avisos.push('Para colgar en percha hacen falta 50 cm de profundidad. Con menos, el barral va perpendicular al frente.')
  }
  if (modelo.distribucion === 'estantes' && !c.conFondo && c.alto > 1800) {
    avisos.push('Sin fondo y a esta altura el mueble hay que amurarlo a la pared. Los tarugos van incluidos.')
  }
  if (c.baseId === 'patas-hierro' && c.ancho > 1800) {
    avisos.push('A este ancho le sumamos una pata central de caño para que el piso no se hunda.')
  }
  if (modelo.distribucion === 'escritorio' && c.ancho > 1800 && c.espesor < 30) {
    avisos.push('Una tapa de mas de 1,80 m va si o si en madera maciza de 30 mm.')
  }
  if (modelo.distribucion === 'escritorio' && c.alto > 790) {
    avisos.push('Arriba de 79 cm de alto conviene una silla regulable o un apoyapies: es altura de escritorio alto.')
  }
  if (modelo.distribucion === 'estanteria-hierro' && c.alto > 1600) {
    avisos.push('A esta altura la estanteria se amura a la pared con dos fijaciones arriba. Van incluidas.')
  }
  if (c.baseId === 'ruedas' && c.ancho > 500) {
    avisos.push('Con ruedas y mas de 50 cm de ancho el mueble se vuelca al abrir el cajon de arriba lleno.')
  }
  if (columnas > 0 && columnas < Math.round(c.columnasCajones)) {
    avisos.push(
      'A este ancho no entran ' +
        Math.round(c.columnasCajones) +
        ' cajones por fila sin que queden angostos: van ' +
        columnas +
        '. Ensanchando el mueble entran todos.',
    )
  }
  if (corrediza) {
    avisos.push(
      'Las corredizas se abren de a un tramo por vez: con ' +
        c.cantidadPuertas +
        ' hojas siempre queda tapada una parte. Los tiradores van al ras para que no choquen entre si.',
    )
  }
  if (corrediza && modelo.distribucion === 'placar' && c.profundidad < 600) {
    avisos.push('El riel y las hojas se comen unos 7 cm de fondo. Para colgar comodo conviene 60 cm o mas.')
  }
  return avisos
}

/** Retiro del marco respecto del borde de la tapa. */
const RETIRO_PATA = 70

/**
 * Escritorio y mesa: tapa de madera maciza sobre bastidor de hierro.
 *
 * La pata no son cuatro postes sueltos. En todas las fotos de la marca es un
 * marco rectangular de caño chato por cada extremo, con la cara ancha de
 * costado y el travesaño de abajo apoyado en el piso. Los dos marcos se unen
 * con un travesaño largo atras. Adelante no lleva nada: ahi van las rodillas.
 */
function armarEscritorio(
  c: Configuracion,
  enL: boolean,
): {
  paneles: Caja[]
  conjuntos: Conjunto[]
  cajones: CajonArmado[]
  puertas: PuertaArmada[]
  patas: Pata[]
  barrales: Barral[]
  rieles: Caja[]
  bulto: Bulto
} {
  const t = c.espesor
  const { ancho: W, profundidad: D } = c
  const altoPata = c.alto - t
  const [caraAncha, caraAngosta] = CANIO.escritorio
  // El caño va de canto: se ve angosto de frente y macizo de perfil.
  const grosor = caraAngosta
  const canto = caraAncha
  const estilo = c.tipoPataId
  const cerrado = estilo === 'marco'
  const esMarco = estilo === 'marco' || estilo === 'marco-u'

  // En el escritorio en L la huella en planta es cuadrada: el ala principal va
  // adelante y el retorno ocupa el fondo contra un costado.
  const fondoTotal = enL ? Math.max(D, W) : D
  const zPrincipal = enL ? fondoTotal / 2 - D / 2 : 0

  const paneles: Caja[] = [
    {
      id: 'tapa',
      nombre: 'Tapa',
      pos: [0, c.alto - t / 2, zPrincipal],
      medida: [W, t, D],
      grano: 'x',
      mat: 'placa',
    },
  ]
  const patas: Pata[] = []
  const conjuntos: Conjunto[] = []

  /**
   * Un marco por extremo. `eje` dice sobre que direccion corren los travesaños
   * del marco: 'z' en los laterales del ala principal, 'x' en el retorno.
   */
  /**
   * Un marco por extremo.
   *
   * El marco cerrado y el marco en U llegan del herrero **soldados y enteros**,
   * asi que salen como un conjunto: una sola pieza en la lista de corte y un
   * solo bulto cuando el mueble se desarma. La pata recta si son cuatro caños
   * sueltos, y en ese caso van como patas independientes.
   *
   * `eje` dice sobre que direccion corren los travesaños: 'z' en los laterales
   * del ala principal, 'x' en el retorno del escritorio en L.
   */
  const armarMarco = (clave: string, cx: number, cz: number, largo: number, eje: 'x' | 'z') => {
    const mitad = largo / 2 - RETIRO_PATA
    const medidaPoste: V3 = eje === 'z' ? [grosor, altoPata, canto] : [canto, altoPata, grosor]

    if (!esMarco) {
      for (const [i, signo] of [-1, 1].entries()) {
        patas.push({
          id: clave + '-poste-' + i,
          nombre: 'Pata de hierro',
          pos: eje === 'z' ? [cx, altoPata / 2, cz + signo * mitad] : [cx + signo * mitad, altoPata / 2, cz],
          altura: altoPata,
          // `seccion` solo sirve de referencia; la medida real va en `medida`.
          seccion: grosor,
          forma: 'tubo',
          mat: 'metal',
          medida: medidaPoste,
        })
      }
      return
    }

    // Las piezas del marco van relativas a su centro, para que el conjunto se
    // pueda mover y girar entero.
    const piezas: Caja[] = []
    for (const [i, signo] of [-1, 1].entries()) {
      piezas.push({
        id: clave + '-poste-' + i,
        nombre: 'Poste',
        pos: eje === 'z' ? [0, 0, signo * mitad] : [signo * mitad, 0, 0],
        medida: medidaPoste,
        grano: 'y',
        mat: 'metal',
      })
    }

    // Travesaño de arriba, pegado bajo la tapa, y el del piso si el marco cierra.
    const alturas: [string, number][] = cerrado
      ? [
          ['sup', altoPata / 2 - canto / 2],
          ['piso', -(altoPata / 2) + canto / 2],
        ]
      : [['sup', altoPata / 2 - canto / 2]]

    const largoTravesanio = largo - 2 * RETIRO_PATA + grosor
    for (const [nombre, y] of alturas) {
      piezas.push({
        id: clave + '-' + nombre,
        nombre: nombre === 'piso' ? 'Travesaño de piso' : 'Travesaño de marco',
        pos: [0, y, 0],
        medida: eje === 'z' ? [grosor, canto, largoTravesanio] : [largoTravesanio, canto, grosor],
        grano: eje,
        mat: 'metal',
      })
    }

    conjuntos.push({
      id: clave,
      nombre: cerrado ? 'Marco de hierro' : 'Marco de hierro en U',
      pos: [cx, altoPata / 2, cz],
      medida: envolvente(piezas),
      piezas,
      mat: 'metal',
    })
  }

  const xIzq = -(W / 2 - RETIRO_PATA)
  const xDer = W / 2 - RETIRO_PATA
  armarMarco('marco-izq', xIzq, zPrincipal, D, 'z')
  armarMarco('marco-der', xDer, zPrincipal, D, 'z')

  // Travesaño largo de atras: es el que une los dos marcos y cuadra el mueble.
  const zFondo = zPrincipal - D / 2 + RETIRO_PATA
  paneles.push({
    id: 'bastidor-largo',
    nombre: 'Travesaño largo',
    pos: [0, Math.max(160, altoPata * 0.28), zFondo],
    medida: [W - 2 * RETIRO_PATA, grosor, grosor],
    grano: 'x',
    mat: 'metal',
  })

  if (enL) {
    // Ala perpendicular contra el costado derecho, hacia el fondo.
    const largoRetorno = Math.max(200, fondoTotal - D)
    const zRetorno = zPrincipal - D / 2 - largoRetorno / 2
    const xRetorno = W / 2 - D / 2
    paneles.push({
      id: 'tapa-retorno',
      nombre: 'Tapa de retorno',
      pos: [xRetorno, c.alto - t / 2, zRetorno],
      medida: [D, t, largoRetorno],
      grano: 'z',
      mat: 'placa',
    })
    // El retorno apoya en un marco propio, en la punta libre.
    armarMarco('marco-ret', xRetorno, zRetorno - largoRetorno / 2 + RETIRO_PATA, D, 'x')
  }

  if (c.conEstanteCpu) {
    // La bandeja apoya dentro del marco izquierdo, sobre el travesaño de abajo,
    // y se mete hacia adentro del escritorio. Es como la llevan en sus fotos:
    // abajo y adentro del marco, no colgada bajo la tapa.
    const espesorBandeja = 20
    const anchoBandeja = 340
    const yBandeja = (cerrado ? canto : 0) + Math.max(140, altoPata * 0.22) + espesorBandeja / 2
    paneles.push({
      id: 'estante-cpu',
      nombre: 'Bandeja para CPU',
      pos: [xIzq + anchoBandeja / 2, yBandeja, zPrincipal],
      medida: [anchoBandeja, espesorBandeja, Math.max(220, D - 2 * RETIRO_PATA)],
      grano: 'x',
      mat: 'placa',
    })
    paneles.push({
      id: 'soporte-cpu',
      nombre: 'Soporte de bandeja',
      pos: [xIzq + anchoBandeja - grosor / 2, yBandeja - espesorBandeja / 2 - canto / 2, zPrincipal],
      medida: [grosor, canto, Math.max(220, D - 2 * RETIRO_PATA)],
      grano: 'z',
      mat: 'metal',
    })
  }

  const bulto: Bulto = { ancho: W, alto: c.alto, profundidad: fondoTotal, centroY: c.alto / 2 }
  return { paneles, conjuntos, cajones: [], puertas: [], patas, barrales: [], rieles: [], bulto }
}

/**
 * Estanteria: parantes de hierro 20x20 y estantes de madera maciza pasantes.
 *
 * No hay cuerpo cerrado. Los estantes apoyan sobre travesaños soldados a los
 * parantes, que es como se arma una estanteria de hierro: el estante entra
 * entre los dos bastidores laterales y queda a la vista por los cuatro cantos.
 */
function armarEstanteriaHierro(
  c: Configuracion,
): {
  paneles: Caja[]
  conjuntos: Conjunto[]
  cajones: CajonArmado[]
  puertas: PuertaArmada[]
  patas: Pata[]
  barrales: Barral[]
  rieles: Caja[]
  bulto: Bulto
  luzEstante: number
} {
  const t = c.espesor
  const { ancho: W, profundidad: D, alto: H } = c
  const [seccion] = CANIO.estanteria
  const cantidad = Math.max(1, c.cantidadEstantes)
  const anchoEstante = Math.max(120, W - 2 * seccion)

  const paneles: Caja[] = []
  const patas: Pata[] = []

  // Cuatro parantes, con la cara externa al ras del ancho y del fondo.
  const esquinas: [number, number][] = [
    [-(W / 2 - seccion / 2), -(D / 2 - seccion / 2)],
    [W / 2 - seccion / 2, -(D / 2 - seccion / 2)],
    [-(W / 2 - seccion / 2), D / 2 - seccion / 2],
    [W / 2 - seccion / 2, D / 2 - seccion / 2],
  ]
  esquinas.forEach(([x, z], i) => {
    patas.push({
      id: 'parante-' + i,
      nombre: 'Parante de hierro',
      pos: [x, H / 2, z],
      altura: H,
      seccion,
      forma: 'tubo',
      mat: 'metal',
    })
  })

  // El estante de mas abajo deja el pie libre y el de arriba cierra el mueble.
  const yPrimero = Math.min(120, H * 0.08)
  const yUltimo = H - t / 2
  const salto = cantidad > 1 ? (yUltimo - yPrimero) / (cantidad - 1) : 0

  for (let i = 0; i < cantidad; i++) {
    const y = cantidad > 1 ? yPrimero + i * salto : H / 2
    paneles.push({
      id: 'estante-' + i,
      nombre: 'Estante',
      pos: [0, y, 0],
      medida: [anchoEstante, t, D],
      grano: 'x',
      mat: 'placa',
    })
    // Travesaños que sostienen el estante, uno de cada lado.
    for (const [j, signo] of [-1, 1].entries()) {
      paneles.push({
        id: 'soporte-' + i + '-' + j,
        nombre: 'Travesaño de estante',
        pos: [signo * (W / 2 - seccion / 2), y - t / 2 - seccion / 2, 0],
        medida: [seccion, seccion, D - 2 * seccion],
        grano: 'z',
        mat: 'metal',
      })
    }
  }

  // Travesaños de fondo arriba y abajo: son los que la cuadran.
  for (const [i, y] of [yPrimero - t / 2 - seccion / 2, H - seccion / 2].entries()) {
    paneles.push({
      id: 'cruz-fondo-' + i,
      nombre: 'Travesaño de fondo',
      pos: [0, y, -(D / 2 - seccion / 2)],
      medida: [W - 2 * seccion, seccion, seccion],
      grano: 'x',
      mat: 'metal',
    })
  }

  const bulto: Bulto = { ancho: W, alto: H, profundidad: D, centroY: H / 2 }
  return {
    paneles,
    conjuntos: [],
    cajones: [],
    puertas: [],
    patas,
    barrales: [],
    rieles: [],
    bulto,
    luzEstante: anchoEstante,
  }
}

/** Luz entre piezas acostadas, en mm. */
const LUZ_PISO = 70

type PiezaSuelta = { medida: V3; asignar: (t: Tendido) => void }

/**
 * Como queda una pieza apoyada de plano: el lado mas finito pasa a ser el alto.
 *
 * Devuelve el giro que hay que aplicarle, la huella que ocupa en el piso y el
 * espesor que levanta. Una tapa ya viene acostada; un lateral hay que voltearlo.
 */
function acostar(medida: V3): { rot: V3; huella: [number, number]; alto: number } {
  const [x, y, z] = medida
  let fino = 1
  if (x <= y && x <= z) fino = 0
  else if (z <= y && z <= x) fino = 2

  if (fino === 0) return { rot: [0, 0, Math.PI / 2], huella: [y, z], alto: x }
  if (fino === 2) return { rot: [Math.PI / 2, 0, 0], huella: [x, y], alto: z }
  return { rot: [0, 0, 0], huella: [x, z], alto: y }
}

/**
 * Acuesta todas las piezas del mueble sobre el piso, en filas.
 *
 * El despiece no explota en el aire: las piezas se vacian sobre el piso del
 * taller, de plano, ordenadas de mayor a menor y acomodadas de izquierda a
 * derecha hasta llenar el ancho de la tirada. El conjunto queda centrado en el
 * origen para que la camara lo encuadre solo.
 */
function acostarEnElPiso(piezas: PiezaSuelta[]): Bulto {
  if (piezas.length === 0) return { ancho: 1, alto: 1, profundidad: 1, centroY: 0 }

  const acostadas = piezas
    .map((pieza) => ({ ...pieza, ...acostar(pieza.medida) }))
    .sort((a, b) => b.huella[0] * b.huella[1] - a.huella[0] * a.huella[1])

  // Ancho de la tirada: se busca que el conjunto quede mas o menos cuadrado.
  const superficie = acostadas.reduce((total, p) => total + p.huella[0] * p.huella[1], 0)
  const anchoTirada = Math.max(acostadas[0].huella[0], Math.sqrt(superficie) * 1.45)

  const ubicadas: { pieza: (typeof acostadas)[number]; pos: V3 }[] = []
  let x = 0
  let z = 0
  let fondoFila = 0
  let anchoUsado = 0
  let altoMax = 0

  for (const pieza of acostadas) {
    const [ancho, fondo] = pieza.huella
    if (x > 0 && x + ancho > anchoTirada) {
      // Se lleno la fila: baja a la siguiente.
      z += fondoFila + LUZ_PISO
      x = 0
      fondoFila = 0
    }
    ubicadas.push({ pieza, pos: [x + ancho / 2, pieza.alto / 2, z + fondo / 2] })
    x += ancho + LUZ_PISO
    anchoUsado = Math.max(anchoUsado, x - LUZ_PISO)
    fondoFila = Math.max(fondoFila, fondo)
    altoMax = Math.max(altoMax, pieza.alto)
  }

  const fondoTotal = z + fondoFila
  // Se acomodo desde el origen hacia +X y +Z: ahora se corre todo al centro.
  for (const { pieza, pos } of ubicadas) {
    pieza.asignar({
      pos: [pos[0] - anchoUsado / 2, pos[1], pos[2] - fondoTotal / 2],
      rot: pieza.rot,
    })
  }

  return {
    ancho: Math.max(1, anchoUsado),
    alto: Math.max(1, altoMax),
    profundidad: Math.max(1, fondoTotal),
    centroY: altoMax / 2,
  }
}

/**
 * Junta todas las piezas del mueble y las acuesta en el piso.
 *
 * Las piezas que viven dentro de un grupo (el frente y la caja de un cajon, la
 * hoja de una puerta) guardan su destino en coordenadas del mundo: al
 * desarmarse, el grupo vuelve al origen y cada pieza se va sola a su lugar.
 */
function tenderDespiece(d: Omit<Despiece, 'bultoDesarmado' | 'avisos'>): Bulto {
  const sueltas: PiezaSuelta[] = []

  for (const panel of [...d.paneles, ...d.rieles]) {
    sueltas.push({ medida: panel.medida, asignar: (t) => (panel.tendido = t) })
  }
  for (const conjunto of d.conjuntos) {
    sueltas.push({ medida: conjunto.medida, asignar: (t) => (conjunto.tendido = t) })
  }
  for (const pata of d.patas) {
    sueltas.push({ medida: medidaDePata(pata), asignar: (t) => (pata.tendido = t) })
  }
  for (const barral of d.barrales) {
    sueltas.push({
      medida: [barral.largo, barral.radio * 2, barral.radio * 2],
      asignar: (t) => (barral.tendido = t),
    })
  }
  for (const cajon of d.cajones) {
    sueltas.push({ medida: cajon.frente.medida, asignar: (t) => (cajon.frente.tendido = t) })
    for (const pieza of cajon.interior) {
      sueltas.push({ medida: pieza.medida, asignar: (t) => (pieza.tendido = t) })
    }
  }
  for (const puerta of d.puertas) {
    sueltas.push({ medida: puerta.hoja.medida, asignar: (t) => (puerta.hoja.tendido = t) })
  }

  return acostarEnElPiso(sueltas)
}

export function armar(c: Configuracion): Despiece {
  const modelo = modeloDe(c.modeloId)
  const t = c.espesor
  const { ancho: W, profundidad: D } = c
  const hb = alturaBaseReal(c)
  const hFrentes = altoFrentes(c)
  const Wi = anchoInterior(c)
  const profUtil = (c.conFondo ? D - ESPESOR_FONDO : D) - t
  const bulto: Bulto = { ancho: W, alto: c.alto, profundidad: D, centroY: c.alto / 2 }

  if (modelo.distribucion === 'escritorio') {
    const parcial = armarEscritorio(c, modelo.retornoEnL === true)
    return {
      ...parcial,
      bulto: parcial.bulto,
      bultoDesarmado: tenderDespiece(parcial),
      avisos: avisosDe(c, 0, 0),
    }
  }

  if (modelo.distribucion === 'estanteria-hierro') {
    const parcial = armarEstanteriaHierro(c)
    return {
      ...parcial,
      bultoDesarmado: tenderDespiece(parcial),
      avisos: avisosDe(c, parcial.luzEstante, 0),
    }
  }

  const paneles = armarCarcasa(c)
  const base = armarBase(c)
  paneles.push(...base.paneles)
  const cajones: CajonArmado[] = []
  const puertas: PuertaArmada[] = []
  const barrales: Barral[] = []
  const rieles: Caja[] = []
  const alturas = normalizarAlturas(c)
  let luzEstante = Wi
  let columnasReales = 0

  const corrediza = c.tipoPuerta === 'corrediza' && c.cantidadPuertas > 0

  if (modelo.distribucion === 'cajones') {
    const grilla = armarGrillaCajones({
      c,
      alturas,
      xDesde: -W / 2,
      anchoZona: W,
      yBase: hb,
      profundidadUtil: profUtil,
      zCara: D / 2,
      adentro: false,
    })
    cajones.push(...grilla.cajones)
    paneles.push(...grilla.paneles)
    columnasReales = grilla.columnas
  }

  if (modelo.distribucion === 'estantes') {
    paneles.push(
      ...repartirEstantes({
        c,
        cantidad: c.cantidadEstantes,
        xCentro: 0,
        ancho: Wi,
        yDesde: hb + t,
        yHasta: hb + hFrentes - t,
        prefijo: 'b',
      }),
    )
  }

  if (modelo.distribucion === 'placar' || modelo.distribucion === 'columnas') {
    const esPlacar = modelo.distribucion === 'placar'
    const yInteriorHasta = hb + hFrentes - t
    let yInteriorDesde = hb + t

    if (corrediza) {
      // Las hojas tapan el frente de punta a punta, asi que los cajones pasan adentro.
      const armado = armarPuertasCorredizas({
        c,
        cantidad: c.cantidadPuertas,
        xDesde: -W / 2,
        anchoZona: W,
        yBase: hb,
        altoZona: hFrentes,
      })
      puertas.push(...armado.puertas)
      rieles.push(...armado.rieles)

      // Al correrse, las hojas se apilan contra la ultima: queda descubierto
      // todo lo que esta a la izquierda de esa posicion final.
      const anchoHoja = (W + (c.cantidadPuertas - 1) * SOLAPE_CORREDIZA) / c.cantidadPuertas
      const zonaAbierta: [number, number] = [
        -W / 2,
        -W / 2 + (c.cantidadPuertas - 1) * (anchoHoja - SOLAPE_CORREDIZA),
      ]

      const grilla = armarGrillaCajones({
        c,
        alturas,
        xDesde: -W / 2 + t,
        anchoZona: Wi,
        yBase: hb + t,
        profundidadUtil: profUtil - 30,
        zCara: D / 2 - vueloCorredizas(c, c.cantidadPuertas) - 14,
        adentro: true,
        zonaAbierta,
      })
      cajones.push(...grilla.cajones)
      paneles.push(...grilla.paneles)
      columnasReales = grilla.columnas
      yInteriorDesde = hb + t + alturas.reduce((a, b) => a + b, 0)
    } else if (esPlacar) {
      const grilla = armarGrillaCajones({
        c,
        alturas,
        xDesde: -W / 2,
        anchoZona: W,
        yBase: hb,
        profundidadUtil: profUtil,
        zCara: D / 2,
        adentro: false,
      })
      cajones.push(...grilla.cajones)
      paneles.push(...grilla.paneles)
      columnasReales = grilla.columnas
      const altoBloque = alturas.reduce((a, b) => a + b, 0)
      yInteriorDesde = Math.max(hb + t, hb + altoBloque)
      puertas.push(
        ...armarPuertasBatientes({
          c,
          cantidad: c.cantidadPuertas,
          xDesde: -W / 2,
          anchoZona: W,
          yBase: hb + altoBloque,
          altoZona: hFrentes - altoBloque,
        }),
      )
    } else {
      // Columnas con batientes: cajonera a un lado, puertas al otro.
      const hayCajones = c.cantidadCajones > 0
      const hayPuertas = c.cantidadPuertas > 0
      let anchoCajonera = W
      if (hayCajones && hayPuertas) {
        anchoCajonera = Math.min(Math.max(320, Math.round(W * 0.38)), Math.max(320, W - 360))
      } else if (!hayCajones) {
        anchoCajonera = 0
      }
      const partida = hayCajones && hayPuertas && anchoCajonera < W

      if (hayCajones) {
        const grilla = armarGrillaCajones({
          c,
          alturas,
          xDesde: -W / 2,
          anchoZona: partida ? anchoCajonera : W,
          yBase: hb,
          profundidadUtil: profUtil,
          zCara: D / 2,
          adentro: false,
        })
        cajones.push(...grilla.cajones)
        paneles.push(...grilla.paneles)
        columnasReales = grilla.columnas
      }

      if (partida) {
        const xParante = -W / 2 + anchoCajonera
        paneles.push({
          id: 'parante',
          nombre: 'Parante central',
          pos: [xParante, hb + hFrentes / 2, c.conFondo ? ESPESOR_FONDO / 2 : 0],
          medida: [t, hFrentes - 2 * t, c.conFondo ? D - ESPESOR_FONDO : D],
          grano: 'y',
          mat: 'placa',
        })
        luzEstante = W - anchoCajonera
      }
      if (hayPuertas) {
        puertas.push(
          ...armarPuertasBatientes({
            c,
            cantidad: c.cantidadPuertas,
            xDesde: partida ? -W / 2 + anchoCajonera : -W / 2,
            anchoZona: partida ? W - anchoCajonera : W,
            yBase: hb,
            altoZona: hFrentes,
          }),
        )
      }
    }

    // Interior: parante en los placards, mas estantes y barral.
    if (yInteriorHasta - yInteriorDesde > 260) {
      if (esPlacar) {
        const xDiv = c.cantidadPuertas === 3 ? -W / 2 + Wi / 3 : 0
        paneles.push({
          id: 'parante',
          nombre: 'Parante central',
          pos: [xDiv, (yInteriorDesde + yInteriorHasta) / 2, c.conFondo ? ESPESOR_FONDO / 2 : 0],
          medida: [t, yInteriorHasta - yInteriorDesde, c.conFondo ? D - ESPESOR_FONDO : D],
          grano: 'y',
          mat: 'placa',
        })
        const anchoIzq = xDiv - t / 2 - (-W / 2 + t)
        const anchoDer = W / 2 - t - (xDiv + t / 2)
        luzEstante = Math.max(anchoIzq, anchoDer)
        paneles.push(
          ...repartirEstantes({
            c,
            cantidad: c.cantidadEstantes,
            xCentro: (-W / 2 + t + (xDiv - t / 2)) / 2,
            ancho: Math.max(0, anchoIzq),
            yDesde: yInteriorDesde,
            yHasta: yInteriorHasta,
            prefijo: 'izq',
          }),
        )
        if (c.conBarral && anchoDer > 0) {
          barrales.push({
            id: 'barral',
            pos: [(xDiv + t / 2 + (W / 2 - t)) / 2, yInteriorHasta - 90, 20],
            largo: anchoDer,
            radio: 13,
          })
        }
      } else {
        paneles.push(
          ...repartirEstantes({
            c,
            cantidad: c.cantidadEstantes,
            xCentro: 0,
            ancho: Wi,
            yDesde: yInteriorDesde,
            yHasta: yInteriorHasta,
            prefijo: 'col',
          }),
        )
      }
    }
  }

  const parcial = { paneles, conjuntos: [], cajones, puertas, patas: base.patas, barrales, rieles, bulto }
  return {
    ...parcial,
    bultoDesarmado: tenderDespiece(parcial),
    avisos: avisosDe(c, luzEstante, columnasReales),
  }
}
