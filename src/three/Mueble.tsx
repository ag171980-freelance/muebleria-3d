import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'
import { materialDe, materialMetal } from '../lib/materiales'
import { ESTRUCTURA_POR_ID, ESTRUCTURAS } from '../data/marca'
import { medidaDePata, TENDIDO_CERO } from '../lib/geometria'
import type { Despiece, Eje, Material, Pata, Tendido, V3 } from '../lib/geometria'
import type { Configuracion } from '../lib/tipos'
import { Herraje } from './Herrajes'

const CAJA = new THREE.BoxGeometry(1, 1, 1)
/** Aristas de la caja unitaria: heredan la escala de la pieza y la dibujan exacta. */
const ARISTAS = new THREE.EdgesGeometry(CAJA)
const m = (mm: number) => mm / 1000
const escalar = (v: V3): V3 => [m(v[0]), m(v[1]), m(v[2])]

/** Apertura maxima de una hoja, en radianes. Un poco menos de 90 grados queda mas creible. */
const APERTURA_PUERTA = 1.5

const CERO: V3 = [0, 0, 0]

/**
 * Donde quedo acostada una pieza, por su id.
 *
 * Se lee del despiece y no de la escena: la posicion en el piso ya esta
 * calculada, asi no hay que andar preguntandole la matriz al objeto 3D en cada
 * cuadro solo para colgarle un cartel.
 */
