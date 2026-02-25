class Proceso {
    constructor(id) {
        this.id = id;
        
        //Tiempo restante aleatorio entre 3 y 10 unidades
        this.tiempoRestante = Math.floor(Math.random() * (10 - 3 + 1)) + 3;
        this.tiempoOriginal = this.tiempoRestante; // Guardamos el original para estadísticas
        
        // Requisito: Estado inicial aleatorio (1 = Listo, 2 = Bloqueado)
        const estadoAleatorio = Math.floor(Math.random() * 2) + 1;
        this.estado = estadoAleatorio === 1 ? "Listo" : "Bloqueado";
        
        // Requisito: Prioridades, boletos, usuarios, etc.
        this.prioridad = Math.floor(Math.random() * 5) + 1; // Prioridad 5 (alta) a 1 (baja)
        this.boletos = Math.floor(Math.random() * 10) + 1; // Para Lotería (1 a 10 boletos)
        this.usuario = `Usuario_${Math.floor(Math.random() * 3) + 1}`; // Para Participación Equitativa
        
        // Variables de control para los algoritmos
        this.vecesEnCPU = 0; // Multiplicador para Múltiples Colas
        this.intentosFallidosDesbloqueo = 0; // Control de inanición
        this.ejecutadoAlgunaVez = false; // Para reporte final: Procesos que nunca entraron en ejecución
        
        // Elemento DOM asociado
        this.elementoDOM = null;
    }

    // Método para manejar el desbloqueo (5 puntos de la rúbrica)
    intentarDesbloqueo() {
        if (this.estado !== "Bloqueado") return false;

        // Genera 0 o 1 aleatoriamente
        const exito = Math.floor(Math.random() * 2); 

        if (exito === 1) {
            this.estado = "Listo";
            this.intentosFallidosDesbloqueo = 0; // Se resetea si logra salir
            return { estado: "Desbloqueado", mensaje: `Proceso ${this.id}: Cambió de estado a Listo.` };
        } else {
            this.intentosFallidosDesbloqueo++;
            // Si falla 3 veces, muere por inanición
            if (this.intentosFallidosDesbloqueo >= 3) {
                this.estado = "Muerto";
                return { estado: "Inanicion", mensaje: `Muerte del proceso ${this.id} por inanición¹` };
            }
            return { estado: "SigueBloqueado", mensaje: `Proceso ${this.id}: Intento de desbloqueo fallido (${this.intentosFallidosDesbloqueo}/3).` };
        }
    }

    // Método para simular ejecución en CPU
    ejecutar(tiempo) {
        this.ejecutadoAlgunaVez = true;
        this.vecesEnCPU++;
        this.tiempoRestante -= tiempo;
        if (this.tiempoRestante <= 0) {
            this.tiempoRestante = 0;
            this.estado = "Terminado";
        }
    }

    crearElementoUI() {
        const tr = document.createElement("tr"); // Ahora es una fila de tabla
        tr.id = `ui-proceso-${this.id}`;
        
        this.elementoDOM = tr; 
        this.actualizarUI(tr);
        return tr;
    }

    actualizarUI(elemento = this.elementoDOM) {
        if (!elemento) return;
        
        // Mapeamos el estado a las clases CSS que creamos
        let claseEstado = `estado-${this.estado === "Muerto" ? "Muerto" : this.estado}`;
        
        // Llenamos las columnas de la tabla con los datos del proceso
        elemento.innerHTML = `
            <td><strong>P${this.id}</strong></td>
            <td class="${claseEstado}">${this.estado}</td>
            <td>${this.tiempoRestante} / ${this.tiempoOriginal} u.</td>
            <td>${this.prioridad}</td>
            <td>${this.boletos}</td>
            <td>${this.usuario}</td>
        `;
    }

    obtenerColorPorEstado() {
        switch(this.estado) {
            case "Listo": return "var(--color-listo)";
            case "Bloqueado": return "var(--color-bloqueado)";
            case "Terminado": return "var(--color-terminado)";
            case "Muerto": return "var(--color-inanicion)";
            default: return "transparent";
        }
    }

    clonar() {
        const clon = new Proceso(this.id);
        clon.tiempoRestante = this.tiempoRestante;
        clon.tiempoOriginal = this.tiempoOriginal;
        clon.estado = this.estado;
        clon.prioridad = this.prioridad;
        clon.boletos = this.boletos;
        clon.usuario = this.usuario;
        clon.vecesEnCPU = this.vecesEnCPU;
        clon.intentosFallidosDesbloqueo = this.intentosFallidosDesbloqueo;
        clon.ejecutadoAlgunaVez = this.ejecutadoAlgunaVez;
        
        // Mantenemos la referencia a la misma fila de la tabla del DOM
        clon.elementoDOM = this.elementoDOM; 
        return clon;
    }
}