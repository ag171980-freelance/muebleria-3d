import { create } from 'zustand'
import { configuracionInicial, modeloDe } from '../data/modelos'
import { BASE_POR_ID } from '../data/herrajes'
import { PATA_POR_ID } from '../data/marca'
import { fijarAlturaCajon, normalizarAlturas } from '../lib/cajones'
import { armar, type Despiece } from '../lib/geometria'
import { computar, type Computo } from '../lib/computo'
import { filaDePieza, listaDePiezas, type PiezaDeLista } from '../lib/piezas'
import { guardarBorrador, leerBorrador, decodificar } from '../lib/guardado'
import type { Configuracion } from '../lib/tipos'

export type Vista = 'catalogo' | 'taller'

type Estado = {
  vista: Vista
  config: Configuracion
  /** Cajones y puertas abiertos, para ver el interior. */
  abierto: boolean
  /** Mueble separado en piezas, para ver el despiece. */
  desarmado: boolean
  /** Fila del despiece que se resalta ahora: la señalada al pasar, o la fijada. */
  piezaDestacada: string | null
  /** Fila fijada con un toque. Sobrevive a sacar el puntero de encima. */
  piezaFijada: string | null
  despiece: Despiece
  piezas: PiezaDeLista[]
  computo: Computo
  verCatalogo: () => void
  /** `ajustes` trae lo que el cliente ya eligio en la tarjeta del catalogo. */
  elegirModelo: (modeloId: string, ajustes?: Partial<Configuracion>) => void
  cargar: (config: Configuracion) => void
  ajustar: (cambios: Partial<Configuracion>) => void
  ajustarAlturaCajon: (indice: number, mm: number) => void
  repartirCajonesParejo: () => void
  alternarApertura: () => void
  alternarDesarme: () => void
  /** Señala al pasar por encima. Con null vuelve a la fila fijada, si hay. */
  destacarPieza: (clave: string | null) => void
  /** Fija o suelta una fila, para poder girar el mueble sin perderla de vista. */
  fijarPieza: (clave: string) => void
  /** Desde el visor llega el id de una pieza, no la clave de la fila. */
  destacarDesdeVisor: (id: string | null) => void
}

function recalcular(config: Configuracion): Pick<Estado, 'config' | 'despiece' | 'piezas' | 'computo'> {
  const modelo = modeloDe(config.modeloId)
  const rangos = modelo.rangos
  const limitar = (valor: number, r: { min: number; max: number }) =>
    Math.max(r.min, Math.min(r.max, Math.round(valor)))

  // La altura de la base no puede comerse el mueble entero.
  const base = BASE_POR_ID.get(config.baseId)
  const alto = limitar(config.alto, rangos.alto)
  const alturaBase = base && base.id !== 'ninguna' ? Math.max(40, Math.min(Math.round(alto * 0.35), config.alturaBase)) : 0

  const normalizado: Configuracion = {
    ...config,
    ancho: limitar(config.ancho, rangos.ancho),
    alto,
    profundidad: limitar(config.profundidad, rangos.profundidad),
    espesor: config.espesor === 30 ? 30 : 20,
    cantidadCajones: Math.max(0, Math.min(modelo.maxCajones, Math.round(config.cantidadCajones))),
    cantidadEstantes: Math.max(0, Math.min(modelo.maxEstantes, Math.round(config.cantidadEstantes))),
    cantidadPuertas: modelo.puertasPosibles.includes(config.cantidadPuertas)
      ? config.cantidadPuertas
      : modelo.puertasPosibles[0],
    columnasCajones: Math.max(1, Math.min(Math.max(1, modelo.maxColumnasCajones), Math.round(config.columnasCajones))),
    estructuraId: config.estructuraId === 'blanca' ? 'blanca' : 'negra',
    tipoPataId: PATA_POR_ID.has(config.tipoPataId) ? config.tipoPataId : 'marco',
    // Si el mueble no ofrece el tipo guardado (por un link viejo), cae en el primero.
    tipoPuerta: modelo.tiposPuerta.includes(config.tipoPuerta) ? config.tipoPuerta : (modelo.tiposPuerta[0] ?? 'batiente'),
    alturaBase,
  }
  const config2: Configuracion = { ...normalizado, alturasCajones: normalizarAlturas(normalizado) }
  const despiece = armar(config2)
  return {
    config: config2,
    despiece,
    piezas: listaDePiezas(despiece).piezas,
    computo: computar(config2, despiece),
  }
}

