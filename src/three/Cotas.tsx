import { useMemo } from 'react'
import { Html } from '@react-three/drei'
import * as THREE from 'three'
import type { Bulto, V3 } from '../lib/geometria'

const m = (mm: number) => mm / 1000

/** Cuanto se separan las cotas del mueble, en metros. */
const AIRE = 0.1
/** Largo de las patitas de los extremos. */
const PATITA = 0.04

type Props = {
  bulto: Bulto
  color: string
}

/**
 * Cotas de ancho, alto y profundidad, dibujadas alrededor del mueble.
 *
 * La linea va en 3D y el numero en una etiqueta HTML encima del lienzo: asi el
 * texto se lee siempre derecho y del mismo tamaño, sin importar desde donde
 * este mirando la camara, que es como se leen las cotas de un plano.
 */
export function Cotas({ bulto, color }: Props) {
  const ancho = m(bulto.ancho)
  const alto = m(bulto.alto)
  const fondo = m(bulto.profundidad)

  const geometria = useMemo(() => {
    const x = ancho / 2
    const z = fondo / 2
    // La cota de ancho va adelante y al pie; la de alto y la de fondo, al costado derecho.
    const yPie = -0.001
    const zAncho = z + AIRE
    const xLado = x + AIRE

    const puntos: V3[] = [
      // Ancho, de punta a punta mas sus patitas.
      [-x, yPie, zAncho],
      [x, yPie, zAncho],
      [-x, yPie, zAncho - PATITA],
      [-x, yPie, zAncho + PATITA],
      [x, yPie, zAncho - PATITA],
      [x, yPie, zAncho + PATITA],
      // Alto, parada sobre el costado derecho.
      [xLado, 0, zAncho],
      [xLado, alto, zAncho],
      [xLado - PATITA, 0, zAncho],
      [xLado + PATITA, 0, zAncho],
      [xLado - PATITA, alto, zAncho],
      [xLado + PATITA, alto, zAncho],
      // Profundidad, al pie del costado derecho.
      [xLado, yPie, -z],
      [xLado, yPie, z],
      [xLado - PATITA, yPie, -z],
      [xLado + PATITA, yPie, -z],
      [xLado - PATITA, yPie, z],
      [xLado + PATITA, yPie, z],
    ]

    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.Float32BufferAttribute(puntos.flat(), 3))
    return geo
  }, [ancho, alto, fondo])

  const material = useMemo(
    () =>
      new THREE.LineBasicMaterial({
        color: new THREE.Color(color),
        transparent: true,
        opacity: 0.7,
      }),
    [color],
  )

  const etiqueta = (valorMm: number) => Math.round(valorMm / 10) + ' cm'
  const x = ancho / 2
  const z = fondo / 2

  return (
    <group>
      <lineSegments geometry={geometria} material={material} />

      <Html position={[0, 0, z + AIRE + 0.1]} center zIndexRange={[20, 10]} style={{ pointerEvents: 'none' }}>
        <span className="cota">{etiqueta(bulto.ancho)}</span>
      </Html>
      <Html position={[x + AIRE + 0.11, alto / 2, z + AIRE]} center zIndexRange={[20, 10]} style={{ pointerEvents: 'none' }}>
        <span className="cota">{etiqueta(bulto.alto)}</span>
      </Html>
      <Html position={[x + AIRE + 0.11, 0, 0]} center zIndexRange={[20, 10]} style={{ pointerEvents: 'none' }}>
        <span className="cota">{etiqueta(bulto.profundidad)}</span>
      </Html>
    </group>
  )
}
