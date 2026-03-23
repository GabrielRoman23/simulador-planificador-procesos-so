class PlanificacionGarantizada extends AlgoritmoPlanificacion {
  constructor(apropiativo) {
    super("Planificación Garantizada", apropiativo);
  }

  obtenerSiguiente(colaListos, procesoEnCPU) {
    if (colaListos.length === 0) return null;

    if (!this.apropiativo && procesoEnCPU) return procesoEnCPU;

    let procesoMenosUsado = colaListos[0];

    for (let i = 1; i < colaListos.length; i++) {
      let procesoActual = colaListos[i];

      // Calculamos cuánto tiempo de CPU ha usado cada proceso
      let tiempoUsadoActual =
        procesoActual.tiempoOriginal - procesoActual.tiempoRestante;
      let tiempoUsadoMenos =
        procesoMenosUsado.tiempoOriginal - procesoMenosUsado.tiempoRestante;

      //Si el proceso actual ha usado menos CPU, lo seleccionamos
      if (tiempoUsadoActual < tiempoUsadoMenos) {
        procesoMenosUsado = procesoActual;
      }
    }
    return procesoMenosUsado;
  }
}
