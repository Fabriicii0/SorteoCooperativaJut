const btnGirar = document.getElementById("btnGirar");
const btnDetener = document.getElementById("btnDetener");
const btnEliminar = document.getElementById("btnEliminar");
const inputMinimo = document.getElementById("minimo");
const inputMaximo = document.getElementById("maximo");
const numerosEliminados = document.getElementById("numerosEliminados");
let animacionActual = null;
let deteniendo = false;
let numeroActual = 0;
let numerosEliminadosArray = [];
let primeraVezGirada = false;

// Configuración de probabilidades (puedes ajustar estos valores)
const rangosPrioritarios = [
  { inicio: 1, fin: 200, peso: 0.4 }, // 40% probabilidad
  { inicio: 201, fin: 700, peso: 0.25 }, // 25% probabilidad
  { inicio: 701, fin: 1500, peso: 0.2 }, // 20% probabilidad

  // 15% restante para otros números
];

function easeOutExpo(x) {
  return x === 1 ? 1 : 1 - Math.pow(2, -10 * x);
}

function getRandomNumber(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  let numero;
  do {
    const random = Math.random();
    let acumulado = 0;

    // Intentar generar número en rangos prioritarios
    let numeroGenerado = false;
    for (const rango of rangosPrioritarios) {
      acumulado += rango.peso;
      if (random < acumulado && rango.inicio >= min && rango.fin <= max) {
        numero =
          Math.floor(Math.random() * (rango.fin - rango.inicio + 1)) +
          rango.inicio;
        if (!numerosEliminadosArray.includes(numero)) {
          numeroGenerado = true;
          break;
        }
      }
    }

    // Si no se generó en rangos prioritarios, usar rango normal
    if (!numeroGenerado) {
      numero = Math.floor(Math.random() * (max - min + 1)) + min;
    }
  } while (numerosEliminadosArray.includes(numero));

  return numero;
}

function actualizarNumerosEliminados() {
  if (numerosEliminadosArray.length > 0) {
    numerosEliminados.textContent = `Números eliminados: ${numerosEliminadosArray
      .sort((a, b) => a - b)
      .join(", ")}`;
  } else {
    numerosEliminados.textContent = "";
  }
}

function eliminarNumero() {
  if (numeroActual !== 0 && !numerosEliminadosArray.includes(numeroActual)) {
    numerosEliminadosArray.push(numeroActual);
    actualizarNumerosEliminados();
    btnEliminar.disabled = true;

    // Verificar si quedan números disponibles
    const { min, max } = validarRango();
    const numerosDisponibles = max - min + 1 - numerosEliminadosArray.length;
    if (numerosDisponibles <= 0) {
      btnGirar.disabled = true;
      alert("No quedan números disponibles para girar");
    }
  }
}

function validarRango() {
  let min = parseInt(inputMinimo.value);
  let max = parseInt(inputMaximo.value);

  if (isNaN(min)) min = 1;
  if (isNaN(max)) max = 100;

  if (min >= max) {
    max = min + 1;
  }

  inputMinimo.value = min;
  inputMaximo.value = max;

  return { min, max };
}

function generarNumerosIntermedios(inicio, fin, cantidad) {
  const numeros = [];
  for (let i = 0; i < cantidad; i++) {
    const progreso = i / (cantidad - 1);
    const numero = Math.round(inicio + (fin - inicio) * progreso);
    numeros.push(numero);
  }
  return numeros;
}

function detenerRuleta() {
  if (animacionActual) {
    deteniendo = true;
    btnDetener.disabled = true;
  }
}

