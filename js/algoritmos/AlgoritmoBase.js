
class AlgoritmoPlanificacion {
    constructor(nombre, apropiativo) {
        this.nombre = nombre;
        this.apropiativo = apropiativo;
    }

    /**
     * MÉTODO OBLIGATORIO
     * @param {Array} colaListos - Arreglo con los objetos Proceso que están listos.
     * @param {Proceso} procesoEnCPU - El proceso que está actualmente en el procesador (puede ser null).
     * @returns {Proceso|null} - Debe retornar el proceso que entrará a la CPU, o null si no hay ninguno.
     */
    obtenerSiguiente(colaListos, procesoEnCPU) {
        throw new Error("El algoritmo debe implementar el método obtenerSiguiente()");
    }
}