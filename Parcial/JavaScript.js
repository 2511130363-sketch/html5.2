var CORREO_PERMITIDO = "2511130363@undc.edu.pe";
var SERVICE_ID = "service_drvxvwm";
var TEMPLATE_ID = "template_rjpodzq";

// Inicializar EmailJS con tu Public Key
if (typeof emailjs !== "undefined") {
  emailjs.init("6IFTzekyQe0TboKw6");
}

// Mensaje en pantalla (reemplaza los alert)
function mostrarEstado(texto, ok) {
  var estado = document.getElementById("estado");
  estado.textContent = texto;
  estado.className = ok ? "ok" : "fallo";
  estado.hidden = false;
}

// Indicador de conexión (prueba real contra EmailJS)
function pintarConexion(enLinea) {
  document.getElementById("conexion").textContent =
    enLinea ? "🟢 Conectado" : "🔴 Sin conexión";
}

function verificarConexion() {
  var control = new AbortController();
  var limite = setTimeout(function () { control.abort(); }, 4000);

  fetch("https://api.emailjs.com/", { mode: "no-cors", cache: "no-store", signal: control.signal })
    .then(function () { pintarConexion(true); })
    .catch(function () { pintarConexion(false); })
    .finally(function () { clearTimeout(limite); });
}

window.addEventListener("load", verificarConexion);
window.addEventListener("online", verificarConexion);
window.addEventListener("offline", function () { pintarConexion(false); });
setInterval(verificarConexion, 5000);

// Validación de datos (los mensajes de error se crean debajo de cada campo)
function validar() {
  var valido = true;
  var nombre = document.getElementById("nombre");
  var email = document.getElementById("email");
  var destino = document.getElementById("destino");
  var mensaje = document.getElementById("mensaje");
  var regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  function revisar(campo, condicion, texto) {
    var aviso = campo.nextElementSibling;
    if (!aviso || !aviso.classList.contains("error")) {
      aviso = document.createElement("small");
      aviso.className = "error";
      campo.insertAdjacentElement("afterend", aviso);
    }
    if (condicion) {
      campo.classList.remove("invalido");
      aviso.textContent = "";
    } else {
      campo.classList.add("invalido");
      aviso.textContent = texto;
      valido = false;
    }
  }

  revisar(nombre, nombre.value.trim().length >= 3, "Escribe tu nombre completo (mínimo 3 caracteres).");

  var correo = email.value.trim();
  if (!regexEmail.test(correo)) {
    revisar(email, false, "Escribe un correo válido.");
  } else {
    revisar(
      email,
      correo.toLowerCase() === CORREO_PERMITIDO.toLowerCase(),
      "Usa tu correo personal o institucional registrado."
    );
  }

  // Campo opcional: vacío es válido; si se escribe, debe ser un correo válido
  var otro = destino.value.trim();
  revisar(destino, otro === "" || regexEmail.test(otro), "Escribe un correo válido o deja este campo vacío.");

  revisar(mensaje, mensaje.value.trim().length >= 10, "El mensaje debe tener al menos 10 caracteres.");
  return valido;
}

// Envía un correo a la dirección indicada
function enviar(para, nombre, deCorreo, texto) {
  return emailjs.send(SERVICE_ID, TEMPLATE_ID, {
    from_name: nombre,
    from_email: deCorreo,
    to_email: para,
    message: texto
  });
}

function enviarCorreo(e) {
  e.preventDefault(); // evitar recarga del form
  document.getElementById("estado").hidden = true;

  if (typeof emailjs === "undefined") {
    mostrarEstado("No se pudo cargar EmailJS. Conéctate a Internet y recarga la página.", false);
    return;
  }

  if (!validar()) {
    mostrarEstado("Corrige los campos marcados antes de enviar.", false);
    return;
  }

  if (!navigator.onLine) {
    mostrarEstado("No hay conexión a Internet. Verifica tu red e inténtalo de nuevo.", false);
    return;
  }

  var nombre = document.getElementById("nombre").value.trim();
  var correo = document.getElementById("email").value.trim();
  var otro = document.getElementById("destino").value.trim();
  var texto = document.getElementById("mensaje").value.trim();
  var hayOtro = otro !== "" && otro.toLowerCase() !== correo.toLowerCase();

  var boton = document.getElementById("btn-enviar");
  boton.disabled = true;
  boton.textContent = "Enviando...";

  // 1) siempre se envía a tu correo
  enviar(correo, nombre, correo, texto)
    .then(function (res) {
      console.log("Respuesta:", res);
      // 2) si hay otro destino, se envía también a ese correo
      if (hayOtro) {
        return enviar(otro, nombre, correo, texto)
          .then(function () { return "ambos"; })
          .catch(function (err) {
            console.error("Error al enviar al segundo correo:", err);
            return "parcial";
          });
      }
      return "uno";
    })
    .then(function (resultado) {
      if (resultado === "ambos") {
        mostrarEstado("¡Enviado con éxito a tu correo y a " + otro + "!", true);
        document.getElementById("formulario") && document.getElementById("formulario").reset();
        e.target.reset();
      } else if (resultado === "parcial") {
        mostrarEstado("Se envió a tu correo, pero no se pudo enviar a " + otro + ". Revisa que esté bien escrito.", false);
      } else {
        mostrarEstado("¡Formulario enviado con éxito! Revisa tu bandeja de entrada o spam.", true);
        e.target.reset();
      }
    })
    .catch(function (err) {
      if (err.status === 0) {
        mostrarEstado("Error de conexión (ERR_INTERNET_DISCONNECTED). Revisa tu Internet, antivirus o firewall, o prueba en modo incógnito.", false);
      } else {
        mostrarEstado("Error al enviar. Confirma tu Service ID, Template ID y Public Key.", false);
      }
      console.error("Error:", err);
    })
    .finally(function () {
      boton.disabled = false;
      boton.textContent = "Enviar";
    });
}