class Simulador {
  constructor(algoritmo, esApropiativo, algoritmoDisco) {
    const cfg = window.AppConfig.simulador;
    this.algoritmo = algoritmo;
    this.esApropiativo = esApropiativo;
    this.algoritmo.simulador = this;

    this.reloj = 0;
    this.tiempoMonitoreo =
      Math.floor(
        Math.random() * (cfg.tiempoMonitoreoMax - cfg.tiempoMonitoreoMin + 1),
      ) + cfg.tiempoMonitoreoMin;
    this.quantumMaximo = this.esApropiativo
      ? Math.floor(Math.random() * (cfg.quantumMax - cfg.quantumMin + 1)) +
        cfg.quantumMin
      : null;
    this.quantumActual = this.quantumMaximo;

    // Estructuras de datos lógicas
    this.procesosTotales = [];
    this.colaListos = [];
    this.colaBloqueados = [];
    this.colaTerminados = [];
    this.procesoEnCPU = null;

    // Subsistema de Disco Duro
    this.sesHHDD = new SESHHDD(this, algoritmoDisco);
    this.procesoEnDisco = null;

    this.estadisticas = {
      cambiosContexto: 0,
      procesosNuncaEjecutados: [],
    };

    this.intervaloReloj = null;
    this.pausado = false;
    this.historial = [];
  }

  inicializar() {
    const cfg = window.AppConfig.simulador;
    const numProcesos = Math.floor(Math.random() * (cfg.numProcesosMax - cfg.numProcesosMin + 1)) + cfg.numProcesosMin;
    this.log(
      `Iniciando simulación con ${numProcesos} procesos. Tiempo máximo: ${this.tiempoMonitoreo}u.`,
    );
    if (this.esApropiativo)
      this.log(`Modo Apropiativo. Quantum: ${this.quantumMaximo}`);

    for (let i = 1; i <= numProcesos; i++) {
      const p = new Proceso(i);
      this.procesosTotales.push(p);

      // Tabla PCB
      const uiFila = p.crearElementoUI();
      document.getElementById("pcb-body").appendChild(uiFila);

      // Tarjeta 
      const tarjeta = p.crearTarjetaUI();
      if (p.estado === "Bloqueado") {
        document.getElementById("contenedor-bloqueados").appendChild(tarjeta);
      } else {
        document.getElementById("contenedor-listos").appendChild(tarjeta);
      }

      this.colaListos.push(p);
    }
    this.actualizarUI();
  }

  iniciarSimulacion() {
    this.inicializar();
    this.intervaloReloj = setInterval(() => {
      if (!this.pausado) this.cicloDeReloj();
    }, 1000);
  }

