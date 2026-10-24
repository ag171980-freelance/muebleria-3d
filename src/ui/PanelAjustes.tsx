import { ArrowsClockwise } from '@phosphor-icons/react'
import { useConfigurador } from '../store/useConfigurador'
import { modeloDe } from '../data/modelos'
import { ACABADOS, MADERAS } from '../data/maderas'
import { BASES, BASE_POR_ID, HERRAJES } from '../data/herrajes'
import { ESTRUCTURAS, PATAS, type TipoEstructura } from '../data/marca'
import { ALTO_MAX_CAJON, ALTO_MIN_CAJON, altoFrentes, cajonesLlenanHueco } from '../lib/cajones'
import { Campo, Interruptor, ListaOpciones, Medida, Muestrario, Segmentado } from './controles'
import type { TipoBase, TipoHerraje } from '../data/herrajes'

export type Pestania = 'medidas' | 'material' | 'interior' | 'piezas' | 'presupuesto'

export function PanelMedidas() {
  const config = useConfigurador((s) => s.config)
  const ajustar = useConfigurador((s) => s.ajustar)
  const modelo = modeloDe(config.modeloId)
  const esEscritorio = modelo.distribucion === 'escritorio'

  return (
    <>
      <div className="grupo">
        <h3 className="grupo__titulo">Medidas generales</h3>
        <Medida
          etiqueta="Ancho"
          valor={config.ancho}
          {...modelo.rangos.ancho}
          alCambiar={(ancho) => ajustar({ ancho })}
        />
        <Medida
          etiqueta={esEscritorio ? 'Altura de la tapa' : 'Alto total'}
          valor={config.alto}
          {...modelo.rangos.alto}
          ayuda={esEscritorio ? 'Del piso a la cara de arriba de la tapa' : undefined}
          alCambiar={(alto) => ajustar({ alto })}
        />
        <Medida
          etiqueta={esEscritorio ? 'Profundidad de la tapa' : 'Profundidad'}
          valor={config.profundidad}
          {...modelo.rangos.profundidad}
          alCambiar={(profundidad) => ajustar({ profundidad })}
        />
      </div>

      <div className="grupo">
        <h3 className="grupo__titulo">Espesor</h3>
        <Segmentado
          etiqueta="Espesor de la madera"
          etiquetaOculta
          valor={config.espesor}
          ayuda="Los dos que trabaja el taller: 20 mm en estantes y cuerpos, 30 mm en tapas de escritorio y mesa."
          opciones={[
            { valor: 20, titulo: '20 mm' },
            { valor: 30, titulo: '30 mm' },
          ]}
          alElegir={(espesor) => ajustar({ espesor })}
        />
      </div>
    </>
  )
}

export function PanelMadera() {
  const config = useConfigurador((s) => s.config)
  const ajustar = useConfigurador((s) => s.ajustar)
  const madera = MADERAS.find((m) => m.id === config.maderaId)

  return (
    <>
      <div className="grupo">
        <h3 className="grupo__titulo">Especie</h3>
        <ListaOpciones
          etiqueta="Especie de la madera"
          etiquetaOculta
          ayuda={
            madera?.nudos
              ? 'El pino no da dos tapas iguales. Si buscás una superficie pareja, el eucalipto es la opcion.'
              : 'Cambia la veta y los nudos, no el color: el color lo pone el laqueado.'
          }
          valor={config.maderaId}
          opciones={MADERAS.map((m) => ({ valor: m.id, titulo: m.nombre, nota: m.nota }))}
          alElegir={(maderaId) => ajustar({ maderaId })}
        />
      </div>

      <div className="grupo">
        <h3 className="grupo__titulo">Laqueado</h3>
        <Muestrario
          etiqueta="Tono del laqueado"
          etiquetaOculta
          ayuda={ACABADOS.find((a) => a.id === config.acabadoId)?.nota}
          valor={config.acabadoId}
          opciones={ACABADOS.map((a) => ({ id: a.id, nombre: a.nombre, color: a.color, nota: a.nota }))}
          alElegir={(acabadoId) => ajustar({ acabadoId })}
        />
        <p className="grupo__nota">Los tonos son una referencia de pantalla. Antes de laquear te mostramos la muestra real.</p>
      </div>
    </>
  )
}

