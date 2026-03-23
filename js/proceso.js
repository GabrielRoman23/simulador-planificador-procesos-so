class Proceso {
  constructor(id) {
    const cfgP = window.AppConfig.proceso;
    this.id = id;

    this.tiempoRestante = Math.floor(Math.random() * (cfgP.tiempoMax - cfgP.tiempoMin + 1)) + cfgP.tiempoMin;
    this.tiempoOriginal = this.tiempoRestante;

    const estadoAleatorio = Math.floor(Math.random() * 2) + 1;
    this.estado = Math.random() < cfgP.probBloqueadoInicial ? "Bloqueado" : "Listo";

    this.prioridad = Math.floor(Math.random() * 5) + 1;
    this.boletos = Math.floor(Math.random() * 10) + 1;
    this.usuario = `Usuario_${Math.floor(Math.random() * 3) + 1}`;

    this.peticionesHHDD = [];
    this.peticionesAtendidas = 0;
    this.peticionEnCurso = null;

    if (this.estado === "Bloqueado") {
      this.generarPeticionesIniciales();
    }

    this.vecesEnCPU = 0;
    this.ejecutadoAlgunaVez = false;
    this.elementoDOM = null;
    this.elementoTarjeta = null;
  }

  /**
   * Genera peticiones iniciales si el proceso nace bloqueado.
   */
  generarPeticionesIniciales() {
    const cfgP = window.AppConfig.proceso;
    const cantidad = Math.floor(Math.random() * (cfgP.petInicialesMax - cfgP.petInicialesMin + 1)) + cfgP.petInicialesMin;
    this.agregarNuevasPeticiones(cantidad);
  }

  /**
   * Agrega nuevas peticiones dinámicamente.
   * Sectores del 1-20, Lectura (L) o Escritura (E), no repetidas pendientes, máximo 10 en total.
   * @param {number} cantidadDeseada - Número de peticiones a intentar generar.
   */
  agregarNuevasPeticiones(cantidadDeseada) {
    const cfgD = window.AppConfig.disco;
    let generadas = 0;

    while (
      generadas < cantidadDeseada &&
      this.peticionesHHDD.length + this.peticionesAtendidas < 10
    ) {
      const sectorAleatorio = Math.floor(Math.random() * 20) + 1;
      const tipo = Math.random() < cfgD.probLectura ? "L" : "E";

      const sectorYaPendiente = this.peticionesHHDD.some(
        (p) => p.sector === sectorAleatorio,
      );

      if (!sectorYaPendiente) {
        this.peticionesHHDD.push({ sector: sectorAleatorio, tipo: tipo });
        generadas++;
      }
    }
  }

  /**
   * Retorna un string formateado con las peticiones pendientes para la UI (Ej: "3L, 14E").
   */
  obtenerStringPeticiones() {
    let pendientes =
      this.peticionesHHDD.length > 0
        ? this.peticionesHHDD.map((p) => `${p.sector}${p.tipo}`).join(", ")
        : "-";

    if (this.peticionEnCurso) {
      return `<span style="color: #10b981;">[🔄 ${this.peticionEnCurso.sector}${this.peticionEnCurso.tipo}]</span> ${pendientes}`;
    }
    return pendientes;
  }

  ejecutar(tiempo) {
    this.ejecutadoAlgunaVez = true;
    this.tiempoRestante -= tiempo;
    if (this.tiempoRestante <= 0) {
      this.tiempoRestante = 0;
      this.estado = "Terminado";
    }
  }

  crearElementoUI() {
    const tr = document.createElement("tr");
    tr.id = `ui-proceso-${this.id}`;
    this.elementoDOM = tr;
    this.actualizarUI(tr);
    return tr;
  }

  crearTarjetaUI() {
    const div = document.createElement("div");
    div.className = "proceso-card";
    div.id = `tarjeta-proceso-${this.id}`;
    this.elementoTarjeta = div;
    this.actualizarTarjeta();
    return div;
  }

  actualizarTarjeta() {
    if (!this.elementoTarjeta) return;
    this.elementoTarjeta.style.borderLeftColor = this.obtenerColorPorEstado();

    const porcentaje =
      ((this.tiempoOriginal - this.tiempoRestante) / this.tiempoOriginal) * 100;

    this.elementoTarjeta.innerHTML = `
            <strong>P${this.id} (${this.estado})</strong>
            <div class="detalle">
                <span>⏳ T: ${this.tiempoRestante}/${this.tiempoOriginal}</span>
                <span>⭐ Prio: ${this.prioridad}</span>
            </div>
            <div style="width: 100%; background-color: #0f172a; height: 6px; border-radius: 3px; margin-top: 6px; overflow: hidden;">
                <div style="width: ${porcentaje}%; background-color: ${this.obtenerColorPorEstado()}; height: 100%; transition: width 0.3s ease;"></div>
            </div>
            <div class="detalle" style="margin-top: 6px; color: #a78bfa; font-size: 0.85em;">
                <span>💿 I/O: ${this.obtenerStringPeticiones()}</span>
            </div>
        `;
  }

  actualizarUI(elemento = this.elementoDOM) {
    if (!elemento) return;
    let claseEstado = `estado-${this.estado === "Muerto" ? "Muerto" : this.estado}`;
    const porcentaje =
      ((this.tiempoOriginal - this.tiempoRestante) / this.tiempoOriginal) * 100;

    elemento.innerHTML = `
            <td><strong>P${this.id}</strong></td>
            <td class="${claseEstado}">${this.estado}</td>
            <td>
                <div style="display: flex; align-items: center; gap: 8px;">
                    <span style="min-width: 45px;">${this.tiempoRestante} / ${this.tiempoOriginal}</span>
                    <div style="flex-grow: 1; background-color: #0f172a; height: 8px; border-radius: 4px; overflow: hidden;">
                        <div style="width: ${porcentaje}%; background-color: ${this.obtenerColorPorEstado()}; height: 100%; transition: width 0.3s ease;"></div>
                    </div>
                </div>
            </td>
            <td>${this.prioridad}</td>
            <td>${this.boletos}</td>
            <td>${this.usuario}</td>
            <td class="col-hhdd" style="font-family: monospace; color: #8b5cf6; font-weight: bold;">
                ${this.obtenerStringPeticiones()}
            </td>
        `;

    this.actualizarTarjeta();
  }

  obtenerColorPorEstado() {
    switch (this.estado) {
      case "Listo":
        return "var(--color-listo)";
      case "Bloqueado":
        return "var(--color-bloqueado)";
      case "Terminado":
        return "var(--color-terminado)";
      case "Muerto":
        return "var(--color-inanicion)";
      default:
        return "transparent";
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
    clon.ejecutadoAlgunaVez = this.ejecutadoAlgunaVez;
    clon.elementoDOM = this.elementoDOM;
    clon.elementoTarjeta = this.elementoTarjeta;

    clon.peticionesHHDD = JSON.parse(JSON.stringify(this.peticionesHHDD));
    clon.peticionesAtendidas = this.peticionesAtendidas;
    clon.peticionEnCurso = this.peticionEnCurso ? { ...this.peticionEnCurso } : null;

    return clon;
  }
}
