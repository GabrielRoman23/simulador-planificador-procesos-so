class MultiplesColas extends AlgoritmoPlanificacion {
    constructor(apropiativo) {
        super("Múltiples Colas de Prioridad", apropiativo);
    }

    obtenerSiguiente(colaListos, procesoActual) {
        if (colaListos.length === 0) return null;

        // Ordenar por prioridad (1 = alta prioridad)
        colaListos.sort((a, b) => a.prioridad - b.prioridad);

        return colaListos[0];
    }
}