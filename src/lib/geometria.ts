import { modeloDe } from '../data/modelos'
import { HERRAJE_POR_ID, type TipoHerraje } from '../data/herrajes'
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
  /**
   * Cuanto se aparta la pieza del mueble en la vista de despiece, en mm.
   * Cada pieza sale por el eje de su propio espesor, que es como se arma y se
   * desarma en la realidad.
   */
  desarme: V3
}

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
  frente: { medida: V3; grano: Eje }
  /** Piezas del cajon, relativas al ancla. */
  interior: Caja[]
  /** Herrajes relativos al ancla. */
  herrajes: HerrajeColocado[]
  tipoHerraje: TipoHerraje
  recorrido: number
  /** Desplazamiento del cajon entero en la vista de despiece. */
  desarme: V3
  utiles: { ancho: number; alto: number; profundidad: number }
}

export type PuertaArmada = {
  id: string
  tipo: TipoPuerta
  /** Batiente: eje de giro. Corrediza: centro de la hoja cerrada. */
  bisagra: V3
  /** Batiente: 1 abre hacia +X, -1 hacia -X. Sin uso en corredizas. */
  sentido: 1 | -1
  hoja: { medida: V3; grano: Eje; centro: V3 }
  herrajes: HerrajeColocado[]
  tipoHerraje: TipoHerraje
  /** Corrediza: cuanto corre sobre X al abrirse, en mm. */
  corrimiento: number
  /** Desplazamiento de la hoja en la vista de despiece, derecha y sin correr. */
  desarme: V3
}

export type Pata = {
  id: string
  nombre: string
  pos: V3
  altura: number
  seccion: number
  forma: 'tubo' | 'torneada'
  mat: Material
  desarme: V3
}

export type Barral = { id: string; pos: V3; largo: number; radio: number; desarme: V3 }

/** Caja envolvente del mueble, en mm. `centroY` es la altura de su centro. */
export type Bulto = { ancho: number; alto: number; profundidad: number; centroY: number }

export type Despiece = {
  paneles: Caja[]
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

/**
 * Separacion base del despiece. Se mide contra el lado mas largo del mueble
 * para que la vista explotada sea igual de legible en una mesa de luz que en
 * un placard de dos metros y medio.
 */
function pasoDesarme(c: Configuracion): number {
  return Math.max(c.ancho, c.alto, c.profundidad) * 0.36
}

/** Cuanto se adelantan los frentes y las puertas: por delante de todo lo demas. */
const AVANCE_FRENTES = 3.4

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
  paso: number
  /** False si tiene una hoja cerrada por delante y no puede salir. */
  puedeAbrir: boolean
}): CajonArmado {
  const { id, c, cx, anchoFrente, anchoHueco, yBase, altoHueco, profundidadUtil, zCara, paso, puedeAbrir } = opts
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
      desarme: [-0.55 * paso, 0, 0],
    },
    {
      id: id + '-der',
      nombre: 'Lateral de cajon',
      pos: [(anchoCaja - PARED_CAJON) / 2, 0, zCentroCaja],
      medida: [PARED_CAJON, altoCaja, profCaja],
      grano: 'z',
      mat: 'placa',
      desarme: [0.55 * paso, 0, 0],
    },
    {
      id: id + '-contrafrente',
      nombre: 'Contrafrente de cajon',
      pos: [0, 0, zCentroCaja - profCaja / 2 + PARED_CAJON / 2],
      medida: [anchoCaja - 2 * PARED_CAJON, altoCaja, PARED_CAJON],
      grano: 'x',
      mat: 'placa',
      desarme: [0, 0, -0.5 * paso],
    },
    {
      id: id + '-piso',
      nombre: 'Piso de cajon',
      pos: [0, -altoCaja / 2 + ESPESOR_FONDO / 2, zCentroCaja],
      medida: [anchoCaja - 2 * PARED_CAJON, ESPESOR_FONDO, profCaja - PARED_CAJON],
      grano: 'x',
      mat: 'fondo',
      desarme: [0, -0.65 * paso, 0],
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
    desarme: [0, 0, AVANCE_FRENTES * paso],
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
  paso: number
  /** True cuando los frentes van dentro de la caja, detras de las puertas. */
  adentro: boolean
  /**
   * Tramo de X que queda descubierto al abrir las corredizas. Un cajon tapado
   * por una hoja no puede salir: atravesaria la puerta.
   */
  zonaAbierta?: [number, number]
}): { cajones: CajonArmado[]; paneles: Caja[]; columnas: number } {
  const { c, alturas, xDesde, anchoZona, yBase, profundidadUtil, zCara, paso, adentro, zonaAbierta } = opts
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
      desarme: [(4.2 + j * 1.2) * paso - x, 0, 0],
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
          paso,
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
  paso: number
}): PuertaArmada[] {
  const { c, cantidad, xDesde, anchoZona, yBase, altoZona, paso } = opts
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
      desarme: [0, 0, AVANCE_FRENTES * paso] as V3,
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
  paso: number
}): { puertas: PuertaArmada[]; rieles: Caja[] } {
  const { c, cantidad, xDesde, anchoZona, yBase, altoZona, paso } = opts
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
      desarme: [0, 0, (AVANCE_FRENTES + i * 0.45) * paso] as V3,
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
      desarme: [0, 0.9 * paso, AVANCE_FRENTES * paso],
    },
    {
      id: 'riel-inferior',
      nombre: 'Riel inferior',
      pos: [centroZona, yBase + ALTO_RIEL / 2, zRiel],
      medida: [anchoZona, ALTO_RIEL, vuelo],
      grano: 'x',
      mat: 'metal',
      desarme: [0, -0.9 * paso, AVANCE_FRENTES * paso],
    },
  ]

  return { puertas, rieles }
}

