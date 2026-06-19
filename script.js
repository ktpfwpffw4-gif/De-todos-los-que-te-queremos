const CONFIG = {
  storageKey: "cartas-personales-v1",
  passwords: {
    leer: "SAPA",
    agregar: "BETO",
    admin: "BETO1"
  },
  imagenCartaDefault: "assets/fondo-carta.jpg",
  imagenMaxSize: 900,
  imagenQuality: 0.82
};

const DB_CONFIG = window.CARTAS_DB_CONFIG || {};
const FIREBASE_DATABASE_URL = (DB_CONFIG.firebaseDatabaseURL || "").replace(/\/$/, "");
const USAR_BASE_ONLINE = Boolean(FIREBASE_DATABASE_URL);

const estado = {
  cartasUsuario: [],
  indiceActual: 0,
  cartaAbierta: false,
  permisoActual: ""
};

const $ = (selector) => document.querySelector(selector);

const dom = {
  pantallas: {
    inicio: $("#inicio"),
    lector: $("#lector")
  },
  panel: $("#panel"),
  carta: $("#carta"),
  contador: $("#contador"),
  nombreFrente: $("#nombreFrente"),
  tituloCarta: $("#tituloCarta"),
  textoCarta: $("#textoCarta"),
  papelCarta: $("#papelCarta"),
  botones: {
    leer: $("#btnLeer"),
    volver: $("#btnVolver"),
    abrir: $("#btnAbrir"),
    anterior: $("#btnAnterior"),
    siguiente: $("#btnSiguiente"),
    cerrarPanel: $("#btnCerrarPanel"),
    borrarTodo: $("#btnBorrar")
  },
  formularios: {
    acceso: $("#formAcceso"),
    carta: $("#formCarta"),
    audio: $("#formAudio")
  },
  inputs: {
    password: $("#inputPassword"),
    nombre: $("#inputNombre"),
    titulo: $("#inputTitulo"),
    texto: $("#inputTexto"),
    foto: $("#inputFoto"),
    audio: $("#inputAudio")
  },
  panelContenido: $("#contenidoPanel"),
  tituloPanel: $("#tituloPanel"),
  textoPermiso: $("#textoPermiso"),
  mensajePassword: $("#mensajePassword"),
  listaCartas: $("#listaCartas"),
  estadoGuardado: $("#estadoGuardado"),
  estadoAudio: $("#estadoAudio"),
  audioPanelDiv: $("#audioPanelDiv"),
  audioPlayer: $("#audioPlayer"),
  btnEliminarAudio: $("#btnEliminarAudio")
};

function obtenerCartas() {
  return [...CARTAS_BASE, ...estado.cartasUsuario, CARTA_FINAL];
}

function obtenerIndiceCartaFinal() {
  return obtenerCartas().length - 1;
}

function mostrarEstado(mensaje) {
  if (dom.estadoGuardado) {
    dom.estadoGuardado.textContent = mensaje;
  }
}

function mostrarEstadoAudio(mensaje) {
  if (dom.estadoAudio) {
    dom.estadoAudio.textContent = mensaje;
  }
}

function mostrarPantalla(nombre) {
  dom.pantallas.inicio.classList.toggle("activa", nombre === "inicio");
  dom.pantallas.lector.classList.toggle("activa", nombre === "lector");
}

function abrirModalAcceso() {
  dom.tituloPanel.textContent = "Entrar";
  dom.mensajePassword.textContent = "";
  dom.formularios.acceso.reset();
  dom.formularios.acceso.classList.remove("oculto");
  dom.panelContenido.classList.add("oculto");
  dom.panel.classList.remove("oculto");
  dom.inputs.password.focus();
}

function cerrarModal() {
  dom.panel.classList.add("oculto");
}

function abrirPanelCartas(permiso) {
  estado.permisoActual = permiso;
  const puedeBorrar = permiso === "admin" && !USAR_BASE_ONLINE;
  const esAdmin = permiso === "admin";

  dom.tituloPanel.textContent = "Agregar cartas";
  dom.textoPermiso.textContent = obtenerTextoPermiso(permiso);

  dom.botones.borrarTodo.classList.toggle("oculto", !puedeBorrar);
  if (dom.audioPanelDiv) {
    dom.audioPanelDiv.classList.toggle("oculto", !esAdmin);
  }
  dom.formularios.acceso.classList.add("oculto");
  dom.panelContenido.classList.remove("oculto");
  renderListaPanel();
}

function obtenerTextoPermiso(permiso) {
  if (USAR_BASE_ONLINE) {
    return "Modo online: puedes agregar cartas compartidas. Para borrar cartas, usa la consola de Firebase.";
  }

  return permiso === "admin"
    ? "Permiso completo: puedes agregar y borrar cartas."
    : "Puedes agregar cartas. No puedes borrar cartas guardadas.";
}

