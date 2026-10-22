import * as THREE from 'three'
import type { Despiece } from '../lib/geometria'

/**
 * Distancia a la que el mueble entra completo en cuadro.
 *
 * Se calcula sobre la esfera que envuelve al mueble, no sobre la caja. En el
 * visor el cliente puede girar alrededor del mueble, y una distancia ajustada a
 * la caja recorta las esquinas en cuanto la vista deja de ser frontal: la
 * esquina cercana proyecta mas grande que el resto. La esfera no depende del
 * angulo, asi que el encuadre vale para cualquier posicion de la camara.
 *
 * Tambien manda el lado mas angosto del lienzo: en un lienzo apaisado limita el
 * alto, y en uno vertical, el ancho.
 */
export function distanciaEncuadre(
  bulto: Despiece['bulto'],
  camara: THREE.PerspectiveCamera,
  margen = 1.05,
): number {
  const radio = Math.hypot(bulto.ancho, bulto.alto, bulto.profundidad) / 2000
  const anguloVertical = THREE.MathUtils.degToRad(camara.fov)
  const aspecto = Math.max(0.2, camara.aspect || 1)
  const anguloHorizontal = 2 * Math.atan(Math.tan(anguloVertical / 2) * aspecto)
  const anguloLimitante = Math.min(anguloVertical, anguloHorizontal)

  return Math.max(0.6, (radio / Math.sin(anguloLimitante / 2)) * margen)
}
