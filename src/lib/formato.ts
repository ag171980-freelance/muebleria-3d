const decimal = new Intl.NumberFormat('es-AR', { maximumFractionDigits: 2 })

export function enNumero(valor: number): string {
  return decimal.format(valor)
}

/** Medidas en centimetros, que es como se habla de muebles. */
export function enCm(mm: number): string {
  return decimal.format(mm / 10) + ' cm'
}

export function enMetros(mm: number): string {
  return decimal.format(mm / 1000) + ' m'
}

export function medidaCorta(mm: number): string {
  return decimal.format(mm / 10)
}
