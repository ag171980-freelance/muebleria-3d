import { useMemo } from 'react'
import * as THREE from 'three'
import type { HerrajeColocado } from '../lib/geometria'
import type { TipoHerraje } from '../data/herrajes'

const CAJA = new THREE.BoxGeometry(1, 1, 1)
const ESFERA = new THREE.SphereGeometry(1, 20, 14)
const CILINDRO = new THREE.CylinderGeometry(1, 1, 1, 20)

const m = (mm: number) => mm / 1000

type Props = {
  tipo: TipoHerraje
  herraje: HerrajeColocado
  material: THREE.Material
}

/**
 * Dibuja el herraje elegido en la posicion que calculo el despiece. Las medidas
 * estan en milimetros, igual que el resto del armado, y se escalan al final.
 */
export function Herraje({ tipo, herraje, material }: Props) {
  const { pos, eje, largo } = herraje
  const horizontal = eje === 'x'
  // El cilindro de three nace sobre el eje Y: para los tiradores horizontales se acuesta.
  const giro = useMemo<[number, number, number]>(() => (horizontal ? [0, 0, Math.PI / 2] : [0, 0, 0]), [horizontal])

  if (tipo === 'uñero') return null

  if (tipo === 'perilla') {
    const radio = 17
    return (
      <group position={[m(pos[0]), m(pos[1]), m(pos[2])]}>
        <mesh
          geometry={CILINDRO}
          material={material}
          position={[0, 0, m(9)]}
          rotation={[Math.PI / 2, 0, 0]}
          scale={[m(5), m(18), m(5)]}
          castShadow
        />
        <mesh
          geometry={ESFERA}
          material={material}
          position={[0, 0, m(18 + radio * 0.7)]}
          scale={[m(radio), m(radio), m(radio * 0.8)]}
          castShadow
        />
      </group>
    )
  }

  if (tipo === 'perfil-j') {
    // Perfil continuo amurado al canto: una lengueta de 24 mm que sobresale 16 mm.
    const grosor = 24
    return (
      <mesh
        geometry={CAJA}
        material={material}
        position={[m(pos[0]), m(pos[1]), m(pos[2] + 8)]}
        scale={horizontal ? [m(largo), m(grosor), m(16)] : [m(grosor), m(largo), m(16)]}
        castShadow
      />
    )
  }

  const separacion = 32
  const esBarral = tipo === 'barral'
  // El cilindro unitario de three tiene radio 1: la escala es el radio, no el diametro.
  const seccion = esBarral ? 6.5 : 16
  const mitad = largo / 2 - 14

  return (
    <group position={[m(pos[0]), m(pos[1]), m(pos[2])]}>
      {[-1, 1].map((signo) => (
        <mesh
          key={signo}
          geometry={CILINDRO}
          material={material}
          position={horizontal ? [m(signo * mitad), 0, m(separacion / 2)] : [0, m(signo * mitad), m(separacion / 2)]}
          rotation={[Math.PI / 2, 0, 0]}
          scale={[m(4.5), m(separacion), m(4.5)]}
          castShadow
        />
      ))}
      <mesh
        geometry={esBarral ? CILINDRO : CAJA}
        material={material}
        position={[0, 0, m(separacion)]}
        rotation={esBarral ? giro : [0, 0, 0]}
        scale={
          esBarral
            ? [m(seccion), m(largo), m(seccion)]
            : horizontal
              ? [m(largo), m(seccion), m(seccion)]
              : [m(seccion), m(largo), m(seccion)]
        }
        castShadow
      />
    </group>
  )
}