export function PanelEstructura() {
  const config = useConfigurador((s) => s.config)
  const ajustar = useConfigurador((s) => s.ajustar)
  const modelo = modeloDe(config.modeloId)
  const esEscritorio = modelo.distribucion === 'escritorio'
  const baseElegida = BASE_POR_ID.get(config.baseId)

  return (
    <>
      <div className="grupo">
        <h3 className="grupo__titulo">Color del hierro</h3>
        <Muestrario
          etiqueta="Color del hierro"
          etiquetaOculta
          ayuda={ESTRUCTURAS.find((e) => e.id === config.estructuraId)?.nota}
          valor={config.estructuraId}
          opciones={ESTRUCTURAS.map((e) => ({ id: e.id, nombre: e.nombre, color: e.color, nota: e.nota }))}
          alElegir={(id) => ajustar({ estructuraId: id as TipoEstructura })}
        />
        <p className="grupo__nota">Pintura epoxi al horno. Patas, travesaños y tiradores van todos en este color.</p>
      </div>

      {esEscritorio ? (
        <div className="grupo">
          <h3 className="grupo__titulo">Terminacion de la pata</h3>
          <ListaOpciones
            etiqueta="Terminacion de la pata"
            etiquetaOculta
            valor={config.tipoPataId}
            opciones={PATAS.map((t) => ({ valor: t.id, titulo: t.nombre, nota: t.nota }))}
            alElegir={(tipoPataId) => ajustar({ tipoPataId })}
          />
        </div>
      ) : null}

      {modelo.grupos.includes('base') && !esEscritorio ? (
        <div className="grupo">
          <h3 className="grupo__titulo">Como apoya</h3>
          <ListaOpciones
            etiqueta="Como apoya el mueble"
            etiquetaOculta
            valor={config.baseId}
            opciones={BASES.map((b) => ({ valor: b.id as TipoBase, titulo: b.nombre, nota: b.nota }))}
            alElegir={(baseId) => {
              const elegida = BASE_POR_ID.get(baseId)
              ajustar({ baseId, alturaBase: elegida?.altura ?? 0 })
            }}
          />
          {baseElegida && baseElegida.id !== 'ninguna' ? (
            <Medida
              etiqueta="Altura de la base"
              valor={config.alturaBase}
              min={40}
              max={Math.max(60, Math.round(config.alto * 0.4))}
              paso={5}
              ayuda="Se descuenta del cuerpo: el alto total no cambia."
              alCambiar={(alturaBase) => ajustar({ alturaBase })}
            />
          ) : null}
        </div>
      ) : null}
    </>
  )
}

