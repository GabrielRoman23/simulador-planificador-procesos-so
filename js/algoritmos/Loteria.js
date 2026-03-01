class Loteria extends AlgoritmoPlanificacion {
    constructor(apropiativo) {
        super("Boletos de Lotería", apropiativo);
    }

    obtenerSiguiente(colaListos, procesoActual) {

        if (colaListos.length === 0) return null;

        if (!this.apropiativo && procesoActual) {
            return procesoActual;
        }

        let totalBoletos = 0;
        for (let proceso of colaListos) {
            totalBoletos += proceso.boletos || 1;  //
        }

        // Simula el sorteo del boleto ganador (entre 1 y totalBoletos)
        let boletoGanador = Math.floor(Math.random() * totalBoletos) + 1;

        let acumulado = 0;
        for (let proceso of colaListos) {
            acumulado += proceso.boletos || 1;

            if (boletoGanador <= acumulado) {
                return proceso;
            }
        }

        return colaListos[0]; //
    }
}