function armarBase(c: Configuracion, paso: number): { patas: Pata[]; paneles: Caja[] } {
  const hb = alturaBaseReal(c)
  if (hb <= 0) return { patas: [], paneles: [] }
  const { ancho: W, profundidad: D } = c

  if (c.baseId === 'zocalo') {
    return {
      patas: [],
      paneles: [
        {
          id: 'zocalo',
          nombre: 'Zocalo',
          // Retirado del frente para que no se golpee con la punta del pie.
          pos: [0, hb / 2, -15],
          medida: [Math.max(200, W - 120), hb, Math.max(150, D - 60)],
          grano: 'x',
          mat: 'placa',
          desarme: [0, -1.9 * paso, 0],
        },
      ],
    }
  }

  const tubo = c.baseId === 'patas-metal'
  const seccion = tubo ? 38 : 62
  const retiro = tubo ? 55 : 70
  const esquinas: V3[] = [
    [-(W / 2 - retiro), hb / 2, -(D / 2 - retiro)],
    [W / 2 - retiro, hb / 2, -(D / 2 - retiro)],
    [-(W / 2 - retiro), hb / 2, D / 2 - retiro],
    [W / 2 - retiro, hb / 2, D / 2 - retiro],
  ]
  return {
    patas: esquinas.map((pos, i) => ({
      id: 'pata-' + i,
      nombre: tubo ? 'Pata de hierro' : 'Pata de madera',
      pos,
      altura: hb,
      seccion,
      forma: tubo ? 'tubo' : 'torneada',
      mat: tubo ? 'metal' : 'placa',
      desarme: [Math.sign(pos[0]) * 0.7 * paso, -1.1 * paso, Math.sign(pos[2]) * 0.7 * paso] as V3,
    })),
    paneles: [],
  }
}

function armarCarcasa(c: Configuracion, paso: number): Caja[] {
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
      desarme: [-paso, 0, 0],
    },
    {
      id: 'lat-der',
      nombre: 'Lateral',
      pos: [(W - t) / 2, hb + hc / 2, 0],
      medida: [t, hc, D],
      grano: 'y',
      mat: 'placa',
      desarme: [paso, 0, 0],
    },
    {
      id: 'techo',
      nombre: 'Techo',
      pos: [0, hb + hc - t / 2, 0],
      medida: [Wi, t, D],
      grano: 'x',
      mat: 'placa',
      desarme: [0, paso, 0],
    },
    {
      id: 'piso',
      nombre: 'Piso',
      pos: [0, hb + t / 2, 0],
      medida: [Wi, t, D],
      grano: 'x',
      mat: 'placa',
      desarme: [0, -paso, 0],
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
      desarme: [0, 0, -1.45 * paso],
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
  paso: number
}): Caja[] {
  const { c, cantidad, xCentro, ancho, yDesde, yHasta, prefijo, paso } = opts
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
    desarme: [0, 0, paso * (1.1 + i * 0.55)] as V3,
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
  if (c.espesor === 18 && c.ancho > 2000 && modelo.distribucion !== 'mesa') {
    avisos.push('Arriba de 2 m de ancho recomendamos placa de 25 mm en laterales y techo.')
  }
  if (modelo.distribucion === 'placar' && c.profundidad < 500) {
    avisos.push('Para colgar en percha hacen falta 50 cm de profundidad. Con menos, el barral va perpendicular al frente.')
  }
  if (modelo.distribucion === 'estantes' && !c.conFondo && c.alto > 1800) {
    avisos.push('Sin fondo y a esta altura el mueble hay que amurarlo a la pared. Los tarugos van incluidos.')
  }
  if (c.baseId === 'patas-metal' && c.ancho > 2000) {
    avisos.push('A este ancho sumamos un quinto apoyo central para que el piso no se hunda.')
  }
  if (modelo.distribucion === 'mesa' && c.espesor < 25) {
    avisos.push('Una tapa de mesa en 18 mm se arquea. La hacemos en 25 mm o con refuerzo por debajo.')
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

/** Acumulador de caja envolvente en milimetros. */
type Limites = { minX: number; maxX: number; minY: number; maxY: number; minZ: number; maxZ: number }

function limitesVacios(): Limites {
  return {
    minX: Infinity,
    maxX: -Infinity,
    minY: Infinity,
    maxY: -Infinity,
    minZ: Infinity,
    maxZ: -Infinity,
  }
}

function sumarLimites(l: Limites, centro: V3, medida: V3): void {
  l.minX = Math.min(l.minX, centro[0] - medida[0] / 2)
  l.maxX = Math.max(l.maxX, centro[0] + medida[0] / 2)
  l.minY = Math.min(l.minY, centro[1] - medida[1] / 2)
  l.maxY = Math.max(l.maxY, centro[1] + medida[1] / 2)
  l.minZ = Math.min(l.minZ, centro[2] - medida[2] / 2)
  l.maxZ = Math.max(l.maxZ, centro[2] + medida[2] / 2)
}

function aBulto(l: Limites): Bulto {
  if (l.minX === Infinity) return { ancho: 1, alto: 1, profundidad: 1, centroY: 0 }
  return {
    ancho: Math.max(1, l.maxX - l.minX),
    alto: Math.max(1, l.maxY - l.minY),
    profundidad: Math.max(1, l.maxZ - l.minZ),
    centroY: (l.minY + l.maxY) / 2,
  }
}

/**
 * Envolvente del mueble con todas las piezas separadas. La vista de despiece
 * ocupa mucho mas lugar que el mueble armado, asi que la camara necesita su
 * propia medida para encuadrarla.
 */
function medirDesarmado(d: Omit<Despiece, 'bultoDesarmado' | 'avisos'>): Bulto {
  const l = limitesVacios()
  const correr = (p: V3, o: V3): V3 => [p[0] + o[0], p[1] + o[1], p[2] + o[2]]

  for (const panel of [...d.paneles, ...d.rieles]) sumarLimites(l, correr(panel.pos, panel.desarme), panel.medida)
  for (const pata of d.patas) {
    sumarLimites(l, correr(pata.pos, pata.desarme), [pata.seccion, pata.altura, pata.seccion])
  }
  for (const cajon of d.cajones) {
    const base = correr(cajon.ancla, cajon.desarme)
    sumarLimites(l, base, cajon.frente.medida)
    for (const pieza of cajon.interior) sumarLimites(l, correr(base, correr(pieza.pos, pieza.desarme)), pieza.medida)
  }
  for (const puerta of d.puertas) {
    sumarLimites(l, correr(correr(puerta.bisagra, puerta.hoja.centro), puerta.desarme), puerta.hoja.medida)
  }
  return aBulto(l)
}

export function armar(c: Configuracion): Despiece {
  const modelo = modeloDe(c.modeloId)
  const t = c.espesor
  const { ancho: W, profundidad: D } = c
  const hb = alturaBaseReal(c)
  const hFrentes = altoFrentes(c)
  const Wi = anchoInterior(c)
  const profUtil = (c.conFondo ? D - ESPESOR_FONDO : D) - t
  const paso = pasoDesarme(c)
  const bulto: Bulto = { ancho: W, alto: c.alto, profundidad: D, centroY: c.alto / 2 }

  if (modelo.distribucion === 'mesa') {
    const tapa = Math.max(t, 25)
    const altoPata = c.alto - tapa
    const retiro = 95
    const seccion = c.baseId === 'patas-metal' ? 45 : 70
    const paneles: Caja[] = [
      {
        id: 'tapa',
        nombre: 'Tapa',
        pos: [0, c.alto - tapa / 2, 0],
        medida: [W, tapa, D],
        grano: 'x',
        mat: 'placa',
        desarme: [0, paso, 0],
      },
      {
        id: 'travesanio-frente',
        nombre: 'Travesaño',
        pos: [0, c.alto - tapa - 70, D / 2 - retiro],
        medida: [Math.max(100, W - 2 * retiro - seccion), 90, 24],
        grano: 'x',
        mat: 'placa',
        desarme: [0, -0.5 * paso, 1.4 * paso],
      },
      {
        id: 'travesanio-fondo',
        nombre: 'Travesaño',
        pos: [0, c.alto - tapa - 70, -(D / 2 - retiro)],
        medida: [Math.max(100, W - 2 * retiro - seccion), 90, 24],
        grano: 'x',
        mat: 'placa',
        desarme: [0, -0.5 * paso, -1.4 * paso],
      },
      {
        id: 'travesanio-izq',
        nombre: 'Travesaño',
        pos: [-(W / 2 - retiro), c.alto - tapa - 70, 0],
        medida: [24, 90, Math.max(100, D - 2 * retiro - seccion)],
        grano: 'z',
        mat: 'placa',
        desarme: [-1.4 * paso, -0.5 * paso, 0],
      },
      {
        id: 'travesanio-der',
        nombre: 'Travesaño',
        pos: [W / 2 - retiro, c.alto - tapa - 70, 0],
        medida: [24, 90, Math.max(100, D - 2 * retiro - seccion)],
        grano: 'z',
        mat: 'placa',
        desarme: [1.4 * paso, -0.5 * paso, 0],
      },
    ]
    const patas: Pata[] = (
      [
        [-(W / 2 - retiro), -(D / 2 - retiro)],
        [W / 2 - retiro, -(D / 2 - retiro)],
        [-(W / 2 - retiro), D / 2 - retiro],
        [W / 2 - retiro, D / 2 - retiro],
      ] as [number, number][]
    ).map(([x, z], i) => ({
      id: 'pata-' + i,
      nombre: c.baseId === 'patas-metal' ? 'Pata de hierro' : 'Pata de madera',
      pos: [x, altoPata / 2, z] as V3,
      altura: altoPata,
      seccion,
      forma: (c.baseId === 'patas-metal' ? 'tubo' : 'torneada') as Pata['forma'],
      mat: (c.baseId === 'patas-metal' ? 'metal' : 'placa') as Material,
      desarme: [Math.sign(x) * 0.9 * paso, -0.9 * paso, Math.sign(z) * 0.9 * paso] as V3,
    }))
    const parcial = { paneles, cajones: [], puertas: [], patas, barrales: [], rieles: [], bulto }
    return { ...parcial, bultoDesarmado: medirDesarmado(parcial), avisos: avisosDe(c, 0, 0) }
  }

  const paneles = armarCarcasa(c, paso)
  const base = armarBase(c, paso)
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
      paso,
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
        paso,
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
        paso,
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
        paso,
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
        paso,
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
          paso,
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
          paso,
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
          desarme: [3 * paso - xParante, 0, 0],
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
            paso,
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
          desarme: [3 * paso - xDiv, 0, 0],
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
            paso,
          }),
        )
        if (c.conBarral && anchoDer > 0) {
          barrales.push({
            id: 'barral',
            pos: [(xDiv + t / 2 + (W / 2 - t)) / 2, yInteriorHasta - 90, 20],
            largo: anchoDer,
            radio: 13,
            desarme: [0, 1.7 * paso, 0],
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
            paso,
          }),
        )
      }
    }
  }

  const parcial = { paneles, cajones, puertas, patas: base.patas, barrales, rieles, bulto }
  return {
    ...parcial,
    bultoDesarmado: medirDesarmado(parcial),
    avisos: avisosDe(c, luzEstante, columnasReales),
  }
}
