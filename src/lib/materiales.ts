import * as THREE from 'three'
import { ACABADO_POR_ID, MADERA_POR_ID } from '../data/maderas'
import type { Eje, Material, V3 } from './geometria'

/** Lado del tile de veta, en milimetros reales. */
const ESCALA_GRANO = 420

const texturasBase = new Map<string, THREE.Texture>()
const texturasMapeadas = new Map<string, THREE.Texture>()
const materiales = new Map<string, THREE.MeshPhysicalMaterial>()

function aleatorio(semilla: number) {
  let s = semilla
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff
    return s / 0x7fffffff
  }
}

/**
 * Dibuja un tile de veta en escala de grises. Se usa como `map` (lo tiñe el
 * color de la madera), como `bumpMap` y como `roughnessMap`, asi que una sola
 * textura alcanza para las nueve maderas del catalogo.
 */
function dibujarGrano(intensidad: number, nudos: boolean): THREE.Texture {
  const lado = 512
  const lienzo = document.createElement('canvas')
  lienzo.width = lado
  lienzo.height = lado
  const ctx = lienzo.getContext('2d')
  if (!ctx) return new THREE.Texture()

  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, lado, lado)

  const rnd = aleatorio(Math.round(intensidad * 1000) + 7)
  const lineas = Math.round(90 + intensidad * 150)

  // Vetas: lineas horizontales con una ondulacion suave, de grosor y opacidad variables.
  for (let i = 0; i < lineas; i++) {
    const y = rnd() * lado
    const grosor = 0.4 + rnd() * (1 + intensidad * 2.6)
    const alfa = (0.03 + rnd() * 0.1) * intensidad
    const amplitud = 2 + rnd() * 9
    const frecuencia = 0.004 + rnd() * 0.012
    const fase = rnd() * Math.PI * 2
    ctx.strokeStyle = 'rgba(70, 48, 30, ' + alfa.toFixed(3) + ')'
    ctx.lineWidth = grosor
    ctx.beginPath()
    for (let x = 0; x <= lado; x += 8) {
      // El desfasaje vertical se repite en los bordes para que el tile calce.
      const onda = Math.sin(x * frecuencia + fase) * amplitud * Math.sin((x / lado) * Math.PI)
      const py = y + onda
      if (x === 0) ctx.moveTo(x, py)
      else ctx.lineTo(x, py)
    }
    ctx.stroke()
  }

  // Nudos: solo las especies que los tienen. El pino los muestra, el eucalipto no.
  if (nudos) {
    const nudos = Math.round(intensidad * 3)
    for (let i = 0; i < nudos; i++) {
      const cx = 60 + rnd() * (lado - 120)
      const cy = 60 + rnd() * (lado - 120)
      const radio = 10 + rnd() * 22
      for (let anillo = 6; anillo > 0; anillo--) {
        ctx.strokeStyle = 'rgba(62, 40, 24, ' + (0.05 * intensidad * anillo).toFixed(3) + ')'
        ctx.lineWidth = 1 + rnd() * 1.6
        ctx.beginPath()
        ctx.ellipse(cx, cy, (radio * anillo) / 6, ((radio * anillo) / 6) * 0.45, 0, 0, Math.PI * 2)
        ctx.stroke()
      }
    }
  }

  // Grano fino, para que la superficie no quede plana en los reflejos.
  const datos = ctx.getImageData(0, 0, lado, lado)
  for (let i = 0; i < datos.data.length; i += 4) {
    const ruido = (rnd() - 0.5) * 14 * (0.3 + intensidad)
    datos.data[i] = Math.max(0, Math.min(255, datos.data[i] + ruido))
    datos.data[i + 1] = Math.max(0, Math.min(255, datos.data[i + 1] + ruido))
    datos.data[i + 2] = Math.max(0, Math.min(255, datos.data[i + 2] + ruido))
  }
  ctx.putImageData(datos, 0, 0)

  const textura = new THREE.CanvasTexture(lienzo)
  textura.wrapS = THREE.RepeatWrapping
  textura.wrapT = THREE.RepeatWrapping
  textura.colorSpace = THREE.SRGBColorSpace
  textura.anisotropy = 4
  return textura
}

function granoBase(intensidad: number, nudos: boolean): THREE.Texture {
  const clave = intensidad.toFixed(1) + (nudos ? '|n' : '')
  let textura = texturasBase.get(clave)
  if (!textura) {
    textura = dibujarGrano(Number(intensidad.toFixed(1)), nudos)
    texturasBase.set(clave, textura)
  }
  return textura
}

/**
 * Cuantas veces se repite el tile sobre la cara mas grande de la pieza, y si
 * hay que girarlo para que la veta corra en el sentido pedido.
 */
