import { configuracionInicial, MODELO_POR_ID } from '../data/modelos'
import { MARCA } from '../data/marca'
import { normalizarAlturas } from './cajones'
import type { Configuracion } from './tipos'

const CLAVE_DISENIOS = 'ironwoods.disenios.v1'
const CLAVE_BORRADOR = 'ironwoods.borrador.v1'

export type DisenioGuardado = {
  id: string
  nombre: string
  creado: string
  config: Configuracion
  /** PNG en data URL, generado desde el visor 3D. */
  miniatura?: string
}

export type DatosContacto = {
  nombre: string
  telefono: string
  email: string
  localidad: string
  plazo: string
  comentarios: string
}

/** Se re-exporta para no tocar todas las pantallas: los datos viven en marca.ts. */
export const TALLER = MARCA

function esConfiguracion(valor: unknown): valor is Configuracion {
  if (!valor || typeof valor !== 'object') return false
  const c = valor as Partial<Configuracion>
  return (
    typeof c.modeloId === 'string' &&
    MODELO_POR_ID.has(c.modeloId) &&
    typeof c.ancho === 'number' &&
    typeof c.alto === 'number' &&
    typeof c.profundidad === 'number'
  )
}

/** Completa lo que falte con los valores iniciales del modelo, por si cambio el catalogo. */
export function sanear(valor: unknown): Configuracion | null {
  if (!esConfiguracion(valor)) return null
  const base = configuracionInicial(valor.modeloId)
  const unido: Configuracion = { ...base, ...valor, modeloId: valor.modeloId }
  return { ...unido, alturasCajones: normalizarAlturas(unido) }
}

function aBase64Url(texto: string): string {
  const bytes = new TextEncoder().encode(texto)
  let binario = ''
  bytes.forEach((b) => {
    binario += String.fromCharCode(b)
  })
  return btoa(binario).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function deBase64Url(texto: string): string {
  const normalizado = texto.replace(/-/g, '+').replace(/_/g, '/')
  const relleno = normalizado + '='.repeat((4 - (normalizado.length % 4)) % 4)
  const binario = atob(relleno)
  const bytes = Uint8Array.from(binario, (ch) => ch.charCodeAt(0))
  return new TextDecoder().decode(bytes)
}

export function codificar(config: Configuracion): string {
  return aBase64Url(JSON.stringify(config))
}

export function decodificar(codigo: string): Configuracion | null {
  try {
    return sanear(JSON.parse(deBase64Url(codigo)))
  } catch {
    return null
  }
}

/** Link para compartir el diseño tal como esta. */
export function enlaceDeDisenio(config: Configuracion): string {
  const { origin, pathname } = window.location
  return origin + pathname + '#/d/' + codificar(config)
}

function leer<T>(clave: string, porDefecto: T): T {
  try {
    const crudo = window.localStorage.getItem(clave)
    return crudo ? (JSON.parse(crudo) as T) : porDefecto
  } catch {
    return porDefecto
  }
}

function escribir(clave: string, valor: unknown): boolean {
  try {
    window.localStorage.setItem(clave, JSON.stringify(valor))
    return true
  } catch {
    // Navegacion privada o almacenamiento lleno: el diseño sigue vivo en memoria.
    return false
  }
}

export function guardarBorrador(config: Configuracion): void {
  escribir(CLAVE_BORRADOR, config)
}

export function leerBorrador(): Configuracion | null {
  return sanear(leer<unknown>(CLAVE_BORRADOR, null))
}

export function listarDisenios(): DisenioGuardado[] {
  return leer<DisenioGuardado[]>(CLAVE_DISENIOS, [])
    .map((d) => {
      const config = sanear(d.config)
      return config ? { ...d, config } : null
    })
    .filter((d): d is DisenioGuardado => d !== null)
}

export function guardarDisenio(nombre: string, config: Configuracion, miniatura?: string): DisenioGuardado[] {
  const disenio: DisenioGuardado = {
    id: 'd' + Date.now().toString(36),
    nombre: nombre.trim() || 'Diseño sin nombre',
    creado: new Date().toISOString(),
    config,
    miniatura,
  }
  // Se guardan los ultimos doce para no llenar el almacenamiento con miniaturas.
  const lista = [disenio, ...listarDisenios()].slice(0, 12)
  if (!escribir(CLAVE_DISENIOS, lista)) {
    // Si no entro con miniatura, se reintenta sin ella antes de darlo por perdido.
    const liviana = lista.map((d) => ({ ...d, miniatura: undefined }))
    escribir(CLAVE_DISENIOS, liviana)
    return liviana
  }
  return lista
}

export function borrarDisenio(id: string): DisenioGuardado[] {
  const lista = listarDisenios().filter((d) => d.id !== id)
  escribir(CLAVE_DISENIOS, lista)
  return lista
}

export type Pedido = {
  contacto: DatosContacto
  config: Configuracion
  resumen: Record<string, string | number>
  miniatura?: string
  enlace: string
}

export type ResultadoEnvio =
  | { estado: 'enviado'; referencia: string }
  | { estado: 'local'; motivo: string; archivo: string }

/**
 * Manda el pedido al taller. Si el endpoint PHP no esta disponible (por ejemplo
 * en el servidor de desarrollo de Vite), el pedido no se pierde: se deja un
 * archivo descargable y se ofrece el envio por WhatsApp.
 */
export async function enviarPedido(pedido: Pedido): Promise<ResultadoEnvio> {
  const cuerpo = JSON.stringify(pedido)
  try {
    const respuesta = await fetch('api/presupuesto.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: cuerpo,
    })
    const tipo = respuesta.headers.get('content-type') ?? ''
    if (respuesta.ok && tipo.includes('application/json')) {
      const datos = (await respuesta.json()) as { ok?: boolean; referencia?: string; error?: string }
      if (datos.ok && datos.referencia) return { estado: 'enviado', referencia: datos.referencia }
      throw new Error(datos.error ?? 'El servidor no confirmo el pedido.')
    }
    throw new Error('El servidor respondio ' + respuesta.status + '.')
  } catch (error) {
    const nombreArchivo = 'pedido-' + pedido.config.modeloId + '-' + Date.now().toString(36) + '.json'
    descargar(nombreArchivo, cuerpo, 'application/json')
    return {
      estado: 'local',
      motivo: error instanceof Error ? error.message : 'No se pudo contactar al servidor.',
      archivo: nombreArchivo,
    }
  }
}

export function descargar(nombre: string, contenido: string, tipo: string): void {
  const blob = new Blob([contenido], { type: tipo })
  const url = URL.createObjectURL(blob)
  const ancla = document.createElement('a')
  ancla.href = url
  ancla.download = nombre
  ancla.click()
  URL.revokeObjectURL(url)
}

/** Texto para mandar por WhatsApp cuando el cliente prefiere escribir. */
export function mensajeWhatsapp(pedido: Pick<Pedido, 'resumen' | 'enlace' | 'contacto'>): string {
  const lineas = [
    'Hola! Armé un mueble en la pagina de Ironwoods y quiero presupuestarlo.',
    '',
    ...Object.entries(pedido.resumen).map(([clave, valor]) => clave + ': ' + valor),
    '',
    'Diseño: ' + pedido.enlace,
  ]
  if (pedido.contacto.comentarios.trim()) lineas.push('', 'Nota: ' + pedido.contacto.comentarios.trim())
  return lineas.join('\n')
}

export function enlaceWhatsapp(texto: string): string {
  return 'https://wa.me/' + TALLER.whatsapp + '?text=' + encodeURIComponent(texto)
}
