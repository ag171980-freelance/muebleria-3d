import { ACABADO_POR_ID, MADERA_POR_ID } from '../data/maderas'
import { BASE_POR_ID, HERRAJE_POR_ID } from '../data/herrajes'
import { ESTRUCTURA_POR_ID } from '../data/marca'
import { modeloDe } from '../data/modelos'
import { medidaCorta } from './formato'
import type { Computo } from './computo'
import type { Despiece } from './geometria'
import type { Configuracion } from './tipos'

/**
 * Resumen en texto plano del mueble armado. Es lo que ve el carpintero en el
 * mail, en la planilla y en el mensaje de WhatsApp, asi que va en el mismo
 * vocabulario que se usa en el taller.
 */
export function resumenDelPedido(c: Configuracion, d: Despiece, computo: Computo): Record<string, string> {
  const modelo = modeloDe(c.modeloId)
  const madera = MADERA_POR_ID.get(c.maderaId)
  const acabado = ACABADO_POR_ID.get(c.acabadoId)
  const herraje = HERRAJE_POR_ID.get(c.herrajeId)
  const estructura = ESTRUCTURA_POR_ID.get(c.estructuraId)
  const base = BASE_POR_ID.get(c.baseId)

  const resumen: Record<string, string> = {
    Mueble: modelo.nombre,
    Medidas: medidaCorta(c.ancho) + ' x ' + medidaCorta(c.alto) + ' x ' + medidaCorta(c.profundidad) + ' cm (ancho x alto x profundidad)',
    Madera: (madera?.nombre ?? '') + ' maciza de ' + c.espesor + ' mm',
    Laqueado: acabado?.nombre ?? '',
    Estructura: (estructura?.nombre ?? '') + ', pintura epoxi al horno',
  }

  if (d.cajones.length > 0) {
    const filas = Math.max(1, c.alturasCajones.length)
    const columnas = Math.round(d.cajones.length / filas)
    const grilla = columnas > 1 ? ' (' + filas + ' filas x ' + columnas + ' por fila)' : ''
    resumen.Cajones =
      d.cajones.length +
      grilla +
      ', frentes de ' +
      c.alturasCajones.map((h) => medidaCorta(h)).join(' / ') +
      ' cm de alto'
  }
  if (d.puertas.length > 0) {
    resumen.Puertas = d.puertas.length + ' hojas ' + (c.tipoPuerta === 'corrediza' ? 'corredizas' : 'batientes')
  }
  if (c.cantidadEstantes > 0) resumen.Estantes = String(c.cantidadEstantes)
  if (d.barrales.length > 0) resumen.Barral = 'si'
  if (c.conEstanteCpu) resumen['Bandeja CPU'] = 'si'
  resumen.Fondo = c.conFondo ? 'cerrado' : 'abierto'
  if (herraje && d.cajones.length + d.puertas.length > 0) resumen.Herraje = herraje.nombre
  if (base) resumen.Base = base.nombre + (base.id === 'ninguna' ? '' : ' de ' + medidaCorta(c.alturaBase) + ' cm')

  resumen.Placas = computo.placasEnteras + ' placas de 1,83 x 2,60 m'
  resumen.Peso = 'unos ' + computo.pesoKg + ' kg armado'

  return resumen
}
