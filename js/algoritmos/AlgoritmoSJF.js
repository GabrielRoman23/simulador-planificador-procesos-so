class AlgoritmoSJF extends AlgoritmoPlanificacion {
  constructor(apropiativo) {
        super("Proceso mas corto primero", apropiativo);
    }

    obtenerSiguiente(colaListos, procesoEnCPU) {
        if (colaListos.length === 0) return null;

      // SJF selecciona el proceso con el menor tiempo restante
        let masCorto = colaListos[0];
        
        for(let i=1; i < colaListos.length; i++) {
            let procesoActual = colaListos[i];
            if (procesoActual.tiempoRestante < masCorto.tiempoRestante) {
                masCorto = procesoActual;
            }
        }

        return masCorto;
    }
}