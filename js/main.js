window.AppConfig = {
  simulador: {
    numProcesosMin: 1,
    numProcesosMax: 10,
    tiempoMonitoreoMin: 20,
    tiempoMonitoreoMax: 35,
    quantumMin: 2,
    quantumMax: 5,
    probInterrupcion: 0.1, // 10%
  },
  proceso: {
    tiempoMin: 3,
    tiempoMax: 10,
    probBloqueadoInicial: 0.5, // 50%
    petInicialesMin: 1,
    petInicialesMax: 5,
  },
  disco: {
    probLectura: 0.5, // 50%
    probNuevasPeticiones: 0.5, // 50%
    nuevasPetMin: 1,
    nuevasPetMax: 3,
  },
};

document.addEventListener("DOMContentLoaded", () => {
  hacerTablaOrdenable();
  dibujarPistaDisco();
  const btnIniciar = document.getElementById("btn-iniciar");

  const btnPlayPause = document.getElementById("btn-play-pause");
  const btnSiguiente = document.getElementById("btn-siguiente");
  const btnAnterior = document.getElementById("btn-anterior");
  const btnReiniciar = document.getElementById("btn-reiniciar");

  // Lógica del botón Play / Pause
  btnPlayPause.addEventListener("click", () => {
    if (window.simuladorActual) {
      const estaPausado = window.simuladorActual.togglePausa();

      btnPlayPause.textContent = estaPausado ? "▶ Reanudar" : "⏸ Pausar";
      btnSiguiente.disabled = !estaPausado; 
      btnAnterior.disabled =
        !estaPausado || window.simuladorActual.historial.length === 0;
    }
  });

  // Lógica del botón Siguiente
  btnSiguiente.addEventListener("click", () => {
    if (window.simuladorActual) {
      window.simuladorActual.pasoSiguiente();
      btnAnterior.disabled = window.simuladorActual.historial.length === 0;
    }
  });

  // Lógica del botón Anterior
  btnAnterior.addEventListener("click", () => {
    if (window.simuladorActual) {
      window.simuladorActual.pasoAnterior();
      if (window.simuladorActual.historial.length === 0)
        btnAnterior.disabled = true;
    }
  });

  btnReiniciar.addEventListener("click", () => {
    // 1. Detener el reloj del simulador si está corriendo
    if (window.simuladorActual) {
      clearInterval(window.simuladorActual.intervaloReloj);
      window.simuladorActual = null; // Destruimos el objeto en memoria
    }

    // 2. Limpiar toda la interfaz visual
    limpiarInterfaz();

    // 3. Bloquear los botones de control hasta que se vuelva a dar "Iniciar"
    btnPlayPause.disabled = true;
    btnPlayPause.textContent = "⏸ Pausar";
    btnSiguiente.disabled = true;
    btnAnterior.disabled = true;
    btnReiniciar.disabled = true;
  });

  const modalConfig = document.getElementById("modal-config");
  const btnSettings = document.getElementById("btn-settings");
  const btnCerrarModal = document.getElementById("btn-cerrar-modal");
  const btnGuardarConfig = document.getElementById("btn-guardar-config");

  // Mostrar Modal y Cargar Datos Actuales
  btnSettings.addEventListener("click", () => {
    document.getElementById("cfg-proc-min").value =
      AppConfig.simulador.numProcesosMin;
    document.getElementById("cfg-proc-max").value =
      AppConfig.simulador.numProcesosMax;
    document.getElementById("cfg-tiempo-min").value =
      AppConfig.simulador.tiempoMonitoreoMin;
    document.getElementById("cfg-tiempo-max").value =
      AppConfig.simulador.tiempoMonitoreoMax;
    document.getElementById("cfg-quantum-min").value =
      AppConfig.simulador.quantumMin;
    document.getElementById("cfg-quantum-max").value =
      AppConfig.simulador.quantumMax;
    document.getElementById("cfg-prob-interrupcion").value =
      AppConfig.simulador.probInterrupcion * 100;

    document.getElementById("cfg-tproc-min").value =
      AppConfig.proceso.tiempoMin;
    document.getElementById("cfg-tproc-max").value =
      AppConfig.proceso.tiempoMax;
    document.getElementById("cfg-prob-bloqueado").value =
      AppConfig.proceso.probBloqueadoInicial * 100;
    document.getElementById("cfg-pet-ini-min").value =
      AppConfig.proceso.petInicialesMin;
    document.getElementById("cfg-pet-ini-max").value =
      AppConfig.proceso.petInicialesMax;

    document.getElementById("cfg-prob-lectura").value =
      AppConfig.disco.probLectura * 100;
    document.getElementById("cfg-prob-nuevas-pet").value =
      AppConfig.disco.probNuevasPeticiones * 100;
    document.getElementById("cfg-nuevas-pet-min").value =
      AppConfig.disco.nuevasPetMin;
    document.getElementById("cfg-nuevas-pet-max").value =
      AppConfig.disco.nuevasPetMax;

    modalConfig.style.display = "flex";
  });

  // Ocultar Modal
  btnCerrarModal.addEventListener(
    "click",
    () => (modalConfig.style.display = "none"),
  );

  // Guardar Cambios
  btnGuardarConfig.addEventListener("click", () => {
    AppConfig.simulador.numProcesosMin = parseInt(
      document.getElementById("cfg-proc-min").value,
    );
    AppConfig.simulador.numProcesosMax = parseInt(
      document.getElementById("cfg-proc-max").value,
    );
    AppConfig.simulador.tiempoMonitoreoMin = parseInt(
      document.getElementById("cfg-tiempo-min").value,
    );
    AppConfig.simulador.tiempoMonitoreoMax = parseInt(
      document.getElementById("cfg-tiempo-max").value,
    );
    AppConfig.simulador.quantumMin = parseInt(
      document.getElementById("cfg-quantum-min").value,
    );
    AppConfig.simulador.quantumMax = parseInt(
      document.getElementById("cfg-quantum-max").value,
    );
    AppConfig.simulador.probInterrupcion =
      parseInt(document.getElementById("cfg-prob-interrupcion").value) / 100;

    AppConfig.proceso.tiempoMin = parseInt(
      document.getElementById("cfg-tproc-min").value,
    );
    AppConfig.proceso.tiempoMax = parseInt(
      document.getElementById("cfg-tproc-max").value,
    );
    AppConfig.proceso.probBloqueadoInicial =
      parseInt(document.getElementById("cfg-prob-bloqueado").value) / 100;
    AppConfig.proceso.petInicialesMin = parseInt(
      document.getElementById("cfg-pet-ini-min").value,
    );
    AppConfig.proceso.petInicialesMax = parseInt(
      document.getElementById("cfg-pet-ini-max").value,
    );

    AppConfig.disco.probLectura =
      parseInt(document.getElementById("cfg-prob-lectura").value) / 100;
    AppConfig.disco.probNuevasPeticiones =
      parseInt(document.getElementById("cfg-prob-nuevas-pet").value) / 100;
    AppConfig.disco.nuevasPetMin = parseInt(
      document.getElementById("cfg-nuevas-pet-min").value,
    );
    AppConfig.disco.nuevasPetMax = parseInt(
      document.getElementById("cfg-nuevas-pet-max").value,
    );

    modalConfig.style.display = "none";
    alert("Configuraciones guardadas. Se aplicarán en la próxima simulación.");
  });

  btnIniciar.addEventListener("click", () => {
    // 1. Limpiar la interfaz de cualquier simulación previa
    limpiarInterfaz();

    // Habilitar y configurar botones de control
    btnPlayPause.disabled = false;
    btnPlayPause.textContent = "⏸ Pausar";
    btnSiguiente.disabled = true;
    btnAnterior.disabled = true;
    btnReiniciar.disabled = false;

    // 2. Leer configuraciones del usuario desde el HTML
    const tipoPlanificacion =
      document.getElementById("tipo-planificacion").value;
    const esApropiativo = tipoPlanificacion === "apropiativo";
    const idAlgoritmo = document.getElementById("algoritmo").value;
    const algoritmoDisco = document.getElementById("algoritmo-disco").value;

    let algoritmoSeleccionado;

    switch (idAlgoritmo) {
      case "rr":
        algoritmoSeleccionado = new RoundRobin(esApropiativo);
        break;
      case "equitativa":
        algoritmoSeleccionado = new ParticipacionEquitativa(esApropiativo);
        break;
      case "sjf":
        algoritmoSeleccionado = new AlgoritmoSJF(esApropiativo);
        break;
      case "prioridades":
        algoritmoSeleccionado = new AlgoritmoPrioridad(esApropiativo);
        break;
      case "loteria":
        algoritmoSeleccionado = new Loteria(esApropiativo);
        break;
      case "multiples-colas":
        algoritmoSeleccionado = new MultiplesColas(esApropiativo);
        break;
      case "garantizada":
        algoritmoSeleccionado = new PlanificacionGarantizada(esApropiativo);
        break;
      default:
        alert("Este algoritmo aún no ha sido implementado por el equipo.");
        return;
    }

    // 4. Detener simulación anterior si existe
    if (window.simuladorActual) {
      clearInterval(window.simuladorActual.intervaloReloj);
    }

    // 5. Instanciar el Simulador y arrancar
    window.simuladorActual = new Simulador(
      algoritmoSeleccionado,
      esApropiativo,
      algoritmoDisco,
    );
    window.simuladorActual.iniciarSimulacion();
  });
});