function encuadre(medida: V3, grano: Eje): { repeticion: [number, number]; rotacion: number } {
  const ejes: Eje[] = ['x', 'y', 'z']
  // El eje mas corto es el espesor: las dos caras grandes son las otras dos.
  let ejeEspesor = 0
  for (let i = 1; i < 3; i++) if (medida[i] < medida[ejeEspesor]) ejeEspesor = i

  // Para cada eje de espesor, que ejes del mundo mapean a U y a V en BoxGeometry.
  const mapeo: Record<number, [Eje, Eje]> = { 0: ['z', 'y'], 1: ['x', 'z'], 2: ['x', 'y'] }
  const [ejeU, ejeV] = mapeo[ejeEspesor]
  const dim = (e: Eje) => medida[ejes.indexOf(e)]

  if (grano === ejeV) {
    return { repeticion: [dim(ejeV) / ESCALA_GRANO, dim(ejeU) / ESCALA_GRANO], rotacion: Math.PI / 2 }
  }
  return { repeticion: [dim(ejeU) / ESCALA_GRANO, dim(ejeV) / ESCALA_GRANO], rotacion: 0 }
}

function mapaPara(medida: V3, grano: Eje, intensidad: number, nudos: boolean): THREE.Texture {
  const { repeticion, rotacion } = encuadre(medida, grano)
  const rx = Math.max(0.08, Math.round(repeticion[0] * 20) / 20)
  const ry = Math.max(0.08, Math.round(repeticion[1] * 20) / 20)
  const clave = intensidad.toFixed(1) + (nudos ? 'n' : '') + '|' + rx + '|' + ry + '|' + rotacion.toFixed(2)
  let textura = texturasMapeadas.get(clave)
  if (!textura) {
    textura = granoBase(intensidad, nudos).clone()
    textura.needsUpdate = true
    textura.repeat.set(rx, ry)
    textura.center.set(0.5, 0.5)
    textura.rotation = rotacion
    texturasMapeadas.set(clave, textura)
  }
  return textura
}

export type ClaveMaterial = {
  maderaId: string
  acabadoId: string
  mat: Material
  medida: V3
  grano: Eje
}

/** Si el cliente prueba muchas combinaciones, se libera la memoria de golpe. */
function podar() {
  if (materiales.size < 240) return
  for (const material of materiales.values()) material.dispose()
  materiales.clear()
  if (texturasMapeadas.size > 160) {
    for (const textura of texturasMapeadas.values()) textura.dispose()
    texturasMapeadas.clear()
  }
}

export function materialDe({ maderaId, acabadoId, mat, medida, grano }: ClaveMaterial): THREE.MeshPhysicalMaterial {
  const madera = MADERA_POR_ID.get(maderaId) ?? MADERA_POR_ID.values().next().value!
  const acabado = ACABADO_POR_ID.get(acabadoId) ?? ACABADO_POR_ID.values().next().value!
  // El fondo de fibrofacil se laquea al tono pero se ve mas apagado y sin veta.
  const veta = mat === 'fondo' ? Math.min(madera.veta, 0.25) : madera.veta
  const nudos = mat === 'fondo' ? false : madera.nudos
  const { repeticion, rotacion } = encuadre(medida, grano)
  const rx = Math.max(0.08, Math.round(repeticion[0] * 20) / 20)
  const ry = Math.max(0.08, Math.round(repeticion[1] * 20) / 20)
  const clave = [maderaId, acabadoId, mat, veta.toFixed(1), nudos, rx, ry, rotacion.toFixed(2)].join('|')

  const guardado = materiales.get(clave)
  if (guardado) return guardado

  podar()
  // El color es el del laqueado; la especie solo le corre el tono, porque el
  // pino tira a amarillo y el eucalipto a rosado incluso debajo de la laca.
  const color = new THREE.Color(acabado.color)
  color.setRGB(
    Math.min(1, color.r * madera.tinte[0]),
    Math.min(1, color.g * madera.tinte[1]),
    Math.min(1, color.b * madera.tinte[2]),
  )
  if (mat === 'fondo') color.multiplyScalar(0.82)

  const material = new THREE.MeshPhysicalMaterial({
    color,
    roughness: Math.max(0.06, Math.min(1, acabado.rugosidad)),
    metalness: 0,
    clearcoat: acabado.barniz,
    clearcoatRoughness: 0.25,
    envMapIntensity: 0.5,
  })

  if (veta > 0.02) {
    const mapa = mapaPara(medida, grano, veta, nudos)
    material.map = mapa
    material.bumpMap = mapa
    material.bumpScale = veta * 0.5
    material.roughnessMap = mapa
  }

  materiales.set(clave, material)
  return material
}

const metales = new Map<string, THREE.MeshStandardMaterial>()

export function materialMetal(color: string, metalico: number, rugosidad: number): THREE.MeshStandardMaterial {
  const clave = color + '|' + metalico + '|' + rugosidad
  let material = metales.get(clave)
  if (!material) {
    material = new THREE.MeshStandardMaterial({
      color: new THREE.Color(color),
      metalness: metalico,
      roughness: rugosidad,
      envMapIntensity: 1.1,
    })
    metales.set(clave, material)
  }
  return material
}
