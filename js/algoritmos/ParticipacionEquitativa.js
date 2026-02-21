class ParticipacionEquitativa extends AlgoritmoPlanificacion {
    constructor(apropiativo) {
        super("Participación Equitativa", apropiativo);
    }

    obtenerSiguiente(colaListos, procesoEnCPU) {
        if (colaListos.length === 0) return null;

        // 1. Agrupar los procesos en la cola de listos por Usuario
        const registroUsuarios = {};

        colaListos.forEach(proceso => {
            if (!registroUsuarios[proceso.usuario]) {
                registroUsuarios[proceso.usuario] = {
                    usoTotalCPU: 0,
                    procesos: []
                };
            }
            // Sumamos el uso de CPU de este proceso al total de su usuario
            registroUsuarios[proceso.usuario].usoTotalCPU += proceso.vecesEnCPU;
            registroUsuarios[proceso.usuario].procesos.push(proceso);
        });

        // 2. Determinar qué usuario ha recibido MENOS atención de la CPU
        let usuarioGanador = null;
        let minimoUso = Infinity;

        for (const nombreUsuario in registroUsuarios) {
            const stats = registroUsuarios[nombreUsuario];
            if (stats.usoTotalCPU < minimoUso) {
                minimoUso = stats.usoTotalCPU;
                usuarioGanador = stats;
            }
        }

        // 3. Del usuario ganador, tomamos su proceso que menos veces haya entrado a CPU
        // Esto garantiza equidad no solo entre usuarios, sino entre los procesos del mismo usuario
        usuarioGanador.procesos.sort((a, b) => a.vecesEnCPU - b.vecesEnCPU);

        return usuarioGanador.procesos[0];
    }
}