  cicloDeReloj() {
    this.guardarEstado();
    this.reloj++;

    if (this.procesoEnDisco) {
      this.sesHHDD.ciclo();
      this.dibujarGantt(true);
      this.actualizarUI();

      if (this.verificarFinSimulacion()) {
        clearInterval(this.intervaloReloj);
        this.generarReporteFinal();
      }
      return;
    }

    // 1. Ejecutar CPU
    if (this.procesoEnCPU) {
      this.procesoEnCPU.ejecutar(1);
      if (this.esApropiativo) this.quantumActual--;
    }

    // 2. Evaluar Cambios de Contexto
    let requiereCambio = false;

    if (this.procesoEnCPU) {
      if (this.procesoEnCPU.estado === "Terminado") {
        this.log(`✅ Proceso P${this.procesoEnCPU.id} ha terminado con éxito.`);
        this.colaTerminados.push(this.procesoEnCPU);
        this.procesoEnCPU = null;
        requiereCambio = true;
      } else if (Math.random() < window.AppConfig.simulador.probInterrupcion) {
        this.log(
          `🛑 ¡INTERRUPCIÓN! P${this.procesoEnCPU.id} se bloquea y es sacado del CPU.`,
          "alerta-inanicion",
        );
        this.procesoEnCPU.estado = "Bloqueado";

        if (this.procesoEnCPU.peticionesHHDD.length === 0) {
          this.procesoEnCPU.generarPeticionesIniciales();
          this.log(
            `Se generaron nuevas peticiones a HHDD para P${this.procesoEnCPU.id}`,
          );
        }

        this.colaListos.push(this.procesoEnCPU);
        this.procesoEnCPU = null;
        requiereCambio = true;
      } else if (
        !requiereCambio &&
        this.esApropiativo &&
        this.quantumActual <= 0
      ) {
        this.log(
          `⏳ Quantum agotado para P${this.procesoEnCPU.id}. Vuelve a Listos.`,
        );
        this.procesoEnCPU.estado = "Listo";
        this.colaListos.push(this.procesoEnCPU);
        this.procesoEnCPU = null;
        requiereCambio = true;
      }
    } else {
      requiereCambio = true;
    }

    // 4. Obtener siguiente proceso mediante el Algoritmo
    if (requiereCambio && this.colaListos.length > 0) {
      let siguiente = null;
      let fallaronDesbloqueo = [];

      while (this.colaListos.length > 0) {
        let candidato = this.algoritmo.obtenerSiguiente(
          this.colaListos,
          this.procesoEnCPU,
        );

        if (!candidato) break;

        // Extraemos al candidato de la lista
        this.colaListos = this.colaListos.filter((p) => p.id !== candidato.id);

        if (candidato.estado === "Bloqueado") {
          this.log(
            `Le toca turno a P${candidato.id} pero está Bloqueado. Entregando a SES-HHDD.`,
          );
          this.procesoEnDisco = candidato;
          this.sesHHDD.iniciar(candidato);

          fallaronDesbloqueo.push(candidato);
          break;
        } else {
          siguiente = candidato;
          break;
        }
      }

      this.colaListos = [...this.colaListos, ...fallaronDesbloqueo];

      if (siguiente) {
        this.procesoEnCPU = siguiente;
        this.procesoEnCPU.estado = "EnCPU";
        this.procesoEnCPU.vecesEnCPU++;
        this.estadisticas.cambiosContexto++;
        this.quantumActual = this.quantumMaximo;
        this.log(`Proceso P${this.procesoEnCPU.id} entra al procesador.`);
      }
    }

    this.dibujarGantt(false);
    this.actualizarUI();

    if (this.verificarFinSimulacion()) {
      clearInterval(this.intervaloReloj);
      this.generarReporteFinal();
    }
  }

  dibujarGantt(enDisco = false) {
    const timeline = document.getElementById("gantt-timeline");
    const bloque = document.createElement("div");
    bloque.className = "gantt-block";

    bloque.style.cursor = "help";

    if (enDisco && this.procesoEnDisco) {
      bloque.textContent = `I/O`;
      bloque.style.backgroundColor = "var(--color-nuevo)";
      bloque.title = `T=${this.reloj} | P${this.procesoEnDisco.id} usando el Disco Duro`;
    } else if (this.procesoEnCPU) {
      bloque.textContent = `P${this.procesoEnCPU.id}`;
      bloque.style.backgroundColor = "var(--color-cpu)";
      bloque.title = `T=${this.reloj} | P${this.procesoEnCPU.id} en CPU`;
    } else {
      bloque.classList.add("vacio");
      bloque.title = `T=${this.reloj} | CPU Inactiva`;
    }

    timeline.appendChild(bloque);

    timeline.scrollLeft = timeline.scrollWidth;
  }

  log(mensaje, claseCss = "") {
    const consola = document.getElementById("lista-logs");
    const div = document.createElement("div");

    let icono = "👉";
    if (mensaje.includes("Iniciando") || mensaje.includes("Listo"))
      icono = "🟢";
    else if (mensaje.includes("entra al procesador") || mensaje.includes("CPU"))
      icono = "⚡";
    else if (mensaje.includes("INTERRUPCIÓN") || mensaje.includes("Bloqueado"))
      icono = "🔴";
    else if (
      mensaje.includes("SES-HHDD") ||
      mensaje.includes("sector") ||
      mensaje.includes("petición")
    )
      icono = "💿";
    else if (mensaje.includes("terminado") || mensaje.includes("finalizó"))
      icono = "✅";
    else if (mensaje.includes("Quantum")) icono = "⏳";

    let mensajeLimpio = mensaje.replace(/✅|🛑|⏳|⚠/g, "").trim();

    div.innerHTML = `<span style="color: #64748b; font-weight: bold;">[T=${this.reloj.toString().padStart(2, "0")}]</span> ${icono} ${mensajeLimpio}`;

    if (claseCss) div.className = claseCss;

    consola.appendChild(div);

    consola.scrollTop = consola.scrollHeight;
  }

