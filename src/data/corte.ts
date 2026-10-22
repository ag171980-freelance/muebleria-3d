/**
 * DATOS DE CORTE DEL TALLER
 *
 * Medidas de la placa con la que se trabaja y cuanto se pierde al cortarla.
 * Sirven para decirle al cliente cuantas placas lleva su mueble, que es un
 * dato de materiales, no un precio: el presupuesto lo arma el carpintero
 * despues de recibir el pedido.
 */
export const CORTE = {
  /** Ancho y alto de la placa estandar, en metros. */
  placaEstandar: { ancho: 1.83, alto: 2.6 },
  /** Desperdicio de corte sobre la superficie neta. */
  desperdicio: 0.18,
} as const
