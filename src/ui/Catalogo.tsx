import { useEffect, useRef, useState } from 'react'
import { ArrowRight, Trash, WhatsappLogo } from '@phosphor-icons/react'
import { MODELOS, modeloDe } from '../data/modelos'
import { MADERA_POR_ID } from '../data/maderas'
import { useConfigurador } from '../store/useConfigurador'
import { MiniVisor } from '../three/MiniVisor'
import { borrarDisenio, enlaceWhatsapp, listarDisenios, TALLER, type DisenioGuardado } from '../lib/guardado'
import { medidaCorta } from '../lib/formato'
import { FONDO_ESCENA } from '../lib/tema'

/** El mueble que se muestra en la portada. Es el que mas se pide. */
const DESTACADO = 'placar'

export function Catalogo({ tema }: { tema: 'claro' | 'oscuro' }) {
  const elegirModelo = useConfigurador((s) => s.elegirModelo)
  const cargar = useConfigurador((s) => s.cargar)
  const [guardados, setGuardados] = useState<DisenioGuardado[]>([])
  const rejilla = useRef<HTMLDivElement>(null)
  const fondo = FONDO_ESCENA[tema]

  useEffect(() => {
    setGuardados(listarDisenios())
  }, [])

  return (
    <main className="catalogo">
      <section className="intro">
        <div>
          <h1 className="intro__titulo">El mueble que necesitas, con tus medidas.</h1>
          <p className="intro__texto">
            Elegí un mueble, ajustá las medidas al centímetro y mirá cómo queda antes de encargarlo.
          </p>
          <div className="intro__acciones">
            <button
              type="button"
              className="boton"
              onClick={() => rejilla.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
            >
              Elegir un mueble
              <ArrowRight size={17} className="icono" aria-hidden="true" />
            </button>
            <a
              className="boton boton--linea"
              href={enlaceWhatsapp('Hola! Quiero consultar por un mueble a medida.')}
              target="_blank"
              rel="noreferrer"
            >
              <WhatsappLogo size={17} className="icono" aria-hidden="true" />
              Hablar con el taller
            </a>
          </div>
        </div>
        <div>
          <div className="intro__visor">
            <MiniVisor modeloId={DESTACADO} fondo={fondo} />
          </div>
          <p className="intro__pie">{modeloDe(DESTACADO).nombre}, armado con las medidas que mas se repiten.</p>
        </div>
      </section>

      <section className="seccion" ref={rejilla}>
        <div className="seccion__cabecera">
          <h2 className="seccion__titulo">Muebles que hacemos</h2>
          <p className="seccion__nota">Pasá el puntero por arriba para verlo girar.</p>
        </div>
        <div className="rejilla-modelos">
          {MODELOS.map((modelo) => (
            <button key={modelo.id} type="button" className="tarjeta-modelo" onClick={() => elegirModelo(modelo.id)}>
              <span className="tarjeta-modelo__lienzo">
                <MiniVisor modeloId={modelo.id} fondo={fondo} />
              </span>
              <span className="tarjeta-modelo__cuerpo">
                <span className="tarjeta-modelo__nombre">{modelo.nombre}</span>
                <span className="tarjeta-modelo__resumen">{modelo.resumen}</span>
                <span className="tarjeta-modelo__medidas num">
                  {medidaCorta(modelo.inicial.ancho)} x {medidaCorta(modelo.inicial.alto)} x{' '}
                  {medidaCorta(modelo.inicial.profundidad)} cm
                </span>
              </span>
            </button>
          ))}
        </div>
      </section>

      <section className="seccion">
        <div className="seccion__cabecera">
          <h2 className="seccion__titulo">Tus diseños</h2>
        </div>
        {guardados.length === 0 ? (
          <div className="vacio">
            <p className="vacio__titulo">Todavia no guardaste ninguno</p>
            <p className="vacio__texto">
              Mientras armás un mueble podés guardarlo con un nombre y volver a abrirlo desde este equipo cuando
              quieras. Tambien te damos un link para compartirlo.
            </p>
          </div>
        ) : (
          <div className="guardados">
            {guardados.map((disenio) => (
              <article className="guardado" key={disenio.id}>
                {disenio.miniatura ? (
                  <img className="guardado__foto" src={disenio.miniatura} alt="" />
                ) : (
                  <span className="guardado__foto" aria-hidden="true" />
                )}
                <div className="guardado__datos">
                  <p className="guardado__nombre">{disenio.nombre}</p>
                  <p className="guardado__fecha">
                    {modeloDe(disenio.config.modeloId).nombre} en{' '}
                    {MADERA_POR_ID.get(disenio.config.maderaId)?.nombre ?? 'madera a definir'}
                  </p>
                  <p className="guardado__fecha num">
                    {medidaCorta(disenio.config.ancho)} x {medidaCorta(disenio.config.alto)} x{' '}
                    {medidaCorta(disenio.config.profundidad)} cm
                  </p>
                </div>
                <div className="guardado__acciones">
                  <button type="button" className="boton boton--chico" onClick={() => cargar(disenio.config)}>
                    Abrir
                  </button>
                  <button
                    type="button"
                    className="boton boton--texto boton--chico"
                    aria-label={'Borrar ' + disenio.nombre}
                    onClick={() => setGuardados(borrarDisenio(disenio.id))}
                  >
                    <Trash size={15} aria-hidden="true" />
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <footer className="pie">
        <div className="pie__cuerpo">
          <span>
            {TALLER.nombre}, {TALLER.zona}
          </span>
          <a href={'mailto:' + TALLER.email}>{TALLER.email}</a>
          <span>Las medidas finales se verifican en el lugar antes de cortar.</span>
        </div>
      </footer>
    </main>
  )
}