//Animacion de Confetti
function lanzarConfeti(
  duracionSegundos = 15,
  colores = ["#bb0000", "#ffffff"],
  particulas = 5,
  spread = 75
) {
  var end = Date.now() + duracionSegundos * 1000; // Duración en segundos

  (function frame() {
    confetti({
      particleCount: particulas, // Cantidad de partículas
      angle: 60,
      spread: spread, // Dispersión del confeti
      origin: { x: 0 }, // Lado izquierdo
      colors: colores,
    });
    confetti({
      particleCount: particulas, // Cantidad de partículas
      angle: 120,
      spread: spread, // Dispersión del confeti
      origin: { x: 1 }, // Lado derecho
      colors: colores,
    });

    if (Date.now() < end) {
      requestAnimationFrame(frame);
    }
  })();
}

function iniciarRuleta() {
  if (animacionActual) {
    cancelAnimationFrame(animacionActual);
  }

  const { min, max } = validarRango();
  // Verificar si hay números disponibles
  const numerosDisponibles = max - min + 1 - numerosEliminadosArray.length;
  if (numerosDisponibles <= 0) {
    alert("No quedan números disponibles para girar");
    return;
  }

  btnGirar.disabled = true;
  btnDetener.disabled = false;
  btnEliminar.disabled = true;
  deteniendo = false;

  const config = {
    duracionTotal: 15000, // Duración total en ms
    numerosRapidos: 400, // Números en la fase rápida
    numerosFinal: 120, // Números para la transición final
    alturaNumero: 50, // Altura de cada número en píxeles
  };

  const numeros = document.getElementById("numero");
  const numeroFinal = getRandomNumber(min, max);
  numeroActual = numeroFinal;

  // Generar números
  const valores = [];

  // Fase rápida
  const numerosGenerados = new Set();
  while (numerosGenerados.size < config.numerosRapidos) {
    let nuevoNumero = getRandomNumber(min, max);
    if (!numerosGenerados.has(nuevoNumero)) {
      numerosGenerados.add(nuevoNumero);
    }
  }
  valores.push(...Array.from(numerosGenerados));

  // Últimos números antes del final
  const ultimoNumeroAleatorio = valores[valores.length - 1];
  const numerosTransicion = new Set();
  while (numerosTransicion.size < config.numerosFinal) {
    let nuevoNumero = getRandomNumber(min, max);
    if (!numerosTransicion.has(nuevoNumero) && nuevoNumero !== numeroFinal) {
      numerosTransicion.add(nuevoNumero);
    }
  }
  valores.push(...Array.from(numerosTransicion));

  // Añadir el número final al final del array
  valores.push(numeroFinal);

  // Insertar números en el DOM
  numeros.innerHTML = valores.map((num) => `<div>${num}</div>`).join("");

  const inicio = performance.now();
  const posicionFinal = -config.alturaNumero * (valores.length - 1);

  function animar(tiempoActual) {
    const tiempoTranscurrido = tiempoActual - inicio;
    let progreso = Math.min(tiempoTranscurrido / config.duracionTotal, 1);

    if (deteniendo) {
      progreso = Math.min(progreso + 0.1, 1);
    }

    const progresoSuavizado = easeOutExpo(progreso);
    const posicionActual = progresoSuavizado * posicionFinal;

    numeros.style.transform = `translateY(${posicionActual}px)`;

    if (progreso < 1) {
      animacionActual = requestAnimationFrame(animar);
    } else {
      // Cuando termine la animación, mostrar solo el número final
      numeros.style.transition = "transform 0.3s ease-out";
      numeros.innerHTML = `<div>${numeroFinal}</div>`;
      numeros.style.transform = "translateY(0)";

      setTimeout(() => {
        numeros.style.transition = "none";
        btnGirar.disabled = false;
        btnDetener.disabled = true;
        btnEliminar.disabled = false;
        animacionActual = null;
        deteniendo = false;
        primeraVezGirada = true;
        lanzarConfeti(
          3,
          ["#ff0000", "#fbff07", "#1ec02b", "#5b64cf", "#db6fbf"],
          5,
          50
        );
      }, 300);
    }
  }

  animacionActual = requestAnimationFrame(animar);
}

// Inicialización
validarRango();
actualizarNumerosEliminados();