function limpiarInterfaz() {
  document.getElementById("pcb-body").innerHTML = "";
  document.getElementById("gantt-timeline").innerHTML = "";

  const contenedorListos = document.getElementById("contenedor-listos");
  if (contenedorListos) contenedorListos.innerHTML = "";

  const contenedorCPU = document.getElementById("contenedor-cpu");
  if (contenedorCPU) contenedorCPU.innerHTML = "";

  const contenedorBloqueados = document.getElementById("contenedor-bloqueados");
  if (contenedorBloqueados) contenedorBloqueados.innerHTML = "";

  const contenedorTerminados = document.getElementById("contenedor-terminados");
  if (contenedorTerminados) contenedorTerminados.innerHTML = "";

  document.getElementById("lista-logs").innerHTML =
    "<div>> Sistema inicializado... Esperando configuración.</div>";

  const reporteFinal = document.getElementById("reporte-final");
  if (reporteFinal) {
    reporteFinal.style.display = "none";
    document.getElementById("datos-reporte").innerHTML = "";
  }

  document.getElementById("reloj").textContent = "0";
  document.getElementById("quantum-display").textContent = "-";

  const discoProcesoLabel = document.getElementById("disco-proceso-label");
  if (discoProcesoLabel) discoProcesoLabel.textContent = "Ninguno";

  const discoPeticionLabel = document.getElementById("disco-peticion-label");
  if (discoPeticionLabel) discoPeticionLabel.textContent = "Ninguna";

  document
    .querySelectorAll(".sector")
    .forEach((s) => s.classList.remove("activo-lectura", "activo-escritura"));

  const discoHead = document.getElementById("disco-head");
  if(discoHead) {
      discoHead.style.left = "0%";
  }
  
  
}

