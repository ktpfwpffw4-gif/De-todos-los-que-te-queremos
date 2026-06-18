const STORAGE_KEY = "cartas-personales-v1";
const PASSWORD_LEER = "SAPA";
const PASSWORD_AGREGAR = "BETO";
const PASSWORD_ADMIN = "BETO1";

let cartasUsuario = cargarCartasUsuario();
let indiceActual = 0;
let cartaAbierta = false;
let permisoActual = "";

const inicio = document.querySelector("#inicio");
const lector = document.querySelector("#lector");
const panel = document.querySelector("#panel");
const carta = document.querySelector("#carta");
const contador = document.querySelector("#contador");
const nombreFrente = document.querySelector("#nombreFrente");
const tituloCarta = document.querySelector("#tituloCarta");
const textoCarta = document.querySelector("#textoCarta");
const papelCarta = document.querySelector("#papelCarta");
const btnAbrir = document.querySelector("#btnAbrir");
const btnAnterior = document.querySelector("#btnAnterior");
const btnSiguiente = document.querySelector("#btnSiguiente");
const listaCartas = document.querySelector("#listaCartas");
const formCarta = document.querySelector("#formCarta");
const formAcceso = document.querySelector("#formAcceso");
const contenidoPanel = document.querySelector("#contenidoPanel");
const inputPassword = document.querySelector("#inputPassword");
const mensajePassword = document.querySelector("#mensajePassword");
const tituloPanel = document.querySelector("#tituloPanel");
const textoPermiso = document.querySelector("#textoPermiso");
const btnBorrar = document.querySelector("#btnBorrar");

function todasLasCartas() {
  return [...CARTAS_BASE, ...cartasUsuario, CARTA_FINAL];
}

function indiceCartaFinal() {
  return todasLasCartas().length - 1;
}

function mostrarPantalla(nombre) {
  inicio.classList.toggle("activa", nombre === "inicio");
  lector.classList.toggle("activa", nombre === "lector");
}

function abrirAcceso() {
  tituloPanel.textContent = "Entrar";
  formAcceso.reset();
  mensajePassword.textContent = "";
  formAcceso.classList.remove("oculto");
  contenidoPanel.classList.add("oculto");
  panel.classList.remove("oculto");
  inputPassword.focus();
}

function abrirPanel(permiso) {
  permisoActual = permiso;
  tituloPanel.textContent = "Agregar cartas";
  textoPermiso.textContent = permiso === "admin"
    ? "Permiso completo: puedes agregar y borrar cartas."
    : "Puedes agregar cartas. No puedes borrar cartas guardadas.";
  btnBorrar.classList.toggle("oculto", permiso !== "admin");
  formAcceso.classList.add("oculto");
  contenidoPanel.classList.remove("oculto");
  renderListaPanel();
}

function cargarCartasUsuario() {
  const guardadas = localStorage.getItem(STORAGE_KEY);
  return guardadas ? JSON.parse(guardadas) : [];
}

function guardarCartasUsuario() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cartasUsuario));
}

function renderCarta() {
  const cartas = todasLasCartas();
  const cartaActual = cartas[indiceActual];
  const totalVisible = indiceActual === indiceCartaFinal()
    ? cartas.length
    : cartas.length - 1;

  carta.classList.remove("abierta");
  cartaAbierta = false;
  btnAbrir.textContent = "Abrir carta";

  nombreFrente.textContent = cartaActual.nombre;
  tituloCarta.textContent = cartaActual.titulo;
  textoCarta.textContent = cartaActual.texto;
  contador.textContent = `Carta ${indiceActual + 1} de ${totalVisible}`;

  if (cartaActual.foto) {
    papelCarta.style.backgroundImage = `linear-gradient(rgba(255, 250, 247, 0.18), rgba(255, 250, 247, 0.18)), url("${cartaActual.foto}")`;
  } else {
    papelCarta.style.backgroundImage = 'url("assets/fondo-carta.jpg")';
  }

  btnAnterior.disabled = indiceActual === 0;
  btnSiguiente.textContent = indiceActual === indiceCartaFinal() ? "Fin" : "›";
}

