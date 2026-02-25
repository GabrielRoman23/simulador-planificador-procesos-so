class Loteria extends AlgoritmoPlanificacion {
    constructor(apropiativo) {
        super("Boletos de Lotería", apropiativo);
    }

    obtenerSiguientes(colaListos, procesoActual) {
        if (colaListos.length === 0) return null;

        // Calcular total de boletos
        let totalBoletos = 0;
        colaListos.forEach(p => totalBoletos += p.boletos);

        // Elegir boleto ganador
        let boletoGanador = Math.floor(Math.random() * totalBoletos) + 1;

        // Buscar el proceso ganador
        let acumulado = 0;
        for (let proceso of colaListos) {
            acumulado += proceso.boletos;
            if (boletoGanador <= acumulado) {
                return proceso;
            }
        }

        return colaListos[0];
    }
}