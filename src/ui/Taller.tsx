import { Suspense, useMemo, useState } from 'react'
import { ArrowLeft, ArrowRight, ArrowsOutSimple, Check, FloppyDisk, LinkSimple, Stack } from '@phosphor-icons/react'
import { useConfigurador } from '../store/useConfigurador'
import { modeloDe } from '../data/modelos'
import { Visor } from '../three/Visor'
import { tomarFoto } from '../three/captura'
import { enlaceDeDisenio, guardarDisenio } from '../lib/guardado'
import { enNumero } from '../lib/formato'
import { ACENTO_ESCENA, AMBIENTE } from '../lib/tema'
import { PanelEstructura, PanelHerrajes, PanelInterior, PanelMadera, PanelMedidas } from './PanelAjustes'
import { Resumen } from './Resumen'
import { Piezas } from './Piezas'
import { Repaso } from './Repaso'
import { Formulario } from './Formulario'
import { pasosDe, type PasoId } from './pasos'

/** Referencia estable: evita rehacer el resaltado del visor en cada render. */
const VACIO: string[] = []

function Guardar() {
  const config = useConfigurador((s) => s.config)
  const modelo = modeloDe(config.modeloId)
  const [abierto, setAbierto] = useState(false)
  const [nombre, setNombre] = useState('')
  const [guardado, setGuardado] = useState(false)

  if (guardado) {
    return (
      <p className="grupo__nota">
        <Check size={14} aria-hidden="true" /> Guardado en este equipo. Lo vas a encontrar en la portada, en Tus
        diseños.
      </p>
    )
  }

  if (!abierto) {
    return (
      <button
        type="button"
        className="boton boton--linea boton--ancho"
        onClick={() => {
          setNombre(modelo.nombre + ' de ' + config.ancho / 10 + ' cm')
          setAbierto(true)
        }}
      >
        <FloppyDisk size={17} className="icono" aria-hidden="true" />
        Guardar este diseño
      </button>
    )
  }

  return (
    <form
      className="formulario"
      onSubmit={(e) => {
        e.preventDefault()
        guardarDisenio(nombre, config, tomarFoto() ?? undefined)
        setGuardado(true)
      }}
    >
      <label className="campo__etiqueta" htmlFor="nombre-disenio">
        Con qué nombre lo guardamos
      </label>
      <input
        id="nombre-disenio"
        className="entrada"
        value={nombre}
        autoFocus
        onChange={(e) => setNombre(e.target.value)}
      />
      <div className="acciones-fila">
        <button type="submit" className="boton boton--chico">
          Guardar
        </button>
        <button type="button" className="boton boton--texto boton--chico" onClick={() => setAbierto(false)}>
          Cancelar
        </button>
      </div>
    </form>
  )
}

function Compartir() {
  const config = useConfigurador((s) => s.config)
  const [copiado, setCopiado] = useState(false)
  const enlace = useMemo(() => enlaceDeDisenio(config), [config])

  return (
    <button
      type="button"
      className="boton boton--linea boton--ancho"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(enlace)
          setCopiado(true)
          window.setTimeout(() => setCopiado(false), 2600)
        } catch {
          // Sin permiso de portapapeles, el link queda en la barra de direcciones.
          window.location.hash = enlace.slice(enlace.indexOf('#'))
        }
      }}
    >
      {copiado ? (
        <Check size={17} className="icono" aria-hidden="true" />
      ) : (
        <LinkSimple size={17} className="icono" aria-hidden="true" />
      )}
      {copiado ? 'Link copiado' : 'Copiar link del diseño'}
    </button>
  )
}

