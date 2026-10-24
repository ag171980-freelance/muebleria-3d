import { useEffect, useMemo, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { ContactShadows, OrbitControls } from '@react-three/drei'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import * as THREE from 'three'
import { Mueble } from './Mueble'
import { Escenario } from './Escenario'
import { Cotas } from './Cotas'
import { distanciaEncuadre } from './encuadre'
import { camara } from './captura'
import { useMenosMovimiento } from '../lib/preferencias'
import type { Bulto, Despiece } from '../lib/geometria'
import type { Configuracion } from '../lib/tipos'

type Props = {
  despiece: Despiece
  config: Configuracion
  abierto: boolean
  /** Mueble separado en piezas. */
  desarmado: boolean
  /** Color del contorno de la pieza señalada y de las cotas. */
  acento: string
  /** Colores del piso y la pared del ambiente. */
  ambiente: { piso: string; pared: string }
  /** Ids de las piezas a resaltar. */
  destacados: string[]
  /** Nombre y medida de la pieza señalada. */
  etiqueta: string | null
  alSeñalar: (id: string | null) => void
}

/**
 * Reencuadra la camara cuando cambia el tamaño del mueble. Es el unico
 * movimiento automatico del visor: avisa que la medida cambio sin que el
 * cliente tenga que buscar el mueble de nuevo.
 */
function Encuadre({ bulto, margen, sinAnimacion }: { bulto: Bulto; margen: number; sinAnimacion: boolean }) {
  const camaraActiva = useThree((s) => s.camera) as THREE.PerspectiveCamera
  const controles = useThree((s) => s.controls) as { target: THREE.Vector3; update: () => void } | null
  // El tamaño del lienzo entra en el encuadre: se recalcula tambien al redimensionar.
  const medidaLienzo = useThree((s) => s.size)
  const objetivoAltura = bulto.centroY / 1000
  const distanciaObjetivo = useMemo(
    () => distanciaEncuadre(bulto, camaraActiva, margen),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [bulto, margen, camaraActiva, medidaLienzo.width, medidaLienzo.height],
  )
  const primerCuadro = useRef(true)
  const pendiente = useRef(true)

  // Solo se reencuadra cuando cambia la medida del mueble. Si corriera siempre,
  // le devolveria la camara a su lugar cada vez que el cliente acerca con la
  // rueda, y el zoom quedaria inutilizable.
  useEffect(() => {
    pendiente.current = true
  }, [distanciaObjetivo, objetivoAltura])

  useFrame((_, delta) => {
    if (!controles || !pendiente.current) return
    const suavizado = sinAnimacion || primerCuadro.current ? 1 : 1 - Math.exp(-5 * delta)
    primerCuadro.current = false

    controles.target.y += (objetivoAltura - controles.target.y) * suavizado
    const direccion = camaraActiva.position.clone().sub(controles.target)
    const largo = direccion.length() || 1
    const nuevoLargo = largo + (distanciaObjetivo - largo) * suavizado
    camaraActiva.position.copy(controles.target).add(direccion.multiplyScalar(nuevoLargo / largo))
    controles.update()

    const listo = Math.abs(nuevoLargo - distanciaObjetivo) < 0.004 && Math.abs(controles.target.y - objetivoAltura) < 0.004
    if (listo) pendiente.current = false
  })

  return null
}

/** Deja disponible la captura del lienzo para adjuntarla al pedido. */
function Fotografo() {
  const gl = useThree((s) => s.gl)
  const escena = useThree((s) => s.scene)
  const camaraActiva = useThree((s) => s.camera)

  useEffect(() => {
    camara.tomar = () => {
      gl.render(escena, camaraActiva)
      return gl.domElement.toDataURL('image/png')
    }
    return () => {
      camara.tomar = null
    }
  }, [gl, escena, camaraActiva])

  return null
}

/**
 * Mapa de entorno para los reflejos de los herrajes.
 *
 * Antes esto era un <Environment> de drei con Lightformers. Ese camino deja el
 * mueble completamente negro cuando el navegador cae a WebGL por software, que
 * es lo que pasa en equipos sin placa o con la aceleracion desactivada. Esta
 * version usa PMREM, que restaura el render target al terminar, y si el
 * horneado falla se sigue sin mapa: las luces directas alcanzan para ver el
 * mueble, solo se pierde brillo en los metales.
 */
function Ambiente() {
  const gl = useThree((s) => s.gl)
  const escena = useThree((s) => s.scene)

  useEffect(() => {
    let destino: THREE.WebGLRenderTarget | null = null
    try {
      const pmrem = new THREE.PMREMGenerator(gl)
      const sala = new RoomEnvironment()
      destino = pmrem.fromScene(sala, 0.04)
      escena.environment = destino.texture
      pmrem.dispose()
      sala.traverse((nodo) => {
        const malla = nodo as THREE.Mesh
        if (malla.isMesh) {
          malla.geometry?.dispose()
          const material = malla.material
          if (Array.isArray(material)) material.forEach((m) => m.dispose())
          else material?.dispose()
        }
      })
    } catch {
      escena.environment = null
    }
    return () => {
      escena.environment = null
      destino?.dispose()
    }
  }, [gl, escena])

  return null
}

function Fondo({ color }: { color: string }) {
  const escena = useThree((s) => s.scene)
  useEffect(() => {
    escena.background = new THREE.Color(color)
    return () => {
      escena.background = null
    }
  }, [escena, color])
  return null
}

export function Visor({
  despiece,
  config,
  abierto,
  desarmado,
  acento,
  ambiente,
  destacados,
  etiqueta,
  alSeñalar,
}: Props) {
  const sinAnimacion = useMenosMovimiento()
  // El despiece abierto ocupa mucho mas lugar que el mueble armado y tiene su
  // propio centro: la camara necesita encuadrar uno u otro segun el modo.
  const bultoActivo = desarmado ? despiece.bultoDesarmado : despiece.bulto
  // La sombra tiene que cubrir todo lo que hay en el piso, armado o desarmado.
  const radioSombra = Math.max(
    2.5,
    (Math.max(bultoActivo.ancho, bultoActivo.profundidad, bultoActivo.alto) / 1000) * 1.6,
  )
  // Punto de partida aproximado: el encuadre exacto lo ajusta <Encuadre /> con el lienzo ya medido.
  const diagonal = Math.hypot(despiece.bulto.ancho, despiece.bulto.alto, despiece.bulto.profundidad) / 1000
  const distancia = Math.max(1.6, diagonal * 1.2)

  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      // preserveDrawingBuffer deja leer el lienzo para adjuntar la foto al presupuesto.
      gl={{ antialias: true, preserveDrawingBuffer: true }}
      camera={{ position: [distancia * 0.72, distancia * 0.52, distancia * 0.78], fov: 38, near: 0.05, far: 60 }}
    >
      <Fondo color={ambiente.pared} />
      <Fotografo />

      {/*
        Las intensidades estan calibradas para que la madera se vea en el tono
        del laqueado. Con la suma de luces mas alta, el mapeo de tonos levanta
        el albedo y el Nogal se lee como un marron medio: en una marca donde el
        tono del laqueado es la eleccion principal, eso engaña al cliente.
      */}
      <hemisphereLight intensity={0.3} groundColor="#8a8a84" />
      <directionalLight
        position={[radioSombra * 1.1, radioSombra * 1.7, radioSombra * 1.4]}
        intensity={1.2}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0006}
        shadow-camera-left={-radioSombra}
        shadow-camera-right={radioSombra}
        shadow-camera-top={radioSombra}
        shadow-camera-bottom={-radioSombra}
        shadow-camera-far={radioSombra * 6}
      />
      <directionalLight position={[-3.2, 2.2, -1.8]} intensity={0.35} />

      <Ambiente />

      <Mueble
        despiece={despiece}
        config={config}
        abierto={abierto}
        desarmado={desarmado}
        sinAnimacion={sinAnimacion}
        destacados={destacados}
        etiqueta={etiqueta}
        acento={acento}
        alSeñalar={alSeñalar}
      />

      <Escenario bulto={bultoActivo} colorPiso={ambiente.piso} colorPared={ambiente.pared} />

      {desarmado ? null : (
        <ContactShadows
          position={[0, 0.001, 0]}
          opacity={0.4}
          scale={Math.max(4, distancia * 2.4)}
          blur={2.4}
          far={2.2}
        />
      )}

      {/* Las cotas miden el mueble armado: con las piezas en el piso no hay caja que medir. */}
      {desarmado ? null : <Cotas bulto={despiece.bulto} color={acento} />}

      <OrbitControls
        makeDefault
        enablePan={false}
        enableDamping={!sinAnimacion}
        dampingFactor={0.08}
        minDistance={0.8}
        maxDistance={40}
        // No se puede mirar el mueble desde abajo del piso.
        maxPolarAngle={Math.PI / 2 - 0.03}
        minPolarAngle={0.12}
      />
      {/*
        Armado necesita mas aire porque las cotas se dibujan por fuera del
        mueble; desarmado no hay cotas, asi que las piezas pueden llenar mas el
        cuadro en vez de quedar chiquitas en el medio del piso.
      */}
      <Encuadre bulto={bultoActivo} margen={desarmado ? 1.08 : 1.24} sinAnimacion={sinAnimacion} />
    </Canvas>
  )
}
