const STORAGE_KEY = "cartas-personales-v1";
const PASSWORD_LEER = "SAPA";
const PASSWORD_AGREGAR = "BETO";
const PASSWORD_ADMIN = "BETO1";
const DB_CONFIG = window.CARTAS_DB_CONFIG || {};
const FIREBASE_DATABASE_URL = (DB_CONFIG.firebaseDatabaseURL || "").replace(/\/$/, "");
const USAR_BASE_ONLINE = Boolean(FIREBASE_DATABASE_URL);

let cartasUsuario = [];
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
const estadoGuardado = document.querySelector("#estadoGuardado");

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

function mostrarEstadoGuardado(mensaje) {
  if (estadoGuardado) {
    estadoGuardado.textContent = mensaje;
  }
}

function normalizarCartasRemotas(datos) {
  if (!datos) return [];

  return Object.entries(datos)
    .map(([id, carta]) => ({ id, ...carta }))
    .sort((a, b) => (a.creadaEn || 0) - (b.creadaEn || 0));
}

async function cargarCartasUsuario() {
  if (!USAR_BASE_ONLINE) {
    mostrarEstadoGuardado("Modo local: estas cartas solo se guardan en este dispositivo.");
    const guardadas = localStorage.getItem(STORAGE_KEY);
    return guardadas ? JSON.parse(guardadas) : [];
  }

  try {
    mostrarEstadoGuardado("Cargando cartas compartidas...");
    const respuesta = await fetch(`${FIREBASE_DATABASE_URL}/cartas.json`);

    if (!respuesta.ok) {
      throw new Error("No se pudieron cargar las cartas.");
    }

    mostrarEstadoGuardado("Modo online: las cartas se comparten para que Darlyn las vea.");
    return normalizarCartasRemotas(await respuesta.json());
  } catch (error) {
    console.error(error);
    mostrarEstadoGuardado("No se pudo conectar con la base online. Usando guardado local.");
    const guardadas = localStorage.getItem(STORAGE_KEY);
    return guardadas ? JSON.parse(guardadas) : [];
  }
}

async function guardarCartaUsuario(cartaNueva) {
  if (!USAR_BASE_ONLINE) {
    cartasUsuario.push(cartaNueva);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cartasUsuario));
    return;
  }

  const respuesta = await fetch(`${FIREBASE_DATABASE_URL}/cartas.json`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      ...cartaNueva,
      creadaEn: Date.now()
    })
  });

  if (!respuesta.ok) {
    throw new Error("No se pudo guardar la carta online.");
  }

  cartasUsuario = await cargarCartasUsuario();
}

async function borrarCartaUsuario(index) {
  const cartaParaBorrar = cartasUsuario[index];

  if (!USAR_BASE_ONLINE) {
    cartasUsuario.splice(index, 1);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cartasUsuario));
    return;
  }

  if (!cartaParaBorrar?.id) return;

  const respuesta = await fetch(`${FIREBASE_DATABASE_URL}/cartas/${cartaParaBorrar.id}.json`, {
    method: "DELETE"
  });

  if (!respuesta.ok) {
    throw new Error("No se pudo borrar la carta online.");
  }

  cartasUsuario = await cargarCartasUsuario();
}

async function borrarTodasLasCartasUsuario() {
  if (!USAR_BASE_ONLINE) {
    cartasUsuario = [];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cartasUsuario));
    return;
  }

  const respuesta = await fetch(`${FIREBASE_DATABASE_URL}/cartas.json`, {
    method: "DELETE"
  });

  if (!respuesta.ok) {
    throw new Error("No se pudieron borrar las cartas online.");
  }

  cartasUsuario = [];
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
    lectorArchivo.onload = () => {
      const imagen = new Image();

      imagen.onload = () => {
        const maximo = 900;
        const escala = Math.min(1, maximo / Math.max(imagen.width, imagen.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(imagen.width * escala);
        canvas.height = Math.round(imagen.height * escala);

        const contexto = canvas.getContext("2d");
        contexto.drawImage(imagen, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.82));
      };

      imagen.onerror = () => resolve(lectorArchivo.result);
      imagen.src = lectorArchivo.result;
    };
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
  const botonGuardar = formCarta.querySelector("button[type='submit']");
  botonGuardar.disabled = true;

  try {
    const foto = await leerArchivoComoDataUrl(document.querySelector("#inputFoto").files[0]);

    await guardarCartaUsuario({
      nombre: document.querySelector("#inputNombre").value.trim(),
      titulo: document.querySelector("#inputTitulo").value.trim(),
      texto: document.querySelector("#inputTexto").value.trim(),
      foto
    });

    mostrarEstadoGuardado(USAR_BASE_ONLINE
      ? "Carta guardada online. Darlyn podra verla desde su dispositivo."
      : "Carta guardada en este dispositivo.");
    formCarta.reset();
    renderListaPanel();
    renderCarta();
  } catch (error) {
    console.error(error);
    mostrarEstadoGuardado("No se pudo guardar la carta. Revisa la conexion o Firebase.");
  } finally {
    botonGuardar.disabled = false;
  }
});

listaCartas.addEventListener("click", async (event) => {
  const boton = event.target.closest("[data-borrar]");
  if (!boton) return;
  if (permisoActual !== "admin") return;

  const index = Number(boton.dataset.borrar);

  try {
    await borrarCartaUsuario(index);
    renderListaPanel();
    indiceActual = Math.min(indiceActual, indiceCartaFinal());
    renderCarta();
  } catch (error) {
    console.error(error);
    mostrarEstadoGuardado("No se pudo borrar la carta.");
  }
});

document.querySelector("#btnBorrar").addEventListener("click", async () => {
  if (permisoActual !== "admin") return;

  try {
    await borrarTodasLasCartasUsuario();
    renderListaPanel();
    indiceActual = 0;
    renderCarta();
  } catch (error) {
    console.error(error);
    mostrarEstadoGuardado("No se pudieron borrar las cartas.");
  }
});

panel.addEventListener("click", (event) => {
  if (event.target === panel) {
    panel.classList.add("oculto");
  }
});

async function iniciarCartas() {
  cartasUsuario = await cargarCartasUsuario();
  renderListaPanel();
}

iniciarCartas();
