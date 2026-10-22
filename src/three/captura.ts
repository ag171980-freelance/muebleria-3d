/**
 * Puente para sacarle una foto al visor desde fuera del arbol de three.
 * El formulario de presupuesto la usa para adjuntar el mueble tal como lo
 * dejo el cliente, que es lo primero que mira el carpintero.
 */
export const camara: { tomar: (() => string | null) | null } = { tomar: null }

export function tomarFoto(): string | null {
  try {
    return camara.tomar ? camara.tomar() : null
  } catch {
    return null
  }
}
