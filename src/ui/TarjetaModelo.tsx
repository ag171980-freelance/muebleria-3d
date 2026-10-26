import { useMemo, useState } from 'react'
import { ArrowRight } from '@phosphor-icons/react'
import { MADERAS, ACABADOS } from '../data/maderas'
import { ESTRUCTURAS } from '../data/marca'
import { MiniVisor } from '../three/MiniVisor'
import type { Configuracion, Modelo } from '../lib/tipos'

type Props = {
  modelo: Modelo
  fondo: string
  alElegir: (modeloId: string, ajustes: Partial<Configuracion>) => void
}

type Chip = { valor: string; etiqueta: string }

function GrupoChips({
  titulo,
  opciones,
  valor,
  alElegir,
}: {
  titulo: string
  opciones: Chip[]
  valor: string
  alElegir: (valor: string) => void
}) {
  // Con una sola opcion igual se muestra: el chip de medida comunica el tamaño
  // aunque no haya nada que elegir, para que todas las tarjetas midan igual.
  if (opciones.length === 0) return null
  return (
    <div className="chips" role="group" aria-label={titulo}>
      {opciones.map((opcion) => (
        <button
          key={opcion.valor}
          type="button"
          className="chip"
          aria-pressed={opcion.valor === valor}
          onClick={() => alElegir(opcion.valor)}
        >
          {opcion.etiqueta}
        </button>
      ))}
    </div>
  )
}

/**
 * Tarjeta del catalogo, con las opciones que se pueden elegir desde afuera:
 * estructura, madera, medida y laqueado.
 *
 * Lo que se elige acá se ve al toque en la vista previa y viaja al
 * configurador, asi el cliente no tiene que volver a elegir lo mismo adentro.
 */
export function TarjetaModelo({ modelo, fondo, alElegir }: Props) {
  const [estructuraId, setEstructura] = useState(modelo.inicial.estructuraId)
  const [maderaId, setMadera] = useState(modelo.inicial.maderaId)
  const [acabadoId, setAcabado] = useState(modelo.inicial.acabadoId)
  const [medida, setMedida] = useState(() => {
    const porDefecto = modelo.medidas.findIndex((m) => m.ancho === modelo.inicial.ancho)
    return porDefecto >= 0 ? porDefecto : 0
  })

  const elegida = modelo.medidas[medida] ?? modelo.medidas[0]
  const ajustes = useMemo<Partial<Configuracion>>(
    () => ({
      estructuraId,
      maderaId,
      acabadoId,
      ancho: elegida?.ancho ?? modelo.inicial.ancho,
      alto: elegida?.alto ?? modelo.inicial.alto,
      profundidad: elegida?.profundidad ?? modelo.inicial.profundidad,
    }),
    [estructuraId, maderaId, acabadoId, elegida, modelo.inicial],
  )

  const entrar = () => alElegir(modelo.id, ajustes)

  return (
    <article className="tarjeta-modelo">
      <button type="button" className="tarjeta-modelo__vista" onClick={entrar} aria-label={'Armar ' + modelo.nombre}>
        <MiniVisor modeloId={modelo.id} fondo={fondo} ajustes={ajustes} />
      </button>

      <div className="tarjeta-modelo__cuerpo">
        <h3 className="tarjeta-modelo__nombre">
          <button type="button" className="tarjeta-modelo__enlace" onClick={entrar}>
            {modelo.nombre}
          </button>
        </h3>
        <p className="tarjeta-modelo__resumen">{modelo.resumen}</p>

        <div className="tarjeta-modelo__opciones">
          <GrupoChips
            titulo="Color de la estructura"
            valor={estructuraId}
            opciones={ESTRUCTURAS.map((e) => ({ valor: e.id, etiqueta: e.nombre }))}
            alElegir={(v) => setEstructura(v as typeof estructuraId)}
          />
          <GrupoChips
            titulo="Especie de la madera"
            valor={maderaId}
            opciones={MADERAS.map((m) => ({ valor: m.id, etiqueta: m.nombre }))}
            alElegir={setMadera}
          />
          <GrupoChips
            titulo="Medida"
            valor={String(medida)}
            opciones={modelo.medidas.map((m, i) => ({ valor: String(i), etiqueta: m.etiqueta }))}
            alElegir={(v) => setMedida(Number(v))}
          />
          <GrupoChips
            titulo="Laqueado"
            valor={acabadoId}
            opciones={ACABADOS.map((a) => ({ valor: a.id, etiqueta: a.nombre }))}
            alElegir={setAcabado}
          />
        </div>

        <button type="button" className="boton boton--ancho boton--chico" onClick={entrar}>
          Armar a medida
          <ArrowRight size={15} className="icono" aria-hidden="true" />
        </button>
      </div>
    </article>
  )
}
