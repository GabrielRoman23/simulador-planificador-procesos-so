class FSCAN extends AlgoritmoDiscoBase {
    constructor() {
        super("FSCAN");
        this.direccion = 1;
        this.colaActual = []; 
    }

    obtenerSiguiente(peticiones, cabezaActual) {
        if (peticiones.length === 0 && this.colaActual.length === 0) return null;

        if (this.colaActual.length === 0) {
            this.colaActual = peticiones.splice(0, peticiones.length);
        }

        let candidatos = this.colaActual.filter(p => 
            this.direccion === 1 ? p.sector >= cabezaActual : p.sector <= cabezaActual
        );

        if (candidatos.length === 0) {
            this.direccion *= -1; 
            candidatos = this.colaActual.filter(p => 
                this.direccion === 1 ? p.sector >= cabezaActual : p.sector <= cabezaActual
            );
        }

        let mejorCandidato = candidatos[0];
        let minDist = Math.abs(mejorCandidato.sector - cabezaActual);
        for(let c of candidatos) {
            if(Math.abs(c.sector - cabezaActual) < minDist) {
                minDist = Math.abs(c.sector - cabezaActual);
                mejorCandidato = c;
            }
        }

        const indexOriginal = this.colaActual.findIndex(p => p.sector === mejorCandidato.sector);
        return this.colaActual.splice(indexOriginal, 1)[0];
    }
}