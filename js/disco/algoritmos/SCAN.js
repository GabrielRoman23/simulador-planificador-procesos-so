class SCAN extends AlgoritmoDiscoBase {
    constructor() {
        super("SCAN");
        this.direccion = 1;  // 1 derecha, -1 izquierda
        this.retornar = false;
    }

    obtenerSiguiente(peticiones, cabezaActual) {
        this.retornar = false;
        if (peticiones.length === 0) return null;

        //Filtra que las peticiones eten en el movimiento en el que estoy
        let candidatos = peticiones.filter(p => (p.sector - cabezaActual) * this.direccion >= 0);

        // Si no hay candidatos se va hasta el otro extremo y retorna a la direccion contrario
        if (candidatos.length === 0) {
            this.direccion *= -1;
            this.retornar = true; 
            
            candidatos = peticiones.filter(p => (p.sector - cabezaActual) * this.direccion >= 0);
        }

        if (candidatos.length === 0) return null;

        //Ordena del mas cercano  al mas lejano 
        candidatos.sort((a, b) => Math.abs(a.sector - cabezaActual) - Math.abs(b.sector - cabezaActual));
        let mejorCandidato = candidatos[0];

        // Regresa el sector al que se va a mover y elimina la peticion de la lista
        const indexOriginal = peticiones.indexOf(mejorCandidato);
        return peticiones.splice(indexOriginal, 1)[0];
    }

    obtenerRuta(cabezaActual, peticionDestino) {
        //Traza  la ruta hacia el extremo 1 o 20 antes de ir al destino
        if (this.retornar) {
            const extremo = this.direccion === -1 ? 20 : 1; 
            return [extremo, peticionDestino.sector];
        }
        return [peticionDestino.sector];
    }
}