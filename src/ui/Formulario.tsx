import { useMemo, useState } from 'react'
import { CheckCircle, FilePdf, FloppyDisk, PaperPlaneTilt, WarningCircle, WhatsappLogo } from '@phosphor-icons/react'
import { useConfigurador } from '../store/useConfigurador'
import { resumenDelPedido } from '../lib/resumen'
import { tomarFoto } from '../three/captura'
import {
  PLAZOS,
  descargarBlob,
  enlaceDeDisenio,
  enlaceWhatsapp,
  enviarPedido,
  mensajeWhatsapp,
  type DatosContacto,
  type ResultadoEnvio,
} from '../lib/guardado'
import { Campo } from './controles'

const VACIO: DatosContacto = {
  nombre: '',
  telefono: '',
  email: '',
  localidad: '',
  plazo: 'un-mes',
  comentarios: '',
}

type Errores = Partial<Record<keyof DatosContacto, string>>

function validar(datos: DatosContacto): Errores {
  const errores: Errores = {}
  if (datos.nombre.trim().length < 2) errores.nombre = 'Poné tu nombre para que sepamos a quien escribirle.'

  const soloNumeros = datos.telefono.replace(/[^\d]/g, '')
  if (soloNumeros.length < 8) errores.telefono = 'Necesitamos un telefono con caracteristica, de al menos 8 digitos.'

  if (datos.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(datos.email.trim())) {
    errores.email = 'Revisá el correo: falta el arroba o el punto.'
  }
  if (datos.localidad.trim().length < 2) errores.localidad = 'Decinos la localidad para calcular el envio y el armado.'
  return errores
}

