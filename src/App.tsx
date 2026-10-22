import { useEffect } from 'react'
import { useConfigurador } from './store/useConfigurador'
import { useTema } from './lib/tema'
import { Encabezado } from './ui/Encabezado'
import { Catalogo } from './ui/Catalogo'
import { Taller } from './ui/Taller'
import { decodificar } from './lib/guardado'

export default function App() {
  const vista = useConfigurador((s) => s.vista)
  const cargar = useConfigurador((s) => s.cargar)
  const verCatalogo = useConfigurador((s) => s.verCatalogo)
  const { tema, resuelto, alternar } = useTema()

  // Los links compartidos entran por el hash, incluso con la pagina ya abierta.
  useEffect(() => {
    const alNavegar = () => {
      const marca = window.location.hash.match(/^#\/d\/(.+)$/)
      if (marca) {
        const compartido = decodificar(marca[1])
        if (compartido) {
          cargar(compartido)
          return
        }
      }
      if (window.location.hash === '#/' || window.location.hash === '') verCatalogo()
    }
    window.addEventListener('hashchange', alNavegar)
    return () => window.removeEventListener('hashchange', alNavegar)
  }, [cargar, verCatalogo])

  return (
    <>
      <Encabezado tema={tema} resuelto={resuelto} alternarTema={alternar} />
      {vista === 'taller' ? <Taller tema={resuelto} /> : <Catalogo tema={resuelto} />}
    </>
  )
}