function escaparHtml(texto = "") {
  return String(texto)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function normalizarCartasRemotas(datos) {
  if (!datos) return [];

  return Object.entries(datos)
    .map(([id, carta]) => ({ id, ...carta }))
    .sort((a, b) => (a.creadaEn || 0) - (b.creadaEn || 0));
}

function cargarCartasLocales() {
  const guardadas = localStorage.getItem(CONFIG.storageKey);
  return guardadas ? JSON.parse(guardadas) : [];
}

function guardarCartasLocales(cartas) {
  localStorage.setItem(CONFIG.storageKey, JSON.stringify(cartas));
}

function cargarAudioLocal() {
  return localStorage.getItem("audio-fondo") || null;
}

function guardarAudioLocal(audioDataUrl) {
  if (audioDataUrl) {
    localStorage.setItem("audio-fondo", audioDataUrl);
  } else {
    localStorage.removeItem("audio-fondo");
  }
}

function cargarAudioEnReproductor() {
  const audioData = cargarAudioLocal();
  if (audioData && dom.audioPlayer) {
    dom.audioPlayer.src = audioData;
    dom.audioPlayer.hidden = false;
    dom.audioPlayer.play().catch(() => {
      // El navegador puede bloquear autoplay
    });
  }
}

async function cargarCartas() {
  if (!USAR_BASE_ONLINE) {
    mostrarEstado("Modo local: estas cartas solo se guardan en este dispositivo.");
    return cargarCartasLocales();
  }

  try {
    mostrarEstado("Cargando cartas compartidas...");
    const respuesta = await fetch(`${FIREBASE_DATABASE_URL}/cartas.json`);

    if (!respuesta.ok) {
      throw new Error("No se pudieron cargar las cartas.");
    }

    mostrarEstado("Modo online: las cartas se comparten para que Darlyn las vea.");
    return normalizarCartasRemotas(await respuesta.json());
  } catch (error) {
    console.error(error);
    mostrarEstado("No se pudo conectar con la base online. Usando guardado local.");
    return cargarCartasLocales();
  }
}

async function guardarCarta(cartaNueva) {
  if (!USAR_BASE_ONLINE) {
    estado.cartasUsuario.push(cartaNueva);
    guardarCartasLocales(estado.cartasUsuario);
    return;
  }

  const respuesta = await fetch(`${FIREBASE_DATABASE_URL}/cartas.json`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...cartaNueva,
      creadaEn: Date.now()
    })
  });

  if (!respuesta.ok) {
    const texto = await respuesta.text().catch(() => "");
    throw new Error(`No se pudo guardar la carta online. HTTP ${respuesta.status}. ${texto}`);
  }


  estado.cartasUsuario = await cargarCartas();
}

async function borrarCarta(index) {
  const cartaParaBorrar = estado.cartasUsuario[index];

  if (!USAR_BASE_ONLINE) {
    estado.cartasUsuario.splice(index, 1);
    guardarCartasLocales(estado.cartasUsuario);
    return;
  }

  if (!cartaParaBorrar?.id) return;

  const respuesta = await fetch(`${FIREBASE_DATABASE_URL}/cartas/${cartaParaBorrar.id}.json`, {
    method: "DELETE"
  });

  if (!respuesta.ok) {
    throw new Error("No se pudo borrar la carta online.");
  }

  estado.cartasUsuario = await cargarCartas();
}

async function borrarTodasLasCartas() {
  if (!USAR_BASE_ONLINE) {
    estado.cartasUsuario = [];
    guardarCartasLocales(estado.cartasUsuario);
    return;
  }

  const respuesta = await fetch(`${FIREBASE_DATABASE_URL}/cartas.json`, {
    method: "DELETE"
  });

  if (!respuesta.ok) {
    throw new Error("No se pudieron borrar las cartas online.");
  }

  estado.cartasUsuario = [];
}

function renderCarta() {
  const cartas = obtenerCartas();
  const cartaActual = cartas[estado.indiceActual];
  const totalVisible = estado.indiceActual === obtenerIndiceCartaFinal()
    ? cartas.length
    : cartas.length - 1;

  estado.cartaAbierta = false;
  dom.carta.classList.remove("abierta");
  dom.botones.abrir.textContent = "Abrir carta";

  dom.nombreFrente.textContent = cartaActual.nombre;
  dom.tituloCarta.textContent = cartaActual.titulo;
  dom.textoCarta.textContent = cartaActual.texto;
  dom.contador.textContent = `Carta ${estado.indiceActual + 1} de ${totalVisible}`;

  const imagenFondo = cartaActual.foto
    ? `linear-gradient(rgba(255, 250, 247, 0.18), rgba(255, 250, 247, 0.18)), url("${cartaActual.foto}")`
    : `url("${CONFIG.imagenCartaDefault}")`;

  dom.papelCarta.style.backgroundImage = imagenFondo;
  dom.botones.anterior.disabled = estado.indiceActual === 0;
  dom.botones.siguiente.textContent = estado.indiceActual === obtenerIndiceCartaFinal() ? "Fin" : "›";
}

