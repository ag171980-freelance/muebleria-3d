import { configuracionInicial, MODELO_POR_ID } from '../data/modelos'
import { MARCA } from '../data/marca'
import { normalizarAlturas } from './cajones'
import type { PiezaDeLista } from './piezas'
import type { Configuracion } from './tipos'

const CLAVE_DISENIOS = 'configurador.disenios.v1'
const CLAVE_BORRADOR = 'configurador.borrador.v1'

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

/**
 * Los plazos viven aca y no en el formulario porque el valor corto es lo que
 * viaja en el pedido, y el texto largo es lo que tiene que leer el carpintero
 * en la hoja impresa.
 */
export const PLAZOS = [
  { valor: 'cuanto-antes', titulo: 'Lo antes posible' },
  { valor: 'un-mes', titulo: 'Dentro del mes' },
  { valor: 'dos-tres-meses', titulo: 'En dos o tres meses' },
  { valor: 'solo-precio', titulo: 'Por ahora solo quiero el precio' },
] as const

export function etiquetaDePlazo(valor: string): string {
  return PLAZOS.find((p) => p.valor === valor)?.titulo ?? valor
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
  resumen: Record<string, string>
  /** Lista de corte, para que la hoja impresa sirva en el taller. */
  piezas: PiezaDeLista[]
  miniatura?: string
  enlace: string
}

/** La hoja del pedido ya armada, para descargarla desde la pantalla de gracias. */
export type HojaPdf = { blob: Blob; nombre: string }

export type ResultadoEnvio =
  | { estado: 'enviado'; referencia: string; pdf: HojaPdf | null }
  | { estado: 'local'; motivo: string; archivo: string; pdf: HojaPdf | null }

/**
 * Arma la hoja del pedido en PDF. Si algo falla (el navegador sin memoria, la
 * carga de jsPDF cortada) devuelve null: el pedido se manda igual, lo que no
 * puede pasar es que el cliente pierda el envio por un problema de impresion.
 */
async function hojaDelPedido(pedido: Pedido, referencia?: string): Promise<(HojaPdf & { base64: string }) | null> {
  try {
    const { armarPdf } = await import('./pdf')
    return await armarPdf({
      contacto: { ...pedido.contacto, plazo: etiquetaDePlazo(pedido.contacto.plazo) },
      resumen: pedido.resumen,
      piezas: pedido.piezas,
      miniatura: pedido.miniatura,
      enlace: pedido.enlace,
      referencia,
      marca: MARCA,
    })
  } catch {
    return null
  }
}

/**
 * Deja la hoja junto al pedido, en api/data/pedidos/<referencia>.pdf.
 *
 * Va en un segundo pedido y no en el primero a proposito: el numero de pedido
 * lo asigna el servidor, asi que recien despues de su respuesta se puede
 * imprimir en la hoja. Si este paso falla el taller igual tiene todo en el
 * JSON, y el cliente se queda con el PDF descargado.
 */
async function dejarPdfEnElTaller(referencia: string, base64: string): Promise<void> {
  try {
    await fetch('api/presupuesto.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accion: 'pdf', referencia, pdf: base64 }),
    })
  } catch {
    // Sin conexion no hay nada que hacer, y el pedido ya quedo registrado.
  }
}

/**
 * Manda el pedido al taller. Si el endpoint PHP no esta disponible (por ejemplo
 * en el servidor de desarrollo de Vite), el pedido no se pierde: se descarga la
 * hoja en PDF y se ofrece el envio por WhatsApp.
 */
export async function enviarPedido(pedido: Pedido): Promise<ResultadoEnvio> {
  try {
    const respuesta = await fetch('api/presupuesto.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(pedido),
    })
    const tipo = respuesta.headers.get('content-type') ?? ''
    if (respuesta.ok && tipo.includes('application/json')) {
      const datos = (await respuesta.json()) as { ok?: boolean; referencia?: string; error?: string }
      if (datos.ok && datos.referencia) {
        const hoja = await hojaDelPedido(pedido, datos.referencia)
        if (hoja) await dejarPdfEnElTaller(datos.referencia, hoja.base64)
        return { estado: 'enviado', referencia: datos.referencia, pdf: hoja }
      }
      throw new Error(datos.error ?? 'El servidor no confirmo el pedido.')
    }
    throw new Error('El servidor respondio ' + respuesta.status + '.')
  } catch (error) {
    const motivo = error instanceof Error ? error.message : 'No se pudo contactar al servidor.'
    const hoja = await hojaDelPedido(pedido)
    if (hoja) {
      descargarBlob(hoja.blob, hoja.nombre)
      return { estado: 'local', motivo, archivo: hoja.nombre, pdf: hoja }
    }
    // Ultimo recurso: el pedido crudo, que el taller puede volver a abrir.
    const nombreArchivo = 'pedido-' + pedido.config.modeloId + '-' + Date.now().toString(36) + '.json'
    descargar(nombreArchivo, JSON.stringify(pedido), 'application/json')
    return { estado: 'local', motivo, archivo: nombreArchivo, pdf: null }
  }
}

export function descargarBlob(blob: Blob, nombre: string): void {
  const url = URL.createObjectURL(blob)
  const ancla = document.createElement('a')
  ancla.href = url
  ancla.download = nombre
  // Firefox ignora el click si el enlace no esta en el documento.
  ancla.style.display = 'none'
  document.body.append(ancla)
  ancla.click()
  ancla.remove()
  // El click ya abrio la descarga; se libera en el siguiente turno para que
  // Firefox llegue a leer el blob antes de que desaparezca.
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function descargar(nombre: string, contenido: string, tipo: string): void {
  descargarBlob(new Blob([contenido], { type: tipo }), nombre)
}

/** Texto para mandar por WhatsApp cuando el cliente prefiere escribir. */
export function mensajeWhatsapp(pedido: Pick<Pedido, 'resumen' | 'enlace' | 'contacto'>): string {
  const lineas = [
    'Hola! Armé un mueble en el configurador y quiero presupuestarlo.',
    '',
    ...Object.entries(pedido.resumen).map(([clave, valor]) => clave + ': ' + valor),
    '',
    'Diseño: ' + pedido.enlace,
  ]
  if (pedido.contacto.comentarios.trim()) lineas.push('', 'Nota: ' + pedido.contacto.comentarios.trim())
  return lineas.join('\n')
}

/**
 * Sin numero cargado, wa.me abre WhatsApp con el mensaje ya escrito y deja
 * elegir a quien mandarselo. Es el modo que documenta WhatsApp para compartir
 * texto suelto, asi que la demo muestra el circuito entero sin mandarle la
 * consulta al telefono de un tercero.
 */
export function enlaceWhatsapp(texto: string): string {
  return 'https://wa.me/' + TALLER.whatsapp + '?text=' + encodeURIComponent(texto)
}