function abrirOCerrarCarta() {
  cartaAbierta = !cartaAbierta;
  carta.classList.toggle("abierta", cartaAbierta);
  btnAbrir.textContent = cartaAbierta ? "Cerrar carta" : "Abrir carta";
}

function siguienteCarta() {
  const ultimoIndiceNormal = indiceCartaFinal() - 1;

  if (indiceActual < ultimoIndiceNormal) {
    indiceActual += 1;
    renderCarta();
    return;
  }

  if (indiceActual === ultimoIndiceNormal) {
    indiceActual = indiceCartaFinal();
    renderCarta();
    return;
  }

  mostrarPantalla("inicio");
  indiceActual = 0;
}

function anteriorCarta() {
  if (indiceActual > 0) {
    indiceActual -= 1;
    renderCarta();
  }
}

function renderListaPanel() {
  if (!cartasUsuario.length) {
    listaCartas.innerHTML = "<p>No has agregado cartas desde el panel todavía.</p>";
    return;
  }

  listaCartas.innerHTML = cartasUsuario
    .map((item, index) => `
      <div class="item-carta">
        <span><strong>${index + 1}.</strong> ${escaparHtml(item.nombre)}</span>
        ${permisoActual === "admin"
          ? `<button class="boton-secundario" data-borrar="${index}">Quitar</button>`
          : ""}
      </div>
    `)
    .join("");
}

function escaparHtml(texto) {
  return texto
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function leerArchivoComoDataUrl(archivo) {
  return new Promise((resolve) => {
    if (!archivo) {
      resolve("");
      return;
    }

    const lectorArchivo = new FileReader();
    lectorArchivo.onload = () => resolve(lectorArchivo.result);
    lectorArchivo.readAsDataURL(archivo);
  });
}

document.querySelector("#btnLeer").addEventListener("click", () => {
  abrirAcceso();
});

document.querySelector("#btnVolver").addEventListener("click", () => {
  mostrarPantalla("inicio");
});

document.querySelector("#btnCerrarPanel").addEventListener("click", () => {
  panel.classList.add("oculto");
});

formAcceso.addEventListener("submit", (event) => {
  event.preventDefault();
  const password = inputPassword.value.trim().toUpperCase();

  if (password === PASSWORD_LEER) {
    panel.classList.add("oculto");
    indiceActual = 0;
    mostrarPantalla("lector");
    renderCarta();
    return;
  }

  if (password === PASSWORD_AGREGAR) {
    abrirPanel("agregar");
    return;
  }

  if (password === PASSWORD_ADMIN) {
    abrirPanel("admin");
    return;
  }

  mensajePassword.textContent = "Contraseña incorrecta.";
  inputPassword.select();
});

btnAbrir.addEventListener("click", abrirOCerrarCarta);
btnSiguiente.addEventListener("click", siguienteCarta);
btnAnterior.addEventListener("click", anteriorCarta);

formCarta.addEventListener("submit", async (event) => {
  event.preventDefault();

  const foto = await leerArchivoComoDataUrl(document.querySelector("#inputFoto").files[0]);

  cartasUsuario.push({
    nombre: document.querySelector("#inputNombre").value.trim(),
    titulo: document.querySelector("#inputTitulo").value.trim(),
    texto: document.querySelector("#inputTexto").value.trim(),
    foto
  });

  guardarCartasUsuario();
  formCarta.reset();
  renderListaPanel();
  renderCarta();
});

listaCartas.addEventListener("click", (event) => {
  const boton = event.target.closest("[data-borrar]");
  if (!boton) return;
  if (permisoActual !== "admin") return;

  const index = Number(boton.dataset.borrar);
  cartasUsuario.splice(index, 1);
  guardarCartasUsuario();
  renderListaPanel();
  indiceActual = Math.min(indiceActual, indiceCartaFinal());
  renderCarta();
});

document.querySelector("#btnBorrar").addEventListener("click", () => {
  if (permisoActual !== "admin") return;

  cartasUsuario = [];
  guardarCartasUsuario();
  renderListaPanel();
  indiceActual = 0;
  renderCarta();
});

panel.addEventListener("click", (event) => {
  if (event.target === panel) {
    panel.classList.add("oculto");
  }
});

renderListaPanel();