export function PanelInterior() {
  const config = useConfigurador((s) => s.config)
  const despiece = useConfigurador((s) => s.despiece)
  const ajustar = useConfigurador((s) => s.ajustar)
  const ajustarAlturaCajon = useConfigurador((s) => s.ajustarAlturaCajon)
  const repartirParejo = useConfigurador((s) => s.repartirCajonesParejo)
  const modelo = modeloDe(config.modeloId)
  const grupos = new Set(modelo.grupos)
  const llenan = cajonesLlenanHueco(config.modeloId)
  const filas = Math.max(1, config.alturasCajones.length)
  const columnasReales = despiece.cajones.length > 0 ? Math.round(despiece.cajones.length / filas) : 1
  const disponible = altoFrentes(config)

  return (
    <>
      {grupos.has('cajones') ? (
        <div className="grupo">
          <h3 className="grupo__titulo">Cajones</h3>
          <Segmentado
            etiqueta="Cajones a lo alto"
            valor={config.cantidadCajones}
            ayuda="Filas apiladas, de abajo hacia arriba."
            opciones={Array.from({ length: modelo.maxCajones + 1 }, (_, i) => ({ valor: i, titulo: String(i) }))}
            alElegir={(cantidadCajones) => ajustar({ cantidadCajones })}
          />

          {config.cantidadCajones > 0 && modelo.maxColumnasCajones > 1 ? (
            <Segmentado
              etiqueta="Cajones a lo ancho"
              valor={config.columnasCajones}
              ayuda={
                columnasReales < config.columnasCajones
                  ? 'A este ancho entran ' + columnasReales + ' por fila. Ensanchá el mueble para que entren todos.'
                  : 'Cada columna de mas lleva su parante para amurar las correderas.'
              }
              opciones={Array.from({ length: modelo.maxColumnasCajones }, (_, i) => ({
                valor: i + 1,
                titulo: String(i + 1),
              }))}
              alElegir={(columnasCajones) => ajustar({ columnasCajones })}
            />
          ) : null}

          {config.cantidadCajones > 0 ? (
            <Campo
              etiqueta="Altura de cada fila"
              ayuda={
                llenan
                  ? 'Los frentes cubren los ' +
                    (disponible / 10).toFixed(0) +
                    ' cm del cuerpo. Si subis uno, los demas se acomodan solos.'
                  : 'Bloque de cajones al pie del placard. Arriba queda el hueco para colgar.'
              }
              extra={
                <button type="button" className="boton boton--texto boton--chico" onClick={repartirParejo}>
                  <ArrowsClockwise size={14} className="icono" aria-hidden="true" />
                  Repartir parejo
                </button>
              }
            >
              <div className="cajonera">
                {config.alturasCajones.map((altura, indice) => (
                  <div className="cajon-fila" key={indice}>
                    <Medida
                      etiqueta={'Fila ' + (indice + 1)}
                      valor={altura}
                      min={ALTO_MIN_CAJON}
                      max={llenan ? Math.max(ALTO_MIN_CAJON, disponible - ALTO_MIN_CAJON * (config.cantidadCajones - 1)) : ALTO_MAX_CAJON}
                      paso={5}
                      ayuda={
                        // Los cajones salen fila por fila: el primero de la fila
                        // esta en indice * columnas.
                        despiece.cajones[indice * columnasReales]
                          ? (columnasReales > 1 ? columnasReales + ' de ' : 'Util: ') +
                            despiece.cajones[indice * columnasReales].utiles.ancho / 10 +
                            ' x ' +
                            despiece.cajones[indice * columnasReales].utiles.alto / 10 +
                            ' x ' +
                            despiece.cajones[indice * columnasReales].utiles.profundidad / 10 +
                            ' cm'
                          : undefined
                      }
                      alCambiar={(mm) => ajustarAlturaCajon(indice, mm)}
                    />
                  </div>
                ))}
              </div>
            </Campo>
          ) : null}
        </div>
      ) : null}

      {grupos.has('puertas') && (modelo.puertasPosibles.length > 1 || modelo.tiposPuerta.length > 1) ? (
        <div className="grupo">
          <h3 className="grupo__titulo">Puertas</h3>

          {modelo.tiposPuerta.length > 1 ? (
            <Segmentado
              etiqueta="Como abren"
              valor={config.tipoPuerta}
              ayuda={
                config.tipoPuerta === 'corrediza'
                  ? 'Corren sobre un riel y no invaden el ambiente. Tapan siempre una parte del mueble.'
                  : 'Abren hacia afuera. Dejan todo el interior a la vista de una.'
              }
              opciones={modelo.tiposPuerta.map((t) => ({
                valor: t,
                titulo: t === 'corrediza' ? 'Corredizas' : 'Batientes',
              }))}
              alElegir={(tipoPuerta) => ajustar({ tipoPuerta })}
            />
          ) : null}

          {modelo.puertasPosibles.length > 1 ? (
            <Segmentado
              etiqueta="Cantidad de hojas"
              valor={config.cantidadPuertas}
              ayuda={
                config.tipoPuerta === 'corrediza'
                  ? 'Cada hoja va en su carril, una por delante de la otra.'
                  : 'Las hojas abren de a pares, enfrentadas.'
              }
              opciones={modelo.puertasPosibles.map((n) => ({ valor: n, titulo: n === 0 ? 'Sin puertas' : String(n) }))}
              alElegir={(cantidadPuertas) => ajustar({ cantidadPuertas })}
            />
          ) : null}
        </div>
      ) : null}

      {grupos.has('estantes') ? (
        <div className="grupo">
          <h3 className="grupo__titulo">Estantes</h3>
          <Segmentado
            etiqueta="Cantidad de estantes"
            etiquetaOculta
            valor={config.cantidadEstantes}
            ayuda="Se reparten a distancias iguales."
            opciones={Array.from({ length: modelo.maxEstantes + 1 }, (_, i) => ({ valor: i, titulo: String(i) }))}
            alElegir={(cantidadEstantes) => ajustar({ cantidadEstantes })}
          />
        </div>
      ) : null}

      {grupos.has('cpu') ? (
        <div className="grupo">
          <h3 className="grupo__titulo">Agregados</h3>
          <Interruptor
            etiqueta="Bandeja para la CPU"
            nota="Colgada bajo la tapa, contra el lateral izquierdo."
            activo={config.conEstanteCpu}
            alCambiar={(conEstanteCpu) => ajustar({ conEstanteCpu })}
          />
        </div>
      ) : null}

      {grupos.has('barral') || grupos.has('fondo') ? (
        <div className="grupo">
          <h3 className="grupo__titulo">Agregados</h3>
          {grupos.has('barral') ? (
            <Interruptor
              etiqueta="Barral para colgar"
              nota="Tubo cromado con soportes, en el cuerpo libre."
              activo={config.conBarral}
              alCambiar={(conBarral) => ajustar({ conBarral })}
            />
          ) : null}
          {grupos.has('fondo') ? (
            <Interruptor
              etiqueta="Fondo cerrado"
              nota="Fibrofacil de 6 mm al tono. Sin fondo se ve la pared."
              activo={config.conFondo}
              alCambiar={(conFondo) => ajustar({ conFondo })}
            />
          ) : null}
        </div>
      ) : null}

    </>
  )
}

