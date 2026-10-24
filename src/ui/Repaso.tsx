import { PencilSimple } from '@phosphor-icons/react'
import { useConfigurador } from '../store/useConfigurador'
import { modeloDe } from '../data/modelos'
import { MADERA_POR_ID, ACABADO_POR_ID } from '../data/maderas'
import { ESTRUCTURA_POR_ID, PATA_POR_ID } from '../data/marca'
import { BASE_POR_ID, HERRAJE_POR_ID } from '../data/herrajes'
import { medidaCorta } from '../lib/formato'
import type { PasoId } from './pasos'

type Fila = { clave: string; valor: string; paso: PasoId }

/**
 * Repaso de lo elegido, al final del asistente.
 *
 * Cada linea vuelve al paso donde se decidio. Sin esto, corregir una medida en
 * el ultimo momento obliga a buscar en que paso estaba, que es justo lo que
 * hace sentir laberintico a un configurador.
 */
export function Repaso({ alIrAlPaso }: { alIrAlPaso: (paso: PasoId) => void }) {
  const config = useConfigurador((s) => s.config)
  const despiece = useConfigurador((s) => s.despiece)
  const modelo = modeloDe(config.modeloId)

  const filas: Fila[] = [
    {
      clave: 'Medidas',
      valor:
        medidaCorta(config.ancho) +
        ' x ' +
        medidaCorta(config.alto) +
        ' x ' +
        medidaCorta(config.profundidad) +
        ' cm',
      paso: 'medidas',
    },
    { clave: 'Espesor', valor: config.espesor + ' mm', paso: 'medidas' },
    {
      clave: 'Madera',
      valor: (MADERA_POR_ID.get(config.maderaId)?.nombre ?? '') + ', ' + (ACABADO_POR_ID.get(config.acabadoId)?.nombre ?? ''),
      paso: 'madera',
    },
    {
      clave: 'Hierro',
      valor: ESTRUCTURA_POR_ID.get(config.estructuraId)?.nombre ?? '',
      paso: 'estructura',
    },
  ]

  if (modelo.distribucion === 'escritorio') {
    filas.push({ clave: 'Pata', valor: PATA_POR_ID.get(config.tipoPataId)?.nombre ?? '', paso: 'estructura' })
  } else if (config.baseId !== 'ninguna') {
    filas.push({ clave: 'Base', valor: BASE_POR_ID.get(config.baseId)?.nombre ?? '', paso: 'estructura' })
  }

  if (despiece.cajones.length > 0) {
    const filasCajon = Math.max(1, config.alturasCajones.length)
    const columnas = Math.round(despiece.cajones.length / filasCajon)
    filas.push({
      clave: 'Cajones',
      valor: despiece.cajones.length + (columnas > 1 ? ' (' + filasCajon + ' x ' + columnas + ')' : ''),
      paso: 'interior',
    })
  }
  if (despiece.puertas.length > 0) {
    filas.push({
      clave: 'Puertas',
      valor: despiece.puertas.length + ' ' + (config.tipoPuerta === 'corrediza' ? 'corredizas' : 'batientes'),
      paso: 'interior',
    })
  }
  if (config.cantidadEstantes > 0) {
    filas.push({ clave: 'Estantes', valor: String(config.cantidadEstantes), paso: 'interior' })
  }
  if (config.conEstanteCpu) filas.push({ clave: 'Bandeja CPU', valor: 'si', paso: 'interior' })
  if (despiece.cajones.length + despiece.puertas.length > 0) {
    filas.push({ clave: 'Tirador', valor: HERRAJE_POR_ID.get(config.herrajeId)?.nombre ?? '', paso: 'interior' })
  }

  return (
    <div className="grupo">
      <h3 className="grupo__titulo">Lo que armaste</h3>
      <p className="repaso__mueble">{modelo.nombre}</p>
      <div className="repaso">
        {filas.map((fila) => (
          <div className="repaso__fila" key={fila.clave}>
            <span className="repaso__clave">{fila.clave}</span>
            <span className="repaso__valor">{fila.valor}</span>
            <button
              type="button"
              className="repaso__cambiar"
              onClick={() => alIrAlPaso(fila.paso)}
              aria-label={'Cambiar ' + fila.clave.toLowerCase()}
            >
              <PencilSimple size={13} aria-hidden="true" />
              Cambiar
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
