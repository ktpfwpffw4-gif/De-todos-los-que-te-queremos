const CONFIG = {
  storageKey: "cartas-personales-v1",
  audioStorageKey: "cartas-audio-v1",
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
  permisoActual: "",
  audioData: "" // data URL del audio (si hay)
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
  btnEliminarAudio: $("#btnEliminarAudio"),
  audioPlayer: $("#audioPlayer")
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

  dom.tituloPanel.textContent = "Agregar cartas";
  dom.textoPermiso.textContent = obtenerTextoPermiso(permiso);

  dom.botones.borrarTodo.classList.toggle("oculto", !puedeBorrar);
  dom.formularios.acceso.classList.add("oculto");
  dom.panelContenido.classList.remove("oculto");
  renderListaPanel();
  renderAudioPanelEstado();
}

function obtenerTextoPermiso(permiso) {
  if (USAR_BASE_ONLINE) {
    return "Modo online: puedes agregar cartas compartidas. Para borrar cartas, usa la consola de Firebase.";
  }

  return permiso === "admin"
    ? "Permiso completo: puedes agregar y borrar cartas."
    : "Puedes agregar cartas. No puedes borrar cartas guardadas.";
}

function escap... (truncated)