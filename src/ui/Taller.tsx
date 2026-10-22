import { Suspense, useMemo, useState } from 'react'
import { ArrowsOutSimple, Check, FloppyDisk, LinkSimple, Package, Stack } from '@phosphor-icons/react'
import { useConfigurador } from '../store/useConfigurador'
import { modeloDe } from '../data/modelos'
import { Visor } from '../three/Visor'
import { tomarFoto } from '../three/captura'
import { enlaceDeDisenio, guardarDisenio } from '../lib/guardado'
import { enNumero } from '../lib/formato'
import { ACENTO_ESCENA, FONDO_ESCENA } from '../lib/tema'
import { PanelHerrajes, PanelInterior, PanelMaterial, PanelMedidas, type Pestania } from './PanelAjustes'
import { Resumen } from './Resumen'
import { Piezas } from './Piezas'
import { Formulario } from './Formulario'

const PESTANIAS: { id: Pestania; titulo: string }[] = [
  { id: 'medidas', titulo: 'Medidas' },
  { id: 'material', titulo: 'Material' },
  { id: 'interior', titulo: 'Interior' },
  { id: 'piezas', titulo: 'Piezas' },
  { id: 'presupuesto', titulo: 'Presupuesto' },
]

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
      {copiado ? <Check size={17} className="icono" aria-hidden="true" /> : <LinkSimple size={17} className="icono" aria-hidden="true" />}
      {copiado ? 'Link copiado' : 'Copiar link del diseño'}
    </button>
  )
}

/** Referencia estable: evita rehacer el resaltado del visor en cada render. */
const VACIO: string[] = []

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
  const [pestania, setPestania] = useState<Pestania>('medidas')
  const modelo = modeloDe(config.modeloId)
  const tieneFrentes = despiece.cajones.length + despiece.puertas.length > 0
  const filaDestacada = piezas.find((pieza) => pieza.clave === piezaDestacada) ?? null
  const destacados = filaDestacada ? filaDestacada.ids : VACIO

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
              fondo={FONDO_ESCENA[tema]}
              acento={ACENTO_ESCENA[tema]}
              destacados={destacados}
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
              // Al separar las piezas, el panel pasa a la lista con las medidas de cada una.
              if (!desarmado) setPestania('piezas')
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
                <span className="num">{enNumero(computo.placaM2)} m2</span> de placa
                {' · '}
                <span className="num">{computo.piezas}</span> piezas
              </>
            )}
          </p>
        )}
      </div>

      <div className="panel">
        <div className="panel__pestanias" role="tablist" aria-label="Ajustes del mueble">
          {PESTANIAS.map((p) => (
            <button
              key={p.id}
              type="button"
              className="pestania"
              role="tab"
              aria-selected={pestania === p.id}
              onClick={() => setPestania(p.id)}
            >
              {p.titulo}
            </button>
          ))}
        </div>

        <div className="panel__cuerpo">
          {pestania === 'medidas' ? <PanelMedidas /> : null}
          {pestania === 'material' ? <PanelMaterial /> : null}
          {pestania === 'interior' ? (
            <>
              <PanelInterior />
              <PanelHerrajes />
              {modelo.distribucion === 'mesa' ? (
                <p className="grupo__nota">
                  La mesa no lleva cajones ni herrajes: lo unico que se elige es como apoya y la madera de la tapa.
                </p>
              ) : null}
            </>
          ) : null}
          {pestania === 'piezas' ? <Piezas /> : null}
          {pestania === 'presupuesto' ? (
            <>
              <Resumen />
              <div className="grupo">
                <h3 className="grupo__titulo">Guardar y compartir</h3>
                <Guardar />
                <Compartir />
              </div>
              <div className="grupo">
                <h3 className="grupo__titulo">Pedir el presupuesto</h3>
                <p className="grupo__nota">
                  Mandanos el mueble como lo armaste. Lo miramos en el taller y te contestamos con el precio y
                  el plazo de entrega.
                </p>
                <Formulario />
              </div>
            </>
          ) : null}

          {pestania !== 'presupuesto' ? (
            <button type="button" className="boton boton--ancho" onClick={() => setPestania('presupuesto')}>
              <Package size={17} className="icono" aria-hidden="true" />
              Pedir el presupuesto
            </button>
          ) : null}
        </div>
      </div>
    </main>
  )
}
