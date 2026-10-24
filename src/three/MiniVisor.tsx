import { useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { configuracionInicial } from '../data/modelos'
import { armar } from '../lib/geometria'
import type { Configuracion } from '../lib/tipos'
import { Mueble } from './Mueble'
import { distanciaEncuadre } from './encuadre'
import { useMenosMovimiento } from '../lib/preferencias'
import type { Despiece } from '../lib/geometria'

function Giro({ activo, children }: { activo: boolean; children: React.ReactNode }) {
  const grupo = useRef<THREE.Group>(null)
  useFrame((_, delta) => {
    if (grupo.current && activo) grupo.current.rotation.y += delta * 0.35
  })
  return <group ref={grupo}>{children}</group>
}

/** Coloca la camara a la distancia que deja el mueble entero en cuadro. */
function Encuadre({ bulto }: { bulto: Despiece['bulto'] }) {
  const camara = useThree((s) => s.camera) as THREE.PerspectiveCamera
  const medida = useThree((s) => s.size)
  const invalidar = useThree((s) => s.invalidate)

  useLayoutEffect(() => {
    const distancia = distanciaEncuadre(bulto, camara, 1.02)
    const direccion = camara.position.clone().normalize()
    camara.position.copy(direccion.multiplyScalar(distancia))
    camara.lookAt(0, 0, 0)
    camara.updateProjectionMatrix()
    // En modo bajo demanda hay que pedir el redibujado a mano.
    invalidar()
  }, [bulto, camara, medida.width, medida.height, invalidar])

  return null
}

type Props = {
  modeloId: string
  fondo: string
  /** Lo que se eligio en la tarjeta, para que la vista previa lo muestre. */
  ajustes?: Partial<Configuracion>
  /** Vista previa de catalogo: gira solo mientras el puntero esta encima. */
  interactivo?: boolean
}

/**
 * Render chico del mueble para las tarjetas del catalogo. Es el producto real,
 * no una foto de archivo: lo que ve el cliente en la tarjeta es exactamente lo
 * que se abre en el configurador.
 */
export function MiniVisor({ modeloId, fondo, ajustes, interactivo = true }: Props) {
  const sinAnimacion = useMenosMovimiento()
  const [activo, setActivo] = useState(false)
  const { config, despiece } = useMemo(() => {
    const config = { ...configuracionInicial(modeloId), ...ajustes }
    return { config, despiece: armar(config) }
  }, [modeloId, ajustes])

  const girando = interactivo && activo && !sinAnimacion

  return (
    <Canvas
      // Sin interaccion no se redibuja: seis tarjetas no pueden estar animando a la vez.
      frameloop={girando ? 'always' : 'demand'}
      dpr={[1, 1.6]}
      camera={{ position: [1.6, 0.9, 1.5], fov: 34, near: 0.05, far: 60 }}
      style={{ background: fondo }}
      onPointerEnter={() => setActivo(true)}
      onPointerLeave={() => setActivo(false)}
    >
      {/* Misma calibracion que el visor grande: la madera tiene que verse igual
          en la tarjeta y en el configurador. */}
      <hemisphereLight intensity={0.42} groundColor="#8a8a84" />
      <directionalLight position={[2.2, 3.4, 2.6]} intensity={1.35} />
      <directionalLight position={[-2.4, 1.6, -1.6]} intensity={0.32} />
      <Encuadre bulto={despiece.bulto} />
      {/* El mueble se dibuja desde el piso hacia arriba: se baja medio alto para que gire sobre su centro. */}
      <Giro activo={girando}>
        <group position={[0, -despiece.bulto.alto / 2000, 0]}>
          <Mueble despiece={despiece} config={config} abierto={false} sinAnimacion />
        </group>
      </Giro>
    </Canvas>
  )
}
