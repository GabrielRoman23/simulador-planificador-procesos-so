class ParticipacionEquitativa extends AlgoritmoPlanificacion {
  constructor(apropiativo) {
    super("Participación Equitativa", apropiativo);
  }

  obtenerSiguiente(colaListos, procesoEnCPU) {
    if (colaListos.length === 0) return null;

    const registroUsuarios = {};

    // 1. Calcular el uso HISTÓRICO total sumando el de todos los procesos (incluso si ya terminaron)
    // Nota: Para esto asumimos que podemos acceder a window.simuladorActual.procesosTotales
    const todosLosProcesos = window.simuladorActual.procesosTotales;
    console.log("Todos los procesos históricos:", todosLosProcesos.length);

    todosLosProcesos.forEach((proceso) => {
      if (!registroUsuarios[proceso.usuario]) {
        registroUsuarios[proceso.usuario] = {
          usoTotalCPU: 0,
          procesosDisponibles: [],
        };
      }
      // Sumamos el tiempo consumido histórico
      let tiempoConsumido = proceso.tiempoOriginal - proceso.tiempoRestante;
      registroUsuarios[proceso.usuario].usoTotalCPU += tiempoConsumido;
    });

    // 2. Llenar los procesos que SÍ están disponibles en esta ronda (solo los de colaListos)
    colaListos.forEach((proceso) => {
      registroUsuarios[proceso.usuario].procesosDisponibles.push(proceso);
    });

    // 3. Determinar qué usuario ha recibido MENOS atención y que TENGA procesos en colaListos
    let usuarioGanador = null;
    let minimoUso = Infinity;

    for (const nombreUsuario in registroUsuarios) {
      const stats = registroUsuarios[nombreUsuario];

      // Solo evaluamos usuarios que tengan procesos listos para ejecutarse
      if (stats.procesosDisponibles.length > 0) {
        if (stats.usoTotalCPU < minimoUso) {
          minimoUso = stats.usoTotalCPU;
          usuarioGanador = stats;
        }
      }
    }

    // 4. Del usuario ganador, tomamos su proceso que menos tiempo haya usado
    usuarioGanador.procesosDisponibles.sort(
      (a, b) =>
        a.tiempoOriginal -
        a.tiempoRestante -
        (b.tiempoOriginal - b.tiempoRestante),
    );

    return usuarioGanador.procesosDisponibles[0];
  }
}
