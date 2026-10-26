import type { PiezaDeLista } from './piezas'

/** Lo que entra en la hoja del pedido. */
export type DatosPdf = {
  contacto: {
    nombre: string
    telefono: string
    email: string
    localidad: string
    plazo: string
    comentarios: string
  }
  /** El mueble en texto, tal como lo arma resumenDelPedido(). */
  resumen: Record<string, string>
  /** Lista de corte. Si viene vacia, la hoja no lleva despiece. */
  piezas: PiezaDeLista[]
  /** PNG del visor, en data URL. */
  miniatura?: string
  /** Link que reabre el diseño exacto. */
  enlace: string
  /** Numero de pedido, cuando el servidor ya lo asigno. */
  referencia?: string
  marca: { nombre: string; bajada: string; sitio: string; instagram: string; zona: string }
}

/** Medidas de la hoja, en milimetros. */
const HOJA = { ancho: 210, alto: 297, margen: 18 }
const UTIL = HOJA.ancho - HOJA.margen * 2
/** Linea de base del pie, y hasta donde puede bajar el contenido sin pisarlo. */
const PIE = HOJA.alto - 12
const LIMITE = PIE - 12

const TINTA: [number, number, number] = [21, 22, 22]
const GRIS: [number, number, number] = [115, 119, 124]
const LINEA: [number, number, number] = [214, 215, 216]

/**
 * Hoja de pedido en PDF: el logo, el mueble que armo el cliente y sus datos.
 *
 * El logo se dibuja con texto, no con una imagen: Times es la serif que ya
 * figura como alternativa de Unna en la hoja de estilos, asi que la hoja sale
 * con la misma cara aunque no se embeba ninguna tipografia.
 *
 * jsPDF se carga a demanda. Son unos 300 kB que solo hacen falta cuando
 * alguien manda el pedido, y no tienen por que viajar en la carga inicial.
 */
