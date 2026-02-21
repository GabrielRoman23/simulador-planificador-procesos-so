// js/Simulador.js

class Simulador {
    constructor(algoritmo, esApropiativo) {
        this.algoritmo = algoritmo;
        this.esApropiativo = esApropiativo;
        
        this.reloj = 0;
        this.tiempoMonitoreo = Math.floor(Math.random() * (35 - 20 + 1)) + 20; 
        this.quantumMaximo = this.esApropiativo ? Math.floor(Math.random() * (5 - 2 + 1)) + 2 : null;
        this.quantumActual = this.quantumMaximo;

        // Estructuras de datos lógicas
        this.procesosTotales = [];
        this.colaListos = [];
        this.colaBloqueados = [];
        this.colaTerminados = [];
        this.procesoEnCPU = null;

        this.estadisticas = {
            cambiosContexto: 0,
            procesosNuncaEjecutados: [],
        };

        this.intervaloReloj = null;
        this.pausado = false;
        this.historial = [];  
    }

    inicializar() {
        const numProcesos = Math.floor(Math.random() * 10) + 1;
        this.log(`Iniciando simulación con ${numProcesos} procesos. Tiempo máximo: ${this.tiempoMonitoreo}u.`);
        if (this.esApropiativo) this.log(`Modo Apropiativo. Quantum: ${this.quantumMaximo}`);

        for (let i = 1; i <= numProcesos; i++) {
            const p = new Proceso(i);
            this.procesosTotales.push(p);
            
            // Renderizamos la fila en la tabla del HTML
            const uiFila = p.crearElementoUI();
            document.getElementById("pcb-body").appendChild(uiFila);
            
            if (p.estado === "Listo") {
                this.colaListos.push(p);
            } else {
                this.colaBloqueados.push(p);
            }
        }
        this.actualizarUI();
    }

    iniciarSimulacion() {
        this.inicializar();
        this.intervaloReloj = setInterval(() => {
            if (!this.pausado) {
                this.cicloDeReloj();
            }
        }, 1000); 
    }

    cicloDeReloj() {
        this.guardarEstado();
        this.reloj++;
        
        // 1. Procesar Bloqueados
        this.procesarBloqueados();

        // 2. Ejecutar CPU
        if (this.procesoEnCPU) {
            this.procesoEnCPU.ejecutar(1);
            if (this.esApropiativo) this.quantumActual--;
        }

        // 3. Evaluar Cambios de Contexto
        let requiereCambio = false;

        if (this.procesoEnCPU) {
            if (this.procesoEnCPU.estado === "Terminado") {
                this.log(`Proceso P${this.procesoEnCPU.id} ha terminado.`);
                this.colaTerminados.push(this.procesoEnCPU);
                this.procesoEnCPU = null;
                requiereCambio = true;
            } else if (this.esApropiativo && this.quantumActual === 0) {
                this.log(`Quantum agotado para P${this.procesoEnCPU.id}. Vuelve a Listos.`);
                this.procesoEnCPU.estado = "Listo"; // Cambiamos estado para que la tabla lo refleje
                this.colaListos.push(this.procesoEnCPU);
                this.procesoEnCPU = null;
                requiereCambio = true;
            }
        } else {
            requiereCambio = true;
        }

        // 4. Obtener siguiente proceso mediante el Algoritmo
        if (requiereCambio && this.colaListos.length > 0) {
            const siguiente = this.algoritmo.obtenerSiguiente(this.colaListos, this.procesoEnCPU);
            
            if (siguiente) {
                this.procesoEnCPU = siguiente;
                this.procesoEnCPU.estado = "EnCPU"; // Nuevo estado visual para la tabla
                this.colaListos = this.colaListos.filter(p => p.id !== siguiente.id); 
                
                this.estadisticas.cambiosContexto++; 
                this.quantumActual = this.quantumMaximo; 
                this.log(`Proceso P${this.procesoEnCPU.id} entra al procesador.`);
            }
        }

        // 5. Dibujar en el Diagrama de Gantt
        this.dibujarGantt();

        // 6. Actualizar visualmente toda la tabla
        this.actualizarUI();

        // 7. Condición de Parada
        if (this.verificarFinSimulacion()) {
            clearInterval(this.intervaloReloj);
            this.generarReporteFinal();
        }
    }

    procesarBloqueados() {
        for (let i = this.colaBloqueados.length - 1; i >= 0; i--) {
            const p = this.colaBloqueados[i];
            const resultado = p.intentarDesbloqueo();
            
            this.log(resultado.mensaje, resultado.estado === "Inanicion" ? "alerta-inanicion" : "");

            if (resultado.estado === "Desbloqueado") {
                this.colaBloqueados.splice(i, 1);
                this.colaListos.push(p);
            } else if (resultado.estado === "Inanicion") {
                this.colaBloqueados.splice(i, 1);
                this.colaTerminados.push(p);
            }
        }
    }