function posicionTendida(despiece: Despiece, id: string): V3 | null {
  for (const conjunto of despiece.conjuntos) if (conjunto.id === id) return conjunto.tendido?.pos ?? null
  for (const panel of despiece.paneles) if (panel.id === id) return panel.tendido?.pos ?? null
  for (const riel of despiece.rieles) if (riel.id === id) return riel.tendido?.pos ?? null
  for (const pata of despiece.patas) if (pata.id === id) return pata.tendido?.pos ?? null
  for (const cajon of despiece.cajones) {
    if (id === cajon.id + '-frente') return cajon.frente.tendido?.pos ?? null
    for (const pieza of cajon.interior) {
      if (id === cajon.id + '/' + pieza.id) return pieza.tendido?.pos ?? null
    }
  }
  for (const puerta of despiece.puertas) {
    if (id === puerta.id + '-hoja') return puerta.hoja.tendido?.pos ?? null
  }
  return null
}

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
  /** Material del hierro, ya resuelto con el color de estructura. */
  metal: THREE.Material
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
  metal,
  destacado,
  acento,
  señalable,
  alSeñalar,
  registrar,
}: PropsPieza) {
  const material = useMemo(
    () => (mat === 'metal' ? metal : materialDe({ maderaId, acabadoId, mat, medida, grano })),
    [mat, metal, maderaId, acabadoId, medida, grano],
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
  metal,
  destacado,
  acento,
  señalable,
  alSeñalar,
  registrar,
}: {
  pata: Pata
  maderaId: string
  acabadoId: string
  metal: THREE.Material
  destacado: boolean
  acento: string
  señalable: boolean
  alSeñalar?: (id: string | null) => void
  registrar?: (id: string, nodo: THREE.Object3D | null) => void
}) {
  const material = useMemo(
    () =>
      pata.mat === 'metal'
        ? metal
        : materialDe({ maderaId, acabadoId, mat: 'placa', medida: medidaDePata(pata), grano: 'y' }),
    [pata, metal, maderaId, acabadoId],
  )

  // La rueda giratoria se dibuja como un cilindro acostado bajo su soporte.
  const geometria = useMemo(() => {
    if (pata.forma === 'tubo') return CAJA
    return new THREE.CylinderGeometry(m(pata.altura * 0.42), m(pata.altura * 0.42), m(pata.seccion * 0.45), 16)
  }, [pata.forma, pata.seccion, pata.altura])

  // La geometria se rearma con cada medida nueva, asi que hay que soltar la anterior.
  useEffect(() => {
    return () => {
      if (geometria !== CAJA) geometria.dispose()
    }
  }, [geometria])

  const esTubo = pata.forma === 'tubo'
  const medida = medidaDePata(pata)

  return (
    <mesh
      geometry={esTubo ? CAJA : geometria}
      material={material}
      position={escalar(pata.pos)}
      rotation={esTubo ? undefined : [0, 0, Math.PI / 2]}
      scale={esTubo ? escalar(medida) : undefined}
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
          scale={esTubo ? undefined : escalar(medida)}
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
  /** Nombre y medida de la pieza señalada, para el cartel sobre la pieza. */
  etiqueta?: string | null
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
  etiqueta,
  acento = '#1f6b4c',
  alSeñalar,
}: Props) {
  const { maderaId, acabadoId } = config
  // En un mueble de hierro y madera el herraje es parte del hierro: patas,
  // rieles y tiradores van todos en la misma pintura epoxi que la estructura.
  const estructura = ESTRUCTURA_POR_ID.get(config.estructuraId) ?? ESTRUCTURAS[0]
  const metalHerraje = useMemo(
    () => materialMetal(estructura.color, estructura.metalico, estructura.rugosidad),
    [estructura],
  )
  const resaltados = useMemo(() => new Set(destacados ?? []), [destacados])
  // El cartel se cuelga sobre la primera pieza del grupo señalado.
  const anclaEtiqueta = useMemo(() => {
    if (!desarmado || !etiqueta || !destacados?.length) return null
    return posicionTendida(despiece, destacados[0])
  }, [desarmado, etiqueta, destacados, despiece])

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
    /**
     * Lleva la pieza de su lugar en el mueble a su lugar en el piso.
     *
     * `d` va de 0 a 1: en 0 la pieza esta montada, en 1 esta acostada sobre el
     * piso. Se interpola tanto la posicion como el giro, asi la pieza se ve
     * bajar y darse vuelta en el mismo movimiento.
     */
    const ubicar = (id: string, pos: V3, tendido: Tendido | undefined, extra: V3 = CERO) => {
      const nodo = nodos.current.get(id)
      if (!nodo) return
      const destino = tendido ?? TENDIDO_CERO
      const mezcla = (desde: number, hasta: number) => desde + (hasta - desde) * d
      nodo.position.set(
        m(mezcla(pos[0] + extra[0], destino.pos[0])),
        m(mezcla(pos[1] + extra[1], destino.pos[1])),
        m(mezcla(pos[2] + extra[2], destino.pos[2])),
      )
      if (tendido) nodo.rotation.set(destino.rot[0] * d, destino.rot[1] * d, destino.rot[2] * d)
    }

    for (const conjunto of despiece.conjuntos) ubicar(conjunto.id, conjunto.pos, conjunto.tendido)
    for (const panel of despiece.paneles) ubicar(panel.id, panel.pos, panel.tendido)
    for (const riel of despiece.rieles) ubicar(riel.id, riel.pos, riel.tendido)
    for (const pata of despiece.patas) ubicar(pata.id, pata.pos, pata.tendido)
    for (const barral of despiece.barrales) ubicar(barral.id, barral.pos, barral.tendido)

    for (const cajon of despiece.cajones) {
      // El grupo del cajon vuelve al origen: sus piezas guardan el destino en
      // coordenadas del mundo y se van solas a su lugar en el piso.
      ubicar(cajon.id, cajon.ancla, TENDIDO_CERO, [0, 0, cajon.recorrido * p])
      ubicar(cajon.id + '-frente', CERO, cajon.frente.tendido)
      for (const pieza of cajon.interior) ubicar(cajon.id + '/' + pieza.id, pieza.pos, pieza.tendido)
    }

    for (const puerta of despiece.puertas) {
      // La corrediza corre sobre el riel; la batiente gira sobre la bisagra.
      // Al desarmarse, las dos vuelven a su lugar y quedan derechas: una hoja
      // abierta o corrida no se puede medir.
      const corrido = puerta.tipo === 'corrediza' ? puerta.corrimiento * p * (1 - d) : 0
      ubicar(puerta.id, puerta.bisagra, TENDIDO_CERO, [corrido, 0, 0])
      ubicar(puerta.id + '-hoja', puerta.hoja.centro, puerta.hoja.tendido)
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
    metal: metalHerraje,
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

      {/*
        Un marco soldado se dibuja como un grupo: sus caños comparten id, asi
        que al pasarle el puntero se señala el marco entero y no una barra, y al
        desarmarse se acuesta en el piso de una pieza.
      */}
      {despiece.conjuntos.map((conjunto) => (
        <group key={conjunto.id} ref={(nodo) => registrar(conjunto.id, nodo)} position={escalar(conjunto.pos)}>
          {conjunto.piezas.map((pieza) => (
            <Pieza
              key={pieza.id}
              id={conjunto.id}
              medida={pieza.medida}
              grano={pieza.grano}
              mat={pieza.mat}
              posicion={pieza.pos}
              destacado={resaltados.has(conjunto.id)}
              {...comun}
              registrar={undefined}
            />
          ))}
        </group>
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
          <group ref={(nodo) => registrar(cajon.id + '-frente', nodo)}>
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
            {cajon.herrajes.map((herraje) => (
              <Herraje key={herraje.id} tipo={cajon.tipoHerraje} herraje={herraje} material={metalHerraje} />
            ))}
          </group>
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
        </group>
      ))}

      {despiece.puertas.map((puerta) => (
        <group
          key={puerta.id}
          ref={(nodo) => registrar(puerta.id, nodo)}
          position={escalar(puerta.bisagra)}
          rotation={[0, puerta.tipo === 'batiente' ? puerta.sentido * apertura.current * APERTURA_PUERTA : 0, 0]}
        >
          <group ref={(nodo) => registrar(puerta.id + '-hoja', nodo)} position={escalar(puerta.hoja.centro)}>
            <Pieza
              id={puerta.id + '-hoja'}
              medida={puerta.hoja.medida}
              grano={puerta.hoja.grano}
              mat="placa"
              posicion={[0, 0, 0]}
              destacado={resaltados.has(puerta.id + '-hoja')}
              {...comun}
              registrar={undefined}
            />
            {puerta.herrajes.map((herraje) => (
              <Herraje
                key={herraje.id}
                tipo={puerta.tipoHerraje}
                herraje={{ ...herraje, pos: [herraje.pos[0] - puerta.hoja.centro[0], herraje.pos[1], herraje.pos[2]] }}
                material={metalHerraje}
              />
            ))}
          </group>
        </group>
      ))}

      {anclaEtiqueta && etiqueta ? (
        <Html
          position={[m(anclaEtiqueta[0]), m(anclaEtiqueta[1]) + 0.16, m(anclaEtiqueta[2])]}
          center
          zIndexRange={[40, 30]}
          style={{ pointerEvents: 'none' }}
        >
          <span className="globo">{etiqueta}</span>
        </Html>
      ) : null}
    </group>
  )
}
