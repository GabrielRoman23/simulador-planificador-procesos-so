class AlgoritmoPrioridad extends AlgoritmoPlanificacion {
    constructor(apropiativo) {
     super("Prioridad", apropiativo);
    }
    
    obtenerSiguiente(colaListos, procesoEnCPU){
        if(colaListos.length === 0) return null;

        let prioritario = colaListos[0];
        for(let i = 1; i < colaListos.length; i++){
            let procesoActual = colaListos[i];
            if(procesoActual.prioridad > prioritario.prioridad){
                prioritario = procesoActual;
            }
        }
        return prioritario;
    }

}
