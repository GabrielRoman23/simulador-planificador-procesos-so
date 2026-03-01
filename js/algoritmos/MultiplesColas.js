class MultiplesColas extends AlgoritmoPlanificacion {
    constructor(apropiativo) {
        super("Múltiples Colas de Prioridad", apropiativo);
    }

    obtenerSiguiente(colaListos, procesoActual) {

        if (colaListos.length === 0) return null;

        // Si no es apropiativo y ya hay uno ejecutándose, continúa
        if (!this.apropiativo && procesoActual) {
            return procesoActual;
        }

        // Crear las colas por prioridad (1 a 5)
        let colas = {
            5: [],
            4: [],
            3: [],
            2: [],
            1: []
        };

        // Separar procesos según su prioridad
        for (let proceso of colaListos) {
            colas[proceso.prioridad].push(proceso);
        }

        // Buscar la cola de mayor prioridad no vacía
        for (let prioridad = 5; prioridad >= 1; prioridad--) {
            if (colas[prioridad].length > 0) {

                // usamos Round Robin para tomar el primero de la cola
                let procesoSeleccionado = colas[prioridad][0];

                return procesoSeleccionado;
            }
        }

        return null;
    }
}