export function Taller({ tema }: { tema: 'claro' | 'oscuro' }) {
  const config = useConfigurador((s) => s.config)
  const despiece = useConfigurador((s) => s.despiece)
  const computo = useConfigurador((s) => s.computo)
  const abierto = useConfigurador((s) => s.abierto)
  const desarmado = useConfigurador((s) => s.desarmado)
  const piezas = useConfigurador((s) => s.piezas)
  const piezaDestacada = useConfigurador((s) => s.piezaDestacada)
  const alternarApertura = useConfigurador((s) => s.alternarApertura)
  const alternarDesarme = useConfigurador((s) => s.alternarDesarme)
  const destacarDesdeVisor = useConfigurador((s) => s.destacarDesdeVisor)

  const modelo = modeloDe(config.modeloId)
  const pasos = useMemo(() => pasosDe(modelo), [modelo])
  const [pasoId, setPasoId] = useState<PasoId>('medidas')
  // Si el mueble que se abre no tiene el paso guardado, se vuelve al primero.
  const indice = Math.max(
    0,
    pasos.findIndex((p) => p.id === pasoId),
  )
  const paso = pasos[indice]
  const esUltimo = indice === pasos.length - 1

  const tieneFrentes = despiece.cajones.length + despiece.puertas.length > 0
  const filaDestacada = piezas.find((pieza) => pieza.clave === piezaDestacada) ?? null
  const destacados = filaDestacada ? filaDestacada.ids : VACIO
  const etiquetaPieza = filaDestacada
    ? filaDestacada.nombre +
      (filaDestacada.cantidad > 1 ? ' (x' + filaDestacada.cantidad + ')' : '') +
      '  ' +
      filaDestacada.largo +
      ' x ' +
      filaDestacada.ancho +
      ' x ' +
      filaDestacada.espesor +
      ' mm'
    : null

  const irA = (id: PasoId) => {
    setPasoId(id)
    // En celular el panel va debajo del visor: hay que subir al principio.
    document.querySelector('.panel__pasos')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <main className="taller">
      <div className="escena">
        <div className="escena__lienzo">
          <Suspense
            fallback={
              <div className="escena__cargando">
                <span className="esqueleto" aria-hidden="true" />
                <span>Armando el mueble...</span>
              </div>
            }
          >
            <Visor
              despiece={despiece}
              config={config}
              abierto={abierto}
              desarmado={desarmado}
              acento={ACENTO_ESCENA[tema]}
              ambiente={AMBIENTE[tema]}
              destacados={destacados}
              etiqueta={etiquetaPieza}
              alSeñalar={destacarDesdeVisor}
            />
          </Suspense>
        </div>

        <div className="escena__herramientas">
          {tieneFrentes ? (
            <button
              type="button"
              className="boton boton--linea boton--chico"
              aria-pressed={abierto}
              onClick={alternarApertura}
            >
              <ArrowsOutSimple size={15} className="icono" aria-hidden="true" />
              {abierto ? 'Cerrar' : 'Abrir'}
            </button>
          ) : null}
          <button
            type="button"
            className="boton boton--linea boton--chico"
            aria-pressed={desarmado}
            onClick={() => {
              alternarDesarme()
              // Al separar las piezas, el panel va al paso donde esta la lista.
              if (!desarmado) irA('pedido')
            }}
          >
            <Stack size={15} className="icono" aria-hidden="true" />
            {desarmado ? 'Armar' : 'Desarmar'}
          </button>
        </div>

        {filaDestacada ? (
          <p className="escena__dato escena__dato--pieza">
            <span>
              {filaDestacada.nombre}
              {filaDestacada.cantidad > 1 ? ' (x' + filaDestacada.cantidad + ')' : ''}
            </span>
            <span className="num">
              {filaDestacada.largo} x {filaDestacada.ancho} x {filaDestacada.espesor} mm
            </span>
          </p>
        ) : (
          <p className="escena__dato">
            {desarmado ? (
              <>
                <span className="num">{piezas.reduce((t, f) => t + f.cantidad, 0)}</span> piezas
                {' · '}
                tocá una para ver su medida
              </>
            ) : (
              <>
                <span className="num">{enNumero(computo.placaM2)} m2</span> de madera
                {' · '}
                <span className="num">{computo.piezas}</span> piezas
              </>
            )}
          </p>
        )}
      </div>

      <div className="panel">
        <div className="panel__pasos">
          <ol className="pasos" aria-label="Pasos para armar el mueble">
            {pasos.map((p, i) => {
              const estado = i === indice ? 'actual' : i < indice ? 'hecho' : 'pendiente'
              return (
                <li key={p.id}>
                  <button
                    type="button"
                    className="pasos__paso"
                    data-estado={estado}
                    aria-current={i === indice ? 'step' : undefined}
                    onClick={() => irA(p.id)}
                  >
                    <span className="pasos__numero" aria-hidden="true">
                      {i < indice ? <Check size={11} weight="bold" /> : i + 1}
                    </span>
                    <span className="pasos__titulo">{p.titulo}</span>
                  </button>
                </li>
              )
            })}
          </ol>
          <p className="panel__bajada">
            <span className="panel__cuenta num">
              Paso {indice + 1} de {pasos.length}
            </span>
            {paso.bajada}
          </p>
        </div>

        <div className="panel__cuerpo">
          {paso.id === 'medidas' ? <PanelMedidas /> : null}
          {paso.id === 'madera' ? <PanelMadera /> : null}
          {paso.id === 'estructura' ? <PanelEstructura /> : null}
          {paso.id === 'interior' ? (
            <>
              <PanelInterior />
              <PanelHerrajes />
            </>
          ) : null}
          {paso.id === 'pedido' ? (
            <>
              <Repaso alIrAlPaso={irA} />
              <Resumen />
              <details className="plegable">
                <summary className="plegable__titulo">Ver el despiece, pieza por pieza</summary>
                <div className="plegable__cuerpo">
                  <Piezas />
                </div>
              </details>
              <div className="grupo">
                <h3 className="grupo__titulo">Guardar y compartir</h3>
                <Guardar />
                <Compartir />
              </div>
              <div className="grupo">
                <h3 className="grupo__titulo">Pedir el presupuesto</h3>
                <p className="grupo__nota">
                  Mandanos el mueble como lo armaste. Lo miramos en el taller y te contestamos con el precio y el
                  plazo de entrega.
                </p>
                <Formulario />
              </div>
            </>
          ) : null}
        </div>

        <div className="panel__navegacion">
          <button
            type="button"
            className="boton boton--linea"
            disabled={indice === 0}
            onClick={() => irA(pasos[Math.max(0, indice - 1)].id)}
          >
            <ArrowLeft size={16} className="icono" aria-hidden="true" />
            Atras
          </button>
          {!esUltimo ? (
            <button type="button" className="boton" onClick={() => irA(pasos[indice + 1].id)}>
              Seguir con {pasos[indice + 1].titulo.toLowerCase()}
              <ArrowRight size={16} className="icono" aria-hidden="true" />
            </button>
          ) : null}
        </div>
      </div>
    </main>
  )
}