function renderListaPanel() {
  if (!estado.cartasUsuario.length) {
    dom.listaCartas.innerHTML = "<p>No has agregado cartas desde el panel todavía.</p>";
    return;
  }

  dom.listaCartas.innerHTML = estado.cartasUsuario
    .map((item, index) => {
      const botonBorrar = estado.permisoActual === "admin" && !USAR_BASE_ONLINE
        ? `<button class="boton-secundario" data-borrar="${index}">Quitar</button>`
        : "";

      return `
        <div class="item-carta">
          <span><strong>${index + 1}.</strong> ${escaparHtml(item.nombre)}</span>
          ${botonBorrar}
        </div>
      `;
    })
    .join("");
}

function abrirOCerrarCarta() {
  estado.cartaAbierta = !estado.cartaAbierta;
  dom.carta.classList.toggle("abierta", estado.cartaAbierta);
  dom.botones.abrir.textContent = estado.cartaAbierta ? "Cerrar carta" : "Abrir carta";
}

function irASiguienteCarta() {
  const ultimoIndiceNormal = obtenerIndiceCartaFinal() - 1;

  if (estado.indiceActual < ultimoIndiceNormal) {
    estado.indiceActual += 1;
    renderCarta();
    return;
  }

  if (estado.indiceActual === ultimoIndiceNormal) {
    estado.indiceActual = obtenerIndiceCartaFinal();
    renderCarta();
    return;
  }

  estado.indiceActual = 0;
  mostrarPantalla("inicio");
}

function irACartaAnterior() {
  if (estado.indiceActual === 0) return;

  estado.indiceActual -= 1;
  renderCarta();
}