function configInicial(): { vista: Vista; config: Configuracion } {
  const hash = window.location.hash
  const marca = hash.match(/^#\/d\/(.+)$/)
  if (marca) {
    const compartido = decodificar(marca[1])
    if (compartido) return { vista: 'taller', config: compartido }
  }
  const borrador = leerBorrador()
  if (borrador) return { vista: 'catalogo', config: borrador }
  return { vista: 'catalogo', config: configuracionInicial('comoda') }
}

const arranque = configInicial()

export const useConfigurador = create<Estado>((set, get) => ({
  vista: arranque.vista,
  abierto: false,
  desarmado: false,
  piezaDestacada: null,
  piezaFijada: null,
  ...recalcular(arranque.config),

  verCatalogo: () => {
    window.history.replaceState(null, '', window.location.pathname + '#/')
    set({ vista: 'catalogo' })
  },

  elegirModelo: (modeloId, ajustes) => {
    const resultado = recalcular({ ...configuracionInicial(modeloId), ...ajustes })
    guardarBorrador(resultado.config)
    window.history.replaceState(null, '', window.location.pathname + '#/taller')
    set({ ...resultado, vista: 'taller', abierto: false, desarmado: false, piezaDestacada: null, piezaFijada: null })
  },

  cargar: (config) => {
    const resultado = recalcular(config)
    guardarBorrador(resultado.config)
    set({ ...resultado, vista: 'taller', abierto: false, desarmado: false, piezaDestacada: null, piezaFijada: null })
  },

  ajustar: (cambios) => {
    const resultado = recalcular({ ...get().config, ...cambios })
    guardarBorrador(resultado.config)
    // Las claves del despiece llevan la medida adentro: al cambiar una medida,
    // la fila señalada deja de existir.
    const vive = (clave: string | null) => clave !== null && resultado.piezas.some((p) => p.clave === clave)
    const fijada = vive(get().piezaFijada) ? get().piezaFijada : null
    set({
      ...resultado,
      piezaFijada: fijada,
      piezaDestacada: vive(get().piezaDestacada) ? get().piezaDestacada : fijada,
    })
  },

  ajustarAlturaCajon: (indice, mm) => {
    const actual = get().config
    const alturas = fijarAlturaCajon(actual, indice, mm)
    const resultado = recalcular({ ...actual, alturasCajones: alturas })
    guardarBorrador(resultado.config)
    set(resultado)
  },

  repartirCajonesParejo: () => {
    const actual = get().config
    const resultado = recalcular({ ...actual, alturasCajones: [] })
    guardarBorrador(resultado.config)
    set(resultado)
  },

  // Abierto y desarmado se pisan entre si: encender uno apaga el otro.
  alternarApertura: () => set({ abierto: !get().abierto, desarmado: false }),

  alternarDesarme: () => {
    const desarmado = !get().desarmado
    // Al volver a armar no queda nada que señalar.
    set(desarmado ? { desarmado, abierto: false } : { desarmado, piezaDestacada: null, piezaFijada: null })
  },

  // Sacar el puntero no apaga el resaltado si antes se fijo una fila.
  destacarPieza: (clave) => set({ piezaDestacada: clave ?? get().piezaFijada }),

  fijarPieza: (clave) => {
    const suelta = get().piezaFijada === clave
    set({ piezaFijada: suelta ? null : clave, piezaDestacada: clave })
  },

  destacarDesdeVisor: (id) => {
    if (!id) {
      set({ piezaDestacada: get().piezaFijada })
      return
    }
    const fila = filaDePieza(get().piezas, id)
    set({ piezaDestacada: fila ? fila.clave : get().piezaFijada })
  },
}))
