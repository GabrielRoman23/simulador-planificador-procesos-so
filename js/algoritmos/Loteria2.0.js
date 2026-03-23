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
            totalBoletos += proceso.boletos;
        }

        if (totalBoletos === 0) return colaListos[0];

        let boletoGanador = Math.floor(Math.random() * totalBoletos) + 1;

        let acumulado = 0;
        for (let proceso of colaListos) {
            acumulado += proceso.boletos;

            if (boletoGanador <= acumulado) {
                if (this.simulador) {
                    this.simulador.log(`Boleto ganador: ${boletoGanador}/${totalBoletos} 
                        → P${proceso.id}`);
                }
                return proceso;
            }
        }
        return null; 
    }
}