  actualizarUI() {
    document.getElementById("reloj").textContent = this.reloj;
    document.getElementById("tiempo-maximo").textContent = this.tiempoMonitoreo;
    document.getElementById("quantum-display").textContent = this.esApropiativo
      ? `${this.quantumActual} / ${this.quantumMaximo}`
      : "N/A";

    this.procesosTotales.forEach((p) => {
      p.actualizarUI();

      const tarjeta = p.elementoTarjeta;
      if (tarjeta) {
        let idContenedor = "";

        if (this.procesoEnDisco && this.procesoEnDisco.id === p.id) {
          idContenedor = "contenedor-cpu"; 
        } else if (p.estado === "EnCPU") {
          idContenedor = "contenedor-cpu";
        } else if (p.estado === "Listo") {
          idContenedor = "contenedor-listos";
        } else if (p.estado === "Bloqueado") {
          idContenedor = "contenedor-bloqueados";
        } else if (p.estado === "Terminado" || p.estado === "Muerto") {
          idContenedor = "contenedor-terminados";
        }

        const contenedor = document.getElementById(idContenedor);
        if (contenedor && tarjeta.parentElement !== contenedor) {
          contenedor.appendChild(tarjeta);
        }
      }
    });
  }

  verificarFinSimulacion() {
    const todosTerminados = this.procesosTotales.every(
      (p) => p.estado === "Terminado" || p.estado === "Muerto",
    );
    const tiempoAgotado = this.reloj >= this.tiempoMonitoreo;

    if (tiempoAgotado && !this.banderaTiempoFinalizado) {
      this.log("¡Tiempo de monitoreo finalizado!");
      this.banderaTiempoFinalizado = true;
    }

    if (todosTerminados && !this.banderaTodosTerminados) {
      this.log("¡Todos los procesos han finalizado!");
      this.banderaTodosTerminados = true;
    }

    return todosTerminados || tiempoAgotado;
  }

  generarReporteFinal() {
    const finalizados = this.procesosTotales
      .filter((p) => p.estado === "Terminado" || p.estado === "Muerto")
      .map((p) => (p.estado === "Muerto" ? `${p.id} (Muerto)` : p.id));

    const nuncaEjecutados = this.procesosTotales
      .filter((p) => !p.ejecutadoAlgunaVez)
      .map((p) => p.id);

    const enEjecucion = this.procesoEnCPU ? [this.procesoEnCPU.id] : [];
    const enEspera = [...this.colaListos, ...this.colaBloqueados].filter(
      (p) => p.estado !== "Muerto",
    );

    const contenedor = document.getElementById("datos-reporte");

    contenedor.innerHTML = `
            <ul>
                <li><strong>Procesos terminados:</strong> ${finalizados.length > 0 ? finalizados.join(", ") : "Ninguno"}</li>
                <li><strong>Procesos que nunca se ejecutaron:</strong> ${nuncaEjecutados.length > 0 ? nuncaEjecutados.join(", ") : "Ninguno"}</li>
                <li><strong>Cantidad de procesos aún en ejecución o en colas:</strong> ${enEjecucion.length + enEspera.length}</li>
                <li><strong>Cantidad de cambios de procesos registrados:</strong> ${this.estadisticas.cambiosContexto}</li>
            </ul>
            <h3 style="margin-top: 15px; color: var(--color-nuevo);">Métricas del Subsistema de Disco</h3>
            <ul>
                <li><strong>Retardo de Giro Rotacional Total:</strong> ${this.sesHHDD.totalRetardoRotacional} u.</li>
                <li><strong>Tiempo de Transferencia Total:</strong> ${this.sesHHDD.totalTiempoTransferencia} u.</li>
            </ul>
        `;
    document.getElementById("reporte-final").style.display = "block";
  }

