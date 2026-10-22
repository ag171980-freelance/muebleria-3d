import { Warning } from '@phosphor-icons/react'
import { useConfigurador } from '../store/useConfigurador'
import { enNumero, medidaCorta } from '../lib/formato'
import { Dato } from './controles'

/**
 * Lo que lleva el mueble, en cantidades de material.
 *
 * No muestra plata a proposito: el cliente manda el mueble armado y el taller
 * contesta con el precio. Un estimado automatico en pantalla se lee como una
 * promesa y despues hay que discutirlo, que es justo lo que se quiere evitar.
 */
export function Resumen() {
  const config = useConfigurador((s) => s.config)
  const despiece = useConfigurador((s) => s.despiece)
  const computo = useConfigurador((s) => s.computo)

  // Los cajones salen fila por fila: con varias columnas todos los de una fila
  // miden lo mismo, asi que alcanza con mostrar el primero de cada una.
  const filas = Math.max(1, config.alturasCajones.length)
  const columnas = despiece.cajones.length > 0 ? Math.round(despiece.cajones.length / filas) : 1
  const porFila = despiece.cajones.filter((_, i) => i % columnas === 0)

  return (
    <>
      {despiece.avisos.length > 0 ? (
        <div className="grupo">
          <h3 className="grupo__titulo">Lo que conviene saber</h3>
          <div className="avisos">
            {despiece.avisos.map((aviso) => (
              <p className="aviso" key={aviso}>
                <Warning size={17} className="aviso__icono" aria-hidden="true" />
                <span>{aviso}</span>
              </p>
            ))}
          </div>
        </div>
      ) : null}

      <div className="grupo">
        <h3 className="grupo__titulo">Lo que lleva</h3>
        <div className="ficha">
          <div className="datos">
            <Dato
              clave="Medidas"
              valor={
                medidaCorta(config.ancho) +
                ' x ' +
                medidaCorta(config.alto) +
                ' x ' +
                medidaCorta(config.profundidad) +
                ' cm'
              }
            />
            <Dato clave="Superficie de placa" valor={enNumero(computo.placaM2) + ' m2'} />
            <Dato clave="Placas de 1,83 x 2,60" valor={computo.placasEnteras} />
            {computo.fondoM2 > 0 ? <Dato clave="Fibrofacil de 6 mm" valor={enNumero(computo.fondoM2) + ' m2'} /> : null}
            <Dato clave="Tapacanto" valor={enNumero(computo.cantoMl) + ' m'} />
            <Dato clave="Piezas a cortar" valor={computo.piezas} />
            {computo.correderas > 0 ? <Dato clave="Juegos de correderas" valor={computo.correderas} /> : null}
            {computo.bisagras > 0 ? <Dato clave="Bisagras" valor={computo.bisagras} /> : null}
            {computo.tiradores > 0 ? <Dato clave="Tiradores" valor={computo.tiradores} /> : null}
            {computo.perfilMl > 0 ? <Dato clave="Perfil J" valor={enNumero(computo.perfilMl) + ' m'} /> : null}
            {computo.barrales > 0 ? <Dato clave="Barral con soportes" valor={computo.barrales} /> : null}
            <Dato clave="Peso armado" valor={'unos ' + computo.pesoKg + ' kg'} />
          </div>
        </div>
        <p className="grupo__nota">
          Este detalle va junto con tu pedido para que el taller pueda presupuestarlo sin tener que volver a
          medir nada.
        </p>
      </div>

      {despiece.cajones.length > 0 ? (
        <div className="grupo">
          <h3 className="grupo__titulo">Medida util de los cajones</h3>
          <div className="bloques-cajon">
            {porFila.map((cajon, i) => (
              <div className="bloque-cajon" key={cajon.id}>
                <span>
                  Fila {i + 1}
                  {columnas > 1 ? ' (' + columnas + ' cajones)' : ''}
                </span>
                <span className="bloque-cajon__medida">
                  {medidaCorta(cajon.utiles.ancho)} x {medidaCorta(cajon.utiles.alto)} x{' '}
                  {medidaCorta(cajon.utiles.profundidad)} cm
                </span>
              </div>
            ))}
          </div>
          <p className="grupo__nota">
            Medida interior libre, ya descontadas las paredes del cajon y las correderas.
          </p>
        </div>
      ) : null}
    </>
  )
}
