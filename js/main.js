document.addEventListener("DOMContentLoaded", () => {
  const btnIniciar = document.getElementById("btn-iniciar");

  const btnPlayPause = document.getElementById("btn-play-pause");
  const btnSiguiente = document.getElementById("btn-siguiente");
  const btnAnterior = document.getElementById("btn-anterior");

  // Lógica del botón Play / Pause
  btnPlayPause.addEventListener("click", () => {
    if (window.simuladorActual) {
      const estaPausado = window.simuladorActual.togglePausa();

      btnPlayPause.textContent = estaPausado ? "▶ Reanudar" : "⏸ Pausar";
      btnSiguiente.disabled = !estaPausado; // Solo se puede avanzar si está pausado
      btnAnterior.disabled =
        !estaPausado || window.simuladorActual.historial.length === 0;
    }
  });

  // Lógica del botón Siguiente
  btnSiguiente.addEventListener("click", () => {
    if (window.simuladorActual) {
      window.simuladorActual.pasoSiguiente();
      // Activamos el botón de regresar porque ya avanzamos manualmente un paso
      btnAnterior.disabled = window.simuladorActual.historial.length === 0;
    }
  });

  // Lógica del botón Anterior
  btnAnterior.addEventListener("click", () => {
    if (window.simuladorActual) {
      window.simuladorActual.pasoAnterior();
      // Desactivamos el botón si ya llegamos al inicio
      if (window.simuladorActual.historial.length === 0) {
        btnAnterior.disabled = true;
      }
    }
  });

  btnIniciar.addEventListener("click", () => {
    // 1. Limpiar la interfaz por si se está corriendo una simulación previa
    limpiarInterfaz();

    // Habilitar y configurar botones de control
    btnPlayPause.disabled = false;
    btnPlayPause.textContent = "⏸ Pausar";
    btnSiguiente.disabled = true;
    btnAnterior.disabled = true;

    // 2. Leer configuraciones del usuario desde el HTML
    const tipoPlanificacion =
      document.getElementById("tipo-planificacion").value;
    const esApropiativo = tipoPlanificacion === "apropiativo";
    const idAlgoritmo = document.getElementById("algoritmo").value;

    let algoritmoSeleccionado;

    // 3. "Fábrica" de Algoritmos: Aquí tus compañeros irán agregando sus clases
    switch (idAlgoritmo) {
      case "rr":
        algoritmoSeleccionado = new RoundRobin(esApropiativo);
        break;
      case "equitativa":
        algoritmoSeleccionado = new ParticipacionEquitativa(esApropiativo);
        break;
      default:
        alert("Este algoritmo aún no ha sido implementado por el equipo.");
        return;
    }

    // 4. Detener simulación anterior si existe
    if (window.simuladorActual) {
      clearInterval(window.simuladorActual.intervaloReloj);
    }

    // 5. Instanciar el orquestador y arrancar
    window.simuladorActual = new Simulador(
      algoritmoSeleccionado,
      esApropiativo,
    );
    window.simuladorActual.iniciarSimulacion();
  });
});

function limpiarInterfaz() {
  // Vaciamos la tabla del PCB y el Gantt
  document.getElementById("pcb-body").innerHTML = "";
  document.getElementById("gantt-timeline").innerHTML = "";

  // Limpiamos la consola
  document.getElementById("lista-logs").innerHTML =
    "<div>> Sistema inicializado... Esperando configuración.</div>";

  // Ocultamos el reporte
  const reporteFinal = document.getElementById("reporte-final");
  if (reporteFinal) {
    reporteFinal.style.display = "none";
    document.getElementById("datos-reporte").innerHTML = "";
  }

  // Reseteamos contadores
  document.getElementById("reloj").textContent = "0";
  document.getElementById("quantum-display").textContent = "-";
}





