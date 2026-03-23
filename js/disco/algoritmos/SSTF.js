class SSTF extends AlgoritmoDiscoBase {
    constructor() {
        super("SSTF");
    }

    obtenerSiguiente(peticiones, cabezaActual) {
        if (peticiones.length === 0) return null;

        let mejor = peticiones[0];
        let menorDistancia = Math.abs(mejor.sector - cabezaActual);

        for (let p of peticiones) {
            let distancia = Math.abs(p.sector - cabezaActual);
            if (distancia < menorDistancia) {
                menorDistancia = distancia;
                mejor = p;
            }
        }

        const index = peticiones.indexOf(mejor);
        return peticiones.splice(index, 1)[0];
    }
}