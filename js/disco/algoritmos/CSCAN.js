class CSCAN extends AlgoritmoDiscoBase {
    constructor() {
        super("C-SCAN");
    }

    obtenerSiguiente(peticiones, cabezaActual) {
        if (peticiones.length === 0) 
            return null;

        let mayores = peticiones.filter(p => p.sector >= cabezaActual); 
        let menores = peticiones.filter(p => p.sector < cabezaActual);

        mayores.sort((a, b) => a.sector - b.sector); 
        menores.sort((a, b) => a.sector - b.sector);

        let orden = [...mayores, ...menores]; 
        let siguiente = orden[0];
        const index = peticiones.findIndex(p => p === siguiente); 
        return peticiones.splice(index, 1)[0]; 
    }
    obtenerRuta(cabezaActual, peticionDestino) {
        let ruta = [];
        if (peticionDestino.sector >= cabezaActual) {
            ruta.push(peticionDestino.sector);
        }      
        else {
            ruta.push(20); 
            ruta.push(1);  
            ruta.push(peticionDestino.sector); 
        }
        return ruta;
    }
}