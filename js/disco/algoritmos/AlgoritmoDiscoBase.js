class AlgoritmoDiscoBase {
    constructor(nombre) {
        this.nombre = nombre;
        this.direccion = 1; 
    }

    obtenerSiguiente(peticiones, cabezaActual) {
        throw new Error("El algoritmo de disco debe implementar obtenerSiguiente()");
    }

    // Permite a los algoritmos trazar puntos de ruta (Waypoints)
    // Por defecto, simplemente devuelve la petición destino como el siguiente punto de ruta
    obtenerRuta(cabezaActual, peticionDestino) {
        return [peticionDestino.sector]; // 
    }
}