    dibujarGantt() {
        const timeline = document.getElementById("gantt-timeline");
        const bloque = document.createElement("div");
        bloque.className = "gantt-block";
        
        if (this.procesoEnCPU) {
            bloque.textContent = `P${this.procesoEnCPU.id}`;
            bloque.style.backgroundColor = "var(--color-cpu)";
        } else {
            bloque.classList.add("vacio");
        }
        timeline.appendChild(bloque);
    }

    log(mensaje, claseCss = "") {
        const consola = document.getElementById("lista-logs");
        const div = document.createElement("div");
        div.textContent = `[T=${this.reloj}] ${mensaje}`;
        if (claseCss) div.className = claseCss;
        consola.prepend(div);
    }

    actualizarUI() {
        document.getElementById("reloj").textContent = this.reloj;
        document.getElementById("tiempo-maximo").textContent = this.tiempoMonitoreo;
        document.getElementById("quantum-display").textContent = this.esApropiativo ? this.quantumActual : "N/A";
        document.getElementById("quantum-display").textContent = this.esApropiativo ? `${this.quantumActual} / ${this.quantumMaximo}` : "N/A";
        
        // Actualizamos cada fila de la tabla para reflejar los nuevos tiempos y estados
        this.procesosTotales.forEach(p => p.actualizarUI());
    }

    verificarFinSimulacion() {
        const todosTerminados = this.procesosTotales.every(p => p.estado === "Terminado" || p.estado === "Muerto");
        const tiempoAgotado = this.reloj >= this.tiempoMonitoreo;
        
        if (tiempoAgotado) this.log("¡Tiempo de monitoreo finalizado!");
        if (todosTerminados) this.log("¡Todos los procesos han finalizado!");

        return todosTerminados || tiempoAgotado;
    }

    generarReporteFinal() {
        const finalizados = this.procesosTotales.filter(p => p.estado === "Terminado").map(p => p.id);
        const nuncaEjecutados = this.procesosTotales.filter(p => !p.ejecutadoAlgunaVez).map(p => p.id);
        const enEjecucion = this.procesoEnCPU ? [this.procesoEnCPU.id] : [];
        const enListosOBloqueados = [...this.colaListos, ...this.colaBloqueados].map(p => p.id);

        const contenedor = document.getElementById("datos-reporte");
        contenedor.innerHTML = `
            <ul>
                <li><strong>Procesos terminados:</strong> ${finalizados.length > 0 ? finalizados.join(", ") : "Ninguno"}</li>
                <li><strong>Procesos que nunca se ejecutaron:</strong> ${nuncaEjecutados.length > 0 ? nuncaEjecutados.join(", ") : "Ninguno"}</li>
                <li><strong>Cantidad de procesos aún en ejecución o listos/bloqueados:</strong> ${enEjecucion.length + enListosOBloqueados.length}</li>
                <li><strong>Cantidad de cambios de procesos registrados:</strong> ${this.estadisticas.cambiosContexto}</li>
            </ul>
        `;
        document.getElementById("reporte-final").style.display = "block";
    }

    // --- NUEVOS MÉTODOS DE CONTROL ---

    guardarEstado() {
        const estado = {
            reloj: this.reloj,
            quantumActual: this.quantumActual,
            estadisticas: JSON.parse(JSON.stringify(this.estadisticas)),
            
            // Clonamos los objetos proceso para no perder sus datos antiguos
            procesos: this.procesosTotales.map(p => p.clonar()),
            
            // Guardamos quién estaba en qué cola usando sus IDs
            colaListosIds: this.colaListos.map(p => p.id),
            colaBloqueadosIds: this.colaBloqueados.map(p => p.id),
            colaTerminadosIds: this.colaTerminados.map(p => p.id),
            procesoEnCPUId: this.procesoEnCPU ? this.procesoEnCPU.id : null,
            
            // Guardamos el HTML de la consola y el Gantt
            logHTML: document.getElementById("lista-logs").innerHTML,
            ganttHTML: document.getElementById("gantt-timeline").innerHTML
        };
        this.historial.push(estado);
    }

    pasoAnterior() {
        if (this.historial.length === 0) return;
        
        // Sacamos la última foto
        const estadoAnterior = this.historial.pop();
        
        // Restauramos contadores
        this.reloj = estadoAnterior.reloj;
        this.quantumActual = estadoAnterior.quantumActual;
        this.estadisticas = estadoAnterior.estadisticas;
        
        // Restauramos procesos y colas
        this.procesosTotales = estadoAnterior.procesos;
        this.colaListos = estadoAnterior.colaListosIds.map(id => this.procesosTotales.find(p => p.id === id));
        this.colaBloqueados = estadoAnterior.colaBloqueadosIds.map(id => this.procesosTotales.find(p => p.id === id));
        this.colaTerminados = estadoAnterior.colaTerminadosIds.map(id => this.procesosTotales.find(p => p.id === id));
        this.procesoEnCPU = estadoAnterior.procesoEnCPUId ? this.procesosTotales.find(p => p.id === estadoAnterior.procesoEnCPUId) : null;
        
        // Restauramos el DOM visual (Consola y Gantt)
        document.getElementById("lista-logs").innerHTML = estadoAnterior.logHTML;
        document.getElementById("gantt-timeline").innerHTML = estadoAnterior.ganttHTML;
        
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