function hacerTablaOrdenable() {
  const headers = document.querySelectorAll("#pcb-table th");
  const tbody = document.getElementById("pcb-body");

  let columnaActiva = -1;
  let ordenAscendente = true;

  headers.forEach((header, index) => {
    header.addEventListener("click", () => {
      // 1. Alternar dirección si es la misma columna, o reiniciar si es nueva
      if (columnaActiva === index) {
        ordenAscendente = !ordenAscendente;
      } else {
        ordenAscendente = true;
        columnaActiva = index;
      }

      // 2. Actualizar las flechitas visuales en los encabezados
      headers.forEach(
        (h) =>
          (h.textContent = h.textContent.replace(" ▲", "").replace(" ▼", "")),
      );
      header.textContent += ordenAscendente ? " ▲" : " ▼";

      // 3. Obtener todas las filas actuales de la tabla y convertirlas a un Arreglo
      const filas = Array.from(tbody.querySelectorAll("tr"));

      // 4. Ordenar el arreglo de filas
      filas.sort((filaA, filaB) => {
        let valA = filaA.cells[index].innerText.trim();
        let valB = filaB.cells[index].innerText.trim();

        // Limpieza de datos para extraer solo los números en columnas específicas
        if (index === 0) {
          // Columna ID: "P1" -> "1"
          valA = valA.replace("P", "");
          valB = valB.replace("P", "");
        } else if (index === 2) {
          // Columna T. Restante: "5 / 10 u." -> "5"
          valA = valA.split(" ")[0];
          valB = valB.split(" ")[0];
        }

        const numA = parseFloat(valA);
        const numB = parseFloat(valB);

        // Si la columna contiene números, ordenamos matemáticamente
        if (!isNaN(numA) && !isNaN(numB)) {
          return ordenAscendente ? numA - numB : numB - numA;
        } else {
          // Si contiene texto (Estado, Usuario), ordenamos alfabéticamente
          return ordenAscendente
            ? valA.localeCompare(valB)
            : valB.localeCompare(valA);
        }
      });

      // 5. Volver a inyectar las filas en el DOM
      filas.forEach((fila) => tbody.appendChild(fila));
    });
  });
}

function dibujarPistaDisco() {
  const track = document.getElementById("disco-track");
  track.innerHTML = ""; // Limpiar

  for (let i = 1; i <= 20; i++) {
    const div = document.createElement("div");
    div.className = "sector";
    div.id = `sector-vis-${i}`;
    div.textContent = i;
    track.appendChild(div);
  }
}
