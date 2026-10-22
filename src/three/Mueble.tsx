import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { materialDe, materialMetal } from '../lib/materiales'
import { TERMINACION_POR_ID } from '../data/herrajes'
import type { Despiece, Eje, Material, Pata, V3 } from '../lib/geometria'
import type { Configuracion } from '../lib/tipos'
import { Herraje } from './Herrajes'

const CAJA = new THREE.BoxGeometry(1, 1, 1)
/** Aristas de la caja unitaria: heredan la escala de la pieza y la dibujan exacta. */
const ARISTAS = new THREE.EdgesGeometry(CAJA)
const m = (mm: number) => mm / 1000
const escalar = (v: V3): V3 => [m(v[0]), m(v[1]), m(v[2])]

/** Hierro pintado de las patas y los apoyos. No cambia con la terminacion de los tiradores. */
const HIERRO = { color: '#2b2d2f', metalico: 0.5, rugosidad: 0.58 }

/** Apertura maxima de una hoja, en radianes. Un poco menos de 90 grados queda mas creible. */
const APERTURA_PUERTA = 1.5

const CERO: V3 = [0, 0, 0]

const resaltes = new Map<string, THREE.LineBasicMaterial>()

function materialResalte(color: string): THREE.LineBasicMaterial {
  let material = resaltes.get(color)
  if (!material) {
    material = new THREE.LineBasicMaterial({
      color: new THREE.Color(color),
      // Sin test de profundidad la pieza señalada se ve aunque este tapada por otra.
      depthTest: false,
      transparent: true,
    })
    resaltes.set(color, material)
  }
  return material
}

type PropsPieza = {
  id: string
  medida: V3
  grano: Eje
  mat: Material
  /** Posicion inicial en mm. Despues la maneja la animacion. */
  posicion: V3
  maderaId: string
  acabadoId: string
  destacado: boolean
  acento: string
  señalable: boolean
  alSeñalar?: (id: string | null) => void
  registrar?: (id: string, nodo: THREE.Object3D | null) => void
}

function Pieza({
  id,
  medida,
  grano,
  mat,
  posicion,
  maderaId,
  acabadoId,
  destacado,
  acento,
  señalable,
  alSeñalar,
  registrar,
}: PropsPieza) {
  const material = useMemo(
    () =>
      mat === 'metal'
        ? materialMetal(HIERRO.color, HIERRO.metalico, HIERRO.rugosidad)
        : materialDe({ maderaId, acabadoId, mat, medida, grano }),
    [mat, maderaId, acabadoId, medida, grano],
  )

  return (
    <mesh
      geometry={CAJA}
      material={material}
      position={escalar(posicion)}
      scale={escalar(medida)}
      castShadow
      receiveShadow
      ref={(nodo) => registrar?.(id, nodo)}
      onPointerOver={
        señalable
          ? (evento) => {
              evento.stopPropagation()
              alSeñalar?.(id)
            }
          : undefined
      }
      onPointerOut={señalable ? () => alSeñalar?.(null) : undefined}
    >
      {destacado ? <lineSegments geometry={ARISTAS} material={materialResalte(acento)} renderOrder={3} /> : null}
    </mesh>
  )
}

function PataMueble({
  pata,
  maderaId,
  acabadoId,
  destacado,
  acento,
  señalable,
  alSeñalar,
  registrar,
}: {
  pata: Pata
  maderaId: string
  acabadoId: string
  destacado: boolean
  acento: string
  señalable: boolean
  alSeñalar?: (id: string | null) => void
  registrar?: (id: string, nodo: THREE.Object3D | null) => void
}) {
  const material = useMemo(
    () =>
      pata.mat === 'metal'
        ? materialMetal(HIERRO.color, HIERRO.metalico, HIERRO.rugosidad)
        : materialDe({
            maderaId,
            acabadoId,
            mat: 'placa',
            medida: [pata.seccion, pata.altura, pata.seccion],
            grano: 'y',
          }),
    [pata, maderaId, acabadoId],
  )

  // Las patas torneadas son conicas: mas anchas arriba que en el apoyo.
  const geometria = useMemo(() => {
    if (pata.forma === 'tubo') return CAJA
    const radio = pata.seccion / 2
    return new THREE.CylinderGeometry(m(radio), m(radio * 0.62), m(pata.altura), 18)
  }, [pata.forma, pata.seccion, pata.altura])

  // La geometria se rearma con cada medida nueva, asi que hay que soltar la anterior.
  useEffect(() => {
    return () => {
      if (geometria !== CAJA) geometria.dispose()
    }
  }, [geometria])

  const esTubo = pata.forma === 'tubo'

  return (
    <mesh
      geometry={esTubo ? CAJA : geometria}
      material={material}
      position={escalar(pata.pos)}
      scale={esTubo ? [m(pata.seccion), m(pata.altura), m(pata.seccion)] : undefined}
      castShadow
      ref={(nodo) => registrar?.(pata.id, nodo)}
      onPointerOver={
        señalable
          ? (evento) => {
              evento.stopPropagation()
              alSeñalar?.(pata.id)
            }
          : undefined
      }
      onPointerOut={señalable ? () => alSeñalar?.(null) : undefined}
    >
      {destacado ? (
        <lineSegments
          geometry={ARISTAS}
          material={materialResalte(acento)}
          renderOrder={3}
          scale={esTubo ? undefined : [m(pata.seccion), m(pata.altura), m(pata.seccion)]}
        />
      ) : null}
    </mesh>
  )
}