export async function armarPdf(datos: DatosPdf): Promise<{ blob: Blob; base64: string; nombre: string }> {
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF({ unit: 'mm', format: 'a4', compress: true })

  let y = HOJA.margen

  const texto = (
    valor: string,
    x: number,
    yy: number,
    opciones: { tam?: number; color?: [number, number, number]; fuente?: string; estilo?: string; espaciado?: number } = {},
  ) => {
    doc.setFont(opciones.fuente ?? 'helvetica', opciones.estilo ?? 'normal')
    doc.setFontSize(opciones.tam ?? 10)
    doc.setTextColor(...(opciones.color ?? TINTA))
    doc.setCharSpace(opciones.espaciado ?? 0)
    doc.text(valor, x, yy)
    doc.setCharSpace(0)
  }

  const regla = (yy: number) => {
    doc.setDrawColor(...LINEA)
    doc.setLineWidth(0.2)
    doc.line(HOJA.margen, yy, HOJA.margen + UTIL, yy)
  }

  /** Salta de hoja si lo que viene no entra, y repite el margen de arriba. */
  const sitio = (alto: number) => {
    if (y + alto > LIMITE) {
      doc.addPage()
      y = HOJA.margen
    }
  }

  // --- Encabezado: el mismo lockup que la barra de arriba ---
  texto(datos.marca.nombre, HOJA.margen, y + 6, { fuente: 'times', tam: 19, espaciado: 0.5 })
  texto(datos.marca.bajada.toUpperCase(), HOJA.margen, y + 11, { tam: 6.5, color: GRIS, espaciado: 0.35 })

  const derecha = HOJA.margen + UTIL
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(6.5)
  doc.setTextColor(...GRIS)
  doc.setCharSpace(0.35)
  doc.text('PEDIDO DE PRESUPUESTO', derecha, y + 4, { align: 'right' })
  doc.setCharSpace(0)
  const fecha = new Date().toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })
  doc.setFontSize(9)
  doc.setTextColor(...TINTA)
  doc.text(datos.referencia ? datos.referencia + '   ' + fecha : fecha, derecha, y + 10, { align: 'right' })

  y += 16
  regla(y)
  y += 8

  // --- El mueble, dibujado ---
  if (datos.miniatura) {
    try {
      const props = doc.getImageProperties(datos.miniatura)
      // 56 mm y no mas: el visor devuelve una foto casi cuadrada, y con una mas
      // alta el mueble y los datos entran en la hoja pero el despiece ya no.
      const alto = Math.min(56, (UTIL * props.height) / props.width)
      const ancho = (alto * props.width) / props.height
      doc.addImage(datos.miniatura, 'PNG', HOJA.margen + (UTIL - ancho) / 2, y, ancho, alto)
      y += alto + 8
    } catch {
      // Si la foto del visor no se pudo leer, la hoja sigue sin ella.
    }
  }

  /**
   * Titulo de seccion, en el mismo tono de los titulos del panel. `necesita` es
   * el alto de lo que viene abajo: un titulo solo al pie de la hoja no sirve.
   */
  const seccion = (titulo: string, necesita = 0) => {
    sitio(14 + necesita)
    texto(titulo.toUpperCase(), HOJA.margen, y, { tam: 7, color: GRIS, espaciado: 0.4 })
    y += 4
    regla(y)
    y += 5
  }

  /** Fila de clave y valor, con el valor cortado al ancho util. */
  const fila = (clave: string, valor: string) => {
    const anchoClave = 38
    const lineas = doc.splitTextToSize(valor, UTIL - anchoClave) as string[]
    sitio(lineas.length * 4.6 + 1)
    texto(clave, HOJA.margen, y, { tam: 8.5, color: GRIS })
    lineas.forEach((linea, i) => texto(linea, HOJA.margen + anchoClave, y + i * 4.6, { tam: 9 }))
    y += lineas.length * 4.6 + 1.6
  }

  seccion('El mueble', 14)
  for (const [clave, valor] of Object.entries(datos.resumen)) fila(clave, valor)
  y += 4

  seccion('Datos de contacto', 14)
  fila('Nombre', datos.contacto.nombre)
  fila('Teléfono', datos.contacto.telefono)
  if (datos.contacto.email) fila('Correo', datos.contacto.email)
  fila('Localidad', datos.contacto.localidad)
  fila('Plazo', datos.contacto.plazo)
  if (datos.contacto.comentarios.trim()) fila('Comentarios', datos.contacto.comentarios.trim())
  y += 4

  seccion('Link del diseño', 12)
  const partes = doc.splitTextToSize(datos.enlace, UTIL) as string[]
  sitio(partes.length * 4 + 4)
  partes.forEach((linea, i) => texto(linea, HOJA.margen, y + i * 4, { tam: 7.5, color: GRIS }))
  y += partes.length * 4 + 4
  texto('Abriendo ese link se reabre el mueble exactamente como lo dejó el cliente.', HOJA.margen, y, {
    tam: 8,
    color: GRIS,
  })
  y += 8

  // --- Despiece ---
  if (datos.piezas.length > 0) {
    // Se reserva el encabezado de la tabla mas tres filas: una tabla que arranca
    // con una sola fila al pie de la hoja se lee peor que empezada en la que sigue.
    seccion('Despiece, para cortar', 4 + Math.min(3, datos.piezas.length) * 4.8)
    const cols = [HOJA.margen, HOJA.margen + 14, HOJA.margen + 104]
    texto('CANT.', cols[0], y, { tam: 6.5, color: GRIS, espaciado: 0.3 })
    texto('PIEZA', cols[1], y, { tam: 6.5, color: GRIS, espaciado: 0.3 })
    texto('LARGO x ANCHO x ESPESOR', cols[2], y, { tam: 6.5, color: GRIS, espaciado: 0.3 })
    y += 4
    for (const pieza of datos.piezas) {
      sitio(5)
      texto(String(pieza.cantidad), cols[0], y, { tam: 9 })
      texto(pieza.nombre, cols[1], y, { tam: 9 })
      texto(pieza.largo + ' x ' + pieza.ancho + ' x ' + pieza.espesor + ' mm', cols[2], y, { tam: 9, color: GRIS })
      y += 4.8
    }
  }

  // --- Pie en todas las hojas ---
  const hojas = doc.getNumberOfPages()
  for (let i = 1; i <= hojas; i++) {
    doc.setPage(i)
    regla(PIE - 4)
    // Solo los datos de contacto que esten cargados. En la demo generica no
    // hay ninguno y el pie queda con la numeracion de hoja sola, en vez de con
    // separadores sueltos.
    const contacto = [
      datos.marca.sitio.replace('https://', ''),
      datos.marca.instagram ? '@' + datos.marca.instagram : '',
      datos.marca.zona,
    ].filter(Boolean)
    if (contacto.length > 0) {
      texto(contacto.join('   '), HOJA.margen, PIE, { tam: 7.5, color: GRIS })
    }
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.5)
    doc.setTextColor(...GRIS)
    doc.text(i + ' de ' + hojas, HOJA.margen + UTIL, PIE, { align: 'right' })
  }

  const blob = doc.output('blob') as Blob
  // El data URL viene como "data:application/pdf;filename=...;base64,XXXX".
  const salida = doc.output('datauristring')
  const base64 = salida.slice(salida.indexOf('base64,') + 7)
  const nombre = 'pedido-' + (datos.referencia ?? new Date().toISOString().slice(0, 10)) + '.pdf'
  return { blob, base64, nombre }
}
