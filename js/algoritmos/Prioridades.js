class Prioridades extends AlgoritmoPlanificacion {
    
    constructor() {
        super("Prioridades", true);
    }

    obtenerSiguiente(colaListos, procesoEnCPU) {
        if (colaListos.length === 0) return null;

        // Ordenar la cola de listos por prioridad (de mayor a menor)
        let procesoPrioritario = colaListos[0];
        for (let proceso of colaListos) {
            if (proceso.prioridad > procesoPrioritario.prioridad) {
                procesoPrioritario = proceso;
            }
        }

        // Retornar el proceso con la mayor prioridad
        return procesoPrioritario;
    }

}