export function Formulario() {
  const config = useConfigurador((s) => s.config)
  const despiece = useConfigurador((s) => s.despiece)
  const computo = useConfigurador((s) => s.computo)
  const piezas = useConfigurador((s) => s.piezas)

  const [datos, setDatos] = useState<DatosContacto>(VACIO)
  const [errores, setErrores] = useState<Errores>({})
  const [enviando, setEnviando] = useState(false)
  const [resultado, setResultado] = useState<ResultadoEnvio | null>(null)
  const [fallo, setFallo] = useState<string | null>(null)

  const resumen = useMemo(() => resumenDelPedido(config, despiece, computo), [config, despiece, computo])
  const enlace = useMemo(() => enlaceDeDisenio(config), [config])

  const campo = (clave: keyof DatosContacto) => ({
    value: datos[clave],
    'aria-invalid': errores[clave] ? ('true' as const) : undefined,
    onChange: (e: { target: { value: string } }) => {
      setDatos((previo) => ({ ...previo, [clave]: e.target.value }))
      if (errores[clave]) setErrores((previo) => ({ ...previo, [clave]: undefined }))
    },
  })

  async function enviar(evento: React.FormEvent) {
    evento.preventDefault()
    const encontrados = validar(datos)
    setErrores(encontrados)
    if (Object.keys(encontrados).length > 0) {
      // El foco va al primer campo con problema, para no obligar a buscarlo.
      const primero = Object.keys(encontrados)[0]
      document.getElementById('contacto-' + primero)?.focus()
      return
    }

    setEnviando(true)
    setFallo(null)
    try {
      const salida = await enviarPedido({
        contacto: datos,
        config,
        resumen,
        piezas,
        miniatura: tomarFoto() ?? undefined,
        enlace,
      })
      setResultado(salida)
    } catch (error) {
      setFallo(error instanceof Error ? error.message : 'No pudimos registrar el pedido. Probá de nuevo.')
    } finally {
      setEnviando(false)
    }
  }

  if (resultado) {
    const texto = mensajeWhatsapp({ resumen, enlace, contacto: datos })
    const hoja = resultado.pdf
    const botonPdf = hoja ? (
      <button type="button" className="boton boton--linea" onClick={() => descargarBlob(hoja.blob, hoja.nombre)}>
        <FilePdf size={17} className="icono" aria-hidden="true" />
        Descargar el PDF
      </button>
    ) : null
    return (
      <div className={'resultado' + (resultado.estado === 'enviado' ? ' resultado--ok' : '')}>
        <p className="resultado__titulo">
          {resultado.estado === 'enviado' ? (
            <CheckCircle size={20} weight="fill" aria-hidden="true" />
          ) : (
            <FloppyDisk size={20} aria-hidden="true" />
          )}
          {resultado.estado === 'enviado' ? 'Pedido recibido' : 'Pedido guardado en tu equipo'}
        </p>

        {resultado.estado === 'enviado' ? (
          <>
            <p className="resultado__texto">
              Lo tenemos con el numero <span className="referencia">{resultado.referencia}</span>. Te escribimos al{' '}
              {datos.telefono} dentro de las proximas 48 horas hábiles con el presupuesto cerrado.
              {hoja ? ' Si querés guardar una copia, bajate la hoja del pedido.' : null}
            </p>
            <div className="acciones-fila">
              <a className="boton boton--linea" href={enlaceWhatsapp(texto)} target="_blank" rel="noreferrer">
                <WhatsappLogo size={17} className="icono" aria-hidden="true" />
                Avisar por WhatsApp
              </a>
              {botonPdf}
            </div>
          </>
        ) : (
          <>
            <p className="resultado__texto">
              No pudimos contactar al servidor del taller ({resultado.motivo}) asi que te descargamos{' '}
              <span className="referencia">{resultado.archivo}</span> con todo el detalle: el mueble, tus datos y el
              despiece. Mandanoslo por WhatsApp y seguimos desde ahi.
            </p>
            <div className="acciones-fila">
              <a className="boton" href={enlaceWhatsapp(texto)} target="_blank" rel="noreferrer">
                <WhatsappLogo size={17} className="icono" aria-hidden="true" />
                Enviar por WhatsApp
              </a>
              {botonPdf}
            </div>
          </>
        )}
      </div>
    )
  }

  return (
    <form className="formulario" onSubmit={enviar} noValidate>
      <div className="formulario__par">
        <Campo etiqueta="Nombre y apellido" error={errores.nombre} para="contacto-nombre">
          <input
            id="contacto-nombre"
            className="entrada"
            autoComplete="name"
            placeholder="Como te presentas"
            {...campo('nombre')}
          />
        </Campo>
        <Campo
          etiqueta="Telefono o WhatsApp"
          ayuda="Con caracteristica, sin el 15."
          error={errores.telefono}
          para="contacto-telefono"
        >
          <input
            id="contacto-telefono"
            className="entrada"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="11 2847 0193"
            {...campo('telefono')}
          />
        </Campo>
      </div>

      <div className="formulario__par">
        <Campo etiqueta="Correo (opcional)" error={errores.email} para="contacto-email">
          <input
            id="contacto-email"
            className="entrada"
            type="email"
            autoComplete="email"
            placeholder="para mandarte el plano"
            {...campo('email')}
          />
        </Campo>
        <Campo
          etiqueta="Localidad"
          ayuda="Entregamos y armamos en zona sur y CABA."
          error={errores.localidad}
          para="contacto-localidad"
        >
          <input
            id="contacto-localidad"
            className="entrada"
            autoComplete="address-level2"
            placeholder="Lanus, Quilmes, Caballito"
            {...campo('localidad')}
          />
        </Campo>
      </div>

      <Campo etiqueta="Para cuando lo necesitas" para="contacto-plazo">
        <select id="contacto-plazo" className="lista" {...campo('plazo')}>
          {PLAZOS.map((plazo) => (
            <option key={plazo.valor} value={plazo.valor}>
              {plazo.titulo}
            </option>
          ))}
        </select>
      </Campo>

      <Campo
        etiqueta="Algo mas que tengamos que saber"
        ayuda="Por ejemplo: va en un hueco de medida fija, hay una canilla al medio, el pasillo es angosto."
        para="contacto-comentarios"
      >
        <textarea
          id="contacto-comentarios"
          className="area"
          placeholder="Contanos del lugar donde va"
          {...campo('comentarios')}
        />
      </Campo>

      {fallo ? (
        <p className="aviso" role="alert">
          <WarningCircle size={17} className="aviso__icono" aria-hidden="true" />
          <span>{fallo}</span>
        </p>
      ) : null}

      <button type="submit" className="boton boton--ancho" disabled={enviando}>
        <PaperPlaneTilt size={17} className="icono" aria-hidden="true" />
        {enviando ? 'Enviando el pedido...' : 'Enviar el pedido'}
      </button>

      <p className="grupo__nota">
        Armamos una hoja en PDF con el mueble, el dibujo y tus datos, y te la damos para descargar. Nada mas.
      </p>
    </form>
  )
}
