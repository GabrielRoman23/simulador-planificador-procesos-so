document.addEventListener("DOMContentLoaded", () => {
  hacerTablaOrdenable();
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

// Función para hacer la tabla ordenable visualmente
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

      // 5. Volver a inyectar las filas en el DOM (esto las mueve sin destruirlas)
      filas.forEach((fila) => tbody.appendChild(fila));
    });
  });
}