type Props = {
  despiece: Despiece
  config: Configuracion
  abierto: boolean
  /** Separa el mueble en piezas. */
  desarmado?: boolean
  /** Si el visitante pidio menos movimiento, se salta la animacion. */
  sinAnimacion: boolean
  /** Ids de las piezas a resaltar. */
  destacados?: string[]
  acento?: string
  alSeñalar?: (id: string | null) => void
}

export function Mueble({
  despiece,
  config,
  abierto,
  desarmado = false,
  sinAnimacion,
  destacados,
  acento = '#1f6b4c',
  alSeñalar,
}: Props) {
  const { maderaId, acabadoId } = config
  const terminacion = TERMINACION_POR_ID.get(config.terminacionHerrajeId) ?? TERMINACION_POR_ID.get('acero')!
  const metalHerraje = useMemo(
    () => materialMetal(terminacion.color, terminacion.metalico, terminacion.rugosidad),
    [terminacion],
  )
  const resaltados = useMemo(() => new Set(destacados ?? []), [destacados])

  const nodos = useRef(new Map<string, THREE.Object3D>())
  const registrar = useRef((id: string, nodo: THREE.Object3D | null) => {
    if (nodo) nodos.current.set(id, nodo)
    else nodos.current.delete(id)
  }).current

  const apertura = useRef(abierto ? 1 : 0)
  const desarme = useRef(desarmado ? 1 : 0)

  /**
   * Coloca cada pieza segun cuanto esta abierto y cuanto desarmado el mueble.
   *
   * Se aplica siempre, no solo mientras hay animacion. Si solo corriera durante
   * la transicion, cambiar una medida con el mueble desarmado volveria a
   * dibujar las piezas en la posicion de armado y se quedarian ahi, porque la
   * animacion ya estaba en su destino y no tenia nada que recorrer.
   */
  const colocar = (p: number, d: number) => {
    const ubicar = (id: string, pos: V3, salida: V3, extra: V3 = CERO) => {
      const nodo = nodos.current.get(id)
      if (!nodo) return
      nodo.position.set(
        m(pos[0] + salida[0] * d + extra[0]),
        m(pos[1] + salida[1] * d + extra[1]),
        m(pos[2] + salida[2] * d + extra[2]),
      )
    }

    for (const panel of despiece.paneles) ubicar(panel.id, panel.pos, panel.desarme)
    for (const riel of despiece.rieles) ubicar(riel.id, riel.pos, riel.desarme)
    for (const pata of despiece.patas) ubicar(pata.id, pata.pos, pata.desarme)
    for (const barral of despiece.barrales) ubicar(barral.id, barral.pos, barral.desarme)

    for (const cajon of despiece.cajones) {
      ubicar(cajon.id, cajon.ancla, cajon.desarme, [0, 0, cajon.recorrido * p])
      for (const pieza of cajon.interior) ubicar(cajon.id + '/' + pieza.id, pieza.pos, pieza.desarme)
    }

    for (const puerta of despiece.puertas) {
      // La corrediza corre sobre el riel; la batiente gira sobre la bisagra.
      // Al desarmarse, las dos vuelven a su lugar y quedan derechas: una hoja
      // abierta o corrida no se puede medir.
      const corrido = puerta.tipo === 'corrediza' ? puerta.corrimiento * p * (1 - d) : 0
      ubicar(puerta.id, puerta.bisagra, puerta.desarme, [corrido, 0, 0])
      const grupo = nodos.current.get(puerta.id)
      if (grupo) {
        grupo.rotation.y = puerta.tipo === 'batiente' ? puerta.sentido * p * APERTURA_PUERTA * (1 - d) : 0
      }
    }
  }

  // El callback de cada cuadro tiene que ver siempre el despiece actual, no el
  // que habia cuando se monto el componente. Se refresca despues de cada render
  // y recoloca antes de pintar: si no, al cambiar una medida con el mueble
  // desarmado se ve un cuadro con las piezas de vuelta en su lugar.
  const colocarAhora = useRef(colocar)
  useLayoutEffect(() => {
    colocarAhora.current = colocar
    colocarAhora.current(apertura.current, desarme.current)
  })

  useFrame((_, delta) => {
    const metaApertura = abierto ? 1 : 0
    const metaDesarme = desarmado ? 1 : 0
    const acercar = (actual: number, meta: number) => {
      if (sinAnimacion) return meta
      const siguiente = THREE.MathUtils.damp(actual, meta, 7, delta)
      return Math.abs(siguiente - meta) < 0.0005 ? meta : siguiente
    }

    apertura.current = acercar(apertura.current, metaApertura)
    desarme.current = acercar(desarme.current, metaDesarme)
    colocarAhora.current(apertura.current, desarme.current)
  })

  const comun = {
    maderaId,
    acabadoId,
    acento,
    señalable: desarmado,
    alSeñalar,
    registrar,
  }

  return (
    <group>
      {despiece.paneles.map((caja) => (
        <Pieza
          key={caja.id}
          id={caja.id}
          medida={caja.medida}
          grano={caja.grano}
          mat={caja.mat}
          posicion={caja.pos}
          destacado={resaltados.has(caja.id)}
          {...comun}
        />
      ))}

      {despiece.patas.map((pata) => (
        <PataMueble key={pata.id} pata={pata} destacado={resaltados.has(pata.id)} {...comun} />
      ))}

      {despiece.rieles.map((riel) => (
        <mesh
          key={riel.id}
          geometry={CAJA}
          material={metalHerraje}
          position={escalar(riel.pos)}
          scale={escalar(riel.medida)}
          castShadow
          ref={(nodo) => registrar(riel.id, nodo)}
        />
      ))}

      {despiece.barrales.map((barral) => (
        <mesh
          key={barral.id}
          material={metalHerraje}
          position={escalar(barral.pos)}
          rotation={[0, 0, Math.PI / 2]}
          castShadow
          ref={(nodo) => registrar(barral.id, nodo)}
        >
          <cylinderGeometry args={[m(barral.radio), m(barral.radio), m(barral.largo), 16]} />
        </mesh>
      ))}

      {despiece.cajones.map((cajon) => (
        <group
          key={cajon.id}
          ref={(nodo) => registrar(cajon.id, nodo)}
          position={escalar(cajon.ancla)}
        >
          <Pieza
            id={cajon.id + '-frente'}
            medida={cajon.frente.medida}
            grano={cajon.frente.grano}
            mat="placa"
            posicion={[0, 0, 0]}
            destacado={resaltados.has(cajon.id + '-frente')}
            {...comun}
            registrar={undefined}
          />
          {cajon.interior.map((pieza) => (
            <Pieza
              key={pieza.id}
              id={cajon.id + '/' + pieza.id}
              medida={pieza.medida}
              grano={pieza.grano}
              mat={pieza.mat}
              posicion={pieza.pos}
              destacado={resaltados.has(cajon.id + '/' + pieza.id)}
              {...comun}
            />
          ))}
          {cajon.herrajes.map((herraje) => (
            <Herraje key={herraje.id} tipo={cajon.tipoHerraje} herraje={herraje} material={metalHerraje} />
          ))}
        </group>
      ))}

      {despiece.puertas.map((puerta) => (
        <group
          key={puerta.id}
          ref={(nodo) => registrar(puerta.id, nodo)}
          position={escalar(puerta.bisagra)}
          rotation={[0, puerta.tipo === 'batiente' ? puerta.sentido * apertura.current * APERTURA_PUERTA : 0, 0]}
        >
          <Pieza
            id={puerta.id + '-hoja'}
            medida={puerta.hoja.medida}
            grano={puerta.hoja.grano}
            mat="placa"
            posicion={puerta.hoja.centro}
            destacado={resaltados.has(puerta.id + '-hoja')}
            {...comun}
            registrar={undefined}
          />
          {puerta.herrajes.map((herraje) => (
            <Herraje key={herraje.id} tipo={puerta.tipoHerraje} herraje={herraje} material={metalHerraje} />
          ))}
        </group>
      ))}
    </group>
  )
}
