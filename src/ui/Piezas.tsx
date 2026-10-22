import { useMemo } from 'react'
import { DownloadSimple, Stack } from '@phosphor-icons/react'
import { useConfigurador } from '../store/useConfigurador'
import { modeloDe } from '../data/modelos'
import { MADERA_POR_ID } from '../data/maderas'
import { nombreDeMaterial } from '../lib/piezas'
import { descargar } from '../lib/guardado'
import { medidaCorta } from '../lib/formato'
import type { PiezaDeLista } from '../lib/piezas'

/** Lista de corte en texto plano, para imprimir o mandar al que hace los cortes. */
function comoCsv(piezas: PiezaDeLista[], titulo: string): string {
  const filas = [
    ['cantidad', 'pieza', 'largo_mm', 'ancho_mm', 'espesor_mm', 'material'],
    ...piezas.map((p) => [
      String(p.cantidad),
      p.nombre,
      String(p.largo),
      String(p.ancho),
      String(p.espesor),
      nombreDeMaterial(p.material),
    ]),
  ]
  return '# ' + titulo + '\n' + filas.map((f) => f.join(';')).join('\n') + '\n'
}

export function Piezas() {
  const config = useConfigurador((s) => s.config)
  const piezas = useConfigurador((s) => s.piezas)
  const desarmado = useConfigurador((s) => s.desarmado)
  const piezaDestacada = useConfigurador((s) => s.piezaDestacada)
  const destacarPieza = useConfigurador((s) => s.destacarPieza)
  const fijarPieza = useConfigurador((s) => s.fijarPieza)
  const piezaFijada = useConfigurador((s) => s.piezaFijada)
  const alternarDesarme = useConfigurador((s) => s.alternarDesarme)

  const modelo = modeloDe(config.modeloId)
  const madera = MADERA_POR_ID.get(config.maderaId)
  const total = useMemo(() => piezas.reduce((suma, p) => suma + p.cantidad, 0), [piezas])

  const titulo = modelo.nombre + ' ' + medidaCorta(config.ancho) + 'x' + medidaCorta(config.alto) + 'x' + medidaCorta(config.profundidad) + ' cm'

  return (
    <>
      <div className="grupo">
        <h3 className="grupo__titulo">Despiece</h3>
        <p className="grupo__nota">
          Las {total} piezas que hay que cortar, agrupadas por medida. Tocá una fila para encontrarla en el visor.
        </p>
        {!desarmado ? (
          <button type="button" className="boton boton--linea boton--ancho" onClick={alternarDesarme}>
            <Stack size={17} className="icono" aria-hidden="true" />
            Ver el mueble desarmado
          </button>
        ) : null}
      </div>

      <div className="grupo">
        {/*
          Lista de botones y no una tabla con roles ARIA: cada fila se puede
          señalar, y aria-pressed no es valido sobre role="row". El encabezado
          queda como guia visual y cada boton lleva su propia etiqueta completa.
        */}
        <div className="tabla-piezas">
          <div className="tabla-piezas__encabezado" aria-hidden="true">
            <span>Pieza</span>
            <span className="tabla-piezas__num">Cant.</span>
            <span className="tabla-piezas__num">Largo x ancho x esp.</span>
          </div>

          {piezas.map((pieza) => {
            const activa = pieza.clave === piezaDestacada || pieza.clave === piezaFijada
            return (
              <button
                key={pieza.clave}
                type="button"
                className={'tabla-piezas__fila' + (activa ? ' tabla-piezas__fila--activa' : '')}
                // aria-pressed habla solo de la fila fijada: señalar al pasar o
                // al enfocar resalta, pero no deja nada apretado.
                aria-pressed={pieza.clave === piezaFijada}
                aria-label={
                  pieza.nombre +
                  ', ' +
                  pieza.cantidad +
                  (pieza.cantidad === 1 ? ' unidad' : ' unidades') +
                  ', ' +
                  pieza.largo +
                  ' por ' +
                  pieza.ancho +
                  ' por ' +
                  pieza.espesor +
                  ' milimetros, en ' +
                  nombreDeMaterial(pieza.material)
                }
                onMouseEnter={() => destacarPieza(pieza.clave)}
                onMouseLeave={() => destacarPieza(null)}
                onFocus={() => destacarPieza(pieza.clave)}
                onBlur={() => destacarPieza(null)}
                onClick={() => fijarPieza(pieza.clave)}
              >
                <span className="tabla-piezas__nombre" aria-hidden="true">
                  {pieza.nombre}
                  <span className="tabla-piezas__material">{nombreDeMaterial(pieza.material)}</span>
                </span>
                <span className="tabla-piezas__num" aria-hidden="true">
                  {pieza.cantidad}
                </span>
                <span className="tabla-piezas__num tabla-piezas__medida" aria-hidden="true">
                  {pieza.largo} x {pieza.ancho} x {pieza.espesor}
                </span>
              </button>
            )
          })}
        </div>
        <p className="grupo__nota">
          Medidas en milimetros, sobre {madera?.nombre.toLowerCase() ?? 'la madera elegida'} de {config.espesor} mm.
          Ya estan descontadas las luces entre frentes y el espesor de las placas.
        </p>
      </div>

      <div className="grupo">
        <button
          type="button"
          className="boton boton--linea boton--ancho"
          onClick={() => descargar('despiece-' + config.modeloId + '.csv', comoCsv(piezas, titulo), 'text/csv;charset=utf-8')}
        >
          <DownloadSimple size={17} className="icono" aria-hidden="true" />
          Bajar la lista de corte
        </button>
      </div>
    </>
  )
}