export function PanelHerrajes() {
  const config = useConfigurador((s) => s.config)
  const ajustar = useConfigurador((s) => s.ajustar)
  const modelo = modeloDe(config.modeloId)
  const tieneFrentes = modelo.grupos.includes('cajones') || modelo.grupos.includes('puertas')
  const corrediza = config.tipoPuerta === 'corrediza' && config.cantidadPuertas > 0

  if (!tieneFrentes) return null

  return (
    <>
      <div className="grupo">
        <h3 className="grupo__titulo">Manija o perilla</h3>
        {corrediza ? (
          <p className="grupo__nota">
            Las hojas corredizas llevan siempre un tirador vertical al ras, porque uno que sobresalga choca con la
            hoja de al lado. Lo que elijas acá va en los cajones.
          </p>
        ) : null}
        <ListaOpciones
          etiqueta="Tipo de tirador"
          etiquetaOculta
          valor={config.herrajeId}
          opciones={HERRAJES.map((h) => ({ valor: h.id as TipoHerraje, titulo: h.nombre, nota: h.nota }))}
          alElegir={(herrajeId) => ajustar({ herrajeId })}
        />
      </div>

      {config.herrajeId !== 'uñero' ? (
        <p className="grupo__nota">
          El tirador va en la misma pintura epoxi que la estructura, que ahora es{' '}
          {ESTRUCTURAS.find((e) => e.id === config.estructuraId)?.nombre.toLowerCase()}.
        </p>
      ) : null}
    </>
  )
}