  guardarEstado() {
    const rutaClonada = this.sesHHDD.rutaPuntos
      ? [...this.sesHHDD.rutaPuntos]
      : [];
    const peticionClonada = this.sesHHDD.peticionActual
      ? { ...this.sesHHDD.peticionActual }
      : null;

    const estado = {
      reloj: this.reloj,
      quantumActual: this.quantumActual,
      estadisticas: JSON.parse(JSON.stringify(this.estadisticas)),

      procesos: this.procesosTotales.map((p) => p.clonar()),

      colaListosIds: this.colaListos.map((p) => p.id),
      colaBloqueadosIds: this.colaBloqueados.map((p) => p.id),
      colaTerminadosIds: this.colaTerminados.map((p) => p.id),
      procesoEnCPUId: this.procesoEnCPU ? this.procesoEnCPU.id : null,
      procesoEnDiscoId: this.procesoEnDisco ? this.procesoEnDisco.id : null,

      logHTML: document.getElementById("lista-logs").innerHTML,
      ganttHTML: document.getElementById("gantt-timeline").innerHTML,

      discoCabezaActual: this.sesHHDD.cabezaActual,
      discoCabezaDestino: this.sesHHDD.cabezaDestino,
      discoTiempoTransf: this.sesHHDD.tiempoTransferenciaRestante,
      discoRetardoTotal: this.sesHHDD.totalRetardoRotacional,
      discoTransfTotal: this.sesHHDD.totalTiempoTransferencia,
      discoRuta: rutaClonada,
      discoPeticion: peticionClonada,

      discoTrackHTML: document.getElementById("disco-track").innerHTML,
      discoHeadLeft: document.getElementById("disco-head").style.left,
      discoLabelProceso: document.getElementById("disco-proceso-label")
        .textContent,
      discoLabelAlgo: document.getElementById("disco-algo-label").textContent,
      discoLabelPeticion: document.getElementById("disco-peticion-label")
        .textContent,
    };

    if (this.historial.length > 50) this.historial.shift();
    this.historial.push(estado);
  }

  pasoAnterior() {
    if (this.historial.length === 0) return;

    const estadoAnterior = this.historial.pop();

    // 1. Restaurar tiempos y estadísticas
    this.reloj = estadoAnterior.reloj;
    this.quantumActual = estadoAnterior.quantumActual;
    this.estadisticas = estadoAnterior.estadisticas;

    // 2. Restaurar el arreglo principal de procesos
    this.procesosTotales = estadoAnterior.procesos;

    // 3. Reconstruir las colas y punteros enlazando con los procesos restaurados
    this.colaListos = estadoAnterior.colaListosIds.map((id) =>
      this.procesosTotales.find((p) => p.id === id),
    );
    this.colaBloqueados = estadoAnterior.colaBloqueadosIds.map((id) =>
      this.procesosTotales.find((p) => p.id === id),
    );
    this.colaTerminados = estadoAnterior.colaTerminadosIds.map((id) =>
      this.procesosTotales.find((p) => p.id === id),
    );

    this.procesoEnCPU = estadoAnterior.procesoEnCPUId
      ? this.procesosTotales.find((p) => p.id === estadoAnterior.procesoEnCPUId)
      : null;
    this.procesoEnDisco = estadoAnterior.procesoEnDiscoId
      ? this.procesosTotales.find(
          (p) => p.id === estadoAnterior.procesoEnDiscoId,
        )
      : null;

    // 4. Restaurar el cerebro del motor SESHHDD
    this.sesHHDD.cabezaActual = estadoAnterior.discoCabezaActual;
    this.sesHHDD.cabezaDestino = estadoAnterior.discoCabezaDestino;
    this.sesHHDD.tiempoTransferenciaRestante = estadoAnterior.discoTiempoTransf;
    this.sesHHDD.totalRetardoRotacional = estadoAnterior.discoRetardoTotal;
    this.sesHHDD.totalTiempoTransferencia = estadoAnterior.discoTransfTotal;
    this.sesHHDD.rutaPuntos = estadoAnterior.discoRuta;
    this.sesHHDD.peticionActual = estadoAnterior.discoPeticion;
    // Volvemos a enlazar al proceso que estaba usando el disco
    this.sesHHDD.procesoActual = this.procesoEnDisco;

    // 5. Restaurar el HTML de las terminales
    document.getElementById("lista-logs").innerHTML = estadoAnterior.logHTML;
    document.getElementById("gantt-timeline").innerHTML =
      estadoAnterior.ganttHTML;

    // 6. Restaurar la UI animada del Disco Duro
    document.getElementById("disco-track").innerHTML =
      estadoAnterior.discoTrackHTML;
    document.getElementById("disco-head").style.left =
      estadoAnterior.discoHeadLeft;
    document.getElementById("disco-proceso-label").textContent =
      estadoAnterior.discoLabelProceso;
    document.getElementById("disco-algo-label").textContent =
      estadoAnterior.discoLabelAlgo;
    document.getElementById("disco-peticion-label").textContent =
      estadoAnterior.discoLabelPeticion;

    // 7. Llamar a actualizarUI mueve las tarjetas a su posición anterior
    this.actualizarUI();
  }

  togglePausa() {
    this.pausado = !this.pausado;
    return this.pausado;
  }

  pasoSiguiente() {
    if (this.pausado && !this.verificarFinSimulacion()) {
      this.cicloDeReloj();
    }
  }
}
