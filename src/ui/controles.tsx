import { useEffect, useId, useState, type ReactNode } from 'react'
import { Check } from '@phosphor-icons/react'

type PropsCampo = {
  etiqueta: string
  ayuda?: string
  error?: string
  extra?: ReactNode
  children: ReactNode
  /** Id del control, para que la etiqueta lo apunte. */
  para?: string
}

/** Etiqueta arriba, control, ayuda o error abajo. Siempre en ese orden. */
export function Campo({ etiqueta, ayuda, error, extra, children, para }: PropsCampo) {
  return (
    <div className="campo">
      <div className="campo__etiqueta">
        {para ? <label htmlFor={para}>{etiqueta}</label> : <span>{etiqueta}</span>}
        {extra}
      </div>
      {children}
      {error ? (
        <p className="campo__error" role="alert">
          {error}
        </p>
      ) : ayuda ? (
        <p className="campo__ayuda">{ayuda}</p>
      ) : null}
    </div>
  )
}

type PropsMedida = {
  etiqueta: string
  /** Valor en milimetros. */
  valor: number
  min: number
  max: number
  paso: number
  ayuda?: string
  alCambiar: (mm: number) => void
}

/**
 * Medida en centimetros, que es como se habla de muebles, pero guardada en
 * milimetros. La barra sirve para explorar y el campo para escribir la medida
 * exacta que el cliente ya tiene del lugar.
 */
export function Medida({ etiqueta, valor, min, max, paso, ayuda, alCambiar }: PropsMedida) {
  const id = useId()
  const [texto, setTexto] = useState(() => (valor / 10).toString())

  useEffect(() => {
    setTexto((valor / 10).toString())
  }, [valor])

  const limitar = (mm: number) => Math.max(min, Math.min(max, Math.round(mm)))

  return (
    <Campo
      etiqueta={etiqueta}
      ayuda={ayuda ?? 'Entre ' + min / 10 + ' y ' + max / 10 + ' cm'}
      para={id}
      extra={<span className="campo__ayuda num">{(valor / 10).toFixed(valor % 10 === 0 ? 0 : 1)} cm</span>}
    >
      <div className="medida">
        <input
          className="medida__rango"
          type="range"
          min={min}
          max={max}
          step={paso}
          value={valor}
          aria-label={etiqueta + ' en milimetros'}
          onChange={(e) => alCambiar(limitar(Number(e.target.value)))}
        />
        <div className="medida__caja">
          <input
            id={id}
            className="medida__numero"
            type="number"
            inputMode="decimal"
            min={min / 10}
            max={max / 10}
            step={paso / 10}
            value={texto}
            onChange={(e) => {
              setTexto(e.target.value)
              const cm = Number(e.target.value)
              if (e.target.value !== '' && Number.isFinite(cm)) alCambiar(limitar(cm * 10))
            }}
            onBlur={() => {
              const cm = Number(texto)
              const mm = Number.isFinite(cm) && texto !== '' ? limitar(cm * 10) : valor
              alCambiar(mm)
              setTexto((mm / 10).toString())
            }}
          />
          <span className="medida__unidad">cm</span>
        </div>
      </div>
    </Campo>
  )
}

type Opcion<T> = { valor: T; titulo: string; nota?: string }

export function Segmentado<T extends string | number>({
  etiqueta,
  opciones,
  valor,
  ayuda,
  alElegir,
}: {
  etiqueta: string
  opciones: { valor: T; titulo: string }[]
  valor: T
  ayuda?: string
  alElegir: (valor: T) => void
}) {
  return (
    <Campo etiqueta={etiqueta} ayuda={ayuda}>
      <div className="segmentado" role="group" aria-label={etiqueta}>
        {opciones.map((opcion) => (
          <button
            key={String(opcion.valor)}
            type="button"
            className="segmentado__opcion"
            aria-pressed={opcion.valor === valor}
            onClick={() => alElegir(opcion.valor)}
          >
            {opcion.titulo}
          </button>
        ))}
      </div>
    </Campo>
  )
}

export function ListaOpciones<T extends string>({
  etiqueta,
  opciones,
  valor,
  ayuda,
  alElegir,
}: {
  etiqueta: string
  opciones: Opcion<T>[]
  valor: T
  ayuda?: string
  alElegir: (valor: T) => void
}) {
  return (
    <Campo etiqueta={etiqueta} ayuda={ayuda}>
      <div className="lista-opciones" role="group" aria-label={etiqueta}>
        {opciones.map((opcion) => {
          const elegida = opcion.valor === valor
          return (
            <button
              key={opcion.valor}
              type="button"
              className="opcion"
              aria-pressed={elegida}
              onClick={() => alElegir(opcion.valor)}
            >
              <span className="opcion__marca" aria-hidden="true">
                {elegida ? <Check size={11} weight="bold" /> : null}
              </span>
              <span className="opcion__cuerpo">
                <span className="opcion__titulo">{opcion.titulo}</span>
                {opcion.nota ? <span className="opcion__nota">{opcion.nota}</span> : null}
              </span>
            </button>
          )
        })}
      </div>
    </Campo>
  )
}

export function Muestrario({
  etiqueta,
  ayuda,
  opciones,
  valor,
  alElegir,
}: {
  etiqueta: string
  ayuda?: string
  opciones: { id: string; nombre: string; color: string; nota: string }[]
  valor: string
  alElegir: (id: string) => void
}) {
  return (
    <Campo etiqueta={etiqueta} ayuda={ayuda}>
      <div className="muestrario" role="group" aria-label={etiqueta}>
        {opciones.map((opcion) => (
          <button
            key={opcion.id}
            type="button"
            className="muestra"
            aria-pressed={opcion.id === valor}
            title={opcion.nota}
            onClick={() => alElegir(opcion.id)}
          >
            <span className="muestra__color" style={{ backgroundColor: opcion.color }} aria-hidden="true" />
            <span className="muestra__nombre">{opcion.nombre}</span>
          </button>
        ))}
      </div>
    </Campo>
  )
}

export function Interruptor({
  etiqueta,
  nota,
  activo,
  alCambiar,
}: {
  etiqueta: string
  nota?: string
  activo: boolean
  alCambiar: (activo: boolean) => void
}) {
  return (
    <button type="button" className="interruptor" role="switch" aria-checked={activo} onClick={() => alCambiar(!activo)}>
      <span className="opcion__cuerpo">
        <span className="opcion__titulo">{etiqueta}</span>
        {nota ? <span className="opcion__nota">{nota}</span> : null}
      </span>
      <span className="interruptor__pista" aria-hidden="true">
        <span className="interruptor__perilla" />
      </span>
    </button>
  )
}

export function Dato({ clave, valor }: { clave: string; valor: ReactNode }) {
  return (
    <div className="dato">
      <span className="dato__clave">{clave}</span>
      <span className="dato__valor">{valor}</span>
    </div>
  )
}
