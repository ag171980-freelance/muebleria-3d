import { ArrowLeft, Moon, Sun } from '@phosphor-icons/react'
import { useConfigurador } from '../store/useConfigurador'
import { modeloDe } from '../data/modelos'
import { TALLER } from '../lib/guardado'
import { medidaCorta } from '../lib/formato'
import type { Tema } from '../lib/tema'

type Props = {
  tema: Tema
  resuelto: 'claro' | 'oscuro'
  alternarTema: () => void
}

export function Encabezado({ resuelto, alternarTema }: Props) {
  const vista = useConfigurador((s) => s.vista)
  const config = useConfigurador((s) => s.config)
  const verCatalogo = useConfigurador((s) => s.verCatalogo)
  const modelo = modeloDe(config.modeloId)

  return (
    <header className="barra">
      {/*
        El mismo lockup del encabezado del sitio: el nombre en la serif de la
        marca y la bajada abajo, chica y espaciada. Se rehace con texto y no con
        el PNG del logo porque asi se adapta al modo oscuro y no se pixela.
      */}
      <button type="button" className="marca" onClick={verCatalogo}>
        <span className="marca__nombre">{TALLER.nombre}</span>
        <span className="marca__bajada">{TALLER.bajada}</span>
      </button>

      <span className="barra__espacio" />

      {vista === 'taller' ? (
        <>
          <span className="barra__paso">
            {modelo.nombre}
            {', '}
            <span className="num">
              {medidaCorta(config.ancho)} x {medidaCorta(config.alto)} x {medidaCorta(config.profundidad)} cm
            </span>
          </span>
          <button type="button" className="boton boton--linea boton--chico" onClick={verCatalogo}>
            <ArrowLeft size={15} className="icono" aria-hidden="true" />
            Otro mueble
          </button>
        </>
      ) : null}

      <button
        type="button"
        className="boton boton--texto boton--chico"
        onClick={alternarTema}
        aria-label={resuelto === 'oscuro' ? 'Pasar a modo claro' : 'Pasar a modo oscuro'}
      >
        {resuelto === 'oscuro' ? <Sun size={17} aria-hidden="true" /> : <Moon size={17} aria-hidden="true" />}
      </button>
    </header>
  )
}