function comprimirImagenComoDataUrl(archivo) {
  return new Promise((resolve) => {
    if (!archivo) {
      resolve("");
      return;
    }

    const lectorArchivo = new FileReader();

    lectorArchivo.onload = () => {
      const imagen = new Image();

      imagen.onload = () => {
        const escala = Math.min(
          1,
          CONFIG.imagenMaxSize / Math.max(imagen.width, imagen.height)
        );

        const canvas = document.createElement("canvas");
        canvas.width = Math.round(imagen.width * escala);
        canvas.height = Math.round(imagen.height * escala);

        const contexto = canvas.getContext("2d");
        contexto.drawImage(imagen, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", CONFIG.imagenQuality));
      };

      imagen.onerror = () => resolve(lectorArchivo.result);
      imagen.src = lectorArchivo.result;
    };

    lectorArchivo.readAsDataURL(archivo);
  });
}

function comprimirAudioComoDataUrl(archivo) {
  return new Promise((resolve) => {
    if (!archivo) {
      resolve("");
      return;
    }

    const lectorArchivo = new FileReader();

    lectorArchivo.onload = () => {
      resolve(lectorArchivo.result);
    };

    lectorArchivo.onerror = () => {
      resolve("");
    };

    lectorArchivo.readAsDataURL(archivo);
  });
}

function validarPassword(password) {
  const passwordLimpia = password.trim().toUpperCase();

  if (passwordLimpia === CONFIG.passwords.leer) return "leer";
  if (passwordLimpia === CONFIG.passwords.agregar) return "agregar";
  if (passwordLimpia === CONFIG.passwords.admin) return "admin";

  return "";
}

function entrarALector() {
  cerrarModal();
  estado.indiceActual = 0;
  mostrarPantalla("lector");
  renderCarta();
  cargarAudioEnReproductor();
}

function configurarEventos() {
  // Botón Leer cartas: abre el modal de contraseña
  dom.botones.leer.addEventListener("click", abrirModalAcceso);

  dom.botones.volver.addEventListener("click", () => mostrarPantalla("inicio"));
  dom.botones.cerrarPanel.addEventListener("click", cerrarModal);
  dom.botones.abrir.addEventListener("click", abrirOCerrarCarta);
  dom.botones.siguiente.addEventListener("click", irASiguienteCarta);
  dom.botones.anterior.addEventListener("click", irACartaAnterior);

  dom.panel.addEventListener("click", (event) => {
    if (event.target === dom.panel) {
      cerrarModal();
    }
  });

  dom.formularios.acceso.addEventListener("submit", manejarAcceso);
  dom.formularios.carta.addEventListener("submit", manejarNuevaCarta);
  if (dom.formularios.audio) {
    dom.formularios.audio.addEventListener("submit", manejarGuardarAudio);
  }
  dom.listaCartas.addEventListener("click", manejarBorradoIndividual);
  dom.botones.borrarTodo.addEventListener("click", manejarBorradoTotal);
  if (dom.btnEliminarAudio) {
    dom.btnEliminarAudio.addEventListener("click", manejarEliminarAudio);
  }
}

function manejarAcceso(event) {
  event.preventDefault();

  const permiso = validarPassword(dom.inputs.password.value);

  if (permiso === "leer") {
    entrarALector();
    return;
  }

  if (permiso === "agregar" || permiso === "admin") {
    abrirPanelCartas(permiso);
    return;
  }

  dom.mensajePassword.textContent = "Contraseña incorrecta.";
  dom.inputs.password.select();
}

async function manejarNuevaCarta(event) {
  event.preventDefault();

  const botonGuardar = dom.formularios.carta.querySelector("button[type='submit']");
  botonGuardar.disabled = true;

  try {
    const foto = await comprimirImagenComoDataUrl(dom.inputs.foto.files[0]);

    await guardarCarta({
      nombre: dom.inputs.nombre.value.trim(),
      titulo: dom.inputs.titulo.value.trim(),
      texto: dom.inputs.texto.value.trim(),
      foto
    });

    mostrarEstado(USAR_BASE_ONLINE
      ? "Carta guardada online. Darlyn podra verla desde su dispositivo."
      : "Carta guardada en este dispositivo.");

    dom.formularios.carta.reset();
    renderListaPanel();
    renderCarta();
  } catch (error) {
    console.error(error);
    mostrarEstado(error?.message || "No se pudo guardar la carta. Revisa la conexion o Firebase.");
  } finally {
    botonGuardar.disabled = false;
  }
}

async function manejarGuardarAudio(event) {
  event.preventDefault();

  const botonGuardar = dom.formularios.audio.querySelector("button[type='submit']");
  botonGuardar.disabled = true;

  try {
    const archivo = dom.inputs.audio.files[0];
    if (!archivo) {
      mostrarEstadoAudio("Selecciona un archivo de audio.");
      botonGuardar.disabled = false;
      return;
    }

    const audioDataUrl = await comprimirAudioComoDataUrl(archivo);
    guardarAudioLocal(audioDataUrl);

    mostrarEstadoAudio("Audio guardado correctamente. Solo tú (admin) puedes cambiarlo.");
    dom.formularios.audio.reset();
    cargarAudioEnReproductor();
  } catch (error) {
    console.error(error);
    mostrarEstadoAudio("No se pudo guardar el audio.");
  } finally {
    botonGuardar.disabled = false;
  }
}

function manejarEliminarAudio() {
  if (estado.permisoActual !== "admin") {
    mostrarEstadoAudio("Solo el admin puede eliminar el audio.");
    return;
  }

  guardarAudioLocal(null);
  dom.audioPlayer.src = "";
  dom.audioPlayer.hidden = true;
  dom.formularios.audio.reset();
  mostrarEstadoAudio("Audio eliminado.");
}

async function manejarBorradoIndividual(event) {
  const boton = event.target.closest("[data-borrar]");

  if (!boton || estado.permisoActual !== "admin") return;
  if (USAR_BASE_ONLINE) {
    mostrarEstado("Por seguridad, las cartas online se borran desde Firebase.");
    return;
  }

  try {
    await borrarCarta(Number(boton.dataset.borrar));
    estado.indiceActual = Math.min(estado.indiceActual, obtenerIndiceCartaFinal());
    renderListaPanel();
    renderCarta();
  } catch (error) {
    console.error(error);
    mostrarEstado("No se pudo borrar la carta.");
  }
}

async function manejarBorradoTotal() {
  if (estado.permisoActual !== "admin") return;
  if (USAR_BASE_ONLINE) {
    mostrarEstado("Por seguridad, las cartas online se borran desde Firebase.");
    return;
  }

  try {
    await borrarTodasLasCartas();
    estado.indiceActual = 0;
    renderListaPanel();
    renderCarta();
  } catch (error) {
    console.error(error);
    mostrarEstado("No se pudieron borrar las cartas.");
  }
}

async function iniciarApp() {
  configurarEventos();
  estado.cartasUsuario = await cargarCartas();
  renderListaPanel();
  cargarAudioEnReproductor();
}

iniciarApp();
