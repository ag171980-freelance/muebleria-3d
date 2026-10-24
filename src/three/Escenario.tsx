import { useMemo } from 'react'
import * as THREE from 'three'
import type { Bulto } from '../lib/geometria'

const m = (mm: number) => mm / 1000

type Props = {
  bulto: Bulto
  colorPiso: string
  colorPared: string
}

/**
 * Piso y pared del fondo.
 *
 * Sin esto el mueble flota en un vacio de color y no se lee la escala. Con un
 * piso donde apoyarse y una pared detras, el ojo entiende enseguida que es un
 * mueble en un ambiente.
 *
 * La pared se dibuja de una sola cara, mirando al frente: cuando el cliente
 * gira la camara para ver el mueble por atras, la pared desaparece sola en vez
 * de taparle la vista. Es el mismo truco de un decorado de teatro.
 */
export function Escenario({ bulto, colorPiso, colorPared }: Props) {
  // Generosos a proposito: con la camara cerca se llegaba a ver donde terminaba
  // la pared, y un borde de pared flotando rompe de una el efecto de ambiente.
  const lado = Math.max(20, (Math.max(bulto.ancho, bulto.profundidad) / 1000) * 10)
  const altoPared = Math.max(8, (bulto.alto / 1000) * 5)
  // La pared va apenas detras del mueble, como cuando se lo arrima contra ella.
  const zPared = -(m(bulto.profundidad) / 2 + 0.03)

  const materialPiso = useMemo(
    () => new THREE.MeshStandardMaterial({ color: new THREE.Color(colorPiso), roughness: 0.92, metalness: 0 }),
    [colorPiso],
  )
  const materialPared = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: new THREE.Color(colorPared),
        roughness: 0.96,
        metalness: 0,
        side: THREE.FrontSide,
      }),
    [colorPared],
  )

  return (
    <group>
      <mesh
        material={materialPiso}
        rotation={[-Math.PI / 2, 0, 0]}
        // Apenas por debajo de cero: deja lugar a la sombra de apoyo sin pelearse con ella.
        position={[0, -0.002, 0]}
        receiveShadow
      >
        <planeGeometry args={[lado, lado]} />
      </mesh>

      {/*
        La pared no recibe sombra a proposito. El mapa de sombras cubre solo el
        entorno del mueble, y donde se termina, three repite el ultimo texel:
        sobre una pared grande eso pinta un triangulo oscuro con borde recto que
        se nota de inmediato. En el piso la sombra si vale la pena; en la pared
        no aporta nada.
      */}
      <mesh material={materialPared} position={[0, altoPared / 2, zPared]}>
        <planeGeometry args={[lado, altoPared]} />
      </mesh>
    </group>
  )
}
