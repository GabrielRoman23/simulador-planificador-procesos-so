
class RoundRobin extends AlgoritmoPlanificacion {
    constructor(apropiativo) {
        super("Round Robin", apropiativo);
    }

    obtenerSiguiente(colaListos, procesoEnCPU) {
        if (colaListos.length === 0) return null;
        return colaListos[0];
    }
}