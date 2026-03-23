class SESHHDD {
    constructor(simulador, idAlgoritmo) {
        this.simulador = simulador;
        
        switch(idAlgoritmo) {
            case "sstf": this.algoritmo = new SSTF(); break;
            case "scan": this.algoritmo = new SCAN(); break;
            case "cscan": this.algoritmo = new CSCAN(); break;
            case "fscan": this.algoritmo = new FSCAN(); break;
            default: this.algoritmo = new SSTF();
        }
        
        this.cabezaActual = 0; 
        this.cabezaDestino = 0; 
        this.rutaPuntos = [];
        
        this.procesoActual = null;
        this.peticionActual = null;
        
        this.tiempoTransferenciaRestante = 0;
        this.totalRetardoRotacional = 0;
        this.totalTiempoTransferencia = 0;
    }

    iniciar(proceso) {
        this.procesoActual = proceso;
        this.simulador.log(`[SES-HHDD] Iniciando atención a P${proceso.id} mediante ${this.algoritmo.nombre}`);
        this.prepararSiguientePeticion();
    }

    prepararSiguientePeticion() {
        this.peticionActual = this.algoritmo.obtenerSiguiente(this.procesoActual.peticionesHHDD, this.cabezaActual);
        
        if (!this.peticionActual) {
            if(this.procesoActual.peticionesHHDD.length === 0 && (!this.algoritmo.colaActual || this.algoritmo.colaActual.length === 0)) {
                this.finalizarAtencion();
                return;
            } else {
                this.peticionActual = this.algoritmo.obtenerSiguiente(this.procesoActual.peticionesHHDD, this.cabezaActual);
            }
        }

        if (this.peticionActual) {
            this.procesoActual.peticionEnCurso = this.peticionActual;
        }

        this.rutaPuntos = this.algoritmo.obtenerRuta(this.cabezaActual, this.peticionActual);
        this.cabezaDestino = this.rutaPuntos.shift();

        this.tiempoTransferenciaRestante = this.peticionActual.tipo === 'L' ? 1 : 2;
        
        this.simulador.log(`[SES-HHDD] Nueva petición objetivo: Sector ${this.peticionActual.sector} [${this.peticionActual.tipo}]`);

        document.getElementById("disco-proceso-label").textContent = `P${this.procesoActual.id}`;
        document.getElementById("disco-algo-label").textContent = this.algoritmo.nombre;
        document.getElementById("disco-peticion-label").textContent = `Sector ${this.peticionActual.sector} (${this.peticionActual.tipo === 'L' ? 'Lectura' : 'Escritura'})`;

        document.querySelectorAll('.sector').forEach(s => {
            s.classList.remove('activo-lectura', 'activo-escritura', 'sector-destino');
        });
        
        const sectorUI = document.getElementById(`sector-vis-${this.peticionActual.sector}`);
        if (sectorUI) {
            sectorUI.classList.add('sector-destino');
        }

        if (this.cabezaActual === this.cabezaDestino) {
            this.avanzarRutaOIniciarTransferencia();
        }
    }

    avanzarRutaOIniciarTransferencia() {
        if (this.rutaPuntos.length > 0) {
            this.cabezaDestino = this.rutaPuntos.shift();
            this.simulador.log(`[SES-HHDD] Punto de ruta alcanzado. Rebotando hacia el sector ${this.cabezaDestino}...`);
        } else {
            const sectorUI = document.getElementById(`sector-vis-${this.cabezaActual}`);
            if (sectorUI) {
                sectorUI.classList.remove('sector-destino');
                sectorUI.classList.add(this.peticionActual.tipo === 'L' ? 'activo-lectura' : 'activo-escritura');
            }
        }
    }

    ciclo() {
        const cfgD = window.AppConfig.disco;
        if (this.cabezaActual !== this.cabezaDestino) {
            if (this.cabezaActual < this.cabezaDestino) {
                this.cabezaActual++;
            } else {
                this.cabezaActual--;
            }
            
            this.totalRetardoRotacional++;
            
            let porcentajeLeft = this.cabezaActual === 0 ? 0 : ((this.cabezaActual - 0.5) / 20) * 100;
            document.getElementById("disco-head").style.left = `${porcentajeLeft}%`;
            
            if(this.cabezaActual % 5 === 0) {
                 this.simulador.log(`[SES-HHDD] Barrido de cabeza... pasando por sector ${this.cabezaActual}`);
            }
            
            if (this.cabezaActual === this.cabezaDestino) {
                this.avanzarRutaOIniciarTransferencia();
            }

        } else if (this.tiempoTransferenciaRestante > 0) {
            this.tiempoTransferenciaRestante--;
            this.totalTiempoTransferencia++;
            this.simulador.log(`[SES-HHDD] Transfiriendo en sector ${this.cabezaActual} (${this.tiempoTransferenciaRestante}u restantes)`);
        }
        
        if (this.cabezaActual === this.cabezaDestino && this.tiempoTransferenciaRestante === 0 && this.rutaPuntos.length === 0) {
            this.simulador.log(`[SES-HHDD] ✅ P${this.procesoActual.id} completó petición en sector ${this.cabezaActual}.`);
            this.procesoActual.peticionesAtendidas++;
            
            if (Math.random() < cfgD.probNuevasPeticiones) {
                const nuevas = Math.floor(Math.random() * (cfgD.nuevasPetMax - cfgD.nuevasPetMin + 1)) + cfgD.nuevasPetMin;
                const peticionesAntes = this.procesoActual.peticionesHHDD.length;
                this.procesoActual.agregarNuevasPeticiones(nuevas);
                
                const creadas = this.procesoActual.peticionesHHDD.length - peticionesAntes;
                if(creadas > 0) {
                    this.simulador.log(`[SES-HHDD] ⚠ P${this.procesoActual.id} generó ${creadas} NUEVAS peticiones al disco.`);
                }
            }
            
            this.prepararSiguientePeticion();
        }
    }

    finalizarAtencion() {
        this.simulador.log(`[SES-HHDD] P${this.procesoActual.id} finalizó sus peticiones. Vuelve a Listo.`, "estado-Listo");
        
        this.procesoActual.peticionEnCurso = null; 
        this.procesoActual.estado = "Listo";
        this.procesoActual = null;
        this.simulador.procesoEnDisco = null; 
        
        document.getElementById("disco-proceso-label").textContent = "Ninguno";
        document.getElementById("disco-peticion-label").textContent = "Ninguna";
        document.querySelectorAll('.sector').forEach(s => s.classList.remove('activo-lectura', 'activo-escritura', 'sector-destino'));
    }
}