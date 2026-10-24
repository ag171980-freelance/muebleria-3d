import type { Configuracion, Modelo } from '../lib/tipos'

/**
 * CATALOGO DE IRONWOODS
 *
 * Los muebles, las medidas y los espesores salen de las fichas de producto de
 * ironwoods.com.ar. Cada entrada anota de donde sale su medida inicial.
 *
 * Los rangos son mas amplios que la lista de la tienda a proposito: la marca
 * fabrica a medida ("Se fabrica a medida segun tu espacio"), asi que el
 * configurador deja moverse entre medidas y las de catalogo quedan como punto
 * de partida.
 */

const base = {
  espesor: 30,
  maderaId: 'eucalipto',
  acabadoId: 'roble-claro',
  estructuraId: 'negra',
  tipoPataId: 'marco',
  cantidadCajones: 0,
  columnasCajones: 1,
  alturasCajones: [],
  cantidadPuertas: 0,
  tipoPuerta: 'batiente',
  cantidadEstantes: 0,
  conBarral: false,
  conFondo: false,
  conEstanteCpu: false,
  herrajeId: 'barral',
  baseId: 'ninguna',
  alturaBase: 0,
} satisfies Omit<Configuracion, 'modeloId' | 'ancho' | 'alto' | 'profundidad'>

export const MODELOS: Modelo[] = [
  {
    id: 'escritorio-clasico',
    medidas: [
      { etiqueta: '120 x 60 x 75 cm', ancho: 1200, alto: 750, profundidad: 600 },
      { etiqueta: '140 x 60 x 75 cm', ancho: 1400, alto: 750, profundidad: 600 },
      { etiqueta: '160 x 60 x 75 cm', ancho: 1600, alto: 750, profundidad: 600 },
      { etiqueta: '180 x 60 x 75 cm', ancho: 1800, alto: 750, profundidad: 600 },
    ],
    distribucion: 'escritorio',
    nombre: 'Escritorio Clasico',
    resumen: 'Tapa maciza de 30 mm sobre bastidor de hierro 30x60. Opcional la bandeja para la CPU.',
    grupos: ['cpu', 'base'],
    rangos: {
      // Catalogo: 120, 140, 160 y 180 x 60 x 75 cm.
      ancho: { min: 900, max: 2200, paso: 10 },
      alto: { min: 700, max: 800, paso: 5 },
      profundidad: { min: 500, max: 800, paso: 10 },
    },
    maxCajones: 0,
    maxColumnasCajones: 0,
    puertasPosibles: [0],
    tiposPuerta: [],
    maxEstantes: 0,
    inicial: { ...base, ancho: 1400, alto: 750, profundidad: 600 },
  },
  {
    id: 'escritorio-xl',
    medidas: [
      { etiqueta: '200 x 60 x 75 cm', ancho: 2000, alto: 750, profundidad: 600 },
    ],
    distribucion: 'escritorio',
    nombre: 'Escritorio Clasico XL',
    resumen: 'El Clasico en dos metros de largo, para dos monitores o para trabajar de pie al lado.',
    grupos: ['cpu', 'base'],
    rangos: {
      // Catalogo: 200 x 60 x 75 cm.
      ancho: { min: 1800, max: 2600, paso: 10 },
      alto: { min: 700, max: 800, paso: 5 },
      profundidad: { min: 500, max: 800, paso: 10 },
    },
    maxCajones: 0,
    maxColumnasCajones: 0,
    puertasPosibles: [0],
    tiposPuerta: [],
    maxEstantes: 0,
    inicial: { ...base, ancho: 2000, alto: 750, profundidad: 600, acabadoId: 'nogal' },
  },
  {
    id: 'escritorio-senior',
    medidas: [
      { etiqueta: '120 x 60 x 78 cm', ancho: 1200, alto: 780, profundidad: 600 },
      { etiqueta: '140 x 60 x 78 cm', ancho: 1400, alto: 780, profundidad: 600 },
      { etiqueta: '160 x 60 x 78 cm', ancho: 1600, alto: 780, profundidad: 600 },
      { etiqueta: '180 x 60 x 78 cm', ancho: 1800, alto: 780, profundidad: 600 },
    ],
    distribucion: 'escritorio',
    nombre: 'Escritorio Senior',
    resumen: 'Tres centimetros mas alto que el Clasico y con bastidor reforzado. Para jornadas largas.',
    grupos: ['cpu', 'base'],
    rangos: {
      // Catalogo: 120, 140, 160 y 180 x 60 x 78 cm.
      ancho: { min: 1000, max: 2200, paso: 10 },
      alto: { min: 740, max: 820, paso: 5 },
      profundidad: { min: 500, max: 800, paso: 10 },
    },
    maxCajones: 0,
    maxColumnasCajones: 0,
    puertasPosibles: [0],
    tiposPuerta: [],
    maxEstantes: 0,
    inicial: { ...base, ancho: 1600, alto: 780, profundidad: 600, estructuraId: 'blanca', acabadoId: 'natural' },
  },
  {
    id: 'escritorio-l',
    medidas: [
      { etiqueta: '120x120x75', ancho: 1200, alto: 750, profundidad: 600 },
      { etiqueta: '140x140x75', ancho: 1400, alto: 750, profundidad: 600 },
      { etiqueta: '160x160x75', ancho: 1600, alto: 750, profundidad: 600 },
      { etiqueta: '180x180x75', ancho: 1800, alto: 750, profundidad: 600 },
    ],
    distribucion: 'escritorio',
    nombre: 'Escritorio en L',
    retornoEnL: true,
    resumen: 'Dos tapas en angulo sobre un solo bastidor. Aprovecha la esquina sin perder lugar para las piernas.',
    grupos: ['cpu', 'base'],
    rangos: {
      // Catalogo: 120x120, 140x140, 160x160 y 180x180, siempre de 75 cm de alto.
      ancho: { min: 1000, max: 2200, paso: 10 },
      alto: { min: 700, max: 800, paso: 5 },
      // En el escritorio en L la profundidad es el fondo de las dos alas.
      profundidad: { min: 500, max: 700, paso: 10 },
    },
    maxCajones: 0,
    maxColumnasCajones: 0,
    puertasPosibles: [0],
    tiposPuerta: [],
    maxEstantes: 0,
    inicial: { ...base, ancho: 1600, alto: 750, profundidad: 600, conEstanteCpu: true },
  },
  {
    id: 'mesa-clasica',
    medidas: [
      { etiqueta: '120 x 80 x 75 cm', ancho: 1200, alto: 750, profundidad: 800 },
      { etiqueta: '140 x 80 x 75 cm', ancho: 1400, alto: 750, profundidad: 800 },
      { etiqueta: '160 x 80 x 75 cm', ancho: 1600, alto: 750, profundidad: 800 },
      { etiqueta: '180 x 80 x 75 cm', ancho: 1800, alto: 750, profundidad: 800 },
    ],
    distribucion: 'escritorio',
    nombre: 'Mesa Clasica',
    resumen: 'El mismo bastidor del escritorio, con tapa de comedor de 80 cm de fondo.',
    grupos: ['base'],
    rangos: {
      // Catalogo: 120, 140, 160 y 180 x 80 x 75 cm.
      ancho: { min: 1000, max: 2600, paso: 10 },
      alto: { min: 700, max: 790, paso: 5 },
      profundidad: { min: 700, max: 1100, paso: 10 },
    },
    maxCajones: 0,
    maxColumnasCajones: 0,
    puertasPosibles: [0],
    tiposPuerta: [],
    maxEstantes: 0,
    inicial: { ...base, ancho: 1600, alto: 750, profundidad: 800, maderaId: 'pino', acabadoId: 'cedro' },
  },
  {
    id: 'estanteria',
    medidas: [
      { etiqueta: '40 x 30 x 180 cm', ancho: 400, alto: 1800, profundidad: 300 },
      { etiqueta: '100 x 30 x 180 cm', ancho: 1000, alto: 1800, profundidad: 300 },
      { etiqueta: '150 x 30 x 180 cm', ancho: 1500, alto: 1800, profundidad: 300 },
      { etiqueta: '200 x 30 x 200 cm', ancho: 2000, alto: 2000, profundidad: 300 },
    ],
    distribucion: 'estanteria-hierro',
    nombre: 'Estanteria Iron & Wood',
    resumen: 'Cinco estantes macizos de 20 mm pasantes entre parantes de hierro 20x20. Se amura a la pared.',
    grupos: ['estantes'],
    rangos: {
      // Catalogo: 40, 100 y 150 x 30 x 180 cm, y 200 x 30 x 200 cm.
      ancho: { min: 400, max: 2200, paso: 10 },
      alto: { min: 900, max: 2200, paso: 10 },
      profundidad: { min: 250, max: 400, paso: 10 },
    },
    maxCajones: 0,
    maxColumnasCajones: 0,
    puertasPosibles: [0],
    tiposPuerta: [],
    maxEstantes: 7,
    inicial: {
      ...base,
      ancho: 1000,
      alto: 1800,
      profundidad: 300,
      espesor: 20,
      cantidadEstantes: 5,
      acabadoId: 'nogal',
    },
  },
  {
    id: 'rack-tv',
    medidas: [
      { etiqueta: '140 x 40 x 60 cm', ancho: 1400, alto: 600, profundidad: 400 },
    ],
    distribucion: 'columnas',
    nombre: 'Rack TV Iron & Wood',
    resumen: 'Cuerpo de 20 mm con cajones de correderas telescopicas, sobre patas de hierro 25x25.',
    grupos: ['cajones', 'puertas', 'base', 'fondo'],
    rangos: {
      // Catalogo: 140 x 40 x 60 cm de alto.
      ancho: { min: 900, max: 2400, paso: 10 },
      alto: { min: 400, max: 800, paso: 10 },
      profundidad: { min: 300, max: 550, paso: 10 },
    },
    maxCajones: 3,
    maxColumnasCajones: 2,
    puertasPosibles: [0, 2],
    tiposPuerta: ['batiente', 'corrediza'],
    maxEstantes: 0,
    inicial: {
      ...base,
      ancho: 1400,
      alto: 600,
      profundidad: 400,
      espesor: 20,
      cantidadCajones: 2,
      conFondo: true,
      baseId: 'patas-hierro',
      alturaBase: 150,
      acabadoId: 'nogal',
      alturasCajones: [],
    },
  },
  {
    id: 'cajonera',
    medidas: [
      { etiqueta: '40 x 35 x 65 cm', ancho: 400, alto: 650, profundidad: 350 },
    ],
    distribucion: 'cajones',
    nombre: 'Cajonera Movil',
    resumen: 'Tres cajones con correderas telescopicas sobre cuatro ruedas giratorias, dos con freno.',
    grupos: ['cajones', 'base', 'fondo'],
    rangos: {
      // Catalogo: 40 x 35 x 65 cm de alto.
      ancho: { min: 300, max: 700, paso: 10 },
      alto: { min: 450, max: 800, paso: 10 },
      profundidad: { min: 300, max: 550, paso: 10 },
    },
    maxCajones: 4,
    maxColumnasCajones: 1,
    puertasPosibles: [0],
    tiposPuerta: [],
    maxEstantes: 0,
    inicial: {
      ...base,
      ancho: 400,
      alto: 650,
      profundidad: 350,
      espesor: 20,
      cantidadCajones: 3,
      conFondo: true,
      baseId: 'ruedas',
      alturaBase: 75,
      herrajeId: 'perfil-j',
      alturasCajones: [],
    },
  },
  {
    id: 'mesa-de-luz',
    medidas: [
      { etiqueta: '45 x 35 x 55 cm', ancho: 450, alto: 550, profundidad: 350 },
    ],
    distribucion: 'cajones',
    nombre: 'Mesa de Luz',
    resumen: 'Un cajon sobre patas de hierro altas. La version chica de la cajonera, para el costado de la cama.',
    grupos: ['cajones', 'base', 'fondo'],
    rangos: {
      ancho: { min: 300, max: 600, paso: 10 },
      alto: { min: 400, max: 700, paso: 10 },
      profundidad: { min: 280, max: 450, paso: 10 },
    },
    maxCajones: 2,
    maxColumnasCajones: 1,
    puertasPosibles: [0],
    tiposPuerta: [],
    maxEstantes: 0,
    inicial: {
      ...base,
      ancho: 450,
      alto: 550,
      profundidad: 350,
      espesor: 20,
      cantidadCajones: 1,
      conFondo: true,
      baseId: 'patas-hierro',
      alturaBase: 200,
      herrajeId: 'perilla',
      alturasCajones: [],
    },
  },
]

export const MODELO_POR_ID = new Map(MODELOS.map((m) => [m.id, m]))

export function modeloDe(id: string): Modelo {
  return MODELO_POR_ID.get(id) ?? MODELOS[0]
}

export function configuracionInicial(modeloId: string): Configuracion {
  const modelo = modeloDe(modeloId)
  return { modeloId: modelo.id, ...modelo.